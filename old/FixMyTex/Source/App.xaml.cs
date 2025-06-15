using System.Windows;

namespace FixMyTex;

/// <summary> Interaction logic for App.xaml </summary>
public partial class App : Application
{
    // Default provider is always SemanticKernel
    public static AiServiceFactory.ServiceProvider DefaultProvider { get; set; } = AiServiceFactory.ServiceProvider.OpenAi;
    
    
    /// <inheritdoc />
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        // Check environment variables to determine which backend for SemanticKernel
        if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("OPENAI_API_KEY", EnvironmentVariableTarget.User)))
        {
            DefaultProvider = AiServiceFactory.ServiceProvider.OpenAi;
        }
        else if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY", EnvironmentVariableTarget.User)))
        {
            DefaultProvider = AiServiceFactory.ServiceProvider.Claude;
        }
        else if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("HUGGINGFACE_API_KEY", EnvironmentVariableTarget.User)))
        {
            DefaultProvider = AiServiceFactory.ServiceProvider.HuggingFace;
        }
        else if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("GOOGLE_API_KEY", EnvironmentVariableTarget.User)))
        {
            DefaultProvider = AiServiceFactory.ServiceProvider.Google;
        }
        else if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("AZURE_OPENAI_API_KEY", EnvironmentVariableTarget.User)))
        {
            DefaultProvider = AiServiceFactory.ServiceProvider.AzureOpenAi;
        }
        else
        {
            //todo inform user that no API keys are set, maybe don't start minimised and go to setting and show the user a hint there
        }
    }
}