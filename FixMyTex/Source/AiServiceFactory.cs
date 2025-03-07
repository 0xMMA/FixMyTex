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
        Mock, // For testing
        // Future providers can be added here (like Claude, etc.)
    }
    
    /// <summary>
    /// Creates an instance of an AI service
    /// </summary>
    /// <param name="provider">The AI service provider to use</param>
    /// <param name="apiKey">Optional API key</param>
    /// <returns>An instance of IAiService</returns>
    public static IAiService CreateService(ServiceProvider provider = ServiceProvider.OpenAI, string? apiKey = null)
    {
        return provider switch
        {
            ServiceProvider.OpenAI => new OpenAiService(apiKey),
            ServiceProvider.Mock => CreateMockService(),
            _ => throw new ArgumentException($"Unsupported AI service provider: {provider}")
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