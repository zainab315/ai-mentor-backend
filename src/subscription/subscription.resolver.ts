import { Args, Query, Resolver } from '@nestjs/graphql';
import { Subscription } from './schema/subscription.schema';
import { SubscriptionService } from './subscription.service';
import { Field, Int, ArgsType,ObjectType } from '@nestjs/graphql';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { defaultValue: 1 , nullable:true})
  page: number;

  @Field(() => Int, { defaultValue: 10, nullable:true })
  limit: number;

  @Field(() => String, {  nullable:false })
  userId: string;
}


@ObjectType()
export class SubscriptionResponse {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => [Subscription],{nullable:true})
  data: Subscription[];
}


@Resolver()
export class SubscriptionResolver {


    constructor(private readonly subscriptionService: SubscriptionService) {}

  @Query(() => SubscriptionResponse)
  async getSubscriptions(@Args() paginationArgs: PaginationArgs) {
    return this.subscriptionService.getSubscriptions(paginationArgs.page, paginationArgs.limit, paginationArgs.userId);
  }

  @Query(() => Subscription, { nullable: true })
  async getActiveSubscription(@Args('userId', { type: () => String }) userId: string) {
    return this.subscriptionService.getActiveSubscription(userId);
  }
  
}


