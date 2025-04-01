using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using FixMyTex.Features.AIConfiguration.Views;
using FixMyTex.Features.Common;
using FixMyTex.Features.Common.Views;

namespace FixMyTex;

/// <summary> Interaction logic for MainWindow.xaml </summary>
public partial class MainWindow : Window
{
    private readonly GlobalHotkeyService _hotkeyService = new();
    private AppConfig? _config;
    private MainWindowViewModel _viewModel;
    
    // Views
    private readonly HomeView _homeView = new();
    private readonly APIConfigurationView _apiConfigView = new();
    private readonly AboutView _aboutView = new();
    
    // Last active nav button
    private Button _activeNavButton;
    
    public MainWindow()
    {
        InitializeComponent();
        
        // Get the view model from resources
        _viewModel = (MainWindowViewModel)FindResource("ViewModel");
        
        loadConfig();
        setTrayIcon();
        
        // Set default view and active nav
        _activeNavButton = NavHome;
        setActiveNavButton(_activeNavButton);
        _viewModel.CurrentView = _homeView;
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
        //TODO: find a better way to start minimized without flickering and without the minimize going just into small size 
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
    
    private void setActiveNavButton(Button button)
    {
        // Reset previous active button
        if (_activeNavButton != null)
        {
            _activeNavButton.Style = (Style)FindResource("FluentNavigationButtonStyle");
        }
        
        // Set new active button
        _activeNavButton = button;
        _activeNavButton.Style = (Style)FindResource("FluentActiveNavigationButtonStyle");
    }
    
    #region Navigation
    
    private void NavHome_Click(object sender, RoutedEventArgs e)
    {
        setActiveNavButton(NavHome);
        _viewModel.CurrentView = _homeView;
    }
    
    private void NavAPIConfig_Click(object sender, RoutedEventArgs e)
    {
        setActiveNavButton(NavAPIConfig);
        _viewModel.CurrentView = _apiConfigView;
    }
    
    private void NavPrompts_Click(object sender, RoutedEventArgs e)
    {
        setActiveNavButton(NavPrompts);
        _viewModel.CurrentView = new TextBlock 
        { 
            Text = "Prompt Templates - Coming Soon", 
            FontSize = 18,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center
        };
    }
    
    private void NavHotkeys_Click(object sender, RoutedEventArgs e)
    {
        setActiveNavButton(NavHotkeys);
        _viewModel.CurrentView = new TextBlock 
        { 
            Text = "Hotkey Configuration - Coming Soon", 
            FontSize = 18,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center
        };
    }
    
    private void NavAbout_Click(object sender, RoutedEventArgs e)
    {
        setActiveNavButton(NavAbout);
        _viewModel.CurrentView = _aboutView;
    }
    
    #endregion
}