using System.IO;
using System.Text.Json;

namespace FixMyTex;

public class AppConfig
{
    public List<HotkeyConfig>? Hotkeys { get; init; }

    public static AppConfig LoadFromJson(string filePath)
    {
        if (!File.Exists(filePath))
        {
            return createDefaultConfig();
        }

        string json = File.ReadAllText(filePath);
        return JsonSerializer.Deserialize<AppConfig>(json) ?? createDefaultConfig();
    }

    private static AppConfig createDefaultConfig()
    {
        // Return a default config if no file found, or handle gracefully.
        return new AppConfig
        {
            Hotkeys =
            [
                new HotkeyConfig
                {
                    Caption = "Proofread",
                    //IconPath        = "pack://application:,,,/icons8-mutig-ai-32.png",
                    Enabled = true,
                    Prompt =
                        """
                        You are an advanced grammar and spelling optimizer. Your task is to correct grammatical errors and spelling mistakes in the provided text while preserving its meaning and intent. The text is sourced from chat messages, emails, or other inter-human communications. Do not alter factual content or change the structure unless necessary for clarity. Your goal is to enhance readability and linguistic accuracy without losing the message’s voice.

                        When given a text to correct, follow these rules:

                        1. Correct all grammatical errors and spelling mistakes.
                        2. Maintain the original meaning and factual content.
                        3. Do not change the intent or tone of the writing.
                        4. Improve style and reword sentences if necessary for clarity or to ensure professionalism or practicality, but maintain the speaker’s perspective.
                        5. When relevant, you may emphasize technical terms or code class names by formatting them in <b>bold</b>, <i>italics</i>, or <code>monospace, code, highlight</code> style (html).
                        6. Just do it! Or don't. Don't ask questions. Just fix the text.

                        Example Input:
                        "their going to the park later, and I might go to if its not to cold."

                        Example Output:
                        "They're going to the park later, and I might go too if it's not too cold."
                        
                        """,
                    Shortcut        = "CTRL+G",
                    ClipboardFormat = "AUTO" // use auto detection by default
                }
            ]
        };
    }

}