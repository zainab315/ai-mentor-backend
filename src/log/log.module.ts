import { Module } from '@nestjs/common';
import { LogController } from './log.controller';
import { LogService } from './log.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Log, LogSchema } from './schema/log.schema';

@Module({
  imports:[
    MongooseModule.forFeature([{name:Log.name,schema:LogSchema}])
  ],
  controllers: [LogController],
  providers: [LogService],
  exports:[LogService]
})
export class LogModule {}
