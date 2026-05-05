import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum planType {
    FREE = "Free",
    BASIC = "Basic",
    PREMIUM = "Pro",
    PRO = "Premium"
}

export enum planStatus {
    ACTIVE = "Active",
    Expired = "Expired"
}

@Schema({
  timestamps: true,
})


@ObjectType() // Add this decorator
export class Subscription extends Document {


  @Field(() => String) 
  _id: Types.ObjectId;

  @Field(() => String) 
  @Prop({ type: Types.ObjectId }) 
  userId: string;

  @Field(() => String) 
  @Prop({ enum: planType, required: true })
  planType: string;

  @Field(() => Number) 
  @Prop({ type: Number, required: true})
  amount: number;

  @Field(() => String) 
  @Prop({ enum: planStatus, required:true})
  planStatus: string;

  @Field(() => Date, { nullable: true })  // Allow null if expired
  @Prop({
    type: Date,
    default: () => {
      const now = new Date();
      now.setUTCHours(0, 0, 0, 0); // Reset time to 00:00:00 UTC
      now.setUTCDate(now.getUTCDate() + 7); // Add 7 days in UTC
      return now;
    },
  })
  expire: Date;

  @Field(() => Date)  // Include createdAt field
  createdAt: Date;

  


  
}



export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);