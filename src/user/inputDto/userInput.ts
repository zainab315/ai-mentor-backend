import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class addUserInput {
  @Field(()=>String)
  clerkId: string;

  @Field(()=>String)
  username: string;

  @Field(()=>String)
  email: string;


}

