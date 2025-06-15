using FixMyTex.Features.QuickActions.Models;

namespace FixMyTex.Features.QuickActions.Services
{
    /// <summary>
    /// Service for enhancing text using quick actions
    /// </summary>
    public interface ITextEnhancementService
    {
        /// <summary>
        /// Enhances text using the specified quick actions
        /// </summary>
        /// <param name="originalText">The original text to enhance</param>
        /// <param name="quickActions">The quick actions to apply</param>
        /// <returns>The enhanced text</returns>
        Task<string> EnhanceTextAsync(string originalText, IEnumerable<QuickAction> quickActions);
        
        /// <summary>
        /// Previews the changes that would be made by enhancing the text
        /// </summary>
        /// <param name="originalText">The original text</param>
        /// <param name="quickActions">The quick actions to apply</param>
        /// <returns>A preview of the enhanced text with differences highlighted</returns>
        Task<string> PreviewEnhancementsAsync(string originalText, IEnumerable<QuickAction> quickActions);
        
        /// <summary>
        /// Applies the enhanced text to the clipboard
        /// </summary>
        Task ApplyEnhancedTextAsync(string enhancedText, string format = "Text");
        
        /// <summary>
        /// Cancels the current enhancement operation
        /// </summary>
        void CancelEnhancement();
    }
}