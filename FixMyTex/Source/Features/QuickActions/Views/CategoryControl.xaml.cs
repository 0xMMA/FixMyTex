using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace FixMyTex.Features.QuickActions.Views
{
    public partial class CategoryControl : UserControl
    {
        public static readonly DependencyProperty TitleProperty =
            DependencyProperty.Register("Title", typeof(string), typeof(CategoryControl), 
                new PropertyMetadata(string.Empty));
                
        public static readonly DependencyProperty ColorProperty =
            DependencyProperty.Register("Color", typeof(string), typeof(CategoryControl), 
                new PropertyMetadata("#757575"));
                
        public static readonly DependencyProperty QuickActionsProperty =
            DependencyProperty.Register("QuickActions", typeof(ObservableCollection<object>), typeof(CategoryControl), 
                new PropertyMetadata(null));
                
        public static readonly DependencyProperty AdditionalOptionsProperty =
            DependencyProperty.Register("AdditionalOptions", typeof(ObservableCollection<string>), typeof(CategoryControl), 
                new PropertyMetadata(null));
                
        public static readonly DependencyProperty SelectQuickActionCommandProperty =
            DependencyProperty.Register("SelectQuickActionCommand", typeof(ICommand), typeof(CategoryControl), 
                new PropertyMetadata(null));
        
        public CategoryControl()
        {
            InitializeComponent();
            // Important: don't set DataContext = this here as it will override any binding from parent
            
            // Create default collections if needed
            if (AdditionalOptions == null)
                AdditionalOptions = new ObservableCollection<string>();
            
            if (QuickActions == null)
                QuickActions = new ObservableCollection<object>();
            
            // Add loaded event to debug data bindings
            this.Loaded += (s, e) => 
            {
                System.Diagnostics.Debug.WriteLine($"CategoryControl loaded: Title={Title}, Color={Color}, QuickActions={QuickActions?.Count ?? 0}, AdditionalOptions={AdditionalOptions?.Count ?? 0}");
            };
        }
        
        public string Title
        {
            get => (string)GetValue(TitleProperty);
            set => SetValue(TitleProperty, value);
        }
        
        public string Color
        {
            get => (string)GetValue(ColorProperty);
            set => SetValue(ColorProperty, value);
        }
        
        public ObservableCollection<object> QuickActions
        {
            get => (ObservableCollection<object>)GetValue(QuickActionsProperty);
            set => SetValue(QuickActionsProperty, value);
        }
        
        public ObservableCollection<string> AdditionalOptions
        {
            get => (ObservableCollection<string>)GetValue(AdditionalOptionsProperty);
            set => SetValue(AdditionalOptionsProperty, value);
        }
        
        public ICommand SelectQuickActionCommand
        {
            get => (ICommand)GetValue(SelectQuickActionCommandProperty);
            set => SetValue(SelectQuickActionCommandProperty, value);
        }
    }
}