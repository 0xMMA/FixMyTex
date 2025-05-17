using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows;

namespace FixMyTex;

public static class ClipboardService
{
    // Custom enum for clipboard formats
    public enum ClipboardFormat
    {
        Text,
        Html
    }

    public static string GetClipboardText()
    {
        // Try native approach
        string? nativeResult = NativeClipboard.GetClipboardData(ClipboardFormat.Text);
        if (!string.IsNullOrEmpty(nativeResult))
        {
            return nativeResult;
        }

        // Fall back to standard approach if native fails
        try
        {
            Debug.WriteLine("Native clipboard get failed, falling back to standard approach");
            return Clipboard.GetText();
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Both clipboard get methods failed: {ex.Message}");
            return string.Empty;
        }
    }

    public static void SetClipboardText(string data, string format)
    {
        if (format.Equals("HTML", StringComparison.OrdinalIgnoreCase))
        {
            // Use the ClipboardHelper to format the HTML correctly
            var formattedHtml = ClipboardHelper.ConvertHtmlToClipboardData(data);

            // Then set it using the HTML format
            if (!NativeClipboard.SetClipboardData(formattedHtml, ClipboardFormat.Html))
            {
                // Fallback to standard approach
                Debug.WriteLine("Native HTML clipboard set failed, falling back to standard approach");
                try
                {
                    Clipboard.SetText(formattedHtml, TextDataFormat.Html);
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Both HTML clipboard methods failed: {ex.Message}");
                }
            }
        }
        else
        {
            // For plain text
            if (!NativeClipboard.SetClipboardData(data, ClipboardFormat.Text))
            {
                // Fall back to standard approach if native fails
                Debug.WriteLine("Native clipboard set failed, falling back to standard approach");
                try
                {
                    Clipboard.SetText(data, TextDataFormat.Text);
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Both clipboard set methods failed: {ex.Message}");
                }
            }
        }
    }

    private static class NativeClipboard
    {
        // Win32 constants
        private const uint GMEM_MOVEABLE = 0x0002;
        private const uint CF_UNICODETEXT = 13;

        // Win32 API declarations
        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool OpenClipboard(IntPtr hWndNewOwner);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool CloseClipboard();

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool EmptyClipboard();

        [DllImport("user32.dll", SetLastError = true)]
        private static extern IntPtr GetClipboardData(uint uFormat);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern IntPtr SetClipboardData(uint uFormat, IntPtr hMem);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern uint RegisterClipboardFormatA(string lpszFormat);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern IntPtr GlobalAlloc(uint uFlags, UIntPtr dwBytes);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern IntPtr GlobalLock(IntPtr hMem);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool GlobalUnlock(IntPtr hMem);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern IntPtr GlobalFree(IntPtr hMem);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern UIntPtr GlobalSize(IntPtr hMem);

        // HTML format ID cache
        private static uint? _htmlFormatId;

        // Map our enum to Win32 format IDs
        private static uint GetFormatId(ClipboardFormat format)
        {
            return format switch
            {
                ClipboardFormat.Text => CF_UNICODETEXT,
                ClipboardFormat.Html => GetHtmlFormatId(),
                _ => throw new ArgumentException($"Unsupported clipboard format: {format}")
            };
        }

        private static uint GetHtmlFormatId()
        {
            if (!_htmlFormatId.HasValue)
            {
                _htmlFormatId = RegisterClipboardFormatA("HTML Format");
                Debug.WriteLine($"Registered HTML Format ID: {_htmlFormatId.Value}");
            }
            return _htmlFormatId.Value;
        }

        // Set clipboard data with specified format
        public static bool SetClipboardData(string data, ClipboardFormat format)
        {
            if (string.IsNullOrEmpty(data)) return false;

            IntPtr hGlobal = IntPtr.Zero;
            bool clipboardOpened = false;

            try
            {
                // Get the format ID
                uint formatId = GetFormatId(format);

                // Determine encoding based on format
                Encoding encoding = format == ClipboardFormat.Html
                    ? Encoding.UTF8
                    : Encoding.Unicode;

                // Add null terminator for text formats
                string dataToUse = format == ClipboardFormat.Text
                    ? data + "\0"
                    : data;

                // Convert string to bytes
                byte[] bytes = encoding.GetBytes(dataToUse);

                // Allocate global memory
                hGlobal = GlobalAlloc(GMEM_MOVEABLE, (UIntPtr)bytes.Length);
                if (hGlobal == IntPtr.Zero)
                {
                    Debug.WriteLine($"GlobalAlloc failed: {Marshal.GetLastWin32Error()}");
                    return false;
                }

                // Lock and copy data
                IntPtr lpGlobal = GlobalLock(hGlobal);
                if (lpGlobal == IntPtr.Zero)
                {
                    Debug.WriteLine($"GlobalLock failed: {Marshal.GetLastWin32Error()}");
                    return false;
                }

                Marshal.Copy(bytes, 0, lpGlobal, bytes.Length);
                GlobalUnlock(hGlobal);

                // Try multiple times with a small delay
                for (int attempt = 0; attempt < 3; attempt++)
                {
                    if (OpenClipboard(IntPtr.Zero))
                    {
                        clipboardOpened = true;
                        break;
                    }

                    if (attempt < 2)
                    {
                        Thread.Sleep(50);
                    }
                }

                if (!clipboardOpened)
                {
                    Debug.WriteLine($"OpenClipboard failed after multiple attempts: {Marshal.GetLastWin32Error()}");
                    return false;
                }

                EmptyClipboard();
                IntPtr result = SetClipboardData(formatId, hGlobal);
                CloseClipboard();

                if (result == IntPtr.Zero)
                {
                    Debug.WriteLine($"SetClipboardData failed: {Marshal.GetLastWin32Error()}");
                    return false;
                }

                // Memory now owned by system
                hGlobal = IntPtr.Zero;
                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Exception in native clipboard set: {ex.Message}");
                return false;
            }
            finally
            {
                // Free memory if still allocated
                if (hGlobal != IntPtr.Zero)
                    GlobalFree(hGlobal);

                // Ensure clipboard is closed
                if (clipboardOpened)
                {
                    try { CloseClipboard(); } catch { }
                }
            }
        }

        // Get clipboard data with specified format
        public static string? GetClipboardData(ClipboardFormat format)
        {
            IntPtr hGlobal = IntPtr.Zero;
            IntPtr lpGlobal = IntPtr.Zero;
            bool clipboardOpened = false;

            try
            {
                // Get the format ID
                uint formatId = GetFormatId(format);

                // Try multiple times with a small delay
                for (int attempt = 0; attempt < 3; attempt++)
                {
                    if (OpenClipboard(IntPtr.Zero))
                    {
                        clipboardOpened = true;
                        break;
                    }

                    if (attempt < 2)
                    {
                        Thread.Sleep(50);
                    }
                }

                if (!clipboardOpened)
                {
                    Debug.WriteLine($"OpenClipboard failed after multiple attempts: {Marshal.GetLastWin32Error()}");
                    return null;
                }

                hGlobal = GetClipboardData(formatId);
                if (hGlobal == IntPtr.Zero)
                {
                    CloseClipboard();
                    Debug.WriteLine($"GetClipboardData failed: {Marshal.GetLastWin32Error()}");
                    return null;
                }

                lpGlobal = GlobalLock(hGlobal);
                if (lpGlobal == IntPtr.Zero)
                {
                    CloseClipboard();
                    Debug.WriteLine($"GlobalLock failed: {Marshal.GetLastWin32Error()}");
                    return null;
                }

                string text;
                if (format == ClipboardFormat.Html)
                {
                    // For HTML, read as UTF-8
                    int size = (int)GlobalSize(lpGlobal).ToUInt32();
                    byte[] bytes = new byte[size];
                    Marshal.Copy(lpGlobal, bytes, 0, size);
                    text = Encoding.UTF8.GetString(bytes);
                }
                else
                {
                    // For text, use Unicode
                    text = Marshal.PtrToStringUni(lpGlobal) ?? string.Empty;
                }

                GlobalUnlock(hGlobal);
                CloseClipboard();

                return text;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Exception in native clipboard get: {ex.Message}");

                if (lpGlobal != IntPtr.Zero)
                    GlobalUnlock(hGlobal);

                if (clipboardOpened)
                    CloseClipboard();

                return null;
            }
        }
    }
}
