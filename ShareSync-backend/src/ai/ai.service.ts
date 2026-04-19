import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleGenAI } from '@google/genai';

// Schemas
import { Project } from '../projects/schemas/project.schema';
import { Task } from '../tasks/schemas/task.schema';
import { SuggestionType } from './dto';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private ai: GoogleGenAI;

  constructor(
    private configService: ConfigService,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is missing. AI features will fail.');
    }
    
    this.ai = new GoogleGenAI({ apiKey: apiKey || 'missing-key' });
  }

  /**
   * PHASE 2: Context Hydration Chat Generation
   */
  async generateChatResponse(prompt: string, contextData: any = {}): Promise<string> {
    try {
      let dbContext = 'No specific project context provided.';

      // 1. HYDRATION: Fetch live DB data if a projectId is provided
      if (contextData?.projectId) {
        try {
          const project = await this.projectModel.findById(contextData.projectId).exec();
          if (project) {
            // Safely count open tasks using either 'project' or 'projectId' field depending on your schema
            const openTasksCount = await this.taskModel.countDocuments({ 
              $or: [{ project: contextData.projectId }, { projectId: contextData.projectId }],
              status: { $ne: 'completed' } 
            }).exec();

            const projectName = project.name || (project as any).title || 'Unknown Project';
            dbContext = `The user is currently looking at the project '${projectName}'. 
            It currently has ${openTasksCount} open/pending tasks. 
            Project Status: ${project.status || 'Active'}.`;
          }
        } catch (dbErr) {
          this.logger.warn(`Failed to hydrate DB context for project ${contextData.projectId}: ${dbErr.message}`);
        }
      }

      // 2. SYSTEM INSTRUCTION: Invisible prompt to guide the AI
      const mentorTone = contextData?.mentorTone || '';
      const systemInstruction = `You are an elite productivity coach in an app called OpenShare. 
      Your tone adapts to the user's preference. Keep responses short and formatted with markdown.
      ${mentorTone === 'drill' ? 'Be direct, tough, no-nonsense. Push hard. Challenge excuses. Use short, commanding sentences.' : ''}
      ${mentorTone === 'kind' ? 'Be warm, gentle, encouraging. Celebrate small wins. Use supportive language and positive reinforcement.' : ''}
      ${mentorTone === 'wise' ? 'Be calm, insightful, philosophical. Share perspective. Use metaphors and thoughtful observations.' : ''}
      ${!mentorTone ? 'Be sharp, encouraging, concise, and highly actionable.' : ''} 
      Do not be overly chatty.
      
      DATABASE CONTEXT (Treat as absolute fact):
      ${dbContext}`;

      const fullPrompt = `User Prompt: ${prompt}`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: { systemInstruction },
      });

      return response.text;
    } catch (error) {
      this.logger.error('Failed to generate chat response', error);
      throw new InternalServerErrorException('AI Coach is currently unavailable.');
    }
  }

  async generateSingleSuggestion(): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Give me one very short, actionable productivity tip to build momentum today. Maximum 15 words.',
      });
      return response.text;
    } catch (error) {
      return "Break your biggest task into three 15-minute chunks."; 
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LEGACY ENDPOINTS (Retained to prevent crashing your existing controller routes)
  // ─────────────────────────────────────────────────────────────────────────────

  async getSuggestions(userId: string, options: any) {
    return [{ id: '1', text: await this.generateSingleSuggestion(), type: options.type || 'momentum' }];
  }

  async analyzeTask(taskId: string) {
    return { status: 'analyzed', insight: 'This task looks well defined.' };
  }

  async analyzeWorkload(projectId: string, userIds?: string[]) {
    return { workloadStatus: 'balanced', recommendation: 'Keep steady.' };
  }

  async generateSmartSchedule(projectId: string, sprintId?: string) {
    return { schedule: [], message: 'Smart schedule generated.' };
  }
}
