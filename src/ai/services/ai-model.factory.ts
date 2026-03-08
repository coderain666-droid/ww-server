import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { ChatDeepSeek } from '@langchain/deepseek';
import { requestContextStorage } from '../../common/request-context/request-context';

export type LLMProvider = 'openai' | 'deepseek' | 'mock';

/**
 * AI 模型工厂服务
 *
 * 集中管理 AI 模型初始化，支持 OpenAI (GPT) 与 DeepSeek。
 * 默认使用 DeepSeek，可通过环境变量 LLM_PROVIDER 切换。
 *
 * 环境变量：
 * - LLM_PROVIDER：'openai' | 'deepseek'，默认 'deepseek'
 * - OpenAI：OPENAI_API_KEY（必填当 provider=openai）、OPENAI_MODEL、OPENAI_TEMPERATURE、OPENAI_MAX_TOKENS
 * - DeepSeek：DEEPSEEK_API_KEY（必填当 provider=deepseek）、DEEPSEEK_MODEL、DEEPSEEK_TEMPERATURE、DEEPSEEK_MAX_TOKENS
 */
@Injectable()
export class AIModelFactory {
  private readonly logger = new Logger(AIModelFactory.name);

  constructor(private configService: ConfigService) {}

  private normalizeValue(value?: string | null): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private getRequestOverrides() {
    return requestContextStorage.getStore()?.localLLM;
  }

  private getExplicitProvider(): LLMProvider | undefined {
    const overrideProvider = this.normalizeValue(
      this.getRequestOverrides()?.provider,
    )?.toLowerCase();
    if (
      overrideProvider === 'mock' ||
      overrideProvider === 'openai' ||
      overrideProvider === 'deepseek'
    ) {
      return overrideProvider;
    }

    const provider = this.normalizeValue(
      this.configService.get<string>('LLM_PROVIDER'),
    )?.toLowerCase();
    if (provider === 'mock' || provider === 'openai' || provider === 'deepseek')
      return provider;
    return undefined;
  }

  private getDeepSeekApiKey(): string | undefined {
    return (
      this.normalizeValue(this.getRequestOverrides()?.deepseekApiKey) ||
      this.normalizeValue(this.configService.get<string>('DEEPSEEK_API_KEY'))
    );
  }

  private getOpenAIApiKey(): string | undefined {
    return (
      this.normalizeValue(this.getRequestOverrides()?.openaiApiKey) ||
      this.normalizeValue(this.configService.get<string>('OPENAI_API_KEY'))
    );
  }

  private getDeepSeekModel(): string {
    return (
      this.normalizeValue(this.getRequestOverrides()?.deepseekModel) ||
      this.normalizeValue(this.configService.get<string>('DEEPSEEK_MODEL')) ||
      'deepseek-chat'
    );
  }

  private getOpenAIModel(): string {
    return (
      this.normalizeValue(this.getRequestOverrides()?.openaiModel) ||
      this.normalizeValue(this.configService.get<string>('OPENAI_MODEL')) ||
      'gpt-4o-mini'
    );
  }

  /** 当前使用的 LLM 提供商 */
  getProvider(): LLMProvider {
    const explicitProvider = this.getExplicitProvider();
    if (explicitProvider) {
      return explicitProvider;
    }

    const requestOverrides = this.getRequestOverrides();
    const hasRequestDeepSeek = Boolean(
      this.normalizeValue(requestOverrides?.deepseekApiKey),
    );
    const hasRequestOpenAI = Boolean(
      this.normalizeValue(requestOverrides?.openaiApiKey),
    );

    if (hasRequestDeepSeek && !hasRequestOpenAI) {
      return 'deepseek';
    }
    if (hasRequestOpenAI && !hasRequestDeepSeek) {
      return 'openai';
    }

    const hasDeepSeek = Boolean(this.getDeepSeekApiKey());
    const hasOpenAI = Boolean(this.getOpenAIApiKey());

    if (hasDeepSeek && !hasOpenAI) {
      return 'deepseek';
    }
    if (hasOpenAI && !hasDeepSeek) {
      return 'openai';
    }
    if (!hasDeepSeek && !hasOpenAI) {
      return 'mock';
    }

    return 'deepseek';
  }

  isMockProvider(): boolean {
    return this.getProvider() === 'mock';
  }

  shouldFallbackToMock(error: any): boolean {
    if (this.isMockProvider()) return true;

    const isLocalEnv =
      this.configService.get<string>('NODE_ENV') !== 'production' ||
      this.configService.get<string>('LOCAL_DEV_MODE') === 'true';

    if (!isLocalEnv) return false;

    const status = error?.status || error?.response?.status;
    const code = error?.lc_error_code || error?.code || error?.error?.code;
    const message =
      error?.message || error?.error?.message || error?.response?.data?.message;

    return (
      status === 401 ||
      code === 'MODEL_AUTHENTICATION' ||
      /authentication|api key|unauthorized|dummy-key/i.test(message || '')
    );
  }

  /**
   * 创建默认的 AI 模型（通用入口，返回 LangChain BaseChatModel）
   */
  createDefaultModel(): BaseChatModel {
    const provider = this.getProvider();
    if (provider === 'mock') {
      throw new Error('LLM_PROVIDER=mock 时不应创建真实模型');
    }
    if (provider === 'deepseek') {
      return this.createDeepSeekDefault();
    }
    return this.createOpenAIDefault();
  }

  /**
   * 创建用于稳定输出的模型（评估、打分等）
   */
  createStableModel(): BaseChatModel {
    const provider = this.getProvider();
    if (provider === 'mock') {
      throw new Error('LLM_PROVIDER=mock 时不应创建真实模型');
    }
    if (provider === 'deepseek') {
      return this.createDeepSeekStable();
    }
    return this.createOpenAIStable();
  }

  /**
   * 创建用于创意输出的模型（生成题目、文案等）
   */
  createCreativeModel(): BaseChatModel {
    const provider = this.getProvider();
    if (provider === 'mock') {
      throw new Error('LLM_PROVIDER=mock 时不应创建真实模型');
    }
    if (provider === 'deepseek') {
      return this.createDeepSeekCreative();
    }
    return this.createOpenAICreative();
  }

  // ---------- OpenAI (GPT) ----------

  private createOpenAIDefault(): ChatOpenAI {
    const apiKey = this.getOpenAIApiKey();
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY 未配置，GPT 调用将失败');
    }
    return new ChatOpenAI({
      apiKey: apiKey || 'dummy-key',
      model: this.getOpenAIModel(),
      temperature:
        Number(this.configService.get<string>('OPENAI_TEMPERATURE')) || 0.7,
      maxTokens:
        Number(this.configService.get<string>('OPENAI_MAX_TOKENS')) || 4000,
    });
  }

  private createOpenAIStable(): ChatOpenAI {
    const base = this.createOpenAIDefault();
    return new ChatOpenAI({
      apiKey: this.getOpenAIApiKey() || 'dummy-key',
      model: base.model,
      temperature: 0.3,
      maxTokens: 4000,
    });
  }

  private createOpenAICreative(): ChatOpenAI {
    const base = this.createOpenAIDefault();
    return new ChatOpenAI({
      apiKey: this.getOpenAIApiKey() || 'dummy-key',
      model: base.model,
      temperature: 0.8,
      maxTokens: 4000,
    });
  }

  // ---------- DeepSeek ----------

  private createDeepSeekDefault(): ChatDeepSeek {
    const apiKey = this.getDeepSeekApiKey();
    if (!apiKey) {
      this.logger.warn('DEEPSEEK_API_KEY 未配置，DeepSeek 调用将失败');
    }
    return new ChatDeepSeek({
      apiKey: apiKey || 'dummy-key',
      model: this.getDeepSeekModel(),
      temperature:
        Number(this.configService.get<string>('DEEPSEEK_TEMPERATURE')) || 0.7,
      maxTokens:
        Number(this.configService.get<string>('DEEPSEEK_MAX_TOKENS')) || 4000,
    });
  }

  private createDeepSeekStable(): ChatDeepSeek {
    const base = this.createDeepSeekDefault();
    return new ChatDeepSeek({
      apiKey: this.getDeepSeekApiKey() || 'dummy-key',
      model: base.model,
      temperature: 0.3,
      maxTokens: 4000,
    });
  }

  private createDeepSeekCreative(): ChatDeepSeek {
    const base = this.createDeepSeekDefault();
    return new ChatDeepSeek({
      apiKey: this.getDeepSeekApiKey() || 'dummy-key',
      model: base.model,
      temperature: 0.8,
      maxTokens: 4000,
    });
  }
}
