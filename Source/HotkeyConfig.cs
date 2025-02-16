namespace FixMyTex;

public class HotkeyConfig
{
    public string? Caption         { get; set; }
    public string? IconPath        { get; set; }
    public bool    Enabled         { get; set; } = true;
    public string? Prompt          { get; set; }
    public string? Shortcut        { get; set; } // e.g. "CTRL+G"
    public string? ClipboardFormat { get; set; } // e.g. "HTML", "Text", "AUTO" for auto-detection
}