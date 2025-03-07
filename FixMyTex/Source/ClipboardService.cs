using System.Diagnostics;
using System.Windows;

namespace FixMyTex;

public static class ClipboardService
{
    public static string GetClipboardText()
    {
        Debug.WriteLine(Clipboard.GetText(TextDataFormat.Html));
        return Clipboard.GetText();
    }

    public static void SetClipboardText(string data, string format)
    {
        // If the config (or auto-detection) says we should do HTML, we do it, else plain text.
        if (format.Equals("HTML", StringComparison.OrdinalIgnoreCase))
        {
            var html = ClipboardHelper.ConvertHtmlToClipboardData(data);
            Debug.WriteLine(format + html);
            Clipboard.SetText(html, TextDataFormat.Html);
        }
        else
        {
            Debug.WriteLine(format + data);
            Clipboard.SetText(data, TextDataFormat.Text);
        }
    }
}