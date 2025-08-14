

import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { PresentationService } from './presentation.service';
import { CreateCategoryDto } from 'src/category/dto/create-category.dto';
import { UpdatePresentationDto } from './dto/update-prsentation.dto';

@Controller('presentation')
export class PresentationController {
  constructor(private readonly presentationService: PresentationService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.presentationService.create(createCategoryDto);
  }

  @Get()
  findAll() {
    return this.presentationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.presentationService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePresentationDto: UpdatePresentationDto) {
    return this.presentationService.update(+id, updatePresentationDto);
  }
}
