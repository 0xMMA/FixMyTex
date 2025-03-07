using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Windows;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;

namespace FixMyTex;

/// <summary> Interaction logic for MainWindow.xaml </summary>
public partial class MainWindow : Window
{

    public MainWindow()
    {
        InitializeComponent();
        loadConfig();
        setTrayIcon();
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

        //TODO: find ab better way to start minimized without flickering and without the minimize going just into small size 
        // Start minimized
        Dispatcher.BeginInvoke(
            new Action(
                () =>
                {
                    WindowState   = WindowState.Minimized;
                    ShowInTaskbar = false;
                }
            )
        );
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

    private void onTryIconDoubleClick(object sender, RoutedEventArgs e)
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

    private readonly GlobalHotkeyService _hotkeyService = new();
    private          AppConfig           _config;

}
