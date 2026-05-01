using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PediHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProductModifiersV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ModifierGroupProduct",
                schema: "pedihub",
                columns: table => new
                {
                    ModifierGroupsId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductsId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModifierGroupProduct", x => new { x.ModifierGroupsId, x.ProductsId });
                    table.ForeignKey(
                        name: "FK_ModifierGroupProduct_ModifierGroups_ModifierGroupsId",
                        column: x => x.ModifierGroupsId,
                        principalSchema: "pedihub",
                        principalTable: "ModifierGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ModifierGroupProduct_Products_ProductsId",
                        column: x => x.ProductsId,
                        principalSchema: "pedihub",
                        principalTable: "Products",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ModifierGroupProduct_ProductsId",
                schema: "pedihub",
                table: "ModifierGroupProduct",
                column: "ProductsId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ModifierGroupProduct",
                schema: "pedihub");
        }
    }
}
