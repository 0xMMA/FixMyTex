namespace FixMyTex.Features.TextCorrection.Models
{
    /// <summary>
    /// Interface for prompt blocks that can be assembled into a complete prompt
    /// </summary>
    public interface IPromptBlock
    {
        /// <summary>
        /// Unique identifier for the block
        /// </summary>
        string Id { get; }
        
        /// <summary>
        /// Display name for the block
        /// </summary>
        string Name { get; }
        
        /// <summary>
        /// Description of what the block does
        /// </summary>
        string? Description { get; }
        
        /// <summary>
        /// Priority for ordering the block in the prompt
        /// Higher numbers come later in the prompt
        /// </summary>
        int OrderPriority { get; }
        
        /// <summary>
        /// Generates content for the block based on provided parameters
        /// </summary>
        /// <param name="parameters">Dictionary of parameters for the block</param>
        /// <returns>Generated content string</returns>
        string GenerateContent(IDictionary<string, object> parameters);
    }
    
    /// <summary>
    /// Base implementation for prompt blocks
    /// </summary>
    public abstract class PromptBlockBase : IPromptBlock
    {
        /// <summary>
        /// Unique identifier for the block
        /// </summary>
        public required string Id { get; init; }
        
        /// <summary>
        /// Display name for the block
        /// </summary>
        public required string Name { get; init; }
        
        /// <summary>
        /// Description of what the block does
        /// </summary>
        public string? Description { get; protected set; }
        
        /// <summary>
        /// Default priority - higher numbers come later in the prompt
        /// </summary>
        public virtual int OrderPriority => 100;
        
        /// <summary>
        /// Template method for content generation
        /// </summary>
        public string GenerateContent(IDictionary<string, object> parameters)
        {
            // Simple parameter null check
            var validParams = parameters ?? new Dictionary<string, object>();
            return GenerateContentInternal(validParams);
        }
        
        /// <summary>
        /// Abstract method to be implemented by derived classes
        /// </summary>
        protected abstract string GenerateContentInternal(IDictionary<string, object> parameters);
    }
    
    /// <summary>
    /// Registry for storing available prompt blocks
    /// </summary>
    public class PromptBlockRegistry
    {
        private readonly Dictionary<string, IPromptBlock> _blockRegistry = new();
        
        /// <summary>
        /// Register a block in the registry
        /// </summary>
        public void RegisterBlock(IPromptBlock block)
        {
            if (_blockRegistry.ContainsKey(block.Id))
            {
                throw new ArgumentException($"Block with ID {block.Id} already registered");
            }
            
            _blockRegistry[block.Id] = block;
        }
        
        /// <summary>
        /// Get a block by ID
        /// </summary>
        public IPromptBlock GetBlock(string id)
        {
            if (!_blockRegistry.TryGetValue(id, out var block))
            {
                throw new KeyNotFoundException($"Block with ID {id} not found");
            }
            
            return block;
        }
        
        /// <summary>
        /// Get all registered blocks
        /// </summary>
        public IEnumerable<IPromptBlock> GetAllBlocks()
        {
            return _blockRegistry.Values;
        }
    }
}