using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using FixMyTex.Features.QuickActions.Models;
using FixMyTex.Features.QuickActions.Services;

namespace FixMyTex.Features.QuickActions.ViewModels
{
    public class QuickActionsViewModel : INotifyPropertyChanged
    {
        private readonly IQuickActionService _quickActionService;
        private readonly ITextEnhancementService _textEnhancementService;
        
        private string _originalText = string.Empty;
        private string _enhancedText = string.Empty;
        private QuickActionCategory _selectedCategory = QuickActionCategory.Fix;
        private bool _isEnhancing = false;
        private ObservableCollection<QuickAction> _activeQuickActions = new();

        public QuickActionsViewModel()
        {
            // only for designer!
        }
        public QuickActionsViewModel(
            IQuickActionService quickActionService,
            ITextEnhancementService textEnhancementService)
        {
            _quickActionService = quickActionService;
            _textEnhancementService = textEnhancementService;
            
            // Initialize commands
            SelectCategoryCommand = new RelayCommand<QuickActionCategory>(SelectCategory);
            SelectQuickActionCommand = new RelayCommand<QuickAction>(SelectQuickAction);
            ApplyEnhancementsCommand = new RelayCommand(async () => await ApplyEnhancements(), () => !IsEnhancing);
            CancelCommand = new RelayCommand(Cancel);
            SavePresetCommand = new RelayCommand(async () => await SavePreset(), () => ActiveQuickActions.Any());
            
            // Initialize categories
            Categories = [];
            
            // Start initialization - don't ConfigureAwait(false) since we need to update UI
            _ = InitializeCategoriesAsync();
        }
        
        public ObservableCollection<CategoryViewModel> Categories { get; }
        
        public ObservableCollection<QuickAction> ActiveQuickActions
        {
            get => _activeQuickActions;
            set
            {
                _activeQuickActions = value;
                OnPropertyChanged();
                UpdateEnhancedText();
            }
        }
        
        public string OriginalText
        {
            get => _originalText;
            set
            {
                _originalText = value;
                OnPropertyChanged();
                UpdateEnhancedText();
            }
        }
        
        public string EnhancedText
        {
            get => _enhancedText;
            set
            {
                _enhancedText = value;
                OnPropertyChanged();
            }
        }
        
        public QuickActionCategory SelectedCategory
        {
            get => _selectedCategory;
            set
            {
                _selectedCategory = value;
                OnPropertyChanged();
            }
        }
        
        public bool IsEnhancing
        {
            get => _isEnhancing;
            set
            {
                _isEnhancing = value;
                OnPropertyChanged();
                CommandManager.InvalidateRequerySuggested();
            }
        }
        
        // Commands
        public ICommand SelectCategoryCommand { get; }
        public ICommand SelectQuickActionCommand { get; }
        public ICommand ApplyEnhancementsCommand { get; }
        public ICommand CancelCommand { get; }
        public ICommand SavePresetCommand { get; }
        
        private async Task InitializeCategoriesAsync()
        {
            try
            {
                // First fetch all quick actions
                var allActions = await _quickActionService.GetQuickActionsAsync();
                
                // Dispatch to UI thread for UI updates
                await System.Windows.Application.Current.Dispatcher.InvokeAsync(() =>
                {
                    // Clear and recreate categories
                    Categories.Clear();

                    // Add a view model for each category enum value
                    foreach (QuickActionCategory category in Enum.GetValues(typeof(QuickActionCategory)))
                    {
                        var categoryVm = new CategoryViewModel(category);
                        
                        // Filter actions for this category
                        foreach (var action in allActions.Where(a => a.Category == category))
                        {
                            categoryVm.QuickActions.Add(action);
                        }
                        
                        // Setup some additional options based on category
                        switch (category)
                        {
                            case QuickActionCategory.Fix:
                                categoryVm.AdditionalOptions.Add("Technical Terms");
                                break;
                            case QuickActionCategory.Style:
                                categoryVm.AdditionalOptions.Add("Concise");
                                break;
                            case QuickActionCategory.Transform:
                                categoryVm.AdditionalOptions.Add("Bullet Points");
                                break;
                            case QuickActionCategory.Audience:
                                categoryVm.AdditionalOptions.Add("Technical Level");
                                break;
                        }
                        
                        Categories.Add(categoryVm);
                    }
                    
                    // Trigger property changed to update UI
                    OnPropertyChanged(nameof(Categories));
                });
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error initializing categories: {ex.Message}");
                // Show error in UI or log
            }
        }
        
        private void SelectCategory(QuickActionCategory category)
        {
            SelectedCategory = category;
        }
        
        private void SelectQuickAction(QuickAction quickAction)
        {
            // Check if the action is already selected
            var existing = ActiveQuickActions.FirstOrDefault(a => a.Id == quickAction.Id);
            
            if (existing != null)
            {
                // Remove the action if it's already active
                ActiveQuickActions.Remove(existing);
            }
            else
            {
                // Add the action if it's not active
                ActiveQuickActions.Add(quickAction);
            }
            
            // Update the enhanced text preview
            UpdateEnhancedText();
        }
        
        private async Task ApplyEnhancements()
        {
            if (string.IsNullOrWhiteSpace(OriginalText) || !ActiveQuickActions.Any())
                return;
                
            IsEnhancing = true;
            
            try
            {
                await _textEnhancementService.ApplyEnhancedTextAsync(EnhancedText);
                
                // Close the window after applying
                CloseRequested?.Invoke(this, EventArgs.Empty);
            }
            catch (Exception ex)
            {
                // Handle error
                System.Diagnostics.Debug.WriteLine($"Error applying enhancements: {ex.Message}");
            }
            finally
            {
                IsEnhancing = false;
            }
        }
        
        private void Cancel()
        {
            if (IsEnhancing)
            {
                _textEnhancementService.CancelEnhancement();
                IsEnhancing = false;
            }
            
            // Close the window
            CloseRequested?.Invoke(this, EventArgs.Empty);
        }
        
        private async Task SavePreset()
        {
            if (!ActiveQuickActions.Any())
                return;
                
            // TODO: Show dialog to get preset name
            string presetName = "Quick Actions Preset"; // Placeholder
            
            await _quickActionService.SavePresetAsync(presetName, ActiveQuickActions);
        }
        
        private async void UpdateEnhancedText()
        {
            if (string.IsNullOrWhiteSpace(OriginalText) || !ActiveQuickActions.Any())
            {
                EnhancedText = OriginalText;
                return;
            }
            
            IsEnhancing = true;
            
            try
            {
                // Get a preview with highlighted differences
                EnhancedText = await _textEnhancementService.PreviewEnhancementsAsync(
                    OriginalText, ActiveQuickActions);
            }
            catch (Exception ex)
            {
                // Handle error
                System.Diagnostics.Debug.WriteLine($"Error updating preview: {ex.Message}");
                EnhancedText = OriginalText;
            }
            finally
            {
                IsEnhancing = false;
            }
        }
        
        // Event for requesting window close
        public event EventHandler CloseRequested;
        
        // INotifyPropertyChanged implementation
        public event PropertyChangedEventHandler PropertyChanged;
        
        protected virtual void OnPropertyChanged([CallerMemberName] string propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
    
    // Simple relay command implementation
    public class RelayCommand : ICommand
    {
        private readonly Action _execute;
        private readonly Func<bool> _canExecute;
        
        public RelayCommand(Action execute, Func<bool> canExecute = null)
        {
            _execute = execute ?? throw new ArgumentNullException(nameof(execute));
            _canExecute = canExecute;
        }
        
        public bool CanExecute(object parameter) => _canExecute?.Invoke() ?? true;
        
        public void Execute(object parameter) => _execute();
        
        public event EventHandler CanExecuteChanged
        {
            add => CommandManager.RequerySuggested += value;
            remove => CommandManager.RequerySuggested -= value;
        }
    }
    
    public class RelayCommand<T> : ICommand
    {
        private readonly Action<T> _execute;
        private readonly Func<T, bool> _canExecute;
        
        public RelayCommand(Action<T> execute, Func<T, bool> canExecute = null)
        {
            _execute = execute ?? throw new ArgumentNullException(nameof(execute));
            _canExecute = canExecute;
        }
        
        public bool CanExecute(object parameter) =>
            parameter is T typedParameter && (_canExecute?.Invoke(typedParameter) ?? true);
        
        public void Execute(object parameter)
        {
            if (parameter is T typedParameter)
            {
                _execute(typedParameter);
            }
        }
        
        public event EventHandler CanExecuteChanged
        {
            add => CommandManager.RequerySuggested += value;
            remove => CommandManager.RequerySuggested -= value;
        }
    }
}