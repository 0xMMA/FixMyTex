using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace FixMyTex;

/// <summary>
/// Implementation of IAiService using Microsoft's Semantic Kernel
/// with support for multiple AI providers
/// </summary>
public class SemanticKernelService : IAiService
{
    private readonly string _apiKey;
    private readonly string _model;
    private readonly ServiceProvider _provider;
    
    /// <summary>
    /// Supported AI service providers for the Semantic Kernel service
    /// </summary>
    public enum ServiceProvider
    {
        OpenAI,
        Anthropic
    }
    
    /// <summary>
    /// Constructor for SemanticKernelService
    /// </summary>
    /// <param name="provider">The AI service provider to use</param>
    /// <param name="apiKey">Optional API key. If null, will retrieve from environment variable.</param>
    /// <param name="model">Model to use. Default depends on provider.</param>
    public SemanticKernelService(ServiceProvider provider = ServiceProvider.OpenAI, string? apiKey = null, string? model = null)
    {
        _provider = provider;
        
        // Set default model based on provider
        string defaultModel = provider switch
        {
            ServiceProvider.OpenAI => "gpt-4o",
            ServiceProvider.Anthropic => "claude-3-haiku-20240307",
            _ => throw new ArgumentException($"Unsupported AI service provider: {provider}")
        };
        
        _model = model ?? defaultModel;
        
        // Get the API key from parameters or environment variables
        string envVarName = provider switch
        {
            ServiceProvider.OpenAI => "OPENAI_API_KEY",
            ServiceProvider.Anthropic => "ANTHROPIC_API_KEY",
            _ => throw new ArgumentException($"Unsupported AI service provider: {provider}")
        };
        
        _apiKey = apiKey ?? Environment.GetEnvironmentVariable(
            envVarName,
            EnvironmentVariableTarget.User
        ) ?? throw new ArgumentNullException(nameof(apiKey), $"API key must be provided or set in the {envVarName} environment variable");
    }
    
    /// <summary>
    /// Gets corrected text from the chosen AI service via Semantic Kernel
    /// </summary>
    public async Task<string> GetCorrectedTextAsync(string prompt, string inputText)
    {
        try
        {
            // Create Semantic Kernel
            var builder = Kernel.CreateBuilder();
            
            // Configure the appropriate service based on the provider
            if (_provider == ServiceProvider.OpenAI)
            {
                builder.AddOpenAIChatCompletion(_model, _apiKey);
            }
            else
            {
                // Instead of using Semantic Kernel for Anthropic (which requires a special extension),
                // we'll use our ClaudeService directly
                var claudeService = new ClaudeService(_apiKey, _model);
                return await claudeService.GetCorrectedTextAsync(prompt, inputText);
            }
            
            var kernel = builder.Build();
            
            // Execute chat completion using a prompt template
            var promptTemplate = $"{prompt}\n{inputText}";
            var result = await kernel.InvokePromptAsync(promptTemplate);
            
            return result.GetValue<string>() ?? string.Empty;
        }
        catch (Exception ex)
        {
            // Log the exception for debugging purposes
            System.Diagnostics.Debug.WriteLine($"Error calling AI API: {ex.Message}");
            
            // Return a user-friendly error message
            return $"[Could not process text. Please check your internet connection and API key. Error: {ex.Message}]";
        }
    }
}