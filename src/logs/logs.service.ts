import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from './entities/logs.entity';
import { CommonService } from 'src/common/common.service';
import { CreateLogsDto } from './dto/create-log.dto';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>,

    private readonly commonService: CommonService,
  ) {}

  async createLog(createLogDto: CreateLogsDto): Promise<Log> {
    try {
      const log = this.logRepository.create(createLogDto);
      await this.logRepository.save(log);
      return log;
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async getAllLogs(): Promise<Log[]> {
    return this.logRepository.find({ order: { timestamp: 'DESC' } });
  }

  async getLogsByEntity(entity: string): Promise<Log[]> {
    return this.logRepository.find({ where: { entity }, order: { timestamp: 'DESC' } });
  }

}
