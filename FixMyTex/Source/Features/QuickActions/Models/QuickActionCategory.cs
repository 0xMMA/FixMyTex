namespace FixMyTex.Features.QuickActions.Models
{
    /// <summary>
    /// Categories of quick actions
    /// </summary>
    public enum QuickActionCategory
    {
        Fix,        // Basic improvements (grammar, spelling, punctuation)
        Style,      // Tone/voice changes (formal, informal, academic)
        Transform,  // Fundamental changes (simplify, expand, summarize)
        Audience,   // Adapt for specific audience (manager, peers, clients)
        Source,     // Source context (mail, documentation, chat, etc.)
        More        // Additional options (extract, translate, etc.)
    }

    ///// <summary>
    ///// Categories of quick actions
    ///// </summary>
    //public enum QuickActionCategory
    //{
    //    Fix,        // Basic improvements (grammar, spelling)
    //    Style,      // Tone/voice changes
    //    Transform,  // Fundamental changes (summarize, expand)
    //    Extract,    // Pull specific elements (key points, action items)
    //    Analyze,    // Provide insights about the text
    //    Contextualize // Adapt for audience/purpose
    //}
}