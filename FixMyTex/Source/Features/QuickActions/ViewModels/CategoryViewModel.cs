using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using FixMyTex.Features.QuickActions.Models;

namespace FixMyTex.Features.QuickActions.ViewModels
{
    public class CategoryViewModel : INotifyPropertyChanged
    {
        private string _title;
        private string _color;

        public CategoryViewModel()
        {
            //DESIGNER ONLY
        }
        public CategoryViewModel(QuickActionCategory category)
        {
            Category = category;
            QuickActions = [];
            AdditionalOptions = [];
            
            // Set title and color based on category
            SetDisplayProperties(category);
        }
        
        public QuickActionCategory Category { get; }
        
        public ObservableCollection<QuickAction> QuickActions { get; }
        
        public ObservableCollection<string> AdditionalOptions { get; }
        
        public string Title
        {
            get => _title;
            set
            {
                _title = value;
                OnPropertyChanged();
            }
        }
        
        public string Color
        {
            get => _color;
            set
            {
                _color = value;
                OnPropertyChanged();
            }
        }
        
        private void SetDisplayProperties(QuickActionCategory category)
        {
            // Set title and color based on category
            switch (category)
            {
                case QuickActionCategory.Fix:
                    Title = "Fix";
                    Color = "#2196F3"; // Blue
                    break;
                    
                case QuickActionCategory.Style:
                    Title = "Style";
                    Color = "#4CAF50"; // Green
                    break;
                    
                case QuickActionCategory.Transform:
                    Title = "Transform";
                    Color = "#FF9800"; // Orange
                    break;
                    
                case QuickActionCategory.Audience:
                    Title = "Audience";
                    Color = "#9C27B0"; // Purple
                    break;
                
                case QuickActionCategory.Source:
                    Title = "Source";
                    Color = "#795548"; // Brown
                    break;
                    
                case QuickActionCategory.More:
                    Title = "More";
                    Color = "#607D8B"; // Gray
                    break;
                    
                default:
                    Title = category.ToString();
                    Color = "#757575"; // Default gray
                    break;
            }
        }
        
        // INotifyPropertyChanged implementation
        public event PropertyChangedEventHandler PropertyChanged;
        
        protected virtual void OnPropertyChanged([CallerMemberName] string propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}