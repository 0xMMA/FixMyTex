﻿using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;

using LangChain.Providers;

using WindowsInput;
using WindowsInput.Native;

namespace FixMyTex;

public class GlobalHotkeyService
{
    private          HwndSource?                   hwndSource;
    private readonly Dictionary<int, HotkeyConfig> hotkeyMap = new();
    
    // Double-press detection
    private DateTime lastKeyPressTime = DateTime.MinValue;
    private int lastHotkeyId = -1;
    private const double DoublePressThresholdMs = 500; // 500ms threshold for double-press
    
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
                //_ = HandleQuickActionsWindowAsync(hotKeyConfig);
                _ = HandleHotkeyActionAsync(hotKeyConfig);

                //// Check for double press
                //var now = DateTime.Now;
                //bool isDoublePress = false;

                //if (lastHotkeyId == hotkeyId && 
                //    (now - lastKeyPressTime).TotalMilliseconds < DoublePressThresholdMs)
                //{
                //    // This is a double press
                //    isDoublePress = true;
                //}

                //// Update last key press time and ID
                //lastKeyPressTime = now;
                //lastHotkeyId = hotkeyId;

                //// Handle differently based on single or double press
                //if (isDoublePress)
                //{
                //    _ = HandleQuickActionsWindowAsync(hotKeyConfig);
                //}
                //else
                //{
                //    _ = HandleHotkeyActionAsync(hotKeyConfig);
                //}

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
                System.Windows.MessageBox.Show("No text in clipboard!");
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
            //string taggedText;
            //if (finalFormat.Equals("HTML", StringComparison.OrdinalIgnoreCase))
            //{
            //    taggedText = "[HTML]\n" + originalText;
            //}
            //else if (finalFormat.Equals("Text", StringComparison.OrdinalIgnoreCase))
            //{
            //    taggedText = "[MARKDOWN]\n" + originalText;
            //}
            //else
            //{
            //    taggedText = "[PLAIN]\n" + originalText;
            //}

            // Use the config's Prompt to process text with the tagged input
            // Create an AI service based on the current default provider
            var chatModel = AiServiceFactory.CreateChatModel(
                AppConfig.DefaultAiProvider,
                null,
                AppConfig.DefaultModels[AppConfig.DefaultAiProvider]
            );

            //OLD: string correctedText = await chatModel.GetCorrectedTextAsync(config.Prompt ?? string.Empty, taggedText);
            string correctedText = await chatModel.GenerateAsync(
                                       $"""
                                        {config.Prompt!}
                                        
                                        {originalText}
                                        """
                                       );

            // Set the updated text to the clipboard with the chosen format
            ClipboardService.SetClipboardText(correctedText, finalFormat);

            // Optionally, simulate paste
            await Task.Delay(100);
            simulator.Keyboard.ModifiedKeyStroke(VirtualKeyCode.CONTROL, VirtualKeyCode.VK_V);
        }
        catch (Exception ex)
        {
            System.Windows.MessageBox.Show($"Error: {ex.Message}");
        }
    }

    // Method to handle showing the QuickActions window on double press
    private async Task HandleQuickActionsWindowAsync(HotkeyConfig config)
    {
        try
        {
            // Get the selected text for the QuickActions window
            var simulator = new InputSimulator();
            simulator.Keyboard.ModifiedKeyStroke(VirtualKeyCode.CONTROL, VirtualKeyCode.VK_C);
            await Task.Delay(100);

            string selectedText = ClipboardService.GetClipboardText();
            if (string.IsNullOrWhiteSpace(selectedText))
            {
                // If no text is selected, we can still show the window with empty text
                selectedText = string.Empty;
            }

            // Create services for QuickActions window
            var quickActionService = new Features.QuickActions.Services.MockQuickActionService();
            var textEnhancementService = new Features.QuickActions.Services.MockTextEnhancementService();

            // Create and show QuickActions window
            Application.Current.Dispatcher.Invoke(() =>
            {
                var quickActionsWindow = new Features.QuickActions.Views.QuickActionsWindow(
                    quickActionService,
                    textEnhancementService,
                    selectedText);
                
                quickActionsWindow.Show();
            });
        }
        catch (Exception ex)
        {
            System.Windows.MessageBox.Show($"Error showing Quick Actions: {ex.Message}");
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