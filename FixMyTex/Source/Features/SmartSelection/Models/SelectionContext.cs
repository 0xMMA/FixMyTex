namespace FixMyTex.Features.SmartSelection.Models
{
    /// <summary>
    /// Represents a context source for smart selection
    /// </summary>
    public abstract class ContextSource
    {
        /// <summary>
        /// Unique identifier for the context source
        /// </summary>
        public required string Id { get; set; }
        
        /// <summary>
        /// Type of content in this context source
        /// </summary>
        public ContextType Type { get; set; }
        
        /// <summary>
        /// Priority of this context source when multiple are available
        /// </summary>
        public int Priority { get; set; }
        
        /// <summary>
        /// Gets the content from this context source
        /// </summary>
        public abstract Task<string> GetContentAsync();
    }
    
    /// <summary>
    /// Simple text selection context source
    /// </summary>
    public class TextSelectionContext : ContextSource
    {
        private readonly string _text;
        
        public TextSelectionContext(string text)
        {
            Id = Guid.NewGuid().ToString();
            Type = ContextType.Text;
            Priority = 100;
            _text = text;
        }
        
        public override Task<string> GetContentAsync()
        {
            return Task.FromResult(_text);
        }
    }
    
    /// <summary>
    /// Screenshot-based context source
    /// </summary>
    public class ScreenshotContext : ContextSource
    {
        private readonly byte[] _imageData;
        
        public ScreenshotContext(byte[] imageData)
        {
            Id = Guid.NewGuid().ToString();
            Type = ContextType.Image;
            Priority = 50;
            _imageData = imageData;
        }
        
        public override async Task<string> GetContentAsync()
        {
            // In a real implementation, this would use OCR to extract text
            // For now, just return a placeholder
            return await Task.FromResult("[Image content - OCR to be implemented]");
        }
    }
    
    /// <summary>
    /// Types of context content
    /// </summary>
    public enum ContextType
    {
        Text,
        Image,
        Html,
        Code
    }
    
    /// <summary>
    /// Manages multiple context sources and combines them
    /// </summary>
    public class ContextManager
    {
        private readonly List<ContextSource> _contextSources = new();
        
        /// <summary>
        /// Adds a context source to the manager
        /// </summary>
        public void AddContext(ContextSource context)
        {
            _contextSources.Add(context);
        }
        
        /// <summary>
        /// Removes a context source by ID
        /// </summary>
        public bool RemoveContext(string id)
        {
            var context = _contextSources.FirstOrDefault(c => c.Id == id);
            if (context != null)
            {
                return _contextSources.Remove(context);
            }
            return false;
        }
        
        /// <summary>
        /// Gets all context sources
        /// </summary>
        public IEnumerable<ContextSource> GetAllSources()
        {
            return _contextSources;
        }
        
        /// <summary>
        /// Assembles all context sources into a single context string
        /// </summary>
        public async Task<string> AssembleContextAsync()
        {
            if (!_contextSources.Any())
            {
                return string.Empty;
            }
            
            // Order by priority (higher numbers come first)
            var orderedSources = _contextSources.OrderByDescending(c => c.Priority).ToList();
            
            // Combine context from all sources
            var contextBuilder = new System.Text.StringBuilder();
            
            foreach (var source in orderedSources)
            {
                var content = await source.GetContentAsync();
                if (!string.IsNullOrWhiteSpace(content))
                {
                    contextBuilder.AppendLine($"--- {source.Type} Context ---");
                    contextBuilder.AppendLine(content);
                    contextBuilder.AppendLine();
                }
            }
            
            return contextBuilder.ToString().Trim();
        }
    }
}