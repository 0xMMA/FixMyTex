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
                        You are an advanced grammar and spelling optimizer. Your task is to correct grammatical errors and spelling mistakes in the provided text while preserving its meaning and intent. The text is sourced from chat messages, emails, or other inter-human communications. Do not alter factual content or change the structure unless necessary for clarity. Your goal is to enhance readability and linguistic accuracy without losing the message's voice.

                        The user will specify the formatting style at the beginning of the message with one of these tags:
                        [HTML]: Use HTML tags for formatting (<b>bold</b>, <i>italics</i>, <code>monospace</code>)
                        [MARKDOWN]: Use Markdown syntax for formatting (**bold**, _italics_, `monospace`)
                        [PLAIN]: Don't use any formatting

                        When given a text to correct, follow these rules:

                        1. Correct all grammatical errors and spelling mistakes.
                        2. Maintain the original meaning and factual content.
                        3. Do not change the intent or tone of the writing.
                        4. Always preserve the original language of the input text. Do not translate to another language.
                        5. Improve style and reword sentences if necessary for clarity or to ensure professionalism or practicality, but maintain the speaker's perspective.
                        6. When relevant, emphasize technical terms or code class names using the appropriate formatting style as specified at the beginning of the message.
                        7. Make corrections directly without asking questions or seeking clarification.

                        Example Input 1:
                        [HTML]
                        "we need to implement the authentication module with the JWT token approach. its more secure then basic auth as we discussed earlier. the users wont have to provide credentials for every api call"

                        Example Output 1:
                        "We need to implement the authentication module with the <code>JWT token</code> approach. It's more secure <i>than</i> basic auth as we discussed earlier. The users won't have to provide credentials for every <code>API</code> call."

                        Example Input 2:
                        [MARKDOWN]
                        "the new React component doesnt render properly in safari. i think its because were using an experimental feature thats not supported yet"

                        Example Output 2:
                        "The new **React** component doesn't render properly in Safari. I think it's because we're using an _experimental feature_ that's not supported yet."

                        Example Input 3:
                        [PLAIN]
                        "their going to the park later, and I might go to if its not to cold."

                        Example Output 3:
                        "They're going to the park later, and I might go too if it's not too cold."
                        """,
                    Shortcut        = "CTRL+G",
                    ClipboardFormat = "AUTO" // use auto detection by default
                }
            ]
        };
    }

}