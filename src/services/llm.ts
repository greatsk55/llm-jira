import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

export type LLMProvider = 'openai' | 'claude';

export interface LLMExecutionRequest {
  provider: LLMProvider;
  prompt: string;
  model?: string;
}

export interface LLMExecutionResult {
  response: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class LLMService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  async execute(request: LLMExecutionRequest): Promise<LLMExecutionResult> {
    switch (request.provider) {
      case 'openai':
        return this.executeOpenAI(request);
      case 'claude':
        return this.executeClaude(request);
      default:
        throw new Error(`Unsupported LLM provider: ${request.provider}`);
    }
  }

  private async executeOpenAI(request: LLMExecutionRequest): Promise<LLMExecutionResult> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const model = request.model || 'gpt-4o-mini';

    const completion = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '';
    const usage = completion.usage;

    return {
      response,
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          }
        : undefined,
    };
  }

  private async executeClaude(request: LLMExecutionRequest): Promise<LLMExecutionResult> {
    if (!this.anthropic) {
      throw new Error('Anthropic API key not configured');
    }

    const model = request.model || 'claude-3-5-sonnet-20241022';

    const message = await this.anthropic.messages.create({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
    });

    const response = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n');

    const usage = message.usage;

    return {
      response,
      usage: usage
        ? {
            promptTokens: usage.input_tokens,
            completionTokens: usage.output_tokens,
            totalTokens: usage.input_tokens + usage.output_tokens,
          }
        : undefined,
    };
  }

  getAvailableProviders(): LLMProvider[] {
    const providers: LLMProvider[] = [];
    if (this.openai) providers.push('openai');
    if (this.anthropic) providers.push('claude');
    return providers;
  }
}

export const llmService = new LLMService();
