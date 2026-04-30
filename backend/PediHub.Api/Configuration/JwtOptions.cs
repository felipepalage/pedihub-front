namespace PediHub.Api.Configuration;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "PEDIHUB";
    public string Audience { get; set; } = "PEDIHUB.Frontend";
    public string Key { get; set; } = "troque-esta-chave-em-desenvolvimento-por-uma-string-longa-e-segura";
    public int ExpiresInHours { get; set; } = 12;
}
