
export interface OpenAIRequestParams {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  reasoning_format?: 'parsed' | 'raw' | 'hidden';
  // 可根据需要扩展其他参数
}

export interface OpenAIConfig {
  baseURL: string;
  apiKey: string;
  timeout?: number;
  defaultModel?: string;
  temperature?: number,
  max_tokens?: number,
}

export class OpenAIClient {
  public config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = {
      timeout: 10000,
      ...config
    };
  }

  async sendRequest(params: OpenAIRequestParams): Promise<any> {
    const { baseURL, apiKey, timeout } = this.config;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(params),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.log(`API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.log('Request timed out.');
      }
      console.error('Request failed:', error.message);
    }
  }

  // 快捷方法示例
  async createChatCompletion(
    messages: OpenAIRequestParams['messages'],
    model?: string
  ): Promise<string> {
    const response = await this.sendRequest({
      model: model || this.config.defaultModel || 'gpt-3.5-turbo',
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.max_tokens,
    });
    return response.choices[0].message.content;
  }
}


