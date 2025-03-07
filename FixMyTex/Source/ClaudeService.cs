using Microsoft.SemanticKernel;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace FixMyTex;

/// <summary>
/// Implementation of IAiService using Anthropic's Claude API via direct HTTP calls
/// </summary>
public class ClaudeService : IAiService
{
    private readonly string _apiKey;
    private readonly string _model;
    private readonly HttpClient _httpClient;
    
    /// <summary>
    /// Constructor for ClaudeService
    /// </summary>
    /// <param name="apiKey">Optional API key. If null, will retrieve from environment variable.</param>
    /// <param name="model">Model to use. Defaults to "claude-3-haiku-20240307"</param>
    public ClaudeService(string? apiKey = null, string model = "claude-3-haiku-20240307")
    {
        _apiKey = apiKey ?? Environment.GetEnvironmentVariable(
            "ANTHROPIC_API_KEY",
            EnvironmentVariableTarget.User
        ) ?? throw new ArgumentNullException(nameof(apiKey), "API key must be provided or set in environment variables");
        
        _model = model;
        
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Add("x-api-key", _apiKey);
        _httpClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }
    
    /// <summary>
    /// Gets corrected text from Claude
    /// </summary>
    public async Task<string> GetCorrectedTextAsync(string prompt, string inputText)
    {
        try
        {
            // Create the request payload
            var requestPayload = new
            {
                model = _model,
                system = prompt,
                messages = new[]
                {
                    new 
                    { 
                        role = "user", 
                        content = new[] 
                        { 
                            new 
                            { 
                                type = "text", 
                                text = inputText 
                            } 
                        } 
                    }
                },
                temperature = 0.3,
                max_tokens = 500
            };
            
            // Serialize to JSON
            var jsonContent = JsonSerializer.Serialize(requestPayload);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
            
            // Send the request
            var response = await _httpClient.PostAsync("https://api.anthropic.com/v1/messages", content);
            response.EnsureSuccessStatusCode();
            
            // Parse the response
            var responseJson = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(responseJson);
            
            // Extract the response text
            if (document.RootElement.TryGetProperty("content", out var contentArray) &&
                contentArray.GetArrayLength() > 0)
            {
                var firstContent = contentArray[0];
                if (firstContent.TryGetProperty("type", out var type) && 
                    type.GetString() == "text" &&
                    firstContent.TryGetProperty("text", out var text))
                {
                    return text.GetString() ?? string.Empty;
                }
            }
            
            return string.Empty;
        }
        catch (Exception ex)
        {
            // Log the exception for debugging purposes
            System.Diagnostics.Debug.WriteLine($"Error calling Claude API: {ex.Message}");
            
            // Return a user-friendly error message
            return $"[Could not process text. Please check your internet connection and API key. Error: {ex.Message}]";
        }
    }
}