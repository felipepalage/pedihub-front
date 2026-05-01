using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PediHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPixAndMercadoPagoTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MercadoPagoAccessToken",
                schema: "pedihub",
                table: "Merchants",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PixKey",
                schema: "pedihub",
                table: "Merchants",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MercadoPagoAccessToken",
                schema: "pedihub",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "PixKey",
                schema: "pedihub",
                table: "Merchants");
        }
    }
}
