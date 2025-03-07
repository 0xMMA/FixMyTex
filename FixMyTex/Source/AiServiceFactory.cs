namespace FixMyTex;

/// <summary>
/// Factory for creating AI service instances
/// </summary>
public static class AiServiceFactory
{
    /// <summary>
    /// Supported AI service providers
    /// </summary>
    public enum ServiceProvider
    {
        OpenAI,
        Claude,
        SemanticKernel,
        Mock // For testing
    }
    
    /// <summary>
    /// Supported models for the SemanticKernel provider
    /// </summary>
    public enum SemanticKernelProvider
    {
        OpenAI,
        Claude
    }
    
    /// <summary>
    /// Creates an instance of an AI service
    /// </summary>
    /// <param name="provider">The AI service provider to use</param>
    /// <param name="apiKey">Optional API key</param>
    /// <param name="model">Optional model name</param>
    /// <param name="semanticKernelProvider">Optional semantic kernel provider (only applicable when provider is SemanticKernel)</param>
    /// <returns>An instance of IAiService</returns>
    public static IAiService CreateService(
        ServiceProvider provider = ServiceProvider.OpenAI, 
        string? apiKey = null, 
        string? model = null,
        SemanticKernelProvider semanticKernelProvider = SemanticKernelProvider.OpenAI)
    {
        return provider switch
        {
            ServiceProvider.OpenAI => new OpenAiService(apiKey, model ?? "gpt-4o"),
            ServiceProvider.Claude => new ClaudeService(apiKey, model ?? "claude-3-haiku-20240307"),
            ServiceProvider.SemanticKernel => CreateSemanticKernelService(semanticKernelProvider, apiKey, model),
            ServiceProvider.Mock => CreateMockService(),
            _ => throw new ArgumentException($"Unsupported AI service provider: {provider}")
        };
    }
    
    /// <summary>
    /// Creates a SemanticKernel service with the specified provider
    /// </summary>
    private static IAiService CreateSemanticKernelService(
        SemanticKernelProvider provider, 
        string? apiKey = null, 
        string? model = null)
    {
        return provider switch
        {
            SemanticKernelProvider.OpenAI => new SemanticKernelService(
                SemanticKernelService.ServiceProvider.OpenAI, 
                apiKey, 
                model),
            SemanticKernelProvider.Claude => new SemanticKernelService(
                SemanticKernelService.ServiceProvider.Anthropic, 
                apiKey, 
                model),
            _ => throw new ArgumentException($"Unsupported Semantic Kernel provider: {provider}")
        };
    }
    
    /// <summary>
    /// Creates a mock service for testing
    /// </summary>
    private static IAiService CreateMockService()
    {
#if DEBUG
        var mockServiceType = Type.GetType("FixMyTex.Tests.MockAiService, FixMyTex.Tests");
        if (mockServiceType != null)
        {
            return (IAiService)Activator.CreateInstance(mockServiceType)!;
        }
#endif
        // Fallback to a simple stub if the mock class isn't available
        return new OpenAiService();
    }
}