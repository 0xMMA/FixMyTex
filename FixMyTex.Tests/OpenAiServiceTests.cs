using Xunit;
using FixMyTex;
using System.Threading.Tasks;

namespace FixMyTex.Tests;

public class AiServiceTests
{
    private readonly string _defaultPrompt = """
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
        """;

    private readonly IAiService _aiService;

    public AiServiceTests()
    {
        // Use the mock service for reliable testing
        _aiService = new MockAiService();
        
        // For real API testing, uncomment this:
        //_aiService = AiServiceFactory.CreateService();
    }

    [Fact]
    public async Task TestHtmlFormatting()
    {
        // Arrange
        string inputText = "[HTML]\nwe need to implement the authentication module with the JWT token approach. its more secure then basic auth as we discussed earlier.";

        // Act
        string result = await _aiService.GetCorrectedTextAsync(_defaultPrompt, inputText);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result);
        
        // Check for HTML formatting (flexible assertions to avoid test fragility)
        bool containsHtmlTag = result.Contains("<") && result.Contains(">");
        Assert.True(containsHtmlTag, "Response should contain HTML formatting");
        
        // Check for content correction
        Assert.Contains("more secure", result);
        Assert.DoesNotContain("then basic auth", result); // Should be corrected to "than"
        
        // Print the actual result for debugging
        System.Diagnostics.Debug.WriteLine($"HTML Result: {result}");
    }

    [Fact]
    public async Task TestMarkdownFormatting()
    {
        // Arrange
        string inputText = "[MARKDOWN]\nthe new React component doesnt render properly in safari. i think its because were using an experimental feature thats not supported yet";

        // Act
        string result = await _aiService.GetCorrectedTextAsync(_defaultPrompt, inputText);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result);
        
        // Check for Markdown formatting (flexible assertions to avoid test fragility)
        bool containsMarkdownFormatting = 
            result.Contains("**") || 
            result.Contains("_") || 
            result.Contains("`");
        
        Assert.True(containsMarkdownFormatting, "Response should contain Markdown formatting");
        
        // Check for content correction
        Assert.Contains("React", result);
        Assert.DoesNotContain("doesnt", result); // Should be corrected to "doesn't"
        
        // Print the actual result for debugging
        System.Diagnostics.Debug.WriteLine($"Markdown Result: {result}");
    }

    [Fact]
    public async Task TestPlainFormatting()
    {
        // Arrange
        string inputText = "[PLAIN]\ntheir going to the park later, and I might go to if its not to cold.";

        // Act
        string result = await _aiService.GetCorrectedTextAsync(_defaultPrompt, inputText);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result);
        
        // Check that there's no special formatting
        Assert.DoesNotContain("<b>", result);
        Assert.DoesNotContain("**", result);
        Assert.DoesNotContain("`", result);
        
        // Check for content correction
        Assert.DoesNotContain("their going", result); // Should be corrected to "They're going"
        Assert.DoesNotContain("go to if", result); // Should be corrected to "go too if"
        Assert.DoesNotContain("to cold", result); // Should be corrected to "too cold"
        
        // Print the actual result for debugging
        System.Diagnostics.Debug.WriteLine($"Plain Result: {result}");
    }
}