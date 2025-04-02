using System.Collections.Generic;
using System.Threading.Tasks;
using FixMyTex.Features.QuickActions.Models;

namespace FixMyTex.Features.QuickActions.Services
{
    /// <summary>
    /// Service for managing quick actions
    /// </summary>
    public interface IQuickActionService
    {
        /// <summary>
        /// Gets all available quick actions
        /// </summary>
        Task<IEnumerable<QuickAction>> GetQuickActionsAsync();
        
        /// <summary>
        /// Gets quick actions by category
        /// </summary>
        Task<IEnumerable<QuickAction>> GetQuickActionsByCategoryAsync(QuickActionCategory category);
        
        /// <summary>
        /// Saves a quick action configuration
        /// </summary>
        Task SaveQuickActionAsync(QuickAction quickAction);
        
        /// <summary>
        /// Saves a preset of quick actions
        /// </summary>
        Task SavePresetAsync(string presetName, IEnumerable<QuickAction> quickActions);
        
        /// <summary>
        /// Gets all available presets
        /// </summary>
        Task<IEnumerable<string>> GetPresetsAsync();
        
        /// <summary>
        /// Loads a preset by name
        /// </summary>
        Task<IEnumerable<QuickAction>> LoadPresetAsync(string presetName);
    }
}