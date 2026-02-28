/**
 * AI聊天工具 - 文心大模型集成
 * 用于调用文心AI接口生成文章内容
 */

import ky, { type KyResponse, type AfterResponseHook, type NormalizedOptions } from 'ky';
import { createParser, type EventSourceParser } from 'eventsource-parser';

export interface SSEOptions {
  onData: (data: string) => void;
  onEvent?: (event: unknown) => void;
  onCompleted?: (error?: Error) => void;
  onAborted?: () => void;
  onReconnectInterval?: (interval: number) => void;
}

export const createSSEHook = (options: SSEOptions): AfterResponseHook => {
  const hook: AfterResponseHook = async (
    request: Request,
    _options: NormalizedOptions,
    response: KyResponse
  ) => {
    if (!response.ok || !response.body) {
      return;
    }

    let completed = false;
    const innerOnCompleted = (error?: Error): void => {
      if (completed) {
        return;
      }

      completed = true;
      options.onCompleted?.(error);
    };

    const isAborted = false;

    const reader: ReadableStreamDefaultReader<Uint8Array> = response.body.getReader();

    const decoder: TextDecoder = new TextDecoder('utf8');

    const parser: EventSourceParser = createParser({
      onEvent: (event) => {
        if (event.data) {
          options.onEvent?.(event);
          // 处理单 message 多 data字段的场景
          const dataArray: string[] = event.data.split('\n');
          for (const data of dataArray) {
            options.onData(data);
          }
        }
      }
    });

    const read = (): void => {
      if (isAborted) {
        return;
      }

      reader
        .read()
        .then((result: ReadableStreamReadResult<Uint8Array>) => {
          if (result.done) {
            innerOnCompleted();
            return;
          }

          parser.feed(decoder.decode(result.value, { stream: true }));

          read();
        })
        .catch((error) => {
          /**
           * 判断是否是手动调用 abortController.abort() 而停止的请求
           */
          if (request.signal.aborted) {
            options.onAborted?.();
            return;
          }

          innerOnCompleted(error as Error);
        });
    };

    read();

    return response;
  };

  return hook;
};

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: string;
}

export interface ChatStreamOptions {
  /** 模型调用接口地址 */
  endpoint: string;
  /** 消息列表 */
  messages: ChatMessage[];
  /** 应用id */
  apiId: string;
  /** 流式返回更新回调 */
  onUpdate: (content: string) => void;
  /** 模型调用完成回调 */
  onComplete: () => void;
  /** 模型调用出错回调 */
  onError: (error: Error) => void;
  /** 中断控制 */
  signal?: AbortSignal;
  /** AI温度参数 (0-1) */
  temperature?: number;
  /** AI top_p参数 (0-1) */
  top_p?: number;
}

export const sendChatStream = async (options: ChatStreamOptions): Promise<void> => {
  const { messages, onUpdate, onComplete, onError, signal, temperature, top_p } = options;

  let currentContent = '';

  const sseHook = createSSEHook({
    onData: (data: string) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.choices?.[0]?.delta?.content) {
          currentContent += parsed.choices[0].delta.content;
          onUpdate(currentContent);
        }
      } catch {
        console.warn('Failed to parse SSE data:', data);
      }
    },
    onCompleted: (error?: Error) => {
      if (error) {
        onError(error);
      } else {
        onComplete();
      }
    },
    onAborted: () => {
      console.log('Stream aborted');
    }
  });

  try {
    const requestBody: Record<string, any> = {
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content
      })),
      enable_thinking: false
    };

    // 添加可选参数
    if (temperature !== undefined) {
      requestBody.temperature = temperature;
    }
    if (top_p !== undefined) {
      requestBody.top_p = top_p;
    }

    await ky.post(options.endpoint, {
      json: requestBody,
      headers: {
        'X-App-Id': options.apiId,
        'Content-Type': 'application/json'
      },
      signal,
      hooks: {
        afterResponse: [sseHook]
      }
    });
  } catch (error) {
    if (!signal?.aborted) {
      onError(error as Error);
    }
  }
};
