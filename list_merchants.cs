using System;
using Microsoft.EntityFrameworkCore;
using PediHub.Api.Data;
using PediHub.Api.Models;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using System.IO;
using System.Linq;

var config = new ConfigurationBuilder()
    .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "backend", "PediHub.Api"))
    .AddJsonFile("appsettings.json")
    .AddJsonFile("appsettings.Local.json", optional: true)
    .Build();

var optionsBuilder = new DbContextOptionsBuilder<PediHubDbContext>();
optionsBuilder.UseSqlServer(config.GetConnectionString("DefaultConnection"));

using var db = new PediHubDbContext(optionsBuilder.Options);
var merchants = db.Merchants.Select(x => new {
    x.CompanyName,
    x.Slug,
    x.Email
}).ToList();

Console.WriteLine(JsonSerializer.Serialize(merchants, new JsonSerializerOptions { WriteIndented = true }));
