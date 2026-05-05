import { Module } from '@nestjs/common';
import { DocxController } from './docx.controller';
import { DocxService } from './docx.service';
import { AgentModule } from 'src/agent/agent.module';

@Module({
  imports:[
    AgentModule,
  ],
  controllers: [DocxController],
  providers: [DocxService]
})
export class DocxModule {}
