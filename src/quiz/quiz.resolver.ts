import { Args, Field, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { QuizService } from './quiz.service';
import { ResponseDto } from './dto/response.dto';
import { Quiz } from './schema/quiz.schema';

@Resolver()
export class QuizResolver {

    constructor(private readonly quizService:QuizService){}


    @Mutation(() => ResponseDto, { name: 'addQuiz' })
    async addQuiz(
        @Args({ name: 'deScopeId', type: () =>String}) deScopeId: string,
        @Args({ name: 'marks',      type: () =>String}) marks: string,
        @Args({ name: 'subject',      type: () =>String}) subject: string,
        @Args({ name: 'difficulty',      type: () =>String}) difficulty: string,
        @Args({ name: 'level',      type: () =>String}) level: string,
        @Args({ name: 'subBranch',      type: () =>String}) subBranch: string,
    ): Promise<ResponseDto> {
        return this.quizService.addQuiz(marks,deScopeId,subject,difficulty,level,subBranch);
    }


    @Query(() => QuizPaginationResponse, { name: 'getAllQuiz' })
async getAllQuiz(
    @Args({ name: 'userId', type: () => String }) userId: string,
    @Args({ name: 'page', type: () => String }) page: string,
    @Args({ name: 'limit', type: () => String }) limit: string
): Promise<QuizPaginationResponse> {
    return this.quizService.getAllQuiz(userId, Number(page), Number(limit));
}
    @Query(() => Number, { name: 'getTotalQuizCount' })
    async getTotalQuizCount(
        @Args({name: 'userId', type:()=>String}) userId: string
    ): Promise<number> {
        return this.quizService.getTotalQuizCount(userId);
    }

    
}

@ObjectType()
export class QuizPaginationResponse {
    @Field(() => [Quiz])
    data: Quiz[];

    @Field(() => Number)
    totalPages: number;

    @Field(() => Number)
    totalQuizCount: number;

    @Field(() => Number)
    currentPage: number;

    @Field(() => Number)
    currentPagePerLimit: number;
}

