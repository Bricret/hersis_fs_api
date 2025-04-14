

import { Controller, Get, Post, Body } from '@nestjs/common';
import { PresentationService } from './presentation.service';
import { CreateCategoryDto } from 'src/category/dto/create-category.dto';

@Controller('category')
export class PresentationController {
  constructor(private readonly presentationService: PresentationService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.presentationService.create(createCategoryDto);
  }
}
