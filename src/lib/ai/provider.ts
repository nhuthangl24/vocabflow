import { z, ZodSchema } from "zod";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

import { trackAILog } from "../analytics";

function calculateCost(provider: string, inputTokens: number, outputTokens: number): number {
  if (provider.toLowerCase() === 'hhtech' || provider.toLowerCase() === 'anthropic') {
    // 900 credit per 1M input, 4500 credit per 1M output
    return (inputTokens * 900 / 1000000) + (outputTokens * 4500 / 1000000);
  }
  return 0; // Default or KiraAI
}

export interface AIProvider {
  generateStructuredOutput<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: ZodSchema<T>;
    model?: string;
    tracking?: { userId?: string, jobId?: string, taskType: string, providerName?: string };
  }): Promise<T>;

  generateText(params: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
    temperature?: number;
    tracking?: { userId?: string, jobId?: string, taskType: string, providerName?: string };
  }): Promise<string>;
}

// Export as LLMProvider for backward compatibility
export type LLMProvider = AIProvider;

export class OpenAICompatibleProvider implements AIProvider {
  protected client: OpenAI;
  protected defaultModel: string;

  constructor(baseURL?: string, apiKey?: string, defaultModel?: string) {
    this.client = new OpenAI({
      baseURL: baseURL,
      apiKey: apiKey,
    });
    this.defaultModel = defaultModel || "gpt-4o-mini";
  }

  async generateStructuredOutput<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: ZodSchema<T>;
    model?: string;
    tracking?: { userId?: string, jobId?: string, taskType: string, providerName?: string };
  }): Promise<T> {
    const { systemPrompt, userPrompt, schema, model, tracking } = params;
    const start = Date.now();
    let usage = { prompt_tokens: 0, completion_tokens: 0 };
    
    try {
      const response = await this.client.chat.completions.create({
        model: model || this.defaultModel,
        messages: [
          { role: "system", content: systemPrompt + "\n\nCRITICAL: You must output ONLY valid JSON matching the required schema. Do not output markdown, just the JSON." },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      });

      usage = response.usage || usage;
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No content returned from LLM");

      let jsonStr = content;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/) || content.match(/\[[\s\S]*\]/);
        jsonStr = jsonMatch ? jsonMatch[0] : content;
        jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
        const parsed = JSON.parse(jsonStr);
        const result = schema.parse(parsed) as T;
        
        if (tracking) {
          trackAILog({
            user_id: tracking.userId,
            job_id: tracking.jobId,
            provider: tracking.providerName || 'unknown',
            model: model || this.defaultModel,
            task_type: tracking.taskType,
            input_tokens: usage.prompt_tokens,
            output_tokens: usage.completion_tokens,
            cost_usd: calculateCost(tracking.providerName || 'unknown', usage.prompt_tokens, usage.completion_tokens),
            latency_ms: Date.now() - start,
            status: 'success',
            raw_response: content
          });
        }
        
        return result;
      } catch (e: any) {
        if (tracking) {
          trackAILog({
            user_id: tracking.userId,
            job_id: tracking.jobId,
            provider: tracking.providerName || 'unknown',
            model: model || this.defaultModel,
            task_type: tracking.taskType,
            input_tokens: usage.prompt_tokens,
            output_tokens: usage.completion_tokens,
            cost_usd: calculateCost(tracking.providerName || 'unknown', usage.prompt_tokens, usage.completion_tokens),
            latency_ms: Date.now() - start,
            status: 'error',
            error_message: `JSON Parse Error: ${e?.message}`,
            raw_response: content
          });
        }
        console.error("Failed to parse LLM output:", content);
        throw new Error(`Invalid JSON: ${e?.message || 'Bad format'}`);
      }
    } catch (err: any) {
      if (tracking) {
        trackAILog({
            user_id: tracking.userId,
            job_id: tracking.jobId,
            provider: tracking.providerName || 'unknown',
            model: model || this.defaultModel,
            task_type: tracking.taskType,
            latency_ms: Date.now() - start,
            status: 'error',
            error_message: err?.message
        });
      }
      throw err;
    }
  }

  async generateText(params: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
    temperature?: number;
    tracking?: { userId?: string, jobId?: string, taskType: string, providerName?: string };
  }): Promise<string> {
    const { systemPrompt, userPrompt, model, temperature, tracking } = params;
    const start = Date.now();

    try {
      const response = await this.client.chat.completions.create({
        model: model || this.defaultModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: temperature ?? 0.7,
      });

      const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0 };
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No text content returned from LLM");

      if (tracking) {
        trackAILog({
          user_id: tracking.userId,
          job_id: tracking.jobId,
          provider: tracking.providerName || 'unknown',
          model: model || this.defaultModel,
          task_type: tracking.taskType,
          input_tokens: usage.prompt_tokens,
          output_tokens: usage.completion_tokens,
          cost_usd: calculateCost(tracking.providerName || 'unknown', usage.prompt_tokens, usage.completion_tokens),
          latency_ms: Date.now() - start,
          status: 'success'
        });
      }

      return content;
    } catch (err: any) {
      if (tracking) {
        trackAILog({
            user_id: tracking.userId,
            job_id: tracking.jobId,
            provider: tracking.providerName || 'unknown',
            model: model || this.defaultModel,
            task_type: tracking.taskType,
            latency_ms: Date.now() - start,
            status: 'error',
            error_message: err?.message
        });
      }
      throw err;
    }
  }
}

export class KiraAIProvider extends OpenAICompatibleProvider {
  constructor() {
    const rawKeys = process.env.KIRAAI_API_KEY || "";
    // Hỗ trợ chia nhiều API Key bằng dấu phẩy
    const keys = rawKeys.split(",").map(k => k.trim()).filter(Boolean);
    const randomKey = keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : undefined;

    if (keys.length > 1) {
      console.log(`[Key Pool] KiraAI: Đang sử dụng 1 trong ${keys.length} API Keys.`);
    }

    super(
      process.env.KIRAAI_BASE_URL || "https://kiraai.vn/api/v1",
      randomKey,
      process.env.KIRAAI_MODEL || "glm-5.3"
    );
  }
}

export class HHTECHProvider extends OpenAICompatibleProvider {
  constructor() {
    // Fallback to legacy LLM_BASE_URL and LLM_API_KEY for backward compatibility
    super(
      process.env.HHTECH_BASE_URL || process.env.LLM_BASE_URL,
      process.env.HHTECH_API_KEY || process.env.LLM_API_KEY,
      process.env.HHTECH_MODEL || process.env.LLM_MODEL || "gpt-4o-mini"
    );
  }
}

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private defaultModel: string;

  constructor() {
    this.client = new Anthropic({
      baseURL: process.env.ANTHROPIC_BASE_URL,
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.defaultModel = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022";
  }

  async generateStructuredOutput<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: ZodSchema<T>;
    model?: string;
    tracking?: { userId?: string, jobId?: string, taskType: string, providerName?: string };
  }): Promise<T> {
    const { systemPrompt, userPrompt, schema, model, tracking } = params;
    const start = Date.now();
    
    try {
      const response = await this.client.messages.create({
        model: model || this.defaultModel,
        system: systemPrompt + "\n\nCRITICAL: You must output ONLY valid JSON matching the required schema. Do not output markdown, just the raw JSON. Start with {.",
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: 4096,
      });

      const content = (response.content[0] as any)?.text;
      if (!content) throw new Error("No content returned from LLM");

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/) || content.match(/\[[\s\S]*\]/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;
        const parsed = JSON.parse(jsonStr);
        const result = schema.parse(parsed) as T;
        
        if (tracking) {
          trackAILog({
            user_id: tracking.userId,
            job_id: tracking.jobId,
            provider: tracking.providerName || 'anthropic',
            model: model || this.defaultModel,
            task_type: tracking.taskType,
            input_tokens: response.usage?.input_tokens || 0,
            output_tokens: response.usage?.output_tokens || 0,
            cost_usd: calculateCost(tracking.providerName || 'anthropic', response.usage?.input_tokens || 0, response.usage?.output_tokens || 0),
            latency_ms: Date.now() - start,
            status: 'success',
            raw_response: content
          });
        }
        
        return result;
      } catch (e: any) {
        if (tracking) {
          trackAILog({
            user_id: tracking.userId,
            job_id: tracking.jobId,
            provider: tracking.providerName || 'anthropic',
            model: model || this.defaultModel,
            task_type: tracking.taskType,
            input_tokens: response.usage?.input_tokens || 0,
            output_tokens: response.usage?.output_tokens || 0,
            cost_usd: calculateCost(tracking.providerName || 'anthropic', response.usage?.input_tokens || 0, response.usage?.output_tokens || 0),
            latency_ms: Date.now() - start,
            status: 'error',
            error_message: `JSON Parse Error: ${e?.message}`,
            raw_response: content
          });
        }
        console.error("Failed to parse Anthropic LLM output:", content);
        throw new Error("Invalid JSON structure returned by LLM");
      }
    } catch (err: any) {
      if (tracking) {
        trackAILog({
            user_id: tracking.userId,
            job_id: tracking.jobId,
            provider: tracking.providerName || 'anthropic',
            model: model || this.defaultModel,
            task_type: tracking.taskType,
            latency_ms: Date.now() - start,
            status: 'error',
            error_message: err?.message
        });
      }
      throw err;
    }
  }

  async generateText(params: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
    temperature?: number;
    tracking?: { userId?: string, jobId?: string, taskType: string, providerName?: string };
  }): Promise<string> {
    const { systemPrompt, userPrompt, model, temperature, tracking } = params;
    const start = Date.now();
    
    try {
      const response = await this.client.messages.create({
        model: model || this.defaultModel,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: 4096,
        temperature: temperature ?? 0.7
      });

      const content = (response.content[0] as any)?.text;
      if (content == null) throw new Error("No content returned from LLM");

      if (tracking) {
        trackAILog({
          user_id: tracking.userId,
          job_id: tracking.jobId,
          provider: tracking.providerName || 'anthropic',
          model: model || this.defaultModel,
          task_type: tracking.taskType,
          input_tokens: response.usage?.input_tokens || 0,
          output_tokens: response.usage?.output_tokens || 0,
          cost_usd: calculateCost(tracking.providerName || 'anthropic', response.usage?.input_tokens || 0, response.usage?.output_tokens || 0),
          latency_ms: Date.now() - start,
          status: 'success'
        });
      }

      return content;
    } catch (err: any) {
      if (tracking) {
        trackAILog({
            user_id: tracking.userId,
            job_id: tracking.jobId,
            provider: tracking.providerName || 'anthropic',
            model: model || this.defaultModel,
            task_type: tracking.taskType,
            latency_ms: Date.now() - start,
            status: 'error',
            error_message: err?.message
        });
      }
      throw err;
    }
  }
}

export class FallbackProvider implements AIProvider {
  private providers: AIProvider[];

  constructor(providers: AIProvider[]) {
    this.providers = providers;
  }

  async generateStructuredOutput<T>(params: any): Promise<T> {
    let lastError: any;
    const MAX_RETRIES = 2; // Retry each provider up to 2 times
    
    for (const provider of this.providers) {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          return await provider.generateStructuredOutput<T>(params);
        } catch (err: any) {
          console.warn(`[FallbackProvider] Provider failed (Attempt ${attempt}/${MAX_RETRIES}). Error:`, err?.message || err);
          lastError = err;
          if (attempt < MAX_RETRIES) {
             // Wait 2 seconds before retrying
             await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      console.warn(`[FallbackProvider] Provider exhausted all retries, switching to next provider...`);
    }
    throw lastError;
  }

  async generateText(params: any): Promise<string> {
    let lastError: any;
    const MAX_RETRIES = 2;
    
    for (const provider of this.providers) {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          return await provider.generateText(params);
        } catch (err: any) {
          console.warn(`[FallbackProvider] Provider failed (Attempt ${attempt}/${MAX_RETRIES}). Error:`, err?.message || err);
          lastError = err;
          if (attempt < MAX_RETRIES) {
             // Wait 2 seconds before retrying
             await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      console.warn(`[FallbackProvider] Provider exhausted all retries, switching to next provider...`);
    }
    throw lastError;
  }
}

export type TaskType = 'shadowing' | 'vocab' | 'grammar';

export function getProvider(task?: TaskType): AIProvider {
  // Legacy support
  if (process.env.LLM_PROVIDER === "anthropic-compatible") {
    return new AnthropicProvider();
  }

  const kira = new KiraAIProvider();
  const hhtech = new HHTECHProvider();

  if (task === 'shadowing') {
    const providerName = process.env.SHADOWING_PROVIDER || 'kiraai';
    if (providerName === 'kiraai') {
      return new FallbackProvider([kira, hhtech]);
    }
    return hhtech;
  }

  if (task === 'vocab') {
    const providerName = process.env.VOCAB_PROVIDER || 'hhtech';
    return providerName === 'kiraai' ? kira : hhtech;
  }

  if (task === 'grammar') {
    const providerName = process.env.GRAMMAR_PROVIDER || 'hhtech';
    return providerName === 'kiraai' ? kira : hhtech;
  }

  return hhtech;
}
