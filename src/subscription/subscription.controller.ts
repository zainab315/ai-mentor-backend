import { Controller, Post, Req, Res, Headers,HttpStatus, HttpException, Get, Query, Body } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Response, Request } from 'express';
@Controller('subscription')
export class SubscriptionController {


    constructor(private readonly subscriptionService: SubscriptionService) {}
   

    @Post('webhook')
    async onSuccssCheckout(
        @Req() req: Request,
        @Res() res: Response,
        @Headers() headers: Record<string, string>,
    ) {
        try {
          console.log('hit')
            const sig = headers['stripe-signature']
          
            await this.subscriptionService.onSuccess(req.body, sig);
            res.status(HttpStatus.OK).send('Webhook received');
          } catch (err) {
            throw new HttpException(
              `Webhook Error: ${err.message}`,
              HttpStatus.BAD_REQUEST,
            );
          }
    }


    @Post('createPayment')
    async createPayment(@Body() data:any): Promise<{ id: string }> {
      return this.subscriptionService.createPayment(data)
    }


    @Get()
  async getSubscriptions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('userId') userId: string 
  ) {
    return this.subscriptionService.getSubscriptions(+page, +limit,userId);
  }
}
