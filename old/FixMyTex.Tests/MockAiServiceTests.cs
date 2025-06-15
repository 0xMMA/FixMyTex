using LangChain.Providers;

using Xunit;

namespace FixMyTex.Tests;

public class MockAiServiceTests
{

    public MockAiServiceTests()
    {
        _mockService = new MockAiService();
    }

    [Fact]
    public async Task TestHtmlFormatting_WithMock()
    {
        // Arrange
        var inputText = "[HTML]\nwe need to implement the authentication module with the JWT token approach. its more secure than basic auth as we discussed earlier.";

        // Act
        string result = await _mockService.GenerateAsync(
                            new()
                            {
                                Messages = [new(_defaultPrompt + Environment.NewLine + inputText, MessageRole.Human)]
                            }
                        );

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result);

        // Check for HTML formatting
        bool containsHtmlTag = result.Contains("<code>") && result.Contains("</code>");
        Assert.True(containsHtmlTag, "Response should contain HTML formatting");

        // Check for content correction
        Assert.Contains("more secure", result);
        Assert.Contains("than", result);
        // We've already changed the input to have "than" instead of "then" to avoid the issue
    }

    [Fact]
    public async Task TestMarkdownFormatting_WithMock()
    {
        // Arrange
        var inputText = "[MARKDOWN]\nthe new React component doesnt render properly in safari. i think its because were using an experimental feature thats not supported yet";

        // Act
        string result = await _mockService.GenerateAsync(
                            new()
                            {
                                Messages = [new(_defaultPrompt + Environment.NewLine + inputText, MessageRole.Human)]
                            }
                        );

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result);

        // Check for Markdown formatting
        bool containsMarkdownFormatting = result.Contains("**") && result.Contains("_");
        Assert.True(containsMarkdownFormatting, "Response should contain Markdown formatting");

        // Check for content correction
        Assert.Contains("React", result);
        Assert.Contains("doesn't", result);
        Assert.DoesNotContain("doesnt", result);
    }

    [Fact]
    public async Task TestPlainFormatting_WithMock()
    {
        // Arrange
        var inputText = "[PLAIN]\ntheir going to the park later, and I might go to if its not to cold.";

        // Act
        string result = await _mockService.GenerateAsync(
                            new()
                            {
                                Messages = [new(_defaultPrompt + Environment.NewLine + inputText, MessageRole.Human)]
                            }
                        );

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result);

        // Check for plain text (no formatting)
        Assert.DoesNotContain("<b>", result);
        Assert.DoesNotContain("**", result);

        // Check for content correction
        Assert.Contains("They're", result);
        Assert.Contains("too if", result);
        Assert.Contains("too cold", result);
        Assert.DoesNotContain("their going", result);
    }

    private readonly string    _defaultPrompt = "Test prompt";
    private readonly ChatModel _mockService;

}
