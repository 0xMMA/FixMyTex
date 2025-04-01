namespace FixMyTex.Features.QuickActions.Models
{
    /// <summary>
    /// Represents a quick action that can be performed on text
    /// </summary>
    public class QuickAction
    {
        /// <summary>
        /// Unique identifier for the quick action
        /// </summary>
        public required string Id { get; set; }
        
        /// <summary>
        /// Display name for the quick action
        /// </summary>
        public required string Name { get; set; }
        
        /// <summary>
        /// Description of what the quick action does
        /// </summary>
        public string? Description { get; set; }
        
        /// <summary>
        /// Keyboard shortcut number (1-9) for quick selection
        /// </summary>
        public int ShortcutNumber { get; set; }
        
        /// <summary>
        /// Optional icon path for the quick action
        /// </summary>
        public string? IconPath { get; set; }
        
        /// <summary>
        /// Category of the quick action
        /// </summary>
        public QuickActionCategory Category { get; set; }
        
        /// <summary>
        /// System prompt to use for this quick action
        /// </summary>
        public required string Prompt { get; set; }
    }
    
    /// <summary>
    /// Categories of quick actions
    /// </summary>
    public enum QuickActionCategory
    {
        Fix,        // Basic improvements (grammar, spelling)
        Style,      // Tone/voice changes
        Transform,  // Fundamental changes (summarize, expand)
        Extract,    // Pull specific elements (key points, action items)
        Analyze,    // Provide insights about the text
        Contextualize // Adapt for audience/purpose
    }
}