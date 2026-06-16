import { forwardRef, Module } from '@nestjs/common';
import { AgentResolver } from './agent.resolver';
import { AgentService } from './agent.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Agent, AgentSchema } from './schema/agent.schema';
import { UserModule } from '../user/user.module';
import { AgentController } from './agent.controller';
import { OpenaiModule } from './openai/openai.module';
import { HistoryModule } from './history/history.module';

@Module({
  imports: [
    HistoryModule,
    MongooseModule.forFeature([
      {
        name: Agent.name,
        schema: AgentSchema,
      },
    ]),
    forwardRef(() => OpenaiModule),
    UserModule,
  ],
  providers: [AgentResolver, AgentService],
  controllers: [AgentController],
  exports: [AgentService],
})
export class AgentModule {}
