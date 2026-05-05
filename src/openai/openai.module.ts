import { forwardRef, Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { OpenaiController } from './openai.controller';
import { AgentModule } from 'src/agent/agent.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule, forwardRef(() => AgentModule)],
  providers: [OpenaiService],
  controllers: [OpenaiController],
  exports: [OpenaiService],
})
export class OpenaiModule {}
