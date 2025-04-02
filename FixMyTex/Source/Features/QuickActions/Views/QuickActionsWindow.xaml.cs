using System;
using System.Windows;
using System.Windows.Input;
using FixMyTex.Features.QuickActions.Services;
using FixMyTex.Features.QuickActions.ViewModels;

namespace FixMyTex.Features.QuickActions.Views
{
    public partial class QuickActionsWindow : Window
    {
        private readonly QuickActionsViewModel _viewModel;
        
        public QuickActionsWindow(
            IQuickActionService quickActionService, 
            ITextEnhancementService textEnhancementService,
            string initialText = "")
        {
            // Initialize the component first
            InitializeComponent();
            
            // Show loading indicator
            var loadingOverlay = new System.Windows.Controls.Border
            {
                Background = new System.Windows.Media.SolidColorBrush(
                    System.Windows.Media.Color.FromArgb(200, 0, 0, 0)),
                Child = new System.Windows.Controls.TextBlock
                {
                    Text = "Loading...",
                    Foreground = System.Windows.Media.Brushes.White,
                    FontSize = 18,
                    HorizontalAlignment = System.Windows.HorizontalAlignment.Center,
                    VerticalAlignment = System.Windows.VerticalAlignment.Center
                },
                Visibility = System.Windows.Visibility.Visible
            };
            
            // Initialize ViewModel
            _viewModel = new QuickActionsViewModel(quickActionService, textEnhancementService)
            {
                OriginalText = initialText
            };
            
            // Subscribe to ViewModel events
            _viewModel.CloseRequested += ViewModel_CloseRequested;
            
            // Set DataContext
            DataContext = _viewModel;
            
            // Add loaded event handler to ensure we have categories
            this.Loaded += async (sender, e) =>
            {
                try
                {
                    // Ensure we have categories loaded
                    if (_viewModel.Categories.Count == 0)
                    {
                        // Wait for categories to load
                        await Task.Delay(500); // Give time for initialization
                    }
                    
                    // If still no categories, try forcing a refresh
                    if (_viewModel.Categories.Count == 0)
                    {
                        System.Diagnostics.Debug.WriteLine("No categories loaded, forcing refresh");
                        // This would trigger a manual refresh if needed
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"Error in window loaded: {ex.Message}");
                }
            };
        }
        
        private void ViewModel_CloseRequested(object sender, EventArgs e)
        {
            Close();
        }
        
        private void Header_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            if (e.ChangedButton == MouseButton.Left)
            {
                DragMove();
            }
        }
        
        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
        
        private void SettingsButton_Click(object sender, RoutedEventArgs e)
        {
            // TODO: Open settings
            MessageBox.Show("Settings dialog will be implemented in a future update.", "Settings", 
                MessageBoxButton.OK, MessageBoxImage.Information);
        }
        
        private void Window_KeyDown(object sender, KeyEventArgs e)
        {
            // Handle keyboard shortcuts
            if (e.Key == Key.Escape)
            {
                _viewModel.CancelCommand.Execute(null);
                e.Handled = true;
            }
            else if (e.Key == Key.Enter)
            {
                _viewModel.ApplyEnhancementsCommand.Execute(null);
                e.Handled = true;
            }
            else if (e.Key >= Key.D1 && e.Key <= Key.D9 || 
                     e.Key >= Key.NumPad1 && e.Key <= Key.NumPad9)
            {
                // TODO: Handle number key shortcuts for category/action selection
                int number = e.Key >= Key.D1 && e.Key <= Key.D9 
                    ? (int)e.Key - (int)Key.D1 + 1 
                    : (int)e.Key - (int)Key.NumPad1 + 1;
                
                // Handle number key based on context
                HandleNumberKeyPress(number);
                e.Handled = true;
            }
        }
        
        private void HandleNumberKeyPress(int number)
        {
            // Category selection (1-based index)
            if (number <= _viewModel.Categories.Count)
            {
                var category = _viewModel.Categories[number - 1];
                _viewModel.SelectCategoryCommand.Execute(category.Category);
            }
        }
    }
}