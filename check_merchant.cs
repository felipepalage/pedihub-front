using System;
using Microsoft.EntityFrameworkCore;
using PediHub.Api.Data;
using PediHub.Api.Models;
using Microsoft.Extensions.Configuration;
using System.Text.Json;

var config = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json")
    .AddJsonFile("appsettings.Local.json", optional: true)
    .Build();

var optionsBuilder = new DbContextOptionsBuilder<PediHubDbContext>();
optionsBuilder.UseSqlServer(config.GetConnectionString("DefaultConnection"));

using var db = new PediHubDbContext(optionsBuilder.Options);
var merchant = db.Merchants.FirstOrDefault(x => x.Slug == "palage-admin");
if (merchant != null) {
    Console.WriteLine(JsonSerializer.Serialize(new {
        merchant.CompanyName,
        merchant.Slug,
        merchant.LogoUrl,
        merchant.BannerUrl
    }));
} else {
    Console.WriteLine("Merchant not found");
}
