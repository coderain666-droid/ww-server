import { AsyncLocalStorage } from 'async_hooks';

export interface LocalLLMRequestOverrides {
  provider?: 'openai' | 'deepseek' | 'mock';
  deepseekApiKey?: string;
  openaiApiKey?: string;
  deepseekModel?: string;
  openaiModel?: string;
}

export interface RequestContextStore {
  localLLM?: LocalLLMRequestOverrides;
}

export const requestContextStorage =
  new AsyncLocalStorage<RequestContextStore>();
