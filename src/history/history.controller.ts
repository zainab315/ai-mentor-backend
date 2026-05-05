import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  CreateHistoryDto,
  HistoryService,
  UpdateHistoryDto,
} from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post()
  async create(@Body() createHistoryDto: CreateHistoryDto) {
    return this.historyService.create(createHistoryDto);
  }

  @Get('get/:id')
  async findOne(@Param('id') id: string) {
    return this.historyService.findOne(id);
  }

  @Get('list/:userId/:agentName')
  async findAll(
    @Param('userId') userId: string,
    @Param('agentName') agentName: string,
  ) {
    if (!userId || !agentName) {
      throw new BadRequestException('userId and agentName are required');
    }

    console.log(userId, agentName);
    return this.historyService.findAll(userId, agentName);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.historyService.delete(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateHistoryDto: UpdateHistoryDto,
  ): Promise<History> {
    return this.historyService.update(id, updateHistoryDto);
  }
}
