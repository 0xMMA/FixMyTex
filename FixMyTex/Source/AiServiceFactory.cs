using LangChain.Providers;
using LangChain.Providers.Anthropic;
using LangChain.Providers.Azure;
using LangChain.Providers.Google;
using LangChain.Providers.HuggingFace;
using LangChain.Providers.OpenAI;

namespace FixMyTex;

/// <summary> Factory for creating AI service instances </summary>
public static class AiServiceFactory
{

    public static ChatModel CreateChatModel(
        ServiceProvider serviceProvider = ServiceProvider.Claude,
        string?         apiKey          = null,
        string?         model           = null)
    {
        switch (serviceProvider)
        {
            case ServiceProvider.Claude:
                string claudeApiKey = apiKey
                                      ?? Environment.GetEnvironmentVariable(
                                          "ANTHROPIC_API_KEY",
                                          EnvironmentVariableTarget.User
                                      )
                                      ?? throw new ArgumentNullException(nameof(apiKey), "API key must be provided or set in environment variables");

                var claudeProvider = new AnthropicProvider(claudeApiKey);

                return new AnthropicChatModel(claudeProvider, model ?? "claude-3-5-haiku-latest");

            case ServiceProvider.OpenAi:
                string apiKeyToUse = apiKey
                                     ?? Environment.GetEnvironmentVariable(
                                         "OPENAI_API_KEY",
                                         EnvironmentVariableTarget.User
                                     )
                                     ?? throw new ArgumentNullException(nameof(apiKey), "API key must be provided or set in environment variables");

                var provider = new OpenAiProvider(apiKeyToUse);

                return new OpenAiChatModel(provider, model ?? "gpt-4o");
            case ServiceProvider.AzureOpenAi:
                string azureApiKey = apiKey
                                     ?? Environment.GetEnvironmentVariable(
                                         "AZURE_OPENAI_API_KEY",
                                         EnvironmentVariableTarget.User
                                     )
                                     ?? throw new ArgumentNullException(nameof(apiKey), "API key must be provided or set in environment variables");
                var azureProvider = new AzureOpenAiProvider(azureApiKey, "TODO","TODO");
                return new AzureOpenAiChatModel(azureProvider, model ?? "gpt-4o");

            case ServiceProvider.HuggingFace:
                string huggingFaceApiKey = apiKey
                                           ?? Environment.GetEnvironmentVariable(
                                               "HUGGINGFACE_API_KEY",
                                               EnvironmentVariableTarget.User
                                           )
                                           ?? throw new ArgumentNullException(nameof(apiKey), "API key must be provided or set in environment variables");

                var huggingFaceProvider = new HuggingFaceProvider(huggingFaceApiKey, new());

                return new HuggingFaceChatModel(huggingFaceProvider, model ?? "meta-llama/Llama-3.1-8B-Instruct");

            case ServiceProvider.Google:
                string googleApiKey = apiKey
                                      ?? Environment.GetEnvironmentVariable(
                                          "GOOGLE_API_KEY",
                                          EnvironmentVariableTarget.User
                                      )
                                      ?? throw new ArgumentNullException(nameof(apiKey), "API key must be provided or set in environment variables");

                var googleProvider = new GoogleProvider(googleApiKey, new());

                return new GoogleChatModel(googleProvider, model ?? "gemini-2.0-flash-lite");
            case ServiceProvider.Mock:
            default:
                throw new ArgumentOutOfRangeException(nameof(serviceProvider), serviceProvider, null);
        }
    }

    /// <summary> Supported AI service providers </summary>
    public enum ServiceProvider
    {

        Claude,
        OpenAi,
        AzureOpenAi,
        HuggingFace,
        Google,
        Mock // For testing

    }

}
