import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Quiz } from './schema/quiz.schema';
import { Model, Types } from 'mongoose';
import { ResponseDto } from 'src/dto/response.dto';
import { generateMongoIdFormat, mongoId } from 'utils/deScopeIdForrmater';

@Injectable()
export class QuizService {

    constructor(@InjectModel(Quiz.name) private QuizModel:Model<Quiz>){}


    async addQuiz(marks:string,deScopeId:string,subject:string,difficulty:string,level:string,subBranch:string):Promise<ResponseDto>{
        try{
            await this.QuizModel.create({deScopeId:mongoId(deScopeId),marks,subject,difficulty,level,subBranch})
            return { success: true, statusCode: HttpStatus.OK };
        }
        catch(e){

            return {
                success: false,
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                msg: "Process failed adding quiz record",
              };
        }
    } 

    async getAllQuiz(userId: string, page: number, limit: number) {
        try {
            console.log(mongoId(userId))
            const query = { deScopeId: mongoId(userId) };
            console.log(query)
            
            const totalQuizCount = await this.QuizModel.countDocuments(query);
            const totalPages = Math.ceil(totalQuizCount / limit);
            
            const quizes = await this.QuizModel.find(query)
                .skip((page - 1) * limit)
                .limit(limit)
                .exec();
            
            return {
                data: quizes,
                totalPages,
                totalQuizCount,
                currentPage: page,
                currentPagePerLimit: limit
            };
        } catch (e) {
            return {
                data: [],
                totalPages: 0,
                totalQuizCount: 0,
                currentPage: page,
                currentPagePerLimit: limit
            };
        }
    }
    
    

    async getTotalQuizCount(userId:string):Promise<number>{
        try{
            return this.QuizModel.find({deScopeId:new Types.ObjectId(generateMongoIdFormat(userId))}).countDocuments()
        }
        catch(e){
            return 0
        }
    }
}
