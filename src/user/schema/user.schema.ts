import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


@Schema({
  timestamps: true,
})

@ObjectType() // Add this decorator
export class User extends Document {


  @Field(() => String) 
  _id: Types.ObjectId;

  @Prop({ type: String})
  originalClerkId: string;

  @Field(() => String) 
  @Prop({ type: Types.ObjectId }) 
  clerkId: string;

  @Field(() => String) 
  @Prop({ type: String, required: true })
  username: string;

  @Field(() => String) 
  @Prop({ type: String, required: true })
  imageUrl: string;

  @Field(() => String) 
  @Prop({ type: String, required: true, unique: [true, "Duplicate Email Entry"] })
  email: string;

  // @Field(() => Boolean) 
  // @Prop({ type: Boolean, default:true })
  // subscription: boolean;

  @Field(() => Number) 
  @Prop({ type: Number, default:10000})
  credits: number;


  
}



export const UserSchema = SchemaFactory.createForClass(User);