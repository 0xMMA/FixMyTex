using System.Diagnostics;
using System.Windows.Controls;
using System.Windows.Navigation;

namespace FixMyTex.Features.Common.Views
{
    /// <summary>
    /// Interaction logic for AboutView.xaml
    /// </summary>
    public partial class AboutView : UserControl
    {
        public AboutView()
        {
            InitializeComponent();
        }
        
        private void Hyperlink_OnRequestNavigate(object sender, RequestNavigateEventArgs e)
        {
            var psi = new ProcessStartInfo
            {
                FileName = e.Uri.AbsoluteUri,
                UseShellExecute = true
            };

            Process.Start(psi);
            e.Handled = true;
        }
    }
}