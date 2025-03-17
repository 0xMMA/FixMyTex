# Prompt Block System - Implementation Strategy

## Overview
The Prompt Block System is a modular architecture for constructing AI prompts from reusable, configurable components. This document outlines the design and implementation strategy based on analysis of existing prompts.

## Core Concepts

### Block Types
Based on analysis of our current prompt structure, we've identified these fundamental block types:

| Block Type | Purpose | Example |
|------------|---------|---------|
| **Identity** | Defines AI's role/persona | "You are an advanced grammar and spelling optimizer." |
| **Task** | Defines primary action | "Correct grammatical errors and spelling mistakes..." |
| **Context** | Provides background | "Text is sourced from chat messages, emails..." |
| **Constraint** | Sets boundaries | "Do not alter factual content..." |
| **Format** | Handles output formatting | "[HTML]: Use HTML tags for formatting..." |
| **Rules** | Detailed processing instructions | "1. Correct all grammatical errors..." |
| **Examples** | Demonstrates expected behavior | "Example Input/Output pairs..." |
| **Tone** | Specifies output tone | "Use a formal, professional tone..." |
| **Style** | Defines writing style | "Write concisely, avoiding redundancy..." |
| **Domain** | Domain-specific instructions | "This is technical content about..." |
| **Length** | Controls output length | "Keep response approximately the same length..." |
| **Translation** | Handles language conversion | "Translate to Spanish while maintaining..." |
| **Special** | Custom one-off instructions | "Highlight key action items..." |

### Block Architecture

Each block should be:
- **Self-contained**: Functions independently with minimal dependencies
- **Configurable**: Customizable through parameters
- **Composable**: Works well with other blocks
- **Testable**: Can be validated in isolation

## Simplified Technical Implementation

### 1. Block Interface

```csharp
public interface IPromptBlock
{
    // Core properties
    string Id { get; }
    string Name { get; }
    string Description { get; }
    
    // Ordering
    int OrderPriority { get; }
    
    // Content generation
    string GenerateContent(IDictionary<string, object> parameters);
}
```

### 2. Base Implementation

```csharp
public abstract class PromptBlockBase : IPromptBlock
{
    public string Id { get; protected set; }
    public string Name { get; protected set; }
    public string Description { get; protected set; }
    
    // Default priority - higher numbers come later in the prompt
    public virtual int OrderPriority => 100;
    
    // Template method for content generation
    public string GenerateContent(IDictionary<string, object> parameters)
    {
        // Simple parameter null check
        var validParams = parameters ?? new Dictionary<string, object>();
        return GenerateContentInternal(validParams);
    }
    
    // Abstract method to be implemented by derived classes
    protected abstract string GenerateContentInternal(IDictionary<string, object> parameters);
}
```

### 3. Block Registry

```csharp
public class PromptBlockRegistry
{
    private readonly Dictionary<string, IPromptBlock> _blockRegistry = new();
    
    // Register a block
    public void RegisterBlock(IPromptBlock block)
    {
        if (_blockRegistry.ContainsKey(block.Id))
        {
            throw new ArgumentException($"Block with ID {block.Id} already registered");
        }
        
        _blockRegistry[block.Id] = block;
    }
    
    // Get a block by ID
    public IPromptBlock GetBlock(string id)
    {
        if (!_blockRegistry.TryGetValue(id, out var block))
        {
            throw new KeyNotFoundException($"Block with ID {id} not found");
        }
        
        return block;
    }
    
    // Get all blocks of a specific category
    public IEnumerable<IPromptBlock> GetBlocksByCategory(string category)
    {
        // Implementation depends on how we categorize blocks
        // Could use a simple tag-based approach
        return _blockRegistry.Values.Where(b => 
            b.Metadata?.TryGetValue("category", out var cat) == true && 
            cat.ToString() == category);
    }
}
```

### 4. Prompt Assembly Engine

```csharp
public class PromptAssemblyEngine
{
    private readonly PromptBlockRegistry _registry;
    
    public PromptAssemblyEngine(PromptBlockRegistry registry)
    {
        _registry = registry;
    }
    
    // Assemble a prompt from a collection of block IDs and parameters
    public string AssemblePrompt(
        IEnumerable<string> blockIds, 
        IDictionary<string, IDictionary<string, object>> blockParameters)
    {
        // Get blocks from registry
        var blocks = blockIds
            .Select(id => _registry.GetBlock(id))
            .ToList();
        
        // Sort blocks by priority
        var orderedBlocks = blocks
            .OrderBy(b => b.OrderPriority)
            .ToList();
        
        // Generate and combine content
        var promptBuilder = new StringBuilder();
        
        foreach (var block in orderedBlocks)
        {
            var parameters = blockParameters.TryGetValue(block.Id, out var p) 
                ? p 
                : new Dictionary<string, object>();
                
            promptBuilder.AppendLine(block.GenerateContent(parameters));
            promptBuilder.AppendLine();
        }
        
        return promptBuilder.ToString().Trim();
    }
}
```

### 5. Prompt Profile (Templates)

```csharp
public class PromptProfile
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    
    // Blocks to include in this profile
    public List<string> BlockIds { get; set; } = new();
    
    // Parameters for each block
    public Dictionary<string, Dictionary<string, object>> BlockParameters { get; set; } = new();
    
    // Metadata (category, tags, etc.)
    public Dictionary<string, object> Metadata { get; set; } = new();
}
```

## Example Block Implementations

### Identity Block

```csharp
public class IdentityBlock : PromptBlockBase
{
    public IdentityBlock()
    {
        Id = "identity";
        Name = "AI Identity";
        Description = "Defines the AI's role and persona";
    }
    
    public override int OrderPriority => 10; // Should appear near the beginning
    
    protected override string GenerateContentInternal(IDictionary<string, object> parameters)
    {
        string role = parameters.TryGetValue("role", out var r) ? r.ToString() : "an AI assistant";
        string expertise = parameters.TryGetValue("expertise", out var e) ? e.ToString() : "";
        
        if (!string.IsNullOrEmpty(expertise))
        {
            return $"You are {role} specialized in {expertise}.";
        }
        
        return $"You are {role}.";
    }
}
```

### Format Block

```csharp
public class FormatBlock : PromptBlockBase
{
    public FormatBlock()
    {
        Id = "format";
        Name = "Output Format";
        Description = "Specifies the output formatting rules";
    }
    
    public override int OrderPriority => 40;
    
    protected override string GenerateContentInternal(IDictionary<string, object> parameters)
    {
        bool includeHtml = parameters.TryGetValue("includeHtml", out var h) && (bool)h;
        bool includeMarkdown = parameters.TryGetValue("includeMarkdown", out var m) && (bool)m;
        bool includePlain = parameters.TryGetValue("includePlain", out var p) && (bool)p;
        
        var sb = new StringBuilder();
        sb.AppendLine("The user will specify the formatting style at the beginning of the message with one of these tags:");
        sb.AppendLine();
        
        if (includeHtml)
        {
            sb.AppendLine("[HTML]: Use HTML tags for formatting (<b>bold</b>, <i>italics</i>, <code>monospace</code>)");
        }
        
        if (includeMarkdown)
        {
            sb.AppendLine("[MARKDOWN]: Use Markdown syntax for formatting (**bold**, _italics_, `monospace`)");
        }
        
        if (includePlain)
        {
            sb.AppendLine("[PLAIN]: Don't use any formatting");
        }
        
        return sb.ToString();
    }
}
```

## Block Ordering Guidelines

To ensure blocks work together correctly, follow these ordering guidelines:

1. **Suggested Block Order**:
   - Identity blocks (who the AI is)
   - Task blocks (what the AI should do)
   - Context blocks (background information)
   - Format blocks (output formatting rules)
   - Constraint blocks (limitations on the task)
   - Rules blocks (specific instructions)
   - Style/Tone blocks (how to communicate)
   - Examples blocks (demonstrations)

2. **Recommended Combinations**:
   - For grammar correction: Identity + Task + Format + Rules + Examples
   - For tone changes: Identity + Task + Tone + Style + Rules
   - For translations: Identity + Task + Translation + Format

## Implementation Strategy

### Phase 1: Core Block Library
1. Implement base interfaces and simplified block base class
2. Create all blocks needed to recreate our existing prompt
3. Build basic assembly engine with ordering support
4. Implement basic profile storage and serialization

### Phase 2: UI Integration
1. Connect blocks to Quick Actions UI
2. Create interface for selecting/configuring blocks
3. Build predefined templates for common actions
4. Implement profile management UI

### Phase 3: Extended Functionality
1. Add more specialized blocks for additional use cases
2. Implement profile sharing capability
3. Create block categorization and filtering
4. Add user customization features

### Phase 4: Optimization (if needed)
1. Add performance improvements based on usage metrics
2. Implement caching for frequently used prompts
3. Add advanced features based on user feedback

## Testing Strategy

1. **Unit Testing**:
   - Test each block type in isolation
   - Verify parameter handling with various inputs
   - Test edge cases for each block type

2. **Integration Testing**:
   - Test combinations of blocks
   - Verify prompt assembly with different ordering
   - Test with sample profiles

3. **End-to-End Testing**:
   - Test complete profiles with AI services
   - Verify correct output formatting
   - Test UI interaction with the block system

## Current Prompt Analysis

Our existing prompt can be broken down into these blocks:

1. **Identity Block**: "You are an advanced grammar and spelling optimizer."

2. **Task Block**: "Your task is to correct grammatical errors and spelling mistakes in the provided text while preserving its meaning and intent."

3. **Context Block**: "The text is sourced from chat messages, emails, or other inter-human communications."

4. **Constraint Block**: "Do not alter factual content or change the structure unless necessary for clarity. Your goal is to enhance readability and linguistic accuracy without losing the message's voice."

5. **Format Block**: Specifies HTML, Markdown, and Plain formatting options.

6. **Rules Block**: The numbered rules 1-8 providing specific instructions.

7. **Examples Block**: The three example input/output pairs.

This analysis will serve as the foundation for our initial block implementations to ensure we can recreate the current functionality in the new system.