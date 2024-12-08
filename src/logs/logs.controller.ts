import { Controller, Get, Param } from '@nestjs/common';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}


  @Get()
  async getAllLogs() {
    return this.logsService.getAllLogs();
  }

  @Get(':entity')
  async getLogsByEntity(@Param('entity') entity: string) {
    return this.logsService.getLogsByEntity(entity);
  }
}
