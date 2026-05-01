using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PediHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWhatsAppIntegration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AddressNumber",
                schema: "pedihub",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "ChangeFor",
                schema: "pedihub",
                table: "Orders",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Complement",
                schema: "pedihub",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CustomerPhone",
                schema: "pedihub",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "DeliveryFee",
                schema: "pedihub",
                table: "Orders",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Neighborhood",
                schema: "pedihub",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReferencePoint",
                schema: "pedihub",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Street",
                schema: "pedihub",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "WhatsAppNumber",
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
                name: "AddressNumber",
                schema: "pedihub",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ChangeFor",
                schema: "pedihub",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "Complement",
                schema: "pedihub",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "CustomerPhone",
                schema: "pedihub",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DeliveryFee",
                schema: "pedihub",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "Neighborhood",
                schema: "pedihub",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ReferencePoint",
                schema: "pedihub",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "Street",
                schema: "pedihub",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "WhatsAppNumber",
                schema: "pedihub",
                table: "Merchants");
        }
    }
}
