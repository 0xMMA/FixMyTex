/**
 * Models and interfaces for LangChain configuration
 */

/**
 * Supported LLM providers
 */
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  AWS_BEDROCK = 'aws-bedrock'
}

/**
 * Base model configuration interface
 */
export interface ModelConfig {
  id: string;
  name: string;
  description: string;
}

/**
 * Provider configuration interface
 */
export interface ProviderConfig {
  id: LLMProvider;
  name: string;
  models: ModelConfig[];
}

/**
 * AWS Bedrock configuration interface
 */
export interface AwsBedrockConfig {
  aws_access_key_id: string;
  aws_secret_access_key: string;
  aws_session_token?: string;
  region: string;
  cache?: boolean;
  inferenceProfile?: string;
}

/**
 * Provider-specific configuration interface
 */
export interface ProviderSpecificConfig {
  awsBedrock?: AwsBedrockConfig;
  // Add other provider-specific configurations here as needed
}

/**
 * LangChain configuration interface
 */
export interface LangChainConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  providerConfig?: ProviderSpecificConfig;
}

/**
 * Default LangChain configuration
 */
export const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: LLMProvider.OPENAI,
    name: 'OpenAI',
    models: [
      // Featured/Flagship chat models
      { id: 'gpt-4.1', name: 'GPT-4.1', description: 'Flagship GPT model for complex tasks' },
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Fast, intelligent, flexible GPT model' },
      { id: 'chatgpt-4o', name: 'ChatGPT-4o', description: 'GPT-4o model used in ChatGPT' },

      // Reasoning models
      { id: 'o3', name: 'O3', description: 'Most powerful reasoning model' },
      { id: 'o4-mini', name: 'O4 Mini', description: 'Faster, more affordable reasoning model' },
      { id: 'o3-pro', name: 'O3 Pro', description: 'Enhanced O3 with more compute for better responses' },
      { id: 'o3-mini', name: 'O3 Mini', description: 'Small model alternative to O3' },
      { id: 'o1', name: 'O1', description: 'Previous full o-series reasoning model' },
      { id: 'o1-pro', name: 'O1 Pro', description: 'Enhanced O1 with more compute for better responses' },

      // Cost-optimized models
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', description: 'Balanced for intelligence, speed, and cost' },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', description: 'Fastest, most cost-effective GPT-4.1 model' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast, affordable small model for focused tasks' },

      // Legacy models
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Legacy model' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Legacy model' }
    ]
  },
  {
    id: LLMProvider.ANTHROPIC,
    name: 'Anthropic Claude',
    models: [
      // Claude 4 family
      { id: 'claude-opus-4-20250514', name: 'Claude 4 Opus', description: 'Most powerful for complex tasks' },
      { id: 'claude-sonnet-4-20250514', name: 'Claude 4 Sonnet', description: 'Balanced performance and efficiency' },

      // Claude 3.x family
      { id: 'claude-3-7-sonnet-latest', name: 'Claude 3.7 Sonnet', description: 'Previous flagship with extended thinking' },
      { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', description: 'Fast and cost-effective' },
      { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', description: 'Previous generation' },
      { id: 'claude-3-opus-latest', name: 'Claude 3 Opus', description: 'Legacy powerful model' }
    ]
  },
  {
    id: LLMProvider.AWS_BEDROCK,
    name: 'AWS Bedrock',
    models: [
      { id: 'anthropic.claude-sonnet-4-20250514-v1:0', name: 'Claude 4 Sonnet', description: 'Balanced performance and efficiency' },
      { id: 'anthropic.claude-3-7-sonnet-20250219-v1:0', name: 'Claude 3.7 Sonnet', description: 'Previous flagship with extended thinking' },
      { id: 'anthropic.claude-3-haiku-20240307-v1:0', name: 'Claude 3 Haiku', description: 'Fast and cost-effective' },
    ]
  }

];

/**
 * Default LangChain configuration
 */
export const DEFAULT_CONFIG: LangChainConfig = {
  provider: LLMProvider.ANTHROPIC,
  model: 'claude-3-7-sonnet-latest',
  apiKey: '',
  providerConfig: {
    awsBedrock: {
      aws_access_key_id: '',
      aws_secret_access_key: '',
      aws_session_token: '',
      region: '',
      cache: false,
      inferenceProfile: ''
    }
  }
};
