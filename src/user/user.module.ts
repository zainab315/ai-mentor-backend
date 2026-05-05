import { forwardRef, Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { UserController } from './user.controller';
import { SubscriptionModule } from 'src/subscription/subscription.module'; // Import Module, not Service

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => SubscriptionModule), // Fix circular dependency
  ],
  providers: [UserResolver, UserService], // Do NOT add SubscriptionService here
  exports: [UserService], // Export UserService so SubscriptionModule can use it
  controllers: [UserController],
})
export class UserModule {}
