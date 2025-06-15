using System.Runtime.CompilerServices;

using LangChain.Providers;

namespace FixMyTex.Tests;

/// <summary> Mock AI service for testing that doesn't make API calls </summary>
public class MockAiService : ChatModel
{

    /// <inheritdoc />
    public MockAiService() : base("test") { }

    /// <inheritdoc />
    public override async IAsyncEnumerable<ChatResponse> GenerateAsync(
        ChatRequest                                request,
        ChatSettings?                              settings          = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        settings ??= ChatSettings.Default;

        // Simulate async operation
        await Task.Delay(50, cancellationToken);

        string inputText = request.Messages.Last().Content;
        string result;

        if (inputText.Contains("[HTML]"))
        {
            result = "We need to implement the authentication module with the <code>JWT token</code> approach. It's more secure <i>than</i> basic auth as we discussed earlier.";
        }
        else if (inputText.Contains("[MARKDOWN]"))
        {
            result = "The new **React** component doesn't render properly in Safari. I think it's because we're using an _experimental feature_ that's not supported yet.";
        }
        else
        {
            result = "They're going to the park later, and I might go too if it's not too cold.";
        }

        yield return new ChatResponse
        {
            Messages     = [new(result, MessageRole.Ai)],
            UsedSettings = settings
        };
    }

}
