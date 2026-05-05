import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


@Schema({
  timestamps: true,
})

@ObjectType() // Add this decorator
export class Log extends Document {


  @Field(() => String) 
  @Prop({ type: String,})
  id: string;

  @Field(() => String) 
  @Prop({ type: String })
  msg: string;


  
}



export const LogSchema = SchemaFactory.createForClass(Log);