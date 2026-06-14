import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { addUserInput } from './inputDto/userInput';
import { UserService } from './user.service';
import { User } from './schema/user.schema';

@Resolver()
export class UserResolver {
    constructor( private userSerice: UserService){}

    @Mutation(() => Boolean, { name: 'addUser' })
    async createUser(
        @Args('addUserInput') addUserInput: addUserInput,
    ): Promise<boolean> {
        return this.userSerice.addUser(addUserInput);
    }

    // ✅ FIXED: Nullable banaya aur optional argument
    @Query(() => User, { name: 'getUser', nullable: true })
    async getUser(
        @Args('deScopeId', { nullable: true }) deScopeId?: string,  // Optional banaya
    ): Promise<User | null> {  // Return type nullable
        try {
            // Agar deScopeId nahi hai toh Clerk se user ID lo
            if (!deScopeId) {
                console.log('No deScopeId provided, returning null');
                return null;
            }
            
            const user = await this.userSerice.getUser(deScopeId);
            return user;
        } catch (error) {
            console.error('GetUser error:', error);
            return null;
        }
    }
}