using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PediHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddModifierGroupProductTableForReal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ModifierGroups",
                schema: "pedihub",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MerchantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MinQuantity = table.Column<int>(type: "int", nullable: false),
                    MaxQuantity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModifierGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ModifierGroups_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalSchema: "pedihub",
                        principalTable: "Merchants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ModifierOptions",
                schema: "pedihub",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ModifierGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModifierOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ModifierOptions_ModifierGroups_ModifierGroupId",
                        column: x => x.ModifierGroupId,
                        principalSchema: "pedihub",
                        principalTable: "ModifierGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ModifierGroups_MerchantId",
                schema: "pedihub",
                table: "ModifierGroups",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_ModifierOptions_ModifierGroupId",
                schema: "pedihub",
                table: "ModifierOptions",
                column: "ModifierGroupId");

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
