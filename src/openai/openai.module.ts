import { forwardRef, Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { OpenaiController } from './openai.controller';
import { AgentModule } from './agent/agent.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [UserModule, forwardRef(() => AgentModule)],
  providers: [OpenaiService],
  controllers: [OpenaiController],
  exports: [OpenaiService],
})
export class OpenaiModule {}
