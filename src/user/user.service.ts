import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import mongoose, { Model, Types } from 'mongoose';
import { addUserInput } from './inputDto/userInput'
import { generateMongoIdFormat, mongoId } from '../utils/deScopeIdForrmater';
import axios from 'axios';
import { SubscriptionService } from './subscription/subscription.service';
import { planType } from './subscription/schema/subscription.schema';


@Injectable()
export class UserService {
  private readonly clerkApiUrl = 'https://api.clerk.com/v1/users';
  private readonly clerkSecretKey = process.env.CLERK_SECRET_KEY;
  private googleScriptUrl = 'https://script.google.com/macros/s/AKfycbz7fZusON-PMF_Zo7CWwC8w9ybil5eOrMhN7P9qolftR8wx_evBbUWE2hapK4wylJYW/exec';
  constructor(
    @InjectModel(User.name) private userModel:Model<User>,
    @Inject(forwardRef(() => SubscriptionService)) // Fix circular dependency
    private readonly subscriptionService: SubscriptionService,
    ){}


  // async updateCustomAttribute(user_Id:string,status:boolean):Promise<boolean>{

  //   try {
  //     const response = await axios.patch(
  //       `${this.clerkApiUrl}/${user_Id}/metadata`,
  //       {
  //         public_metadata: {
  //           subscription: status
  //         }
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${this.clerkSecretKey}`,
  //           'Content-Type': 'application/json',
  //         },
  //       }
  //     );
  //     console.log(response)
  //     return true
  //   } catch (error) {
  //     console.log(error)
  //     console.log(`Failed to update subscription: ${error.response?.data || error.message}`)
  //     return false;
  //   }
  // }     

  async addUser (addUserInput:any):Promise<boolean>{
        try{
            const count = await this.userModel.countDocuments({ email: addUserInput.email });
            if(count>0) return false
            let username 
            if(addUserInput.first_name && addUserInput.last_name){
               username = addUserInput.first_name + " " + addUserInput.last_name
            }else{
              username = addUserInput.first_name
            }
            const user = new this.userModel({
                email:addUserInput.email_addresses[0].email_address,
                username:username,
                imageUrl:addUserInput.image_url,
                originalClerkId:addUserInput.id,
                clerkId: new Types.ObjectId(generateMongoIdFormat(addUserInput.id)),
                // credits:10000
            });
            console.log(user)
            await user.save()
            // await this.updateCustomAttribute(addUserInput.id,true)
            await this.subscriptionService.addSubscription(addUserInput.id,planType.FREE,0)
            return true;
        }catch(e){
            console.log(e)
            return false
        }
  }

  async getUser(deScopeId:string):Promise<User>{
        return this.userModel.findOne({clerkId:new Types.ObjectId(generateMongoIdFormat(deScopeId))})
  }

  async findOne(clerkId:string):Promise<User | null>{
    try{


      

      const user = this.userModel.findOne({clerkId:new Types.ObjectId(generateMongoIdFormat(clerkId))})

      if(user == null){
        return null
      }
      return user
    }catch(e){
      return null
    }
  }

  async getCredits(clerkId: string): Promise<number | null> {
    try {
        console.log('Received clerkId:', clerkId);

        if (typeof clerkId !== 'string' || !clerkId.trim()) {
            throw new Error("Invalid clerkId received");
        }

        const user = await this.userModel
            .findOne({ originalClerkId: clerkId })
            .select("credits")
            .lean();

        console.log('User found:', user);
        return user?.credits ?? null;
    } catch (error) {
        console.error("Error fetching credits:", error);
        return null;
    }
}




  async getExpiredTrials(): Promise<User[]> {
      return this.userModel.find({
          subscription: true
      });
  }

  async updateSubscriptionStatus(userId: any, credits: number) {
    try {

      const isObjectId = mongoose.Types.ObjectId.isValid(userId);

      const query = isObjectId
        ? { clerkId: userId }
        : { originalClerkId: userId };
      
        const updatedUser = await this.userModel.findOneAndUpdate(
          query,
          { $set: { credits } },
          { new: true, projection: { credits: 1, _id: 0 } } // Return only the updated credits
        );

      console.log(updatedUser)
  
      return updatedUser?.credits; // Return only the credits value
    } catch (error) {
      console.error("Error updating subscription status:", error);
      throw new Error("Failed to update subscription status"); // Re-throw or handle error
    }
  }

  async updateCredits(userId: any, creditsToDeduct: number) {
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(userId);

        const query = isObjectId
            ? { clerkId: userId }
            : { originalClerkId: userId };

        // Fetch the user first
        const user = await this.userModel.findOne(query, { credits: 1 });

        if (!user) {
            throw new Error("User not found");
        }

        // Ensure credits do not go below 0
        if (user.credits < creditsToDeduct) {
            await this.userModel.updateOne(query, { $set: { credits: 0 } });
            return 0;
        }

        // Deduct the credits safely
        const updatedUser = await this.userModel.findOneAndUpdate(
            query,
            { $inc: { credits: -creditsToDeduct } },
            { new: true, projection: { credits: 1, _id: 0 } }
        );

        console.log(updatedUser);
        return updatedUser.credits;
    } catch (error) {
        console.error("Error updating credits:", error);
        throw new Error("Failed to update credits");
    }
}
  
  

  async getOriginalClerkId(clerkId: string): Promise<string | null> {
    const user = await this.userModel.findOne(
        { clerkId: new Types.ObjectId(clerkId) },
        { originalClerkId: 1, _id: 0 } // Project only originalClerkId
    );
    return user?.originalClerkId || null;
}

  async delUser(data:any):Promise<void>{
    try{
      return this.userModel.findOneAndDelete({originalClerkId:data.id})
    }catch(e){
      console.log('webhook delete Error')
    }
  }

  async sendDataToGoogleSheet(data: { name: string; email: string; phone: string; state: string }) {
    try {
      console.log(data)
      const response = await axios.post(this.googleScriptUrl, data, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.status == 200 ? true : false;
    } catch (error) {
      return false
    }
  }


}
