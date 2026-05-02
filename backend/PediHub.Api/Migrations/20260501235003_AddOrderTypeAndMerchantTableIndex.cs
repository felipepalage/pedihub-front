using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PediHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderTypeAndMerchantTableIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Type",
                schema: "pedihub",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Number",
                schema: "pedihub",
                table: "MerchantTables",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantTables_MerchantId_Number",
                schema: "pedihub",
                table: "MerchantTables",
                columns: new[] { "MerchantId", "Number" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_MerchantTables_Merchants_MerchantId",
                schema: "pedihub",
                table: "MerchantTables",
                column: "MerchantId",
                principalSchema: "pedihub",
                principalTable: "Merchants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MerchantTables_Merchants_MerchantId",
                schema: "pedihub",
                table: "MerchantTables");

            migrationBuilder.DropIndex(
                name: "IX_MerchantTables_MerchantId_Number",
                schema: "pedihub",
                table: "MerchantTables");

            migrationBuilder.DropColumn(
                name: "Type",
                schema: "pedihub",
                table: "Orders");

            migrationBuilder.AlterColumn<string>(
                name: "Number",
                schema: "pedihub",
                table: "MerchantTables",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}
