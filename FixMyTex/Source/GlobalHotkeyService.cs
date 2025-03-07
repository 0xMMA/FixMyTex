using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;

using WindowsInput;
using WindowsInput.Native;

namespace FixMyTex;

public class GlobalHotkeyService
{
    private          HwndSource?                   hwndSource;
    private readonly Dictionary<int, HotkeyConfig> hotkeyMap = new();

    private const int WM_HOTKEY = 0x0312;

    // Windows API calls
    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool UnregisterHotKey(IntPtr hWnd, int id);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern int GetWindowThreadProcessId(IntPtr hWnd, out int lpdwProcessId);

    // For simplicity, we store a static ID offset to avoid collisions.
    // In a more robust system, we would handle conflicts.
    private static int hotkeyCounter = 9000;

    public void InitializeHotkeys(Window window, List<HotkeyConfig> hotkeys)
    {
        var helper = new WindowInteropHelper(window);
        hwndSource = HwndSource.FromHwnd(helper.Handle);
        hwndSource?.AddHook(WndProc);

        foreach (var config in hotkeys)
        {
            if (!config.Enabled || string.IsNullOrWhiteSpace(config.Shortcut))
                continue;

            if (TryParseShortcut(config.Shortcut, out uint modifier, out uint key))
            {
                int currentId = hotkeyCounter++;
                if (!RegisterHotKey(helper.Handle, currentId, modifier, key))
                {
                    // Handle registration error if needed
                    continue;
                }
                hotkeyMap.Add(currentId, config);
            }
        }
    }

    public void CleanupHotkeys(Window window)
    {
        var helper = new WindowInteropHelper(window);
        foreach (var kvp in hotkeyMap)
        {
            UnregisterHotKey(helper.Handle, kvp.Key);
        }
        hotkeyMap.Clear();
    }

    // WndProc to catch hotkey messages
    private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
    {
        if (msg == WM_HOTKEY)
        {
            var hotkeyId = wParam.ToInt32();
            if (hotkeyMap.TryGetValue(hotkeyId, out var hotKeyConfig))
            {
                // Fire an event or handle logic here. We'll just do the logic in place.
                _       = HandleHotkeyActionAsync(hotKeyConfig);
                handled = true;
            }
        }

        return IntPtr.Zero;
    }

    // Example method to handle a hotkey press using the config
    private async Task HandleHotkeyActionAsync(HotkeyConfig config)
    {
        try
        {
            // Copy from clipboard
            var simulator = new InputSimulator();
            simulator.Keyboard.ModifiedKeyStroke(VirtualKeyCode.CONTROL, VirtualKeyCode.VK_C);
            await Task.Delay(100);

            string originalText = ClipboardService.GetClipboardText();
            if (string.IsNullOrWhiteSpace(originalText))
            {
                MessageBox.Show("No text in clipboard!");
                return;
            }

            // Decide what format we should use. If config says "AUTO", try detecting.
            string finalFormat = config.ClipboardFormat ?? "Text";
            if (finalFormat.Equals("AUTO", StringComparison.OrdinalIgnoreCase))
            {
                // We do process detection.
                string activeProc = GetActiveProcessName().ToLower();
                // Hardcode detection for Outlook & Teams.
                if (activeProc.Contains("outlook") || activeProc.Contains("teams"))
                {
                    finalFormat = "HTML";
                }
                else
                {
                    finalFormat = "Text";
                }
            }

            // Add format tag prefix to the input text based on the detected format
            string taggedText;
            if (finalFormat.Equals("HTML", StringComparison.OrdinalIgnoreCase))
            {
                taggedText = "[HTML]\n" + originalText;
            }
            else if (finalFormat.Equals("Text", StringComparison.OrdinalIgnoreCase))
            {
                taggedText = "[MARKDOWN]\n" + originalText;
            }
            else
            {
                taggedText = "[PLAIN]\n" + originalText;
            }

            // Use the config's Prompt to process text with the tagged input
            // Create an AI service and use it to process text with the tagged input
            var aiService = AiServiceFactory.CreateService();
            string correctedText = await aiService.GetCorrectedTextAsync(config.Prompt ?? string.Empty, taggedText);

            // Set the updated text to the clipboard with the chosen format
            ClipboardService.SetClipboardText(correctedText, finalFormat);

            // Optionally, simulate paste
            await Task.Delay(100);
            simulator.Keyboard.ModifiedKeyStroke(VirtualKeyCode.CONTROL, VirtualKeyCode.VK_V);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Error: {ex.Message}");
        }
    }

    private static string GetActiveProcessName()
    {
        IntPtr hwnd = GetForegroundWindow();
        if (hwnd == IntPtr.Zero)
            return string.Empty;

        _ = GetWindowThreadProcessId(hwnd, out int pid);
        try
        {
            var proc = System.Diagnostics.Process.GetProcessById(pid);
            return proc.ProcessName;
        }
        catch
        {
            // If something goes wrong, just return empty
            return string.Empty;
        }
    }

    // Basic parser for something like "CTRL+SHIFT+G" -> (0x0002 + 0x0004, 0x47)
    private bool TryParseShortcut(string shortcut, out uint modifier, out uint key)
    {
        // Available mod bits: MOD_ALT=0x1, MOD_CONTROL=0x2, MOD_SHIFT=0x4, MOD_WIN=0x8.
        modifier = 0;
        key      = 0;

        // Example parse logic: split by +, handle SHIFT/ALT/CTRL/WIN, final piece is the key.
        // This is simplistic and does not handle edge cases.
        var parts = shortcut.Split('+', StringSplitOptions.RemoveEmptyEntries);
        foreach (var p in parts)
        {
            var upper = p.Trim().ToUpper();
            if (upper      == "CTRL") modifier  |= 0x2;
            else if (upper == "SHIFT") modifier |= 0x4;
            else if (upper == "ALT") modifier   |= 0x1;
            else if (upper == "WIN") modifier   |= 0x8;
            else
            {
                // It's presumably the key.
                // For letters, we can do e.g. 'G' -> 0x47.
                if (upper.Length == 1)
                {
                    key = (uint)upper[0];
                }
                // Could handle F1-F12, etc.
            }
        }

        return (modifier != 0 && key != 0);
    }
}