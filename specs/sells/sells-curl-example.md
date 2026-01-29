# Ejemplos cURL para Ventas (sales) y Resumen por Proyecto

Ejemplos de peticiones cURL para interactuar con las tablas de ventas y la vista **project_sales_summary** vía Supabase REST API.

## Variables de entorno

```bash
# URL base de Supabase (local)
SUPABASE_URL="http://127.0.0.1:54321"

# API Key (anon key para desarrollo local)
SUPABASE_KEY="tu-anon-key"

# Token de autenticación (JWT del usuario logueado)
# Para project_sales_summary debe ser el JWT del organizador.
AUTH_TOKEN="tu-jwt-token"

# IDs de ejemplo
PROJECT_ID="550e8400-e29b-41d4-a716-446655440000"
SALE_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
ORGANIZER_ID="550e8400-e29b-41d4-a716-446655440000"
BUYER_ID="b2c3d4e5-f6a7-8901-bcde-f23456789012"
PRODUCT_ID="c3d4e5f6-a7b8-9012-cdef-345678901234"
```

## Headers importantes

Las tablas y la vista de ventas están en el esquema `gssc_db`:

| Header | Uso | Valor |
|--------|-----|-------|
| `Accept-Profile` | Para operaciones GET | `gssc_db` |
| `Content-Profile` | Para operaciones POST/PATCH | `gssc_db` |

---

# 1. Vista: Resumen de ventas por proyecto (Dashboard "Mis proyectos")

La vista **project_sales_summary** expone un resumen financiero y comercial por proyecto. Solo devuelve proyectos del organizador autenticado (`organizer_id = auth.uid()`). Requiere **usuario autenticado** (JWT en `Authorization: Bearer`).

Equivalente al endpoint lógico: `GET /api/dashboard/projects`.

## 1.1 Listar resumen de proyectos del organizador

Obtiene todos los proyectos del organizador con totales agregados (pedidos confirmados, unidades vendidas, comisión del organizador, moneda, última venta).

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/project_sales_summary?order=last_sale_at.desc.nullslast" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

**Nota:** Usar el JWT del organizador. La vista filtra por `organizer_id = auth.uid()`; si no hay sesión o el token no es de organizador, solo se verán sus propios proyectos (o lista vacía).

### Ordenar por última venta (más recientes primero)

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/project_sales_summary?order=last_sale_at.desc.nullslast" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Seleccionar solo columnas necesarias

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/project_sales_summary?select=project_public_code,project_name,project_status,orders_count,units_sold,organizer_commission_total,currency,last_sale_at&order=last_sale_at.desc.nullslast" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

**Respuesta ejemplo:**
```json
[
  {
    "project_public_code": "PRJ-A1B2C",
    "project_name": "Black Friday 2024",
    "project_status": "finished",
    "orders_count": 520,
    "units_sold": 1560,
    "organizer_commission_total": 48000,
    "currency": "COP",
    "last_sale_at": "2024-11-30T18:45:00Z"
  },
  {
    "project_public_code": "PRJ-X9Y8Z",
    "project_name": "Nuevo Proyecto Sin Ventas",
    "project_status": "active",
    "orders_count": 0,
    "units_sold": 0,
    "organizer_commission_total": 0,
    "currency": null,
    "last_sale_at": null
  }
]
```

### Obtener un proyecto por código público (detalle del dashboard)

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/project_sales_summary?project_public_code=eq.PRJ-A1B2C" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

---

# 2. Ventas (sales)

## 2.1 Listar ventas

### Por proyecto

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/sales?project_id=eq.${PROJECT_ID}&order=created_at.desc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Por organizador

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/sales?organizer_id=eq.${ORGANIZER_ID}&order=created_at.desc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Por comprador

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/sales?buyer_id=eq.${BUYER_ID}&order=created_at.desc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Solo ventas pagadas

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/sales?sale_status=eq.paid&order=paid_at.desc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

## 2.2 Obtener una venta por ID

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/sales?id=eq.${SALE_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Por código público

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/sales?public_code=eq.ORD-2024-001234" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

## 2.3 Crear venta (ledger inmutable)

Las ventas se consideran confirmadas y pagadas al crear; el `public_code` lo genera la aplicación.

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/sales" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "public_code": "ORD-2024-001234",
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "organizer_id": "550e8400-e29b-41d4-a716-446655440000",
    "buyer_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "sale_status": "paid",
    "sale_channel": "web",
    "currency": "COP",
    "country": "CO",
    "buyer_snapshot": {
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "phone": "+573001234567"
    },
    "delivery_address_snapshot": {
      "address": "Calle 123 #45-67",
      "city": "Bogotá",
      "country": "CO"
    },
    "organizer_snapshot": {
      "name": "Equipo Tigres FC",
      "tax_id": "900123456-1"
    },
    "paid_at": "2024-11-30T18:45:00Z"
  }'
```

---

# 3. Ítems de venta (sale_items)

## 3.1 Listar ítems de una venta

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/sale_items?sale_id=eq.${SALE_ID}&order=id" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

## 3.2 Crear ítem de venta

Después de crear la venta, insertar los ítems (snapshot de producto, precios y personalización).

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/sale_items" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "sale_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "product_id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "product_name": "Camiseta Local Tigres FC 2026",
    "base_unit_price": 85000.00,
    "final_unit_price": 80000.00,
    "quantity": 2,
    "subtotal": 160000.00,
    "personalization_snapshot": {
      "size": "M",
      "number": "10",
      "name": "PÉREZ"
    },
    "personalization_extra_cost": 13000.00
  }'
```

---

# 4. Desglose de venta (sale_breakdowns)

Relación 1:1 con `sales`. Una vez creada la venta y los ítems, insertar el desglose.

## 4.1 Obtener desglose de una venta

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/sale_breakdowns?sale_id=eq.${SALE_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

## 4.2 Crear desglose (una vez por venta)

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/sale_breakdowns" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "sale_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "products_subtotal": 160000.00,
    "discount_total": 10000.00,
    "taxable_base": 150000.00,
    "tax_amount": 28500.00,
    "shipping_cost": 5000.00,
    "total_paid": 183500.00,
    "organizer_commission_amount": 22500.00,
    "platform_commission_amount": 7500.00,
    "net_to_organizer": 127500.00
  }'
```

---

# 5. Promociones aplicadas (sale_promotions) e impuestos (sale_taxes)

## 5.1 Listar promociones aplicadas a una venta

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/sale_promotions?sale_id=eq.${SALE_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

## 5.2 Listar impuestos de una venta

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/sale_taxes?sale_id=eq.${SALE_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

## 5.3 Catálogo de promociones (solo lectura)

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/promotions?is_active=eq.true&order=name.asc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

---

# 6. Referencias de facturación (sale_billing_references)

## 6.1 Listar referencias de una venta

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/sale_billing_references?sale_id=eq.${SALE_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

## 6.2 Crear referencia de facturación (opcional)

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/sale_billing_references" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "sale_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "billing_profile_snapshot": {
      "full_name": "Equipo Tigres FC",
      "tax_id": "900123456-1"
    },
    "invoice_number": "FV-2024-001234",
    "invoice_issued_at": "2024-11-30T19:00:00Z"
  }'
```

---

# 7. Ventas con ítems y desglose (select con relaciones)

Obtener una venta con sus ítems y desglose en una sola petición (Supabase permite `select` con relaciones).

## 7.1 Venta con ítems

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/sales?id=eq.${SALE_ID}&select=*,sale_items(*)" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

## 7.2 Venta con ítems y desglose

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/sales?id=eq.${SALE_ID}&select=*,sale_items(*),sale_breakdowns(*)" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

---

# Valores permitidos

## sale_status
- `created` - Creada
- `paid` - Pagada
- `cancelled` - Cancelada
- `refunded` - Reembolsada

## sale_channel
- `web` - Web (único valor en esta iteración)

## promotion_type (catálogo promotions)
- `percentage` - Porcentaje
- `fixed_amount` - Monto fijo
- `volume` - Por volumen/cantidad
- `free_shipping` - Envío gratis

## promotion_scope
- `global` - Global
- `project` - Por proyecto
- `product` - Por producto

---

# Reglas de negocio

1. **Ventas inmutables:** Una vez creadas, no se modifican (ledger). El frontend/BFF no debe hacer UPDATE sobre `sales`, `sale_items`, `sale_breakdowns`, etc.
2. **public_code:** Lo genera la aplicación; debe ser único y no vacío.
3. **Vista project_sales_summary:** Solo incluye ventas con `sale_status = 'paid'`. Proyectos sin ventas aparecen con `orders_count = 0`, `units_sold = 0`, `organizer_commission_total = 0`.
4. **Seguridad de la vista:** Solo el organizador autenticado ve sus proyectos; usar JWT del usuario en `Authorization: Bearer`.

---

# Flujo típico para crear una venta (confirmada y pagada)

1. Crear registro en `sales` (con `sale_status = 'paid'`, `paid_at`, snapshots).
2. Crear registros en `sale_items` (uno por línea, con `sale_id` retornado).
3. Crear registro en `sale_breakdowns` (uno por venta, con totales coherentes).
4. (Opcional) Crear registros en `sale_promotions`, `sale_taxes`, `sale_billing_references` si aplica.

```bash
# 1. Crear venta (guardar id de la respuesta)
curl -X POST "${SUPABASE_URL}/rest/v1/sales" ... -d '{ ... }'

# 2. Crear ítems (usar sale_id del paso 1)
curl -X POST "${SUPABASE_URL}/rest/v1/sale_items" ... -d '{ "sale_id": "<id>", ... }'

# 3. Crear desglose (usar mismo sale_id)
curl -X POST "${SUPABASE_URL}/rest/v1/sale_breakdowns" ... -d '{ "sale_id": "<id>", ... }'
```
