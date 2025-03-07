using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;

namespace FixMyTex;

/// <summary> Interaction logic for MainWindow.xaml </summary>
public partial class MainWindow : Window
{
    private readonly GlobalHotkeyService _hotkeyService = new();
    private AppConfig _config;

    public MainWindow()
    {
        InitializeComponent();
        loadConfig();
        setTrayIcon();
        
        // Initialize UI elements
        SetupUIControls();
    }
    
    private void SetupUIControls()
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
        
        // Update model dropdown
        UpdateModelComboBox();
        
        // Update SK provider visibility
        UpdateSemanticKernelSection();
        
        // Setup event handlers
        ProviderComboBox.SelectionChanged += ProviderComboBox_SelectionChanged;
        ModelComboBox.SelectionChanged += ModelComboBox_SelectionChanged;
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
    }
    
    private void RadioClaude_Checked(object sender, RoutedEventArgs e)
    {
        AppConfig.DefaultSemanticKernelProvider = AiServiceFactory.SemanticKernelProvider.Claude;
        UpdateModelComboBox();
    }

    protected override void OnClosed(EventArgs e)
    {
        // Clean up hotkeys
        _hotkeyService.CleanupHotkeys(this);
        base.OnClosed(e);
    }

    protected override void OnSourceInitialized(EventArgs e)
    {
        base.OnSourceInitialized(e);

        // Initialize all hotkeys from config
        if (_config?.Hotkeys != null)
        {
            _hotkeyService.InitializeHotkeys(this, _config.Hotkeys);
        }

#if !DEBUG
        //TODO: find ab better way to start minimized without flickering and without the minimize going just into small size 
        // Start minimized only in Release builds
        Dispatcher.BeginInvoke(
            new Action(
                () =>
                {
                    WindowState   = WindowState.Minimized;
                    ShowInTaskbar = false;
                }
            )
        );
#endif
    }

    protected override void OnStateChanged(EventArgs e)
    {
        base.OnStateChanged(e);
        ShowInTaskbar = WindowState != WindowState.Minimized;
    }

    private static Icon bitmapImageToIcon(BitmapImage bitmapImage)
    {
        using (var memoryStream = new MemoryStream())
        {
            BitmapEncoder encoder = new PngBitmapEncoder();
            encoder.Frames.Add(BitmapFrame.Create(bitmapImage));
            encoder.Save(memoryStream);

            using (var bitmap = new Bitmap(memoryStream))
            {
                IntPtr hIcon = bitmap.GetHicon();

                return System.Drawing.Icon.FromHandle(hIcon);
            }
        }
    }

    private void Hyperlink_OnRequestNavigate(object sender, RequestNavigateEventArgs e)
    {
        var psi = new ProcessStartInfo
        {
            FileName        = e.Uri.AbsoluteUri,
            UseShellExecute = true
        };

        Process.Start(psi);
        e.Handled = true;
    }

    private void loadConfig()
    {
        // Suppose we load from a config file "hotkeys.json"
        // If it doesn't exist, we fallback to defaults.
        _config = AppConfig.LoadFromJson("hotkeys.json");
    }

    private void onExitClick(object sender, RoutedEventArgs e)
    {
        Application.Current.Shutdown();
    }

    private void onOpenClick(object sender, RoutedEventArgs e)
    {
        openWindow();
    }

    private void onTrayIconDoubleClick(object sender, RoutedEventArgs e)
    {
        openWindow();
    }

    private void openWindow()
    {
        Show();
        WindowState = WindowState.Normal;
        Activate();
    }

    private void setTrayIcon()
    {
        // If config or config.Hotkeys might contain an icon, we could handle that.
        // For now, just load a default.
        var bitmapImage = new BitmapImage(new Uri("pack://application:,,,/icons8-mutig-ai-32.png"));
        TrayIcon.Icon = bitmapImageToIcon(bitmapImage);
    }
}