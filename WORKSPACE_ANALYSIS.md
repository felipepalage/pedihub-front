# PediHub Frontend - Workspace Analysis

## Project Overview
- **Framework**: TanStack React Router v1 (File-based routing)
- **UI Library**: Radix UI + Tailwind CSS
- **Package Manager**: Bun
- **API Base URL**: `http://localhost:5172`

---

## 1. TOKEN GENERATION 🔐

### Status: ⚠️ PLANNED BUT NOT IMPLEMENTED
The admin panel UI mentions "Gestão exclusiva do SuperAdmin: Lojistas e Tokens" but token generation is **NOT yet implemented** in the frontend.

**Files to Check**:
- [src/routes/app.admin.tsx](src/routes/app.admin.tsx#L71) - Admin panel with token mention
- [src/lib/api.ts](src/lib/api.ts) - No token generation functions found

**Current Admin Features**:
- `getAdminMerchants()` - GET /api/admin/merchants
- `deleteAdminMerchant(id)` - DELETE /api/admin/merchants/{id}

**What's Missing**:
- Token generation endpoints
- Token management UI
- Token CRUD operations

**Backend Expectation**: API likely has `/api/admin/tokens` endpoints (not consumed yet)

---

## 2. TABLE RESERVATION (MESAS) 🪑

### Main Files:
| File | Purpose |
|------|---------|
| [src/routes/app.configuracoes.tsx](src/routes/app.configuracoes.tsx#L669-L700) | Table management UI |
| [src/lib/api.ts](src/lib/api.ts#L374-L389) | API functions |
| [src/routes/app.integracoes.tsx](src/routes/app.integracoes.tsx#L279-L302) | Integration showcase |

### API Functions:
```typescript
getTables() - GET /api/tables
createTable(number) - POST /api/tables
deleteTable(id) - DELETE /api/tables/{id}
```

### ⚠️ LOCALHOST HARDCODING ISSUE

**Location**: [src/routes/app.configuracoes.tsx](src/routes/app.configuracoes.tsx#L697)
```typescript
// Hardcoded localhost in QR code generation
const qrUrl = `http://localhost:5174/store/mesa/${table.id}`
```

**Impact**: 
- QR codes always point to `localhost:5174` 
- Cannot be used in production
- Should use `window.location.origin` instead

**Fix Required**:
Replace `http://localhost:5174` with dynamic URL based on current origin

### Table Interface:
```typescript
interface MerchantTable {
  id?: string;
  number: string;
  qrCodeUrl: string;
}
```

---

## 3. ORDER STATUS SYSTEM 📊

### Status Definition Files:
| File | Content |
|------|---------|
| [src/lib/api.ts](src/lib/api.ts#L2-L7) | Type definition |
| [src/lib/domain.ts](src/lib/domain.ts) | UI labels mapping |
| [src/components/orders/StatusBadge.tsx](src/components/orders/StatusBadge.tsx) | Visual display |
| [src/routes/app.pedidos.tsx](src/routes/app.pedidos.tsx#L48-L55) | Filters list |

### Order Status Types:

```typescript
type OrderStatus = 
  | "novo"           // New
  | "aceito"         // Accepted
  | "preparando"     // Preparing
  | "saiu_entrega"   // Out for Delivery
  | "finalizado"     // Completed
  | "cancelado"      // Cancelled
```

### Status Display Mapping:
```typescript
novo: "Novo"
aceito: "Aceito"
preparando: "Preparando"
saiu_entrega: "Saiu p/ entrega"
finalizado: "Finalizado"
cancelado: "Cancelado"
```

### Status Update Flow:
1. User updates status via [app.pedidos.tsx](src/routes/app.pedidos.tsx) UI
2. Calls `updateOrderStatus(orderId, status)` 
3. Makes PATCH request to `/api/orders/{id}/status`
4. Can also send WhatsApp notification via [src/lib/whatsapp.ts](src/lib/whatsapp.ts)

---

## 4. ORDER TYPES (DELIVERY VS PICKUP) 🚚

### Type Definition:
**File**: [src/lib/api.ts](src/lib/api.ts#L109)
```typescript
interface OrderDetail {
  type: "delivery" | "pickup";
  // ... other fields
}
```

### Implementation:
- **Delivery (Entrega)**:
  - Customer provides address
  - `address`, `street`, `addressNumber`, `neighborhood`, `complement`, `referencePoint` included
  - Delivery fee applied
  - Status can be "saiu_entrega"

- **Pickup (Retirada)**:
  - No address fields
  - No delivery fee
  - Displayed as "Retirada no Local"

### Usage Locations:
| File | Usage |
|------|-------|
| [src/routes/$slug.tsx](src/routes/$slug.tsx#L400) | Public store checkout |
| [src/routes/app.pedidos.tsx](src/routes/app.pedidos.tsx#L446) | Order details display |

### Customer Selection:
Customers select order type during checkout in the public store:
```
🚚 Entrega (Delivery)
🏪 Retirada (Pickup)
```

---

## 5. ADMIN CUSTOMERS SECTION 👥

### Route Information:
- **Path**: `/app/clientes`
- **File**: [src/routes/app.clientes.tsx](src/routes/app.clientes.tsx)
- **Access**: **SuperAdmin role ONLY** ✅ (enforced with role check)

### Features:
1. **List View**:
   - Search customers by company name
   - Display: Company, Status, Last Access, Signup Date
   - Pagination support

2. **Status Types**:
   - `ativo` - Active
   - `trial` - Trial period
   - `inativo` - Inactive

3. **Actions**:
   - Add new customer → Link to `/cadastro` (signup page)

### API Endpoints:
```typescript
getCustomers(search?: string) - GET /api/customers?search=...
```

### Customer Summary Interface:
```typescript
interface CustomerSummary {
  id: string;
  company: string;
  status: "ativo" | "trial" | "inativo";
  lastAccessAt?: string | null;
  signupDate: string;
}
```

---

## 6. API BACKEND ANALYSIS 🔗

### API Base URL Configuration:
**Primary**: Environment variable `VITE_API_URL=http://localhost:5172`  
**Fallback**: `http://localhost:5172` (hardcoded in 8 locations)

### Complete API Endpoint Map:

#### Authentication
```
POST   /api/auth/login          → { token, expiresAt, user }
POST   /api/auth/register       → { token, expiresAt, user }
GET    /api/auth/me             → user info
```

#### Dashboard & Analytics
```
GET    /api/dashboard           → DashboardSummary
GET    /api/analytics/summary   → AnalyticsSummary
```

#### Orders
```
GET    /api/orders              → OrderListItem[]
GET    /api/orders/{id}         → OrderDetail
PATCH  /api/orders/{id}/status  → OrderDetail (update status)
POST   /api/orders/{id}/advance → OrderDetail (advance to next status)
```

#### Products
```
GET    /api/products            → Product[]
POST   /api/products            → Product (create)
PUT    /api/products/{id}       → Product (update)
PATCH  /api/products/{id}/availability → toggle
POST   /api/products/{id}/duplicate → Product
DELETE /api/products/{id}       → void
```

#### Customers
```
GET    /api/customers           → CustomerSummary[] (SuperAdmin only)
```

#### Tables
```
GET    /api/tables              → MerchantTable[]
POST   /api/tables              → MerchantTable (create)
DELETE /api/tables/{id}         → void
```

#### Settings & Config
```
GET    /api/settings            → Settings
PUT    /api/settings            → Settings (update)
POST   /api/media/upload        → { url: string }
```

#### Loyalty Program
```
GET    /api/loyalty/program     → LoyaltyProgram
PUT    /api/loyalty/program     → LoyaltyProgram
```

#### Coupons
```
GET    /api/coupons             → Coupon[]
POST   /api/coupons             → Coupon
DELETE /api/coupons/{id}        → void
PATCH  /api/coupons/{id}/toggle → Coupon
GET    /api/store/{slug}/coupons/{code} → Coupon (validate)
```

#### Integrations
```
GET    /api/integrations                  → Integration[]
POST   /api/integrations/{id}/connect     → Integration
POST   /api/integrations/{id}/disconnect  → Integration
```

#### Reports
```
GET    /api/reports             → ReportsResponse
GET    /api/reports/export/csv  → Blob
```

#### Admin
```
GET    /api/admin/merchants     → AdminMerchant[] (SuperAdmin only)
DELETE /api/admin/merchants/{id} → void
```

#### Public Store (No Auth Required)
```
GET    /api/store/{slug}                  → StorePublic
GET    /api/store/{slug}/products         → StoreProduct[]
GET    /api/store/{slug}/orders/{number}  → OrderDetail
POST   /api/store/{slug}/orders           → { message, orderNumber, checkoutUrl? }
```

---

## 7. LOCALHOST HARDCODING LOCATIONS 🔴

**Total Occurrences**: 8 files

| File | Line | Context |
|------|------|---------|
| [.env](file://.env#L1) | 1 | API base URL env var |
| [.env.example](file://.env.example#L1) | 1 | Example env var |
| [src/routes/$slug.tsx](src/routes/$slug.tsx#L65) | 65 | Fallback in store page |
| [src/routes/app.catalogo.tsx](src/routes/app.catalogo.tsx#L73) | 73 | Fallback in catalog |
| [src/routes/app.configuracoes.tsx](src/routes/app.configuracoes.tsx#L114) | 114 | Fallback in settings |
| [src/routes/app.configuracoes.tsx](src/routes/app.configuracoes.tsx#L697) | 697 | **QR CODE URL** ⚠️ |
| [src/lib/api.ts](src/lib/api.ts#L245) | 245 | Fallback in API layer |
| [src/components/layout/AppTopbar.tsx](src/components/layout/AppTopbar.tsx#L18) | 18 | Fallback in topbar |
| [src/components/layout/AppSidebar.tsx](src/components/layout/AppSidebar.tsx#L42) | 42 | Fallback in sidebar |

### Critical Issue:
**Line 697 in app.configuracoes.tsx** - QR code generation hardcodes `localhost:5174`:
```typescript
// ❌ HARDCODED
const qrUrl = `http://localhost:5174/store/mesa/${table.id}`

// ✅ SHOULD BE
const qrUrl = `${window.location.origin}/store/mesa/${table.id}`
```

---

## 8. KEY COMPONENTS & THEIR ROLES 🏗️

| Component | File | Purpose |
|-----------|------|---------|
| Dashboard | [src/routes/app.index.tsx](src/routes/app.index.tsx) | Statistics & recent orders |
| Orders | [src/routes/app.pedidos.tsx](src/routes/app.pedidos.tsx) | Order management & status updates |
| Catalog | [src/routes/app.catalogo.tsx](src/routes/app.catalogo.tsx) | Product management |
| Customers | [src/routes/app.clientes.tsx](src/routes/app.clientes.tsx) | SuperAdmin customer list |
| Settings | [src/routes/app.configuracoes.tsx](src/routes/app.configuracoes.tsx) | Store config, tables, loyalty, coupons |
| Integrations | [src/routes/app.integracoes.tsx](src/routes/app.integracoes.tsx) | Channel connections (WhatsApp, etc) |
| Reports | [src/routes/app.relatorios.tsx](src/routes/app.relatorios.tsx) | Analytics & export |
| Admin | [src/routes/app.admin.tsx](src/routes/app.admin.tsx) | SuperAdmin merchant management |
| Public Store | [src/routes/$slug.tsx](src/routes/$slug.tsx) | Customer-facing storefront |
| StatusBadge | [src/components/orders/StatusBadge.tsx](src/components/orders/StatusBadge.tsx) | Order status display |

---

## 9. SUMMARY TABLE 📋

| Feature | Status | Files | API Endpoint | Issues |
|---------|--------|-------|--------------|--------|
| **Token Generation** | ❌ Not Implemented | app.admin.tsx | `/api/admin/tokens` (?) | No frontend code |
| **Table Reservation** | ✅ Implemented | app.configuracoes.tsx | /api/tables | Localhost hardcoded |
| **Order Status** | ✅ Full | domain.ts, api.ts | /api/orders/{id}/status | None |
| **Order Types** | ✅ Full | api.ts, $slug.tsx | N/A (part of order) | None |
| **Admin Customers** | ✅ Limited | app.clientes.tsx | /api/customers | SuperAdmin only |
| **API Backend** | ✅ Complete | api.ts | Multiple | Localhost fallbacks |

---

## 10. RECOMMENDED NEXT STEPS 🚀

1. **Token Generation**:
   - [ ] Check backend `/api/admin/tokens` endpoints
   - [ ] Implement token CRUD UI in admin panel
   - [ ] Add token lifecycle management

2. **QR Code Fix** (HIGH PRIORITY):
   - [ ] Replace `http://localhost:5174` with `window.location.origin`
   - [ ] Test QR codes work across environments

3. **Localhost Fallbacks**:
   - [ ] Make environment-specific
   - [ ] Use `.env` for all 8 locations
   - [ ] Add validation for invalid URLs

4. **Admin Features**:
   - [ ] Test token generation when implemented
   - [ ] Add customer export functionality
   - [ ] Implement customer role/permissions management

---

**Generated**: June 5, 2026  
**Analysis Tool**: GitHub Copilot  
**Framework**: React 18 + TanStack Router v1
