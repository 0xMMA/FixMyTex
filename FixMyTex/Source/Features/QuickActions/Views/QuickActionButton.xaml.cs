using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace FixMyTex.Features.QuickActions.Views
{
    public partial class QuickActionButton : UserControl
    {
        public static readonly DependencyProperty NumberProperty =
            DependencyProperty.Register("Number", typeof(int), typeof(QuickActionButton), 
                new PropertyMetadata(0));
                
        public static readonly DependencyProperty TextProperty =
            DependencyProperty.Register("Text", typeof(string), typeof(QuickActionButton), 
                new PropertyMetadata(string.Empty));
                
        public static readonly DependencyProperty NumberBackgroundProperty =
            DependencyProperty.Register("NumberBackground", typeof(Brush), typeof(QuickActionButton), 
                new PropertyMetadata(Brushes.Gray));
                
        public static readonly DependencyProperty CommandProperty =
            DependencyProperty.Register("Command", typeof(System.Windows.Input.ICommand), typeof(QuickActionButton), 
                new PropertyMetadata(null));
                
        public static readonly DependencyProperty CommandParameterProperty =
            DependencyProperty.Register("CommandParameter", typeof(object), typeof(QuickActionButton), 
                new PropertyMetadata(null));
                
        public static readonly DependencyProperty IsSelectedProperty =
            DependencyProperty.Register("IsSelected", typeof(bool), typeof(QuickActionButton), 
                new PropertyMetadata(false, OnIsSelectedChanged));
        
        public QuickActionButton()
        {
            InitializeComponent();
        }
        
        public int Number
        {
            get => (int)GetValue(NumberProperty);
            set => SetValue(NumberProperty, value);
        }
        
        public string Text
        {
            get => (string)GetValue(TextProperty);
            set => SetValue(TextProperty, value);
        }
        
        public Brush NumberBackground
        {
            get => (Brush)GetValue(NumberBackgroundProperty);
            set => SetValue(NumberBackgroundProperty, value);
        }
        
        public System.Windows.Input.ICommand Command
        {
            get => (System.Windows.Input.ICommand)GetValue(CommandProperty);
            set => SetValue(CommandProperty, value);
        }
        
        public object CommandParameter
        {
            get => GetValue(CommandParameterProperty);
            set => SetValue(CommandParameterProperty, value);
        }
        
        public bool IsSelected
        {
            get => (bool)GetValue(IsSelectedProperty);
            set => SetValue(IsSelectedProperty, value);
        }
        
        private static void OnIsSelectedChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (d is QuickActionButton button)
            {
                button.UpdateSelectedState((bool)e.NewValue);
            }
        }
        
        private void UpdateSelectedState(bool isSelected)
        {
            // Apply visual changes when selected/deselected
            if (isSelected)
            {

                MainButton.BorderBrush = NumberBackground;
                MainButton.BorderThickness = new Thickness(2);
                MainButton.Background = new SolidColorBrush(Color.FromArgb(50, 0, 0, 0));
            }
            else
            {
                MainButton.BorderBrush = null;
                MainButton.BorderThickness = new Thickness(0);
                MainButton.Background = null;
            }
        }
        
        private void OnButtonClick(object sender, RoutedEventArgs e)
        {
            if (Command != null && Command.CanExecute(CommandParameter))
            {
                Command.Execute(CommandParameter);
            }
            
            // Toggle selection state
            IsSelected = !IsSelected;
        }
    }
}