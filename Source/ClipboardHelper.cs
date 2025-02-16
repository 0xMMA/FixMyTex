using System.Text;

namespace FixMyTex;

public class ClipboardHelper
{

    public static string ConvertHtmlToClipboardData(string html)
    {
        var    encoding = new UTF8Encoding(false);
        byte[] data     = [];

        byte[] header = encoding.GetBytes(string.Format(HEADER, 0, 1, 2, 3));
        data = data.Concat(header).ToArray();

        int startHtml = data.Length;
        data = data.Concat(encoding.GetBytes(HTML_START)).ToArray();

        int startFragment = data.Length;
        data = data.Concat(encoding.GetBytes(html)).ToArray();

        int endFragment = data.Length;
        data = data.Concat(encoding.GetBytes(HTML_END)).ToArray();

        int endHtml = data.Length;

        byte[] newHeader = encoding.GetBytes(
            string.Format(HEADER, startHtml, endHtml, startFragment, endFragment)
        );

        if (newHeader.Length != startHtml)
        {
            throw new InvalidOperationException(nameof(ConvertHtmlToClipboardData));
        }

        Array.Copy(newHeader, data, startHtml);

        return encoding.GetString(data);
    }

    private const string HEADER =
        """
        Version:0.9
        StartHTML:{0:0000000000}
        EndHTML:{1:0000000000}
        StartFragment:{2:0000000000}
        EndFragment:{3:0000000000}
        """;

    private const string HTML_END =
        """
        <!--EndFragment-->
        </body>
        </html>
        """;

    private const string HTML_START =
        """
        <html>
        <body>
        <!--StartFragment-->
        """;

}

