using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace PediHub.Api.Extensions;

public static class SlugExtensions
{
    public static string GenerateSlug(this string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "loja";

        var slug = RemoveDiacritics(name).ToLowerInvariant();
        // Remove non-alphanumeric except spaces and hyphens
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        // Replace spaces with hyphens and trim
        slug = Regex.Replace(slug, @"\s+", "-").Trim('-');
        
        return string.IsNullOrWhiteSpace(slug) ? "loja" : slug;
    }

    private static string RemoveDiacritics(string text)
    {
        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var stringBuilder = new StringBuilder(capacity: normalizedString.Length);

        for (int i = 0; i < normalizedString.Length; i++)
        {
            char c = normalizedString[i];
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
    }
}
