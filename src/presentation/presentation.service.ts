import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Presentation } from "./entities/presentation.entity";
import { Repository } from "typeorm";
import { CommonService } from "src/common/common.service";
import { CreatePresentationDto } from "./dto/create-presentation.dto";


@Injectable()
export class PresentationService {

  constructor(
    @InjectRepository(Presentation)
    private presentationRepository: Repository<Presentation>,

    private readonly commonService: CommonService
  ) {}

  async create(createPresentationDto: CreatePresentationDto) {

    try {
        const presentation =  this.presentationRepository.create(createPresentationDto);
        return await this.presentationRepository.save(presentation);
    } catch (error) {
        this.commonService.handleExceptions(error.message, 'BR');
    }

  }
}