import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schema/user.schema';

// Agent Schema
@ObjectType()
@Schema()
export class History extends Document {
  @Field(() => String)
  _id: Types.ObjectId;

  @Field(() => User)
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Field(() => String)
  @Prop({ type: String })
  agentName: string;

  @Field(() => String)
  @Prop({ type: String })
  history: string;

  @Field(() => String)
  @Prop({ type: String })
  title: string;
}

export const HistorySchema = SchemaFactory.createForClass(History);
