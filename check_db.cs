using System;
using Microsoft.EntityFrameworkCore;
using PediHub.Api.Data;
using PediHub.Api.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

var config = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json")
    .AddJsonFile("appsettings.Local.json", optional: true)
    .Build();

var optionsBuilder = new DbContextOptionsBuilder<PediHubDbContext>();
optionsBuilder.UseSqlServer(config.GetConnectionString("DefaultConnection"));

using var db = new PediHubDbContext(optionsBuilder.Options);
var merchants = db.Merchants.ToList();
foreach (var m in merchants) {
    Console.WriteLine($"Merchant: {m.CompanyName}, Slug: '{m.Slug}'");
}
