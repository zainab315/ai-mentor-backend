import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Agent } from './schema/agent.schema';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { generateMongoIdFormat, mongoId } from 'utils/deScopeIdForrmater';
import { ResponseDto } from 'src/dto/response.dto';
import { HttpStatusCode } from 'axios';
import { OpenaiService } from 'src/openai/openai.service';
import { UserService } from 'src/user/user.service';
import { HistoryService } from 'src/history/history.service';

@Injectable()
export class AgentService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Agent.name) private AgentModel: Model<Agent>,

    @Inject(forwardRef(() => OpenaiService))
    private readonly userService: UserService,
    private readonly OpenaiSevice: OpenaiService,
    private readonly historyService: HistoryService,
  ) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        'STRIPE_SECRET_KEY is not defined in environment variables',
      );
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15',
    } as any);
  }

  async getCustomAgents(userId: string): Promise<Agent[]> {
    try {
      return await this.AgentModel.find({
        deScopeId: new Types.ObjectId(generateMongoIdFormat(userId)),
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return [];
    }
  }

  async deleteAgent(_id: string): Promise<ResponseDto> {
    try {
      console.log(_id);
      await this.AgentModel.findByIdAndDelete(_id);
      return {
        success: true,
        statusCode: HttpStatusCode.Ok,
      };
    } catch (e) {
      return {
        success: false,
        statusCode: HttpStatusCode.InternalServerError,
      };
    }
  }

  async createAgent(agent: any): Promise<ResponseDto> {
    try {
      const agentExists = await this.AgentModel.findOne({
        deScopeId: mongoId(agent.deScopeId),
        agentName: new RegExp(`^${agent.agentName}$`, 'i'),
      });

      if (agentExists) {
        return {
          success: false,
          statusCode: HttpStatusCode.Accepted,
          msg: 'Agent with the same name already exists',
        };
      }
      // Respond immediately
      setTimeout(() => this.processAgentInBackground(agent), 0);

      return {
        success: true,
        statusCode: HttpStatusCode.Accepted,
        msg: 'Agent creation started in the background.',
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return {
        success: false,
        statusCode: HttpStatusCode.InternalServerError,
        msg: 'Failed to initiate agent creation.',
      };
    }
  }

  // Background task (extract from main method)
  private async processAgentInBackground(agent: any): Promise<void> {
    try {
      let textData: string = '';

      if (agent.coursetype === 'File') {
        const response = await this.OpenaiSevice.imageToText(
          [agent.course],
          'Extract Image Data',
          agent.deScopeId,
        );
        textData = response.data;
      } else {
        textData = agent.course;
      }

      const outline: any = await this.OpenaiSevice.generateCourseOutline(
        agent.subjectName,
        agent.difficulty,
        agent.educationLevel,
        textData,
        agent.deScopeId,
      );

      if (!outline.success) return;

      const history = [];
      const parsedOutline = JSON.parse(outline?.data);

      for (const section of parsedOutline?.sections || []) {
        for (const topic of section.topics) {
          const userBoj = {
            id: agent.deScopeId,
            sender: 'user',
            content: {
              text: topic.title,
            },
          };

          const openaiAnswer = await this.OpenaiSevice.courseAnswers(
            topic.title,
            agent.deScopeId,
          );

          let answer = 'N/A';
          if (openaiAnswer.success) {
            answer = openaiAnswer.answer;
            topic.answer = answer;
          }

          const botObj = {
            id: agent.deScopeId,
            sender: 'bot',
            content: {
              text: answer,
            },
          };

          history.push(userBoj);
          history.push(botObj);
        }
      }

      await this.AgentModel.deleteMany({
        deScopeId: mongoId(agent.deScopeId),
        agentName: agent.agentName,
      });

      await this.historyService.deleteHistoryList(
        agent.deScopeId,
        agent.agentName,
      );

      await this.AgentModel.create({
        ...agent,
        course: parsedOutline.sections,
        deScopeId: new Types.ObjectId(generateMongoIdFormat(agent.deScopeId)),
      });

      await this.historyService.create({
        userId: agent.deScopeId,
        agentName: agent.agentName,
        title: 'CourseOutLine',
        history: JSON.stringify(history),
      });
    } catch (e) {
      console.error('Background processing failed:', e);
    }
  }

  async getAgentAndCourseById(_id: string): Promise<Agent> {
    try {
      return this.AgentModel.findById(_id);
    } catch (e) {
      return;
    }
  }

  async findOne(agentId: string): Promise<Agent | null> {
    try {
      const agent = await this.AgentModel.findOne({ _id: agentId });
      if (agent == null) {
        return null;
      }
      return agent;
    } catch (e) {
      return null;
    }
  }

  async courseTopicStatusUpdate(
    docId: string,
    status: string,
    courseId: string,
    topicId: string,
  ): Promise<ResponseDto> {
    try {
      await this.AgentModel.updateOne(
        {
          _id: docId,
          'course._id': courseId,
          'course.topics._id': topicId,
        },
        {
          $set: { 'course.$.topics.$[topic].status': status },
        },
        {
          arrayFilters: [{ 'topic._id': topicId }],
        },
      );

      return {
        success: true,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: `Error updating topic status: , ${error}`,
      };
    }
  }

  async courseTopicCompleteStatus(
    status: boolean,
    courseId: string,
    docId: string,
  ): Promise<ResponseDto> {
    try {
      await this.AgentModel.updateOne(
        {
          _id: docId,
          'course._id': courseId,
        },
        {
          $set: { 'course.$.courseComplete': status },
        },
      );

      const agent = await this.AgentModel.findOne({
        _id: docId,
      });

      const noOfTopics = agent.course.length;
      const noOfCompleteTopics = agent.course.filter(
        (topic) => topic.courseComplete,
      ).length;
      const progress = (noOfCompleteTopics / noOfTopics) * 100 || 0;

      await this.AgentModel.findByIdAndUpdate({ _id: docId }, { progress });

      return {
        success: true,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: `Error updating topic status: , ${error}`,
      };
    }
  }

  async getTotalAgentCount(userId: string): Promise<number> {
    try {
      return this.AgentModel.find({
        deScopeId: new Types.ObjectId(generateMongoIdFormat(userId)),
      }).countDocuments();
    } catch (e) {
      return 0;
    }
  }
}
