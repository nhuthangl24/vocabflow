import { z, ZodSchema } from "zod";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export interface LLMProvider {
  generateStructuredOutput<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: ZodSchema<T>;
    model?: string;
  }): Promise<T>;

  generateText(params: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
    temperature?: number;
  }): Promise<string>;
}

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private defaultModel: string;

  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.LLM_BASE_URL,
      apiKey: process.env.LLM_API_KEY,
    });
    this.defaultModel = process.env.LLM_MODEL || "gpt-4o-mini";
  }

  async generateStructuredOutput<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: ZodSchema<T>;
    model?: string;
  }): Promise<T> {
    const { systemPrompt, userPrompt, schema, model } = params;
    
    // Convert zod to json schema requires a tool like zod-to-json-schema, 
    // but for simplicity in MVP we can instruct the LLM and parse manually,
    // or use OpenAI's native structured outputs if schema definition is provided.
    // For MVP, we will rely on system instructions to output JSON and validate with Zod.

    const response = await this.client.chat.completions.create({
      model: model || this.defaultModel,
      messages: [
        { role: "system", content: systemPrompt + "\n\nCRITICAL: You must output ONLY valid JSON matching the required schema. Do not output markdown, just the JSON." },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No content returned from LLM");

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      let jsonStr = jsonMatch ? jsonMatch[0] : content;
      // Strip trailing commas from arrays and objects
      jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
      const parsed = JSON.parse(jsonStr);
      return schema.parse(parsed) as T;
    } catch (e: any) {
      console.error("Failed to parse LLM output:", content);
      console.error("Parse Error details:", e?.issues || e?.message || e);
      throw new Error(`Invalid JSON: ${e?.message || 'Bad format'}`);
    }
  }

  async generateText(params: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
    temperature?: number;
  }): Promise<string> {
    const { systemPrompt, userPrompt, model, temperature } = params;

    const response = await this.client.chat.completions.create({
      model: model || this.defaultModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: temperature ?? 0.7
    });

    if (!response || !response.choices || response.choices.length === 0) {
      console.error("Invalid LLM response:", JSON.stringify(response));
      throw new Error("No valid response or choices returned from LLM");
    }

    const content = response.choices[0]?.message?.content;
    if (content == null) throw new Error("No text content returned from LLM");
    return content;
  }
}

export class AnthropicProvider implements LLMProvider {
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
  }): Promise<T> {
    const { systemPrompt, userPrompt, schema, model } = params;

    const response = await this.client.messages.create({
      model: model || this.defaultModel,
      system: systemPrompt + "\n\nCRITICAL: You must output ONLY valid JSON matching the required schema. Do not output markdown, just the raw JSON. Start with {.",
      messages: [
        { role: "user", content: userPrompt }
      ],
      max_tokens: 4096,
    });

    // @ts-ignore
    const content = response.content[0]?.text;
    if (!content) throw new Error("No content returned from LLM");

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(jsonStr);
      return schema.parse(parsed) as T;
    } catch (e) {
      console.error("Failed to parse Anthropic LLM output:", content);
      throw new Error("Invalid JSON structure returned by LLM");
    }
  }

  async generateText(params: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
    temperature?: number;
  }): Promise<string> {
    const { systemPrompt, userPrompt, model, temperature } = params;

    const response = await this.client.messages.create({
      model: model || this.defaultModel,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ],
      max_tokens: 4096,
      temperature: temperature ?? 0.7
    });

    // @ts-ignore
    const content = response.content[0]?.text;
    if (content == null) throw new Error("No content returned from LLM");
    return content;
  }
}

export function getProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER || "openai-compatible";
  if (provider === "anthropic-compatible") {
    return new AnthropicProvider();
  }
  return new OpenAIProvider();
}
