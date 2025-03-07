using OpenAI;
using OpenAI.Chat;

namespace FixMyTex;

/// <summary>
/// Implementation of IAiService using OpenAI's API
/// </summary>
public class OpenAiService : IAiService
{
    private readonly string _apiKey;
    private readonly string _model;
    
    /// <summary>
    /// Constructor for OpenAiService
    /// </summary>
    /// <param name="apiKey">Optional API key. If null, will retrieve from environment variable.</param>
    /// <param name="model">Model to use. Defaults to "gpt-4o"</param>
    public OpenAiService(string? apiKey = null, string model = "gpt-4o")
    {
        _apiKey = apiKey ?? Environment.GetEnvironmentVariable(
            "OPENAI_API_KEY",
            EnvironmentVariableTarget.User
        ) ?? throw new ArgumentNullException(nameof(apiKey), "API key must be provided or set in environment variables");
        
        _model = model;
    }
    
    /// <summary>
    /// Gets corrected text from OpenAI
    /// </summary>
    public async Task<string> GetCorrectedTextAsync(string prompt, string inputText)
    {
        try
        {
            OpenAIClient client = new(_apiKey);
            var chatClient = client.GetChatClient(_model);

            var result = await chatClient.CompleteChatAsync(
                new List<ChatMessage>
                {
                    ChatMessage.CreateSystemMessage(prompt),
                    ChatMessage.CreateUserMessage(inputText)
                },
                new()
                {
                    MaxOutputTokenCount = 500,
                    Temperature = 0.3f,
                    FrequencyPenalty = 0.0f,
                    PresencePenalty = 0.0f
                }
            );

            return result.Value.Content[0].Text ?? string.Empty;
        }
        catch (Exception ex)
        {
            // Log the exception for debugging purposes
            System.Diagnostics.Debug.WriteLine($"Error calling AI API: {ex.Message}");
            
            // Return a user-friendly error message
            return $"[Could not process text. Please check your internet connection and API key. Error: {ex.Message}]";
        }
    }
    
    /// <summary>
    /// Static factory method for backward compatibility
    /// </summary>
    public static async Task<string> ProcessTextAsync(string prompt, string inputText)
    {
        var service = new OpenAiService();
        return await service.GetCorrectedTextAsync(prompt, inputText);
    }
}