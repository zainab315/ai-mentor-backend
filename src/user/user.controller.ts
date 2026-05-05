import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {

    constructor(private readonly userSevice: UserService) {}


    @Post("addUser")
    async addUser(@Body() data:any):Promise<boolean>{return this.userSevice.addUser(data.data)}

    @Post("delUser")
    async delUser(@Body() data:any){return this.userSevice.delUser(data.data)}
    
    @Post('updateClerk')
  async updateSubscription(
    @Body('userId') userId: string,
    @Body('credits') credits: number
  ) {
    return this.userSevice.updateSubscriptionStatus(userId, credits);
  }

  @Get('getCredits')
async getCredits(@Query('clerkId') clerkId: string) {
  return this.userSevice.getCredits(clerkId);
}

@Post("googleSheet")
  async sendToSheet(@Body() body: { name: string; email: string; phone: string; state: string }) {
    return this.userSevice.sendDataToGoogleSheet(body);
  }

  
}
