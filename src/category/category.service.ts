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
      return await this.categoryRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }
}
