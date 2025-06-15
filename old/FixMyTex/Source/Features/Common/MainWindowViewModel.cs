using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace FixMyTex.Features.Common
{
    /// <summary>
    /// View model for the main window
    /// </summary>
    public class MainWindowViewModel : INotifyPropertyChanged
    {
        private object? _currentView;

        /// <summary>
        /// The currently displayed view
        /// </summary>
        public object? CurrentView
        {
            get => _currentView;
            set
            {
                _currentView = value;
                OnPropertyChanged();
            }
        }

        public event PropertyChangedEventHandler? PropertyChanged;

        protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
