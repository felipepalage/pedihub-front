IF OBJECT_ID(N'[pedihub].[__EFMigrationsHistory]') IS NULL
BEGIN
    IF SCHEMA_ID(N'pedihub') IS NULL EXEC(N'CREATE SCHEMA [pedihub];');
    CREATE TABLE [pedihub].[__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF SCHEMA_ID(N'pedihub') IS NULL EXEC(N'CREATE SCHEMA [pedihub];');
GO

CREATE TABLE [pedihub].[Merchants] (
    [Id] uniqueidentifier NOT NULL,
    [CompanyName] nvarchar(160) NOT NULL,
    [Cnpj] nvarchar(20) NOT NULL,
    [Plan] nvarchar(20) NOT NULL,
    [Status] nvarchar(20) NOT NULL,
    [Email] nvarchar(180) NOT NULL,
    [Phone] nvarchar(30) NOT NULL,
    [Segment] nvarchar(50) NOT NULL,
    [UnitCount] int NOT NULL,
    [Street] nvarchar(180) NOT NULL,
    [Number] nvarchar(20) NOT NULL,
    [Neighborhood] nvarchar(100) NOT NULL,
    [City] nvarchar(100) NOT NULL,
    [State] nvarchar(2) NOT NULL,
    [ZipCode] nvarchar(12) NOT NULL,
    [LogoUrl] nvarchar(max) NOT NULL,
    [BannerUrl] nvarchar(max) NOT NULL,
    [PrimaryColor] nvarchar(20) NOT NULL,
    [OpeningHours] nvarchar(50) NOT NULL,
    [AveragePrepMinutes] int NOT NULL,
    [DeliveryFeeBase] decimal(18,2) NOT NULL,
    [MinimumOrder] decimal(18,2) NOT NULL,
    [AutoAcceptOrders] bit NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [LastAccessAt] datetimeoffset NULL,
    CONSTRAINT [PK_Merchants] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [pedihub].[Integrations] (
    [Id] uniqueidentifier NOT NULL,
    [MerchantId] uniqueidentifier NOT NULL,
    [Type] nvarchar(50) NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Description] nvarchar(240) NOT NULL,
    [Emoji] nvarchar(20) NOT NULL,
    [Status] nvarchar(20) NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [ConnectedAt] datetimeoffset NULL,
    CONSTRAINT [PK_Integrations] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Integrations_Merchants_MerchantId] FOREIGN KEY ([MerchantId]) REFERENCES [pedihub].[Merchants] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [pedihub].[Orders] (
    [Id] uniqueidentifier NOT NULL,
    [MerchantId] uniqueidentifier NOT NULL,
    [Number] int NOT NULL,
    [Channel] nvarchar(30) NOT NULL,
    [CustomerName] nvarchar(180) NOT NULL,
    [Total] decimal(18,2) NOT NULL,
    [OrderedAt] datetimeoffset NOT NULL,
    [Status] nvarchar(30) NOT NULL,
    [Payment] nvarchar(30) NOT NULL,
    [Address] nvarchar(240) NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [UpdatedAt] datetimeoffset NOT NULL,
    CONSTRAINT [PK_Orders] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Orders_Merchants_MerchantId] FOREIGN KEY ([MerchantId]) REFERENCES [pedihub].[Merchants] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [pedihub].[Products] (
    [Id] uniqueidentifier NOT NULL,
    [MerchantId] uniqueidentifier NOT NULL,
    [Image] nvarchar(100) NOT NULL,
    [Name] nvarchar(180) NOT NULL,
    [Category] nvarchar(100) NOT NULL,
    [Price] decimal(18,2) NOT NULL,
    [Available] bit NOT NULL,
    [Stock] int NOT NULL,
    [Promo] bit NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [UpdatedAt] datetimeoffset NOT NULL,
    CONSTRAINT [PK_Products] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Products_Merchants_MerchantId] FOREIGN KEY ([MerchantId]) REFERENCES [pedihub].[Merchants] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [pedihub].[Users] (
    [Id] uniqueidentifier NOT NULL,
    [MerchantId] uniqueidentifier NOT NULL,
    [FullName] nvarchar(140) NOT NULL,
    [Email] nvarchar(180) NOT NULL,
    [Phone] nvarchar(30) NOT NULL,
    [PasswordHash] nvarchar(512) NOT NULL,
    [Role] nvarchar(40) NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [LastLoginAt] datetimeoffset NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Users_Merchants_MerchantId] FOREIGN KEY ([MerchantId]) REFERENCES [pedihub].[Merchants] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [pedihub].[OrderItems] (
    [Id] uniqueidentifier NOT NULL,
    [OrderId] uniqueidentifier NOT NULL,
    [Name] nvarchar(180) NOT NULL,
    [Quantity] int NOT NULL,
    [UnitPrice] decimal(18,2) NOT NULL,
    CONSTRAINT [PK_OrderItems] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_OrderItems_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [pedihub].[Orders] ([Id]) ON DELETE CASCADE
);
GO

CREATE UNIQUE INDEX [IX_Integrations_MerchantId_Type] ON [pedihub].[Integrations] ([MerchantId], [Type]);
GO

CREATE UNIQUE INDEX [IX_Merchants_Cnpj] ON [pedihub].[Merchants] ([Cnpj]);
GO

CREATE INDEX [IX_OrderItems_OrderId] ON [pedihub].[OrderItems] ([OrderId]);
GO

CREATE UNIQUE INDEX [IX_Orders_MerchantId_Number] ON [pedihub].[Orders] ([MerchantId], [Number]);
GO

CREATE INDEX [IX_Products_MerchantId] ON [pedihub].[Products] ([MerchantId]);
GO

CREATE UNIQUE INDEX [IX_Users_Email] ON [pedihub].[Users] ([Email]);
GO

CREATE INDEX [IX_Users_MerchantId] ON [pedihub].[Users] ([MerchantId]);
GO

INSERT INTO [pedihub].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260430174108_InitialCreate', N'8.0.20');
GO

COMMIT;
GO

