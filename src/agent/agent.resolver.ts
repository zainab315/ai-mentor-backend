import { Args, Query, Resolver } from '@nestjs/graphql';
import { AgentService } from './agent.service';
import { Agent } from './schema/agent.schema';
@Resolver()
export class AgentResolver {

    constructor(private readonly AgentService:AgentService){}

    @Query(() => [Agent], { name: 'getCustomAgents' })
    async getCustomAgents(
        @Args({ name: 'userId'}) userId: string
    ): Promise<Agent[]> {
        return this.AgentService.getCustomAgents(userId);
    }

    @Query(() => Number, { name: 'getTotalAgentCount' })
    async getTotalAgentCount(
        @Args({name: 'userId', type:()=>String}) userId: string
    ): Promise<number> {
        return this.AgentService.getTotalAgentCount(userId);
    }

    @Query(() => Agent, { name: 'getAgentAndCourseById' })
    async getAgentAndCourseById(
        @Args({name: '_id', type:()=>String}) _id: string
    ): Promise<Agent> {
        return this.AgentService.getAgentAndCourseById(_id);
    }


}








