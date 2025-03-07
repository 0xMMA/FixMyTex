namespace FixMyTex;

/// <summary>
/// Interface for AI service providers that can process text
/// </summary>
public interface IAiService
{
    /// <summary>
    /// Gets corrected text from an AI service
    /// </summary>
    /// <param name="prompt">The system prompt to use for the AI</param>
    /// <param name="inputText">The text to be corrected</param>
    /// <returns>The corrected text from the AI</returns>
    Task<string> GetCorrectedTextAsync(string prompt, string inputText);
}