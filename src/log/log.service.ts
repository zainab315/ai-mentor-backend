import { Injectable } from '@nestjs/common';
import { Log } from './schema/log.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class LogService {

    constructor(@InjectModel(Log.name) private logModel:Model<Log>){}


    async createLog(id:string,msg:string):Promise<boolean>{
        try{
            await this.logModel.create({id,msg})
            return true
        }catch(e){
            console.log(e)
            return false
        }
    }
}
