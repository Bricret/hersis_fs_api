import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Presentation } from './entities/presentation.entity';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';
import { CommonService } from 'src/common/common.service';

@Module({
  imports: [TypeOrmModule.forFeature([Presentation])],
  controllers: [PresentationController],
  providers: [PresentationService, CommonService],
})
export class PresentationModule {}
