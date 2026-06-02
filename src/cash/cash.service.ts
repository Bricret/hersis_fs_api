import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Cash, CashStatus } from './entities/cash.entity';
import { CreateCashDto, CloseCashDto, QueryCashDto, UpdateCashDto } from './dto';
import { Branch } from 'src/branches/intities/branches.entity';
import { User } from 'src/users/entities/user.entity';
import { Sale } from 'src/sales/entities/sale.entity';
import PdfPrinter = require('pdfmake/src/printer');

@Injectable()
export class CashService {
  constructor(
    @InjectRepository(Cash)
    private cashRepository: Repository<Cash>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
  ) {}

  private readonly currencyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });

  private formatCurrency(value: number): string {
    return this.currencyFormatter.format(Number(value) || 0);
  }

  private formatDateTime(dateValue?: Date | null): string {
    if (!dateValue) return 'N/A';
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateValue));
  }

  async create(createCashDto: CreateCashDto): Promise<Cash> {
    const { branch_id, user_apertura_id, ...cashData } = createCashDto;

    // Verificar que no haya una caja abierta en la sucursal
    const existingOpenCash = await this.cashRepository.findOne({
      where: {
        branch: { id: branch_id },
        estado: CashStatus.ABIERTA,
      },
    });

    if (existingOpenCash) {
      throw new BadRequestException('Ya existe una caja abierta en esta sucursal');
    }

    // Verificar que la sucursal existe
    const branch = await this.branchRepository.findOne({
      where: { id: branch_id },
    });
    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada');
    }

    // Verificar que el usuario existe
    const user = await this.userRepository.findOne({
      where: { id: user_apertura_id },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const cash = this.cashRepository.create({
      ...cashData,
      fecha_apertura: new Date(),
      monto_esperado: cashData.monto_inicial,
      branch,
      user_apertura: user,
    });

    return await this.cashRepository.save(cash);
  }

  async findAll(query: QueryCashDto = {}): Promise<Cash[]> {
    const { branch_id, search_term, date_from, date_to, estado } = query;

    const queryBuilder = this.cashRepository
      .createQueryBuilder('cash')
      .leftJoinAndSelect('cash.branch', 'branch')
      .leftJoinAndSelect('cash.user_apertura', 'user_apertura')
      .leftJoinAndSelect('cash.user_cierre', 'user_cierre')
      .leftJoinAndSelect('cash.sales', 'sales')
      .orderBy('cash.created_at', 'DESC');

    if (branch_id) {
      queryBuilder.andWhere('branch.id = :branchId', { branchId: branch_id });
    }

    if (estado) {
      queryBuilder.andWhere('cash.estado = :estado', { estado });
    }

    if (search_term?.trim()) {
      const searchPattern = `%${search_term.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(cash.id::text) LIKE :searchPattern', { searchPattern }).orWhere(
            'LOWER(user_apertura.name) LIKE :searchPattern',
            { searchPattern },
          );
        }),
      );
    }

    if (date_from) {
      queryBuilder.andWhere('cash.fecha_apertura >= :dateFrom', {
        dateFrom: new Date(date_from),
      });
    }

    if (date_to) {
      const inclusiveDateTo = new Date(date_to);
      inclusiveDateTo.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('cash.fecha_apertura <= :dateTo', {
        dateTo: inclusiveDateTo,
      });
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Cash> {
    const cash = await this.cashRepository.findOne({
      where: { id },
      relations: ['branch', 'user_apertura', 'user_cierre', 'sales'],
    });

    if (!cash) {
      throw new NotFoundException('Caja no encontrada');
    }

    return cash;
  }

  async findByBranch(branchId: string, query: QueryCashDto = {}): Promise<Cash[]> {
    return this.findAll({ ...query, branch_id: branchId });
  }

  async findActiveCashByBranch(branchId: string): Promise<Cash | null> {
    const result = await this.cashRepository.findOne({
      where: {
        branch: { id: branchId },
        estado: CashStatus.ABIERTA,
      },
      relations: ['branch', 'user_apertura', 'user_cierre', 'sales'],
    });

    if (!result) {
      return null;
    }

    return result;
  }

  async update(id: string, updateCashDto: UpdateCashDto): Promise<Cash> {
    const cash = await this.findOne(id);

    if (cash.estado === CashStatus.CERRADA) {
      throw new BadRequestException('No se puede modificar una caja cerrada');
    }

    Object.assign(cash, updateCashDto);
    return await this.cashRepository.save(cash);
  }

  async closeCash(id: string, closeCashDto: CloseCashDto): Promise<Cash> {
    const cash = await this.findOne(id);

    if (cash.estado === CashStatus.CERRADA) {
      throw new BadRequestException('La caja ya está cerrada');
    }

    // Calcular ventas totales desde las ventas registradas
    const totalSales = await this.calculateTotalSales(id);

    // Verificar que el usuario de cierre existe
    const userCierre = await this.userRepository.findOne({
      where: { id: closeCashDto.user_cierre_id },
    });
    if (!userCierre) {
      throw new NotFoundException('Usuario de cierre no encontrado');
    }

    // Asegurar que trabajamos con números
    const montoInicial = Number(cash.monto_inicial);
    const montoFinal = Number(closeCashDto.monto_final);
    const ventasTotales = Number(totalSales);
    const montoEsperado = montoInicial + ventasTotales;
    const diferencia = montoFinal - montoEsperado;

    // Actualizar usando el repositorio para evitar problemas de tipos
    await this.cashRepository.update(
      { id },
      {
        fecha_cierre: new Date(),
        monto_final: montoFinal,
        ventas_totales: ventasTotales,
        monto_esperado: montoEsperado,
        diferencia: diferencia,
        estado: CashStatus.CERRADA,
        user_cierre: userCierre,
        observaciones: closeCashDto.observaciones || cash.observaciones,
      }
    );

    // Retornar la caja actualizada
    return await this.findOne(id);
  }

  async calculateTotalSales(cashId: string): Promise<number> {
    const result = await this.saleRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.total)', 'total')
      .where('sale.cash_register = :cashId', { cashId })
      .getRawOne();

    return Number(result.total) || 0;
  }

  async syncCashTotals(cashId: string): Promise<Cash> {
    const cash = await this.findOne(cashId);
    
    if (cash.estado === CashStatus.CERRADA) {
      throw new BadRequestException('No se pueden sincronizar los totales de una caja cerrada');
    }

    // Recalcular totales desde las ventas registradas
    const actualTotalSales = await this.calculateTotalSales(cashId);
    const montoInicial = Number(cash.monto_inicial);
    const newMontoEsperado = montoInicial + actualTotalSales;

    // Actualizar los totales
    await this.cashRepository.update(
      { id: cashId },
      {
        ventas_totales: actualTotalSales,
        monto_esperado: newMontoEsperado
      }
    );

    return await this.findOne(cashId);
  }

  async remove(id: string): Promise<void> {
    const cash = await this.findOne(id);
    
    if (cash.estado === CashStatus.ABIERTA) {
      throw new BadRequestException('No se puede eliminar una caja abierta');
    }

    await this.cashRepository.remove(cash);
  }

  async getCashSummary(id: string) {
    const cash = await this.findOne(id);

    const [totalSales, salesCount] = await Promise.all([
      this.calculateTotalSales(id),
      this.saleRepository.count({
        where: { cash_register: { id } },
      }),
    ]);

    const montoInicial = Number(cash.monto_inicial);
    const montoEsperado = montoInicial + totalSales;

    return {
      ...cash,
      ventas_totales: totalSales,
      monto_esperado: montoEsperado,
      cantidad_ventas: salesCount,
      porcentaje_diferencia:
        montoEsperado > 0
          ? ((Number(cash.diferencia) / montoEsperado) * 100).toFixed(2)
          : 0,
    };
  }

  async getCashSales(id: string) {
    const cash = await this.findOne(id);
    
    const sales = await this.saleRepository.find({
      where: { cash_register: { id } },
      relations: ['branch', 'saleDetails', 'user'],
      order: { date: 'DESC' },
    });

    const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.total), 0);

    return {
      cash_info: {
        id: cash.id,
        fecha_apertura: cash.fecha_apertura,
        fecha_cierre: cash.fecha_cierre,
        estado: cash.estado,
        monto_inicial: cash.monto_inicial,
      },
      sales_summary: {
        total_sales_count: sales.length,
        total_amount: totalAmount,
      },
      sales: sales,
    };
  }

  async generateCashReportPdf(id: string): Promise<Buffer> {
    const cash = await this.findOne(id);
    const salesResponse = await this.getCashSales(id);
    const sales = salesResponse.sales || [];

    const salesCount = sales.length;
    const totalSalesAmount = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const totalProducts = sales.reduce(
      (sum, sale) =>
        sum +
        (sale.saleDetails?.reduce(
          (detailAccumulator, detail) => detailAccumulator + Number(detail.quantity || 0),
          0,
        ) || 0),
      0,
    );

    const montoInicial = Number(cash.monto_inicial || 0);
    const montoEsperado = montoInicial + totalSalesAmount;
    const montoFinal = cash.monto_final !== null ? Number(cash.monto_final || 0) : null;
    const diferencia = montoFinal !== null ? montoFinal - montoEsperado : Number(cash.diferencia || 0);
    const diferenciaLabel = diferencia >= 0 ? 'Sobrante' : 'Faltante';
    const diferenciaColor = diferencia >= 0 ? '#166534' : '#991B1B';
    const generatedAt = new Date();

    const salesTableBody: any[][] = [
      [
        { text: 'Venta #', style: 'tableHeader', alignment: 'center' },
        { text: 'Fecha', style: 'tableHeader', alignment: 'center' },
        { text: 'Cajero', style: 'tableHeader' },
        { text: 'Items', style: 'tableHeader', alignment: 'center' },
        { text: 'Total', style: 'tableHeader', alignment: 'right' },
      ],
      ...sales.map((sale) => {
        const saleItemsCount =
          sale.saleDetails?.reduce((acc, detail) => acc + Number(detail.quantity || 0), 0) || 0;

        return [
          { text: `${sale.id}`, alignment: 'center' },
          { text: this.formatDateTime(sale.date), alignment: 'center' },
          { text: sale.user?.name || 'Usuario no disponible' },
          { text: `${saleItemsCount}`, alignment: 'center' },
          { text: this.formatCurrency(Number(sale.total || 0)), alignment: 'right' },
        ];
      }),
    ];

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [32, 84, 32, 40],
      header: (currentPage, pageCount) => ({
        margin: [32, 24, 32, 0],
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              {
                stack: [
                  { text: 'REPORTE DE ARQUEO DE CAJA', style: 'headerTitle' },
                  {
                    text: `Sucursal: ${cash.branch?.name || 'Sin sucursal'}`,
                    style: 'headerSubtitle',
                  },
                ],
                border: [false, false, false, false],
              },
              {
                stack: [
                  {
                    text: this.formatDateTime(generatedAt),
                    alignment: 'right',
                    style: 'headerMeta',
                  },
                  {
                    text: `Pag. ${currentPage} de ${pageCount}`,
                    alignment: 'right',
                    style: 'headerMeta',
                  },
                ],
                border: [false, false, false, false],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
        },
      }),
      content: [
        {
          text: `Caja #${cash.id}`,
          style: 'title',
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              [
                { text: 'Fecha apertura', style: 'metricLabel' },
                { text: this.formatDateTime(cash.fecha_apertura), style: 'metricValue' },
                { text: 'Fecha cierre', style: 'metricLabel' },
                { text: this.formatDateTime(cash.fecha_cierre), style: 'metricValue' },
              ],
              [
                { text: 'Usuario apertura', style: 'metricLabel' },
                { text: cash.user_apertura?.name || 'N/A', style: 'metricValue' },
                { text: 'Usuario cierre', style: 'metricLabel' },
                { text: cash.user_cierre?.name || 'N/A', style: 'metricValue' },
              ],
              [
                { text: 'Estado', style: 'metricLabel' },
                {
                  text: cash.estado === CashStatus.CERRADA ? 'CERRADA' : 'ABIERTA',
                  style: 'statusValue',
                  color: cash.estado === CashStatus.CERRADA ? '#1E40AF' : '#14532D',
                },
                { text: 'Observaciones', style: 'metricLabel' },
                { text: cash.observaciones || 'Sin observaciones', style: 'metricValue' },
              ],
            ],
          },
          layout: {
            hLineColor: () => '#D1D5DB',
            vLineColor: () => '#D1D5DB',
            hLineWidth: () => 1,
            vLineWidth: () => 1,
          },
          margin: [0, 0, 0, 14],
        },
        {
          text: 'Resumen financiero',
          style: 'sectionTitle',
          margin: [0, 0, 0, 8],
        },
        {
          table: {
            widths: ['20%', '20%', '20%', '20%', '20%'],
            body: [
              [
                { text: 'Monto inicial', style: 'summaryHeader' },
                { text: 'Ventas totales', style: 'summaryHeader' },
                { text: 'Monto esperado', style: 'summaryHeader' },
                { text: 'Monto final', style: 'summaryHeader' },
                { text: 'Diferencia', style: 'summaryHeader' },
              ],
              [
                { text: this.formatCurrency(montoInicial), style: 'summaryValue' },
                { text: this.formatCurrency(totalSalesAmount), style: 'summaryValue' },
                { text: this.formatCurrency(montoEsperado), style: 'summaryValue' },
                {
                  text: montoFinal !== null ? this.formatCurrency(montoFinal) : 'Caja abierta',
                  style: 'summaryValue',
                },
                {
                  text: `${diferenciaLabel}: ${this.formatCurrency(Math.abs(diferencia))}`,
                  style: 'summaryValue',
                  color: diferenciaColor,
                },
              ],
            ],
          },
          layout: {
            fillColor: (rowIndex: number) => (rowIndex === 0 ? '#E0E7FF' : '#F8FAFC'),
            hLineColor: () => '#94A3B8',
            vLineColor: () => '#94A3B8',
            hLineWidth: () => 1,
            vLineWidth: () => 1,
          },
          margin: [0, 0, 0, 14],
        },
        {
          text: `Detalle de ventas (${salesCount} transacciones)`,
          style: 'sectionTitle',
          margin: [0, 0, 0, 8],
        },
        salesCount > 0
          ? ({
              table: {
                headerRows: 1,
                widths: ['15%', '25%', '*', '15%', '20%'],
                body: salesTableBody,
              },
              layout: {
                fillColor: (rowIndex: number) => {
                  if (rowIndex === 0) return '#1E3A8A';
                  return rowIndex % 2 === 0 ? '#F1F5F9' : '#FFFFFF';
                },
                hLineColor: () => '#CBD5E1',
                vLineColor: () => '#CBD5E1',
                hLineWidth: () => 1,
                vLineWidth: () => 1,
              },
            })
          : ({
              text: 'No se registraron ventas para esta caja en el periodo reportado.',
              style: 'emptyState',
              margin: [0, 8, 0, 0],
            }),
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [
                {
                  text: `Total de productos vendidos: ${totalProducts}`,
                  style: 'footerKpi',
                  border: [false, false, false, false],
                },
                {
                  text: `Total ventas: ${this.formatCurrency(totalSalesAmount)}`,
                  style: 'footerKpi',
                  alignment: 'right',
                  border: [false, false, false, false],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
          },
          margin: [0, 10, 0, 0],
        },
      ],
      styles: {
        headerTitle: {
          fontSize: 13,
          bold: true,
          color: '#0F172A',
        },
        headerSubtitle: {
          fontSize: 9,
          color: '#334155',
          margin: [0, 2, 0, 0],
        },
        headerMeta: {
          fontSize: 8,
          color: '#475569',
          margin: [0, 1, 0, 0],
        },
        title: {
          fontSize: 16,
          bold: true,
          color: '#0F172A',
        },
        sectionTitle: {
          fontSize: 12,
          bold: true,
          color: '#1E3A8A',
        },
        metricLabel: {
          bold: true,
          fontSize: 9,
          color: '#334155',
          fillColor: '#F8FAFC',
          margin: [4, 5, 4, 5],
        },
        metricValue: {
          fontSize: 9,
          color: '#0F172A',
          margin: [4, 5, 4, 5],
        },
        statusValue: {
          fontSize: 9,
          bold: true,
          margin: [4, 5, 4, 5],
        },
        summaryHeader: {
          bold: true,
          fontSize: 9,
          color: '#1E3A8A',
          alignment: 'center',
          margin: [3, 6, 3, 6],
        },
        summaryValue: {
          fontSize: 10,
          bold: true,
          color: '#0F172A',
          alignment: 'center',
          margin: [3, 8, 3, 8],
        },
        tableHeader: {
          fontSize: 9,
          bold: true,
          color: '#FFFFFF',
          margin: [4, 6, 4, 6],
        },
        emptyState: {
          fontSize: 10,
          color: '#475569',
          italics: true,
        },
        footerKpi: {
          fontSize: 10,
          bold: true,
          color: '#0F172A',
        },
      },
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 9,
        color: '#0F172A',
      },
    };

    return this.buildPdfBuffer(docDefinition);
  }

  private async buildPdfBuffer(docDefinition: any): Promise<Buffer> {
    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };

    const printer = new PdfPrinter(fonts);
    const pdfDocument = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];

    return await new Promise<Buffer>((resolve, reject) => {
      pdfDocument.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDocument.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDocument.on('error', (error) => reject(error));
      pdfDocument.end();
    });
  }
} 