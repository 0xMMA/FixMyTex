using System;
using System.Windows;

namespace FixMyTex;

/// <summary> Interaction logic for App.xaml </summary>
public partial class App : Application
{
    // Default provider is always SemanticKernel
    public static AiServiceFactory.ServiceProvider DefaultProvider { get; set; } = AiServiceFactory.ServiceProvider.SemanticKernel;
    
    // Default SemanticKernel backend to use based on available API keys
    public static AiServiceFactory.SemanticKernelProvider DefaultSemanticKernelProvider { get; set; } = AiServiceFactory.SemanticKernelProvider.OpenAI;
    
    /// <inheritdoc />
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        // Check environment variables to determine which backend for SemanticKernel
        if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("OPENAI_API_KEY", EnvironmentVariableTarget.User)))
        {
            DefaultSemanticKernelProvider = AiServiceFactory.SemanticKernelProvider.OpenAI;
        }
        else if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY", EnvironmentVariableTarget.User)))
        {
            DefaultSemanticKernelProvider = AiServiceFactory.SemanticKernelProvider.Claude;
        }
        else
        {
            //todo inform user that no API keys are set, maybe don't start minimised and go to setting and show the user a hint there
        }
    }
}