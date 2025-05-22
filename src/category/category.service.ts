import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class CategoryService {

  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,

    private readonly commonService: CommonService
  ) {}


  async create(createCategoryDto: CreateCategoryDto) {
    

    const categoryExist = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (categoryExist) this.commonService.handleExceptions('Esta categoria ya existe.', 'BR');

    try {
      const category = this.categoryRepository.create(createCategoryDto);
      await this.categoryRepository.save(category);
      return category;
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }

  }

  async findAll() {
    try {
      return await this.categoryRepository.find();
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async findOne(id: number) {
    try {
      const res = await this.categoryRepository.findOne({
        where: { id },
      });
      if (!res) this.commonService.handleExceptions('No se encontro la categoria', 'NF');
      return res;
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'NF');
    }
  }

  async update(id: number, updateCategoryDto: CreateCategoryDto) {
    const category = await this.findOne(id);
    this.categoryRepository.merge(category, updateCategoryDto);
    this.categoryRepository.save(category);
    return {
      message: 'Categoria actualizada correctamente',
    }
  }

  async delete(id: number) {
    const category = await this.findOne(id);
    return this.categoryRepository.remove(category);
  }
}
