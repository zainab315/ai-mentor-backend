import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AgentModule } from './agent/agent.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { OpenaiModule } from './openai/openai.module';
import { AwsModule } from './aws/aws.module';
import { QuizModule } from './quiz/quiz.module';
import { EventsGateway } from './events/events.gateway';
import { EventsController } from './events/events.controller';
import { SubscriptionModule } from './subscription/subscription.module';
import { SubscriptionService } from './subscription/subscription.service';
import { LogModule } from './log/log.module';
import { HistoryModule } from './history/history.module';
import { DocxModule } from './docx/docx.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    MongooseModule.forRoot(process.env.MONGODB_CONNECTION_URL),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver, 
      autoSchemaFile: true, 
      playground:true
    }),
    UserModule,
    AgentModule,
    OpenaiModule,
    AwsModule,
    QuizModule,
    SubscriptionModule,
    LogModule,
    HistoryModule,
    DocxModule
  ],
  controllers: [AppController, EventsController],
  providers: [AppService, AppResolver, EventsGateway],
})

export class AppModule implements OnModuleInit {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  onModuleInit() {
    this.subscriptionService.startTrialCheckJob();
  }
}
