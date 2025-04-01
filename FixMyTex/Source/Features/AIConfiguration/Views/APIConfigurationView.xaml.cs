using System.Windows;
using System.Windows.Controls;

namespace FixMyTex.Features.AIConfiguration.Views
{
    /// <summary>
    /// Interaction logic for APIConfigurationView.xaml
    /// </summary>
    public partial class APIConfigurationView : UserControl
    {
        public APIConfigurationView()
        {
            InitializeComponent();
            LoadProviders();
            UpdateModelComboBox();
            UpdateSemanticKernelSection();
            
            // Setup event handlers
            ProviderComboBox.SelectionChanged += ProviderComboBox_SelectionChanged;
            ModelComboBox.SelectionChanged += ModelComboBox_SelectionChanged;
            
            // Load API key if available
            UpdateApiKeyDisplay();
        }
        
        private void LoadProviders()
        {
            // Add all available providers (except Mock)
            ProviderComboBox.Items.Clear();
            foreach (var provider in Enum.GetValues<AiServiceFactory.ServiceProvider>())
            {
                if (provider != AiServiceFactory.ServiceProvider.Mock)
                {
                    ProviderComboBox.Items.Add(provider.ToString());
                }
            }
            
            // Select current provider
            ProviderComboBox.SelectedItem = AppConfig.DefaultAiProvider.ToString();
        }
        
        private void UpdateModelComboBox()
        {
            ModelComboBox.Items.Clear();
            
            // Add models based on selected provider
            switch (AppConfig.DefaultAiProvider)
            {
                case AiServiceFactory.ServiceProvider.OpenAI:
                    ModelComboBox.Items.Add("gpt-4o");
                    ModelComboBox.Items.Add("gpt-4-turbo");
                    ModelComboBox.Items.Add("gpt-3.5-turbo");
                    break;
                    
                case AiServiceFactory.ServiceProvider.Claude:
                    ModelComboBox.Items.Add("claude-3-5-haiku-latest");
                    ModelComboBox.Items.Add("claude-3-7-sonnet-latest");
                    ModelComboBox.Items.Add("claude-3-5-sonnet-latest");
                    ModelComboBox.Items.Add("claude-3-opus-latest");
                    break;
                    
                case AiServiceFactory.ServiceProvider.SemanticKernel:
                    // For SemanticKernel, models depend on the underlying provider
                    if (AppConfig.DefaultSemanticKernelProvider == AiServiceFactory.SemanticKernelProvider.OpenAI)
                    {
                        ModelComboBox.Items.Add("gpt-4o");
                        ModelComboBox.Items.Add("gpt-4-turbo");
                        ModelComboBox.Items.Add("gpt-3.5-turbo");
                    }
                    else
                    {
                        ModelComboBox.Items.Add("claude-3-5-haiku-latest");
                        ModelComboBox.Items.Add("claude-3-7-sonnet-latest");
                        ModelComboBox.Items.Add("claude-3-5-sonnet-latest");
                        ModelComboBox.Items.Add("claude-3-opus-latest");
                    }
                    break;
            }
            
            // Select default model for this provider
            ModelComboBox.SelectedItem = AppConfig.DefaultModels[AppConfig.DefaultAiProvider];
        }
        
        private void UpdateSemanticKernelSection()
        {
            // Only show Semantic Kernel provider options when SemanticKernel is selected
            SemanticKernelSection.Visibility = 
                AppConfig.DefaultAiProvider == AiServiceFactory.ServiceProvider.SemanticKernel 
                    ? Visibility.Visible 
                    : Visibility.Collapsed;
            
            // Set the selected SK provider
            if (AppConfig.DefaultSemanticKernelProvider == AiServiceFactory.SemanticKernelProvider.OpenAI)
            {
                RadioOpenAI.IsChecked = true;
            }
            else
            {
                RadioClaude.IsChecked = true;
            }
        }
        
        private void UpdateApiKeyDisplay()
        {
            // Display the API key source based on the selected provider
            string envVarName = GetEnvironmentVariableName();
            string keyExists = Environment.GetEnvironmentVariable(envVarName, EnvironmentVariableTarget.User) != null
                ? "Using API key from environment variable"
                : "No API key found in environment variable";
                
            ApiKeySourceText.Text = $"{keyExists} ({envVarName})";
        }
        
        private string GetEnvironmentVariableName()
        {
            // Get the environment variable name for the current provider
            return AppConfig.DefaultAiProvider switch
            {
                AiServiceFactory.ServiceProvider.OpenAI => "OPENAI_API_KEY",
                AiServiceFactory.ServiceProvider.Claude => "ANTHROPIC_API_KEY",
                AiServiceFactory.ServiceProvider.SemanticKernel => 
                    AppConfig.DefaultSemanticKernelProvider == AiServiceFactory.SemanticKernelProvider.OpenAI 
                        ? "OPENAI_API_KEY" 
                        : "ANTHROPIC_API_KEY",
                _ => "UNKNOWN_API_KEY"
            };
        }
        
        private void ProviderComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (ProviderComboBox.SelectedItem is not string providerName)
                return;
                
            // Update the default provider
            if (Enum.TryParse<AiServiceFactory.ServiceProvider>(providerName, out var provider))
            {
                AppConfig.DefaultAiProvider = provider;
                
                // Update related UI
                UpdateModelComboBox();
                UpdateSemanticKernelSection();
                UpdateApiKeyDisplay();
            }
        }
        
        private void ModelComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (ModelComboBox.SelectedItem is not string model)
                return;
                
            // Update the default model for the selected provider
            AppConfig.DefaultModels[AppConfig.DefaultAiProvider] = model;
        }
        
        private void RadioOpenAI_Checked(object sender, RoutedEventArgs e)
        {
            AppConfig.DefaultSemanticKernelProvider = AiServiceFactory.SemanticKernelProvider.OpenAI;
            UpdateModelComboBox();
            UpdateApiKeyDisplay();
        }
        
        private void RadioClaude_Checked(object sender, RoutedEventArgs e)
        {
            AppConfig.DefaultSemanticKernelProvider = AiServiceFactory.SemanticKernelProvider.Claude;
            UpdateModelComboBox();
            UpdateApiKeyDisplay();
        }
        
        private void SaveApiKeyButton_Click(object sender, RoutedEventArgs e)
        {
            // Get the environment variable name
            string envVarName = GetEnvironmentVariableName();
            
            // Get the API key from the password box
            string apiKey = ApiKeyPasswordBox.Password;
            
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                MessageBox.Show("Please enter a valid API key", "Invalid API Key", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }
            
            try
            {
                // Save the API key to the environment variable
                Environment.SetEnvironmentVariable(envVarName, apiKey, EnvironmentVariableTarget.User);
                
                // Update the UI
                UpdateApiKeyDisplay();
                
                MessageBox.Show($"API key saved successfully to {envVarName}", "Success", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to save API key: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }
}