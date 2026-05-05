import { Module } from '@nestjs/common';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { HistoryResolver } from './history.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { HistorySchema } from './schema/history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'History',
        schema: HistorySchema,
      },
    ]),
  ],
  controllers: [HistoryController],
  providers: [HistoryService, HistoryResolver],
  exports: [HistoryService],
})
export class HistoryModule {}
