using OpenAI;
using OpenAI.Chat;

namespace FixMyTex;

public static class OpenAiService
{
    // Provide a method that uses the prompt and text to produce a corrected output
    public static async Task<string> GetCorrectedTextAsync(string prompt, string inputText)
    {
        try
        {
            OpenAIClient client = new(
                Environment.GetEnvironmentVariable(
                    "OPENAI_API_KEY",
                    EnvironmentVariableTarget.User
                )
            );

            var chatClient = client.GetChatClient("gpt-4o"); // or whichever model

            var result = await chatClient.CompleteChatAsync(
                             new List<ChatMessage>
                             {
                                 ChatMessage.CreateSystemMessage(prompt),
                                 ChatMessage.CreateUserMessage(inputText)
                             },
                             new ()
                             {
                                 MaxOutputTokenCount = 500,
                                 Temperature         = 0.3f,
                                 FrequencyPenalty    = 0.0f,
                                 PresencePenalty     = 0.0f
                             }
                         );

            // For this example, we assume the response is in the first Choice
            return result.Value.Content[0].Text ?? string.Empty;
        }
        catch (Exception ex)
        {
            // Log or handle the exception.
            return $"[Error calling OpenAI API: {ex.Message}]";
        }
    }
}