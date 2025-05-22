import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Controller('branches')
export class BranchesController {
    constructor(private readonly branchesService: BranchesService) {}

    @Post()
    async create(@Body() createBranchDto: CreateBranchDto) {
        try {
            return await this.branchesService.create(createBranchDto);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Get()
    async findAll() {
        try {
            return await this.branchesService.findAll();
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('minimal')
    async findAllMinimal() {
        try {
            return await this.branchesService.findAllMinimal();
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @Get(':id')
    async findOne(@Param('id') id: string) {
        try {
            return await this.branchesService.findOne(id);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        }
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
        try {
            return await this.branchesService.update(id, updateBranchDto);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        try {
            await this.branchesService.remove(id);
            return { message: 'Sucursal eliminada correctamente' };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }
}
