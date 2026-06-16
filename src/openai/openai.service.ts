import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import * as fs from 'fs';
import { ResponseDto } from '../dto/response.dto';
import { Observable } from 'rxjs';
import { ASSISTANT } from './enum/Assistant.enum';
import * as path from 'path';
import { AgentService } from './agent/agent.service';
import { countTokens } from '../utils/methods';
import { mongoId } from '../utils/deScopeIdForrmater';
import { UserService } from '../user/user.service';


@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  constructor(
    @Inject(forwardRef(() => AgentService))
    private readonly agentService: AgentService,
    private readonly userService: UserService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  //Assistant part Start ----------------------------------------------------------------

  // You are a professional medical report analyst.
  // I will ask you questions about the stock market and you will answer them.
  // If you're not 100% sure of the answer, you can say "I don't know"

  async createAssistant(role: string, name: string): Promise<ResponseDto> {
    try {
      const assistant = await this.openai.beta.assistants.create({
        instructions: role,
        name: name,
        tools: [{ type: 'code_interpreter' }],
        model: 'gpt-4o-mini',
      });
      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        data: assistant,
        msg: 'Assistant created',
      };
    } catch (e: any) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: e?.error?.message,
      };
    }
  }

  async deleteAssistant(assistantId: string): Promise<ResponseDto> {
    if (!assistantId)
      return {
        success: true,
        msg: ' Provide assistantId',
        statusCode: HttpStatus.BAD_REQUEST,
      };

    try {
      await this.openai.beta.assistants.del(assistantId);
      return {
        success: true,
        statusCode: HttpStatus.OK,
        msg: 'Assistant deleted',
      };
    } catch (e : any) {
      return {
        success: false,
        msg: e?.error?.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async assistantList(): Promise<ResponseDto> {
    try {
      const list = await this.openai.beta.assistants.list({
        order: 'desc',
      });
      return { data: list.data, success: true, statusCode: HttpStatus.OK };
    } catch (e: any) {
      return {
        success: false,
        data: [],
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: e?.error?.message,
      };
    }
  }

  //Assistant part End ------------------------------------------------------------

  //Thread part Start -------------------------------------------------------------

  async createThread(): Promise<ResponseDto> {
    try {
      const Thread = await this.openai.beta.threads.create(); //thread_Y0MvSLsaTUDULfAHsYzEYPzY
      return {
        data: Thread,
        success: true,
        statusCode: HttpStatus.CREATED,
        msg: 'Thread Created',
      };
    } catch (e: any) {
      return {
        msg: e?.error?.message,
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async deleteThread(threadId: string): Promise<ResponseDto> {
    if (!threadId)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Thread Id missing',
      };
    try {
      await this.openai.beta.threads.del(threadId);
      return {
        success: true,
        statusCode: HttpStatus.OK,
        msg: 'Thread deleted',
      };
    } catch (e: any) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: e?.error?.message,
      };
    }
  }

  //Thread part End ----------------------------------------------------------------

  //Message part Start -------------------------------------------------------------

  async createMessage(message: string, threadId: string): Promise<ResponseDto> {
    if (!threadId)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Thread Id missing',
      };
    if (!message)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Message content missing',
      };
    try {
      const threadMessage = await this.openai.beta.threads.messages.create(
        threadId,
        {
          role: 'user',
          content: message,
        },
      );
      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        data: threadMessage,
      };
    } catch (e: any) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: e?.error?.message,
      };
    }
  }

  async messagesList(threadId: string): Promise<ResponseDto> {
    if (!threadId)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Thread Id missing',
      };

    try {
      const list = await this.openai.beta.threads.messages.list(threadId);
      return { success: true, statusCode: HttpStatus.OK, data: list };
    } catch (e: any) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: [],
        msg: e?.error?.message,
      };
    }
  }

  //Message part End ----------------------------------------------------------------

  //Run part Start --------------------------------------------------------------------
  async createRun(
    agent: string,
    type: string,
    threadId: string,
  ): Promise<ResponseDto> {
    if (!threadId)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Thread Id missing',
      };
    if (!agent || !type) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Assistant Id missing',
      };
    }

    try {
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: 'asst_6R2LDwnthDwzriDZhLrlUNly',
      });
      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        data: run,
        msg: 'Run created',
      };
    } catch (e: any) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: e?.error?.message,
      };
    }
  }

  async cancelRun(runId: string, threadId: string): Promise<ResponseDto> {
    if (!threadId)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Thread Id missing',
      };
    if (!runId)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Run Id missing',
      };
    try {
      const run = await this.openai.beta.threads.runs.cancel(threadId, runId);
      return {
        success: true,
        statusCode: HttpStatus.OK,
        data: run,
        msg: 'Run cancelled',
      };
    } catch (e: any) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: e?.error?.message,
      };
    }
  }

  async runStatus(runId: string, threadId: string): Promise<ResponseDto> {
    if (!threadId)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Thread Id missing',
      };
    if (!runId)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Run Id missing',
      };
    try {
      const run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      return { success: true, statusCode: HttpStatus.OK, data: run };
    } catch (e: any) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: e?.error?.message,
      };
    }
  }
  //Run part End   --------------------------------------------------------------------

  //Speech-To-Text
  async speechToText(audioPath: string, userId: string): Promise<ResponseDto> {
    try {
      console.log('audio hit', userId);
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1',
      });

      const totalUsedTokens = countTokens(transcription.text);

      console.log(totalUsedTokens);

      await this.userService.updateCredits(mongoId(userId), totalUsedTokens);

      return {
        success: true,
        statusCode: HttpStatus.OK,
        data: transcription.text,
      };
    } catch (e: any) {
      return {
        success: true,
        statusCode: HttpStatus.OK,
        data: '',
        msg: e?.error?.message,
      };
    } finally {
      fs.unlink(audioPath, (err) => {
        if (err) console.error(err);
      });
    }
  }

  // Image-to-text data Vision Model
  async imageToText(
    url: string[],
    userPrompt: string,
    userId: string,
  ): Promise<ResponseDto> {
    try {
      console.log('img to text', userId);
      const length = url.length;
      if (length > 3) {
        return {
          success: false,
          statusCode: HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
          msg: 'Too Many Images',
        };
      }

      if (length <= 0) {
        return {
          success: false,
          statusCode: HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
          msg: 'Empty Image List',
        };
      }

      const messages: any = [
        { type: 'text', text: userPrompt ?? 'Explain the image' },
        ...url.map((url) => ({
          type: 'image_url',
          image_url: { url },
        })),
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: messages }],
        store: true,
      });

      const totalUsedTokens = response.usage.completion_tokens;

      console.log(totalUsedTokens);

      await this.userService.updateCredits(mongoId(userId), totalUsedTokens);
      return {
        success: true,
        statusCode: HttpStatus.OK,
        data: response.choices[0]?.message?.content || 'No response generated',
      };
    } catch (e: any) {
      return {
        success: true,
        statusCode: HttpStatus.OK,
        msg: e?.error?.message || 'An unexpected error occurred',
      };
    }
  }

  // Stream Image-to-text data Vision Model
  async streamImageToText(
    url: string[],
    userPrompt: string,
    token: number,
    userId: string,
  ): Promise<Observable<string>> {
    return new Observable((observer) => {
      (async () => {
        console.log('stream img', url);
        try {
          const length = url.length;
          console.log(length);
          if (length > 3) {
            observer.error('Too many images');
            return;
          }

          if (length <= 0) {
            observer.error('Empty Image List');
            return;
          }

          const messages: any = [
            { type: 'text', text: userPrompt ?? 'Explain the image' },
            ...url.map((url) => ({
              type: 'image_url',
              image_url: { url },
            })),
          ];

          const response = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: messages }],
            max_tokens: token,
            store: true,
            stream: true,
          });

          // Corrected token counting logic:
          const inputTokens = messages.reduce((total, msg) => {
            if (msg.type === 'text') {
              return total + countTokens(msg.text);
            }
            return total; // Images typically aren't token-counted this way
          }, 0);

          let outputText = '';

          for await (const part of response) {
            const text = part.choices[0]?.delta?.content || '';
            outputText += text;
            observer.next(text); // Send each token to the client
          }

          const outputTokens = countTokens(outputText);
          const totalUsedTokens = inputTokens + outputTokens;
          console.log(totalUsedTokens);

          await this.userService.updateCredits(
            mongoId(userId),
            totalUsedTokens,
          );
          observer.complete();
        } catch (e: any) {
          console.error('ChatCompletion Streaming Error:', e);
          observer.error(e?.error?.message || 'An unexpected error occurred');
        }
      })();
    });
  }

  // Text-Completion
  async chatCompletion(
    assistantType: keyof typeof ASSISTANT | null,
    subType: string | null,
    userPrompt: string,
    token: number,
    agentId?: string,
  ): Promise<ResponseDto> {
    try {
      let assistantRole: any;
      if (subType != null) {
        // Ensure the requested subtype exists within the selected assistant type
        if (!(subType in ASSISTANT[assistantType])) {
          return {
            success: false,
            statusCode: HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
            msg: `Invalid subtype: ${subType} for assistant type: ${assistantType}`,
          };
        }
        // Get the dynamic assistant role content
        assistantRole =
          ASSISTANT[assistantType][
            subType as keyof (typeof ASSISTANT)[typeof assistantType]
          ];
      } else {
        const agent = await this.agentService.getAgentAndCourseById(agentId);
        assistantRole = agent.agentRole;
      }

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        max_tokens: token,
        messages: [
          { role: 'system', content: assistantRole },
          { role: 'user', content: userPrompt },
        ],
        store: true,
      });

      return {
        success: true,
        statusCode: HttpStatus.OK,
        data:
          completion.choices[0]?.message?.content || 'No response generated',
      };
    } catch (e: any) {
      console.error('ChatCompletion Error:', e);

      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: e?.error?.message || 'An unexpected error occurred',
      };
    }
  }

  // Text-Completion via stream
  async streamChatCompletion(
    assistantType: keyof typeof ASSISTANT | null,
    subType: string | null,
    userPrompt: string,
    token: number,
    userId: string,
    agentId?: string,
  ): Promise<Observable<string>> {
    console.log('userud', userId);
    return new Observable((observer) => {
      (async () => {
        try {
          let assistantRole: any;
          if (subType != null) {
            if (!(subType in ASSISTANT[assistantType])) {
              observer.error(
                `Invalid subtype: ${subType} for assistant type: ${assistantType}`,
              );
              return;
            }
            assistantRole =
              ASSISTANT[assistantType][
                subType as keyof (typeof ASSISTANT)[typeof assistantType]
              ];
          } else {
            const agent =
              await this.agentService.getAgentAndCourseById(agentId);
            assistantRole = agent.agentRole;
          }

          // const messages = [
          //   { role: "system", content: assistantRole },
          //   { role: "user", content: userPrompt },
          // ];

          // Calculate input tokens
          const messages: any = [
            { role: 'system', content: assistantRole },
            { role: 'user', content: userPrompt },
          ];
          const stream = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0,
            max_tokens: token,
            messages,
            stream: true,
          });

          let outputText = '';

          for await (const part of stream) {
            const text = part.choices[0]?.delta?.content || '';
            outputText += text; // accumulate output text
            observer.next(text); // stream chunk to client
          }

          // Calculate output tokens
          const outputTokens = countTokens(outputText);

          const totalUsedTokens = outputTokens;

          console.log(totalUsedTokens);

          // Deduct tokens from user credits
          await this.userService.updateCredits(
            mongoId(userId),
            totalUsedTokens,
          );
          observer.complete();
        } catch (e: any) {
          console.error('ChatCompletion Streaming Error:', e);
          observer.error(e?.error?.message || 'An unexpected error occurred');
        }
      })();
    });
  }

  async tts(inputText: string, userId: string) {
    const filPath = path.resolve(
      `./uploads/${userId}+${Date.now()}+speech.mp3`,
    );
    try {
      const mp3 = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: inputText,
      });
      const buffer = Buffer.from(await mp3.arrayBuffer());

      const totalUsedTokens = countTokens(inputText);

      console.log(totalUsedTokens);

      await this.userService.updateCredits(mongoId(userId), totalUsedTokens);

      await fs.promises.writeFile(filPath, buffer);

      if (!fs.existsSync(filPath)) {
        return {
          success: false,
          msg: 'File not found',
          statusCode: HttpStatus.BAD_REQUEST,
        };
      }

      const stat = fs.statSync(filPath);
      console.log(stat);
      const stream = fs.createReadStream(filPath);

      return {
        success: true,
        msg: 'File not found',
        statusCode: HttpStatus.BAD_REQUEST,
        data: { stream, size: stat.size, filPath },
      };
    } catch (error: any) {
      return {
        success: false,
        msg: 'Error generating speech:',
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }
  }

  async startNewQuiz(
    subject: string,
    difficulty: string,
    totalQuestions: number,
    subBranch: string,
    topic: string,
    level: string,
    usState: string,
    userId: string,
  ): Promise<ResponseDto> {
    try {
      const systemPrompt = `
      Subject: ${subject} ${subBranch} ${topic},
      Difficulty of the quiz: ${difficulty},
      Total quiz questions ${totalQuestions},
      Education Level: ${level},
      ${usState}
      `;

      if (!subject) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_GATEWAY,
        };
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: systemPrompt }],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'quiz_generation',
            schema: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  description:
                    'List of quiz questions with multiple-choice answers.',
                  items: {
                    type: 'object',
                    properties: {
                      question: {
                        type: 'string',
                        description: 'The quiz question',
                      },
                      answers: {
                        type: 'array',
                        description:
                          'Four possible answers, one of which is correct.',
                        items: { type: 'string' },
                      },
                      correct_answer: {
                        type: 'string',
                        description:
                          'The correct answer from the answers array.',
                      },
                      id: {
                        type: 'number',
                        description: 'index id of each quesstion like 1 2 3 4',
                      },
                    },
                    required: ['question', 'answers', 'correct_answer', 'id'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['questions'],
              additionalProperties: false,
            },
            strict: true,
          },
        },
      });

      // Validate and process the response
      if (!response || !response.choices || !response.choices[0]) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          msg: 'Invalid response structure from AI model',
        };
      }

      const totalUsedTokens = response.usage.total_tokens;

      console.log(totalUsedTokens);

      await this.userService.updateCredits(mongoId(userId), totalUsedTokens);

      return {
        success: true,
        statusCode: HttpStatus.OK,
        data: JSON.parse(response.choices[0].message.content),
      };
    } catch (error: any) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: error.message,
      };
    }
  }

  async generateCourseOutline(
    subjectName: string,
    difficulty: string,
    educationLevel: string,
    course: string,
    userId: string,
  ) {
    try {
      const systemPrompt = `
      Subject: ${subjectName},
      courseOutline: ${course},
      Difficulty: ${difficulty},
      Education Level: ${educationLevel}
      Generate a structured course outline with sections and topics. Follow this format:
      
      const initialSections = [
        {
          topics: [
            { title: "What is stack", status: "remaining" },
            { title: "Define Queue," status: "remaining" },
            { title: "Eleborate more about computer field?", status: "remaining" },
          ],
          courseComplete: false
        },
        {
          topics: [
            { title: "Definitions", status: "remaining" },
            { title: "Examples", status: "remaining" },
            { title: "Practice Questions",  status: "remaining" },
          ],
          courseComplete: false
        },
        {
          topics: [
            { title: "Deep Dive",  status: "remaining" },
            { title: "Complex Scenarios", "remaining" },
          ],
          courseComplete: false
        },
        {
          topics: [
            { title: "Timed Quiz", answer: status: "remaining" },
            { title: "Mixed Difficulty",  status: "remaining" },
          ],
          courseComplete: false
        },
      ];
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: systemPrompt }],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'course_outline',
            schema: {
              type: 'object',
              properties: {
                sections: {
                  type: 'array',
                  description: 'List of course sections with topics.',
                  items: {
                    type: 'object',
                    properties: {
                      topics: {
                        type: 'array',
                        description: 'Topics covered in this section.',
                        items: {
                          type: 'object',
                          properties: {
                            title: {
                              type: 'string',
                              description: 'Topic title',
                            }, // Fixed key name
                            status: {
                              type: 'string',
                              enum: ['remaining'],
                              description: 'Initial status',
                            },
                          },
                          required: ['title', 'status'], // Fixed 'answer'
                          additionalProperties: false,
                        },
                      },
                      courseComplete: {
                        type: 'boolean',
                        description:
                          'Completion status of the course section, always set to false',
                      },
                    },
                    required: ['topics', 'courseComplete'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['sections'],
              additionalProperties: false,
            },
            strict: true,
          },
        },
      });

      if (!response || !response.choices || !response.choices[0]) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          msg: 'Invalid response structure from AI model',
        };
      }

      const totalUsedTokens = response.usage.total_tokens;

      await this.userService.updateCredits(mongoId(userId), totalUsedTokens);

      return {
        success: true,
        data: response.choices[0].message.content,
      };
    } catch (error: any) {
      return {
        success: false,
        msg: error.message,
      };
    }
  }

  public async openAi40StructuredOutput(
    model: string,
    token: number,
    temperature: number,
    userContent: string,
    prompt: string,
  ) {
    try {
      const response = await this.openai.chat.completions.create({
        model: model,
        max_tokens: token,
        temperature: temperature,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userContent },
        ],
      });

      if (!response || !response.choices || !response.choices[0]) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          msg: 'Invalid response structure from AI model',
        };
      }

      // Extracting token usage
      const tokenUsage = response.usage
        ? response.usage.prompt_tokens + response.usage.completion_tokens
        : null;

      return {
        success: true,
        gptResponse: JSON.parse(response.choices[0].message.content),
        totalTokensUsed: tokenUsage,
      };
    } catch (error: any) {
      return {
        success: false,
        msg: error.message,
      };
    }
  }

  async courseAnswers(question: string, userId: string): Promise<any> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that provides detailed theoratical answers.',
          },
          { role: 'user', content: question },
        ],
        temperature: 1,
        max_tokens: 700,
      });

      const answer = response.choices[0].message.content.trim();
      const tokensUsed = response?.usage?.total_tokens || 0;

      await this.userService.updateCredits(mongoId(userId), tokensUsed);

      return {
        success: true,
        answer,
      };
    } catch (error: any) {
      console.error('OpenAI Error:', error);
      return {
        success: false,
      };
    }
  }
}
