import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { LogModule } from 'src/log/log.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Subscription, SubscriptionSchema } from './schema/subscription.schema';
import { SubscriptionResolver } from './subscription.resolver';
import { UserModule } from 'src/user/user.module'; // Import Module, not Service

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Subscription.name, schema: SubscriptionSchema }]),
    LogModule,
    forwardRef(() => UserModule), // Fix circular dependency
  ],
  providers: [SubscriptionService, SubscriptionResolver], // Do NOT add UserService here
  controllers: [SubscriptionController],
  exports: [SubscriptionService], // Export SubscriptionService for UserModule
})
export class SubscriptionModule {}
