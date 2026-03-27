import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';
import { loadSettings } from '../config/settings.js';

let clientInstance: OpenAI | null = null;

export function getClient(): OpenAI {
  if (clientInstance) return clientInstance;

  const settings = loadSettings();
  const apiKey = settings.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error(
      '\nKein OpenAI API-Key gefunden.\n\n' +
      'Setze deinen Key auf eine dieser Arten:\n' +
      '  1. export OPENAI_API_KEY="sk-..."\n' +
      '  2. askapro --api-key "sk-..."\n' +
      '  3. In ~/.askapro/settings.json: { "apiKey": "sk-..." }\n'
    );
    process.exit(1);
  }

  clientInstance = new OpenAI({
    apiKey,
    baseURL: settings.baseUrl || undefined,
  });

  return clientInstance;
}

export interface StreamOptions {
  model: string;
  messages: ChatCompletionMessageParam[];
  tools?: ChatCompletionTool[];
  temperature?: number;
  maxTokens?: number;
}

export interface StreamChunk {
  type: 'text' | 'tool_call_start' | 'tool_call_args' | 'done';
  text?: string;
  toolCallId?: string;
  toolCallName?: string;
  toolCallArgs?: string;
}

export async function* streamChat(options: StreamOptions): AsyncGenerator<StreamChunk> {
  const client = getClient();

  const stream = await client.chat.completions.create({
    model: options.model,
    messages: options.messages,
    tools: options.tools?.length ? options.tools : undefined,
    temperature: options.temperature ?? 0.3,
    max_completion_tokens: options.maxTokens ?? 4096,
    stream: true,
  });

  const toolCalls = new Map<number, { id: string; name: string; args: string }>();

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (!delta) continue;

    if (delta.content) {
      yield { type: 'text', text: delta.content };
    }

    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index;
        if (!toolCalls.has(idx)) {
          toolCalls.set(idx, { id: tc.id || '', name: tc.function?.name || '', args: '' });
          if (tc.id && tc.function?.name) {
            yield {
              type: 'tool_call_start',
              toolCallId: tc.id,
              toolCallName: tc.function.name,
            };
          }
        }
        const existing = toolCalls.get(idx)!;
        if (tc.id) existing.id = tc.id;
        if (tc.function?.name) existing.name = tc.function.name;
        if (tc.function?.arguments) {
          existing.args += tc.function.arguments;
          yield {
            type: 'tool_call_args',
            toolCallId: existing.id,
            toolCallName: existing.name,
            toolCallArgs: tc.function.arguments,
          };
        }
      }
    }
  }

  yield { type: 'done' };
}

export interface ChatResult {
  text: string;
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
}

export async function collectStream(options: StreamOptions): Promise<ChatResult> {
  let text = '';
  const toolCalls = new Map<string, { id: string; name: string; arguments: string }>();

  for await (const chunk of streamChat(options)) {
    switch (chunk.type) {
      case 'text':
        text += chunk.text || '';
        break;
      case 'tool_call_start':
        if (chunk.toolCallId) {
          toolCalls.set(chunk.toolCallId, {
            id: chunk.toolCallId,
            name: chunk.toolCallName || '',
            arguments: '',
          });
        }
        break;
      case 'tool_call_args':
        if (chunk.toolCallId && toolCalls.has(chunk.toolCallId)) {
          toolCalls.get(chunk.toolCallId)!.arguments += chunk.toolCallArgs || '';
        }
        break;
    }
  }

  return {
    text,
    toolCalls: Array.from(toolCalls.values()),
  };
}
