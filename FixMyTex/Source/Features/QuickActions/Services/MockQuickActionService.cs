using System.Collections.Generic;
using System.Threading.Tasks;
using FixMyTex.Features.QuickActions.Models;

namespace FixMyTex.Features.QuickActions.Services
{
    /// <summary>
    /// Mock implementation of IQuickActionService for testing and initial development
    /// </summary>
    public class MockQuickActionService : IQuickActionService
    {
        private readonly Dictionary<string, List<QuickAction>> _presets = new();
        
        // Cache for quick actions
        private readonly List<QuickAction> _cachedActions;
        
        public MockQuickActionService()
        {
            // Initialize the cache
            _cachedActions = new List<QuickAction>
            {
                // Fix category
                new QuickAction { Id = "fix_grammar", Name = "Grammar", ShortcutNumber = 1, Category = QuickActionCategory.Fix, Prompt = "Fix grammar errors in the text" },
                new QuickAction { Id = "fix_spelling", Name = "Spelling", ShortcutNumber = 2, Category = QuickActionCategory.Fix, Prompt = "Fix spelling errors in the text" },
                new QuickAction { Id = "fix_punctuation", Name = "Punct.", ShortcutNumber = 3, Category = QuickActionCategory.Fix, Prompt = "Fix punctuation errors in the text" },
                
                // Style category
                new QuickAction { Id = "style_formal", Name = "Formal", ShortcutNumber = 1, Category = QuickActionCategory.Style, Prompt = "Make the text more formal" },
                new QuickAction { Id = "style_informal", Name = "Informal", ShortcutNumber = 2, Category = QuickActionCategory.Style, Prompt = "Make the text more conversational and informal" },
                new QuickAction { Id = "style_academic", Name = "Academic", ShortcutNumber = 3, Category = QuickActionCategory.Style, Prompt = "Make the text sound more academic" },
                
                // Transform category
                new QuickAction { Id = "transform_simplify", Name = "Simplify", ShortcutNumber = 1, Category = QuickActionCategory.Transform, Prompt = "Simplify the text to make it more concise" },
                new QuickAction { Id = "transform_expand", Name = "Expand", ShortcutNumber = 2, Category = QuickActionCategory.Transform, Prompt = "Expand the text with more details" },
                new QuickAction { Id = "transform_summarize", Name = "Summarize", ShortcutNumber = 3, Category = QuickActionCategory.Transform, Prompt = "Summarize the text into key points" },
                
                // Audience category
                new QuickAction { Id = "audience_manager", Name = "Manager", ShortcutNumber = 1, Category = QuickActionCategory.Audience, Prompt = "Format for a manager audience" },
                new QuickAction { Id = "audience_peers", Name = "Peers", ShortcutNumber = 2, Category = QuickActionCategory.Audience, Prompt = "Format for peers/colleagues" },
                new QuickAction { Id = "audience_clients", Name = "Clients", ShortcutNumber = 3, Category = QuickActionCategory.Audience, Prompt = "Format for clients/customers" },
                
                // Source category (as requested)
                new QuickAction { Id = "source_email", Name = "Email", ShortcutNumber = 1, Category = QuickActionCategory.Source, Prompt = "Format for email" },
                new QuickAction { Id = "source_documentation", Name = "Docs", ShortcutNumber = 2, Category = QuickActionCategory.Source, Prompt = "Format for documentation" },
                new QuickAction { Id = "source_chat", Name = "Chat", ShortcutNumber = 3, Category = QuickActionCategory.Source, Prompt = "Format for chat/messaging" },
                
                // More options
                new QuickAction { Id = "more_extract", Name = "Extract", ShortcutNumber = 1, Category = QuickActionCategory.More, Prompt = "Extract key information from the text" },
                new QuickAction { Id = "more_translate", Name = "Translate", ShortcutNumber = 2, Category = QuickActionCategory.More, Prompt = "Translate the text to another language" }
            };
        }
        
        public Task<IEnumerable<QuickAction>> GetQuickActionsAsync()
        {
            // Return a copy of the cached actions to avoid modification
            return Task.FromResult<IEnumerable<QuickAction>>(_cachedActions.ToList());
        }

        public async Task<IEnumerable<QuickAction>> GetQuickActionsByCategoryAsync(QuickActionCategory category)
        {
            var allActions = await GetQuickActionsAsync();
            return System.Linq.Enumerable.Where(allActions, a => a.Category == category);
        }

        public Task SaveQuickActionAsync(QuickAction quickAction)
        {
            // Mock implementation - doesn't actually save anything
            return Task.CompletedTask;
        }

        public Task SavePresetAsync(string presetName, IEnumerable<QuickAction> quickActions)
        {
            // Mock implementation stores in memory
            _presets[presetName] = new List<QuickAction>(quickActions);
            return Task.CompletedTask;
        }

        public Task<IEnumerable<string>> GetPresetsAsync()
        {
            return Task.FromResult<IEnumerable<string>>(_presets.Keys);
        }

        public Task<IEnumerable<QuickAction>> LoadPresetAsync(string presetName)
        {
            if (_presets.TryGetValue(presetName, out var actions))
            {
                return Task.FromResult<IEnumerable<QuickAction>>(actions);
            }
            
            return Task.FromResult<IEnumerable<QuickAction>>(new List<QuickAction>());
        }
    }
}