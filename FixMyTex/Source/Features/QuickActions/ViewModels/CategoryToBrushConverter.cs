using System;
using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;
using FixMyTex.Features.QuickActions.Models;

namespace FixMyTex.Features.QuickActions.ViewModels
{
    public class CategoryToBrushConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is QuickActionCategory category)
            {
                return category switch
                {
                    QuickActionCategory.Fix => new SolidColorBrush(
                        (Color)ColorConverter.ConvertFromString("#2196F3")),
                    QuickActionCategory.Style => new SolidColorBrush(
                        (Color)ColorConverter.ConvertFromString("#4CAF50")),
                    QuickActionCategory.Transform => new SolidColorBrush(
                        (Color)ColorConverter.ConvertFromString("#FF9800")),
                    QuickActionCategory.Audience => new SolidColorBrush(
                        (Color)ColorConverter.ConvertFromString("#9C27B0")),
                    QuickActionCategory.Source => new SolidColorBrush(
                        (Color)ColorConverter.ConvertFromString("#795548")),
                    QuickActionCategory.More => new SolidColorBrush(
                        (Color)ColorConverter.ConvertFromString("#607D8B")),
                    _ => new SolidColorBrush(
                        (Color)ColorConverter.ConvertFromString("#757575"))
                };
            }
            
            return new SolidColorBrush(
                (Color)ColorConverter.ConvertFromString("#757575"));
        }
        
        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }
    }
}