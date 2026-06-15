import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import * as cron from 'node-cron';
import { LogService } from 'src/log/log.service';
import { UserService } from 'src/user/user.service';
import Stripe from 'stripe';
import { generateMongoIdFormat, mongoId } from 'utils/deScopeIdForrmater';
import { planStatus, planType, Subscription } from './schema/subscription.schema';
import { InjectModel } from '@nestjs/mongoose';
import { SubscriptionResponse } from './subscription.resolver';

@Injectable()
export class SubscriptionService {

  private stripe: Stripe;

  constructor(
    @Inject(forwardRef(() => UserService)) // Fix circular dependency
    private readonly usersService: UserService,
    private readonly log:LogService,
    @InjectModel(Subscription.name) private readonly subscriptionModel:Model<Subscription>
  ) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('API_SECRET_KEY is not defined in environment variables');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15',
    } as any);
  }

    // Runs every hour to check trial expiry
  startTrialCheckJob() {
    cron.schedule('0 * * * *', async () => { 
      console.log('Checking expired trials...');
      const expiredUsers = await this.usersService.getExpiredTrials();
      
      for (const user of expiredUsers) {
        await this.usersService.updateSubscriptionStatus(user.clerkId,0);
        // await this.usersService.updateCustomAttribute(user.originalClerkId,false)
        await this.updateSubscriptionStatus(user.clerkId)
        console.log(`Trial expired for user: ${user.email}`)
      }
    });
  }

  async onSuccess(payload:any, sig:string): Promise<void> {
   
    let event: Stripe.Event;

    try {
        event = this.stripe.webhooks.constructEvent(
          payload,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET,
        );
    } catch (err: any) {
        console.log(`Stripe webhook signature verification failed: ${err.message}`)
        const session = event.data.object as Stripe.Checkout.Session;
        if(session){
            await this.log.createLog(session.metadata.deScopeId,`Stripe webhook signature verification failed: ${err.message} line 7 tokens ${session.metadata.credit}`)
        }else{
            await this.log.createLog("none",`Stripe webhook signature verification failed: ${err.message} line 49 tokens ${session.metadata.credit}`)
        }
        throw new Error(`Stripe webhook signature verification failed: ${err.message}`);
    } 
    
    let session;
    try{
      if (event.type === 'checkout.session.completed') {

          session = event.data.object as Stripe.Checkout.Session;
          console.log(session)
          let clerkId = session.metadata.clerkId
          const credits = Number(session.metadata.credit)
          const planType = session.metadata.planType
          const amount = Number(session.metadata.amount)
          clerkId = new Types.ObjectId(clerkId)
          const originalClerkId = await this.usersService.getOriginalClerkId(clerkId)
          console.log(originalClerkId)
          console.log(clerkId)
          // await this.usersService.updateCustomAttribute(originalClerkId,true)
          await this.usersService.updateSubscriptionStatus(clerkId,credits)
          await this.updateSubscriptionStatus(clerkId)
          await this.addSubscription(clerkId,planType,amount,true)
          
            
      }
    }catch(err: any){
        await this.log.createLog("none",`Delivery failed. Try catch line 106 of checkout session completed: ${err.message} tokens ${session.metadata.credit}`)
    }

  }

  async createPayment(
    paymentRequestBody: any,
  ): Promise<{ id: string }> {

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
            price_data: {
              currency: 'usd',
              product_data: {
                name: paymentRequestBody.planName,
                images: Array.isArray(paymentRequestBody.planImage) ? paymentRequestBody.planImage : [paymentRequestBody.planImage],
              },
              unit_amount: Math.round(paymentRequestBody.amount) * 100,
            },
            quantity: 1,
          }
        ],
        mode: 'payment',
        success_url: `${paymentRequestBody.path}/${paymentRequestBody.onComplete}`,
        cancel_url: `${paymentRequestBody.path}/${paymentRequestBody.onFailure}`,
        metadata:{
            clerkId: generateMongoIdFormat(paymentRequestBody._id),
            credit:paymentRequestBody.credit.toString(),
            planType:paymentRequestBody.planName,
            amount:paymentRequestBody.amount.toString()
      }
    })
      
      return {
        id: session.id,
      };
    } catch (error) {
      console.error('Stripe Error:', error);
      throw new Error('Failed to create payment session');
    }
  }

  async addSubscription(clerkId:any,planType:planType,amount:number, custom:boolean=false):Promise<boolean>{
    if(!custom)
    {
      try{
          await this.subscriptionModel.create({
              userId:mongoId(clerkId),
              planType,
              amount:amount,
              planStatus:planStatus.ACTIVE,
          })
          return true
      }catch(e){
          await this.log.createLog(mongoId(clerkId),"error while adding a document of subscription into database ")
          return false
      }
    }else{
      try{
          const now = new Date();
          now.setUTCHours(0, 0, 0, 0); // Reset time to 00:00:00 UTC
          now.setUTCDate(now.getUTCDate() + 30); // Add 7 days in UTC
          const date = now;
        
        await this.subscriptionModel.create({
            userId:clerkId,
            planType,
            amount:amount,
            planStatus:planStatus.ACTIVE,
            expire:date
        })

        return true
    }catch(e){
        await this.log.createLog(mongoId(clerkId),"error while adding a document of subscription into database ")
        return false
    }
    }
  }

  async updateSubscriptionStatus(clerkId:any):Promise<boolean>{
    try{
        await this.subscriptionModel.updateMany({
            userId:clerkId,
            planStatus:planStatus.ACTIVE
        },
        {
            $set:{
                planStatus:planStatus.Expired
            }
        }
        )
        return true
    }catch(e){
        await this.log.createLog(clerkId.toString(),"error while updating Subscription Status  a document of subscription into database ")
        return false
    }
  }

  async getSubscriptions(page: number, limit: number, userId: string): Promise<SubscriptionResponse> {
    const skip = (page - 1) * limit; // Calculate pagination offset

    const filter = { userId: mongoId(userId) };

    const subscriptions = await this.subscriptionModel
      .find(filter)
      .sort({ createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.subscriptionModel.countDocuments(filter); // Filtered total count

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: subscriptions,
    };
  }

  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptionModel
      .findOne({ userId:mongoId(userId), planStatus: planStatus.ACTIVE }) 
      .sort({ createdAt: -1 })
      .exec();
  }

}
