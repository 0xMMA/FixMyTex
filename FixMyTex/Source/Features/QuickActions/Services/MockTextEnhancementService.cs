using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FixMyTex.Features.QuickActions.Models;

namespace FixMyTex.Features.QuickActions.Services
{
    /// <summary>
    /// Mock implementation of ITextEnhancementService for testing and initial development
    /// </summary>
    public class MockTextEnhancementService : ITextEnhancementService
    {
        private bool _isCancelled = false;
        
        public async Task<string> EnhanceTextAsync(string originalText, IEnumerable<QuickAction> quickActions)
        {
            if (string.IsNullOrWhiteSpace(originalText) || !quickActions.Any())
            {
                return originalText;
            }
            
            // Reset cancellation flag
            _isCancelled = false;
            
            // Simulate processing time
            await Task.Delay(1000);
            
            if (_isCancelled)
            {
                return originalText;
            }
            
            // In a real implementation, this would call the AI service
            // For now, just do some simple text transformations based on the quick actions
            var enhancedText = originalText;
            
            foreach (var action in quickActions)
            {
                enhancedText = ApplyQuickAction(enhancedText, action);
                
                // Check for cancellation between actions
                if (_isCancelled)
                {
                    return originalText;
                }
                
                // Simulate processing time between actions
                await Task.Delay(200);
            }
            
            return enhancedText;
        }
        
        public async Task<string> PreviewEnhancementsAsync(string originalText, IEnumerable<QuickAction> quickActions)
        {
            if (string.IsNullOrWhiteSpace(originalText) || !quickActions.Any())
            {
                return originalText;
            }
            
            // For preview, we'll simulate AI processing with a shorter delay
            await Task.Delay(500);
            
            if (_isCancelled)
            {
                return originalText;
            }
            
            // Generate enhanced text with some highlighted differences
            string enhancedText = await EnhanceTextAsync(originalText, quickActions);
            
            // For demonstration, highlight some differences
            // In a real implementation, we'd need to show actual differences
            
            // This is a simple mock implementation that just pretends to highlight some changes
            // In a real implementation, you'd use diff algorithms to identify and highlight changes
            var mockHighlightedText = new StringBuilder(enhancedText);
            
            // Find a few words to highlight as examples (this is just for demonstration)
            var words = enhancedText.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            Random rand = new();
            
            // Randomly "highlight" a few words
            for (int i = 0; i < Math.Min(3, words.Length); i++)
            {
                int index = rand.Next(words.Length);
                string word = words[index];
                if (mockHighlightedText.ToString().Contains(word))
                {
                    mockHighlightedText.Replace(word, $"<span style='color: #4CAF50'>{word}</span>");
                }
            }
            
            return mockHighlightedText.ToString();
        }
        
        public Task ApplyEnhancedTextAsync(string enhancedText, string format = "Text")
        {
            // In a real implementation, this would put the text in the clipboard
            // and possibly paste it
            FixMyTex.ClipboardService.SetClipboardText(enhancedText, format);
            return Task.CompletedTask;
        }
        
        public void CancelEnhancement()
        {
            _isCancelled = true;
        }
        
        private string ApplyQuickAction(string text, QuickAction action)
        {
            // This is a mock implementation that just pretends to apply transformations
            // In a real implementation, this would use AI to apply the transformation
            
            switch (action.Id)
            {
                case "fix_grammar":
                    // Simulate fixing grammar errors
                    text = text.Replace(" i ", " I ")
                               .Replace(" dont ", " don't ")
                               .Replace(" cant ", " can't ");
                    break;
                    
                case "fix_spelling":
                    // Simulate fixing spelling errors
                    text = text.Replace("teh ", "the ")
                               .Replace("wiht ", "with ")
                               .Replace("thier ", "their ");
                    break;
                    
                case "fix_punctuation":
                    // Simulate fixing punctuation
                    if (!text.EndsWith('.') && !text.EndsWith('!') && !text.EndsWith('?'))
                    {
                        text += ".";
                    }
                    break;
                    
                case "style_formal":
                    // Simulate making text more formal
                    text = text.Replace("gonna", "going to")
                               .Replace("wanna", "want to")
                               .Replace("kinda", "kind of");
                    break;
                    
                case "style_informal":
                    // Simulate making text more informal
                    text = text.Replace("I am", "I'm")
                               .Replace("cannot", "can't")
                               .Replace("will not", "won't");
                    break;
                    
                case "transform_simplify":
                    // Simulate simplifying
                    if (text.Length > 50)
                    {
                        // Just truncate for mock purposes
                        text = text.Substring(0, text.Length / 2) + "...";
                    }
                    break;
                    
                case "transform_expand":
                    // Simulate expanding
                    text += " Furthermore, this represents an important consideration for all stakeholders involved.";
                    break;
                    
                default:
                    // For other actions, just return the text unchanged in this mock
                    break;
            }
            
            return text;
        }
    }
}