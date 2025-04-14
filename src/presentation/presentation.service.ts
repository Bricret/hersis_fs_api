import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Presentation } from './entities/presentation.entity';
import { Repository } from 'typeorm';
import { CommonService } from 'src/common/common.service';
import { CreatePresentationDto } from './dto/create-presentation.dto';
import { UpdatePresentationDto } from './dto/update-prsentation.dto';

@Injectable()
export class PresentationService {
  constructor(
    @InjectRepository(Presentation)
    private presentationRepository: Repository<Presentation>,

    private readonly commonService: CommonService,
  ) {}

  async create(createPresentationDto: CreatePresentationDto) {
    try {
      const presentation = this.presentationRepository.create(
        createPresentationDto,
      );
      return await this.presentationRepository.save(presentation);
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }


  async findAll() {
    try {
        const presentations = await this.presentationRepository.find();
        return presentations;
    } catch (error) {
        this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async findOne(id: number) {
    try {
        const presentation = await this.presentationRepository.findOne({
            where: { id },
        });
        return presentation;
    } catch (error) {
        this.commonService.handleExceptions(error.message, 'BR');
    }
    }

  async update(id: number, updatePresentationDto: UpdatePresentationDto) {
    try {
        const presentation = await this.findOne(id);
        if (!presentation) this.commonService.handleExceptions('No se encontro la presentacion', 'BR');
        await this.presentationRepository.update(id, updatePresentationDto);
        return { message: 'Presentacion actualizada correctamente' };
    } catch (error) {
        this.commonService.handleExceptions(error.message, 'BR');
    }
  }
}
