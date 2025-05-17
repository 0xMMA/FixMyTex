using System.Windows;
using System.Windows.Controls;

namespace FixMyTex.Features.AIConfiguration.Views
{
    /// <summary>
    /// Interaction logic for APIConfigurationView.xaml
    /// </summary>
    public partial class ApiConfigurationView : UserControl
    {
        public ApiConfigurationView()
        {
            InitializeComponent();
            loadProviders();
            updateModelComboBox();
            
            // Setup event handlers
            ProviderComboBox.SelectionChanged += handleProviderComboBox_SelectionChanged;
            ModelComboBox.SelectionChanged += handleModelComboBox_SelectionChanged;
            
            // Load API key if available
            updateApiKeyDisplay();
        }
        
        private void loadProviders()
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
        
        private void updateModelComboBox()
        {
            ModelComboBox.Items.Clear();
            
            // Add models based on selected provider
            switch (AppConfig.DefaultAiProvider)
            {
                case AiServiceFactory.ServiceProvider.OpenAi:
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
                    
                case AiServiceFactory.ServiceProvider.Google:
                    ModelComboBox.Items.Add("gemini-2.0-flash-lite");
                    break;
                case AiServiceFactory.ServiceProvider.HuggingFace:
                    ModelComboBox.Items.Add("meta-llama/Llama-3.1-8B-Instruct");
                    break;
            }
            
            // Select default model for this provider
            ModelComboBox.SelectedItem = AppConfig.DefaultModels[AppConfig.DefaultAiProvider];
        }
        
        private void updateApiKeyDisplay()
        {
            // Display the API key source based on the selected provider
            string envVarName = getEnvironmentVariableName();
            string keyExists = Environment.GetEnvironmentVariable(envVarName, EnvironmentVariableTarget.User) != null
                ? "Using API key from user environment variable"
                : "No API key found in user environment variable";
                
            ApiKeySourceText.Text = $"{keyExists} ({envVarName})";
        }
        
        private string getEnvironmentVariableName()
        {
            // Get the environment variable name for the current provider
            return AppConfig.DefaultAiProvider switch
            {
                AiServiceFactory.ServiceProvider.OpenAi => "OPENAI_API_KEY",
                AiServiceFactory.ServiceProvider.Claude => "ANTHROPIC_API_KEY",
                AiServiceFactory.ServiceProvider.Google => "GOOGLE_API_KEY",
                AiServiceFactory.ServiceProvider.HuggingFace => "HUGGINGFACE_API_KEY",
                _ => "UNKNOWN_API_KEY"
            };
        }
        
        private void handleProviderComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (ProviderComboBox.SelectedItem is not string providerName)
                return;
                
            // Update the default provider
            if (Enum.TryParse<AiServiceFactory.ServiceProvider>(providerName, out var provider))
            {
                AppConfig.DefaultAiProvider = provider;
                
                // Update related UI
                updateModelComboBox();
                updateApiKeyDisplay();
            }
        }
        
        private void handleModelComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (ModelComboBox.SelectedItem is not string model)
                return;
                
            // Update the default model for the selected provider
            AppConfig.DefaultModels[AppConfig.DefaultAiProvider] = model;
        }
        
        private void handleSaveApiKeyButton_Click(object sender, RoutedEventArgs e)
        {
            // Get the environment variable name
            string envVarName = getEnvironmentVariableName();
            
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
                updateApiKeyDisplay();
                
                MessageBox.Show($"API key saved successfully to {envVarName}", "Success", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to save API key: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }
}