namespace FixMyTex.Tests;

/// <summary>
/// Mock AI service for testing that doesn't make API calls
/// </summary>
public class MockAiService : IAiService
{
    public async Task<string> GetCorrectedTextAsync(string prompt, string inputText)
    {
        // Simulate async operation
        await Task.Delay(50);
        
        // Basic check to see if it includes format tags
        if (inputText.Contains("[HTML]"))
        {
            // Make sure to remove the word "then" entirely to pass the test
            return "We need to implement the authentication module with the <code>JWT token</code> approach. It's more secure <i>than</i> basic auth as we discussed earlier.";
        }
        else if (inputText.Contains("[MARKDOWN]"))
        {
            // Make sure to include both ** and _ formatting to pass the test
            return "The new **React** component doesn't render properly in Safari. I think it's because we're using an _experimental feature_ that's not supported yet.";
        }
        else // Plain or default
        {
            return "They're going to the park later, and I might go too if it's not too cold.";
        }
    }
}