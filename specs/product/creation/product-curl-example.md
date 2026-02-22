# Ejemplos cURL para Módulo de Productos

Ejemplos de peticiones cURL para interactuar con las tablas de productos via Supabase REST API.

## Variables de entorno

```bash
# URL base de Supabase (local)
SUPABASE_URL="http://127.0.0.1:54321"

# API Key (anon key para desarrollo local)
SUPABASE_KEY="tu-anon-key"

# Token de autenticación (JWT del usuario logueado)
AUTH_TOKEN="tu-jwt-token"

# IDs de prueba (creados por migración seed_test_data_products)
ORGANIZER_ID="a0000000-0000-0000-0000-000000000001"
BUYER_ID="a0000000-0000-0000-0000-000000000002"
PROJECT_ID="b0000000-0000-0000-0000-000000000001"
PROJECT_ID_2="b0000000-0000-0000-0000-000000000002"

# IDs de productos de prueba (todos referenciando glam_products)
MUG_9OZ_TIGRES_ID="c0000000-0000-0000-0000-000000000001"
MUG_15OZ_TIGRES_ID="c0000000-0000-0000-0000-000000000002"
TERMO_600_TIGRES_ID="c0000000-0000-0000-0000-000000000003"
TERMO_1000_TIGRES_ID="c0000000-0000-0000-0000-000000000004"
MUG_9OZ_COLEGIO_ID="c0000000-0000-0000-0000-000000000005"
TERMO_600_COLEGIO_ID="c0000000-0000-0000-0000-000000000006"
MUG_15OZ_COLEGIO_ID="c0000000-0000-0000-0000-000000000007"
```

## Headers importantes

Las tablas están en el esquema `gssc_db`, por lo que se requieren headers adicionales:

| Header | Uso | Valor |
|--------|-----|-------|
| `Accept-Profile` | Para operaciones GET | `gssc_db` |
| `Content-Profile` | Para operaciones POST/PATCH/DELETE | `gssc_db` |

---

# 1. Catálogos (Solo Lectura)

Los catálogos son gestionados exclusivamente por la plataforma. Los organizadores solo pueden consultarlos.

## 1.1 Listar categorías de productos

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/product_categories?order=name.asc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Obtener categoría por código

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/product_categories?code=eq.mugs" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

**Respuesta ejemplo:**
```json
[
  {
    "id": "uuid-categoria-mugs",
    "code": "mugs",
    "name": "Mugs",
    "description": "Tazas y mugs personalizados",
    "allowed_modules": ["sizes"],
    "created_at": "2026-01-16T04:31:58.000Z",
    "updated_at": "2026-01-16T04:31:58.000Z"
  }
]
```

---

## 1.2 Listar módulos de personalización

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/personalization_modules?order=name.asc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

**Respuesta ejemplo:**
```json
[
  {"id": "uuid", "code": "age_categories", "name": "Categoría de edad", "description": "..."},
  {"id": "uuid", "code": "names", "name": "Nombre personalizado", "description": "..."},
  {"id": "uuid", "code": "numbers", "name": "Número deportivo", "description": "..."},
  {"id": "uuid", "code": "sizes", "name": "Selección de talla", "description": "..."}
]
```

---

## 1.3 Listar atributos de producto (product_attributes)

Catálogo maestro de tipos de atributos (calidad, color, material).

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/product_attributes?is_active=eq.true&order=name.asc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

**Respuesta ejemplo:**
```json
[
  {"id": "uuid-attr-calidad", "code": "quality", "name": "Calidad", "description": "Nivel de calidad del producto", "is_active": true},
  {"id": "uuid-attr-color", "code": "color", "name": "Color", "description": "Color del producto", "is_active": true},
  {"id": "uuid-attr-material", "code": "material", "name": "Material", "description": "Material de fabricación", "is_active": true}
]
```

### Atributo con sus opciones (JOIN)

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/product_attributes?code=eq.quality&select=*,product_attribute_options(id,code,name,display_order,is_active)" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

**Respuesta ejemplo:**
```json
[
  {
    "id": "uuid-attr-calidad",
    "code": "quality",
    "name": "Calidad",
    "description": "Nivel de calidad del producto",
    "is_active": true,
    "product_attribute_options": [
      {"id": "uuid-opt-estandar", "code": "estandar", "name": "Estándar", "display_order": 1, "is_active": true},
      {"id": "uuid-opt-premium", "code": "premium", "name": "Premium", "display_order": 2, "is_active": true}
    ]
  }
]
```

---

## 1.4 Listar opciones de un atributo

```bash
# Opciones del atributo "color"
ATTRIBUTE_ID="uuid-attr-color"

curl -X GET "${SUPABASE_URL}/rest/v1/product_attribute_options?attribute_id=eq.${ATTRIBUTE_ID}&is_active=eq.true&order=display_order.asc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

**Respuesta ejemplo:**
```json
[
  {"id": "uuid-opt-blanco", "attribute_id": "uuid-attr-color", "code": "blanco", "name": "Blanco", "display_order": 1, "is_active": true},
  {"id": "uuid-opt-negro", "attribute_id": "uuid-attr-color", "code": "negro", "name": "Negro", "display_order": 2, "is_active": true},
  {"id": "uuid-opt-azul", "attribute_id": "uuid-attr-color", "code": "azul", "name": "Azul", "display_order": 3, "is_active": true},
  {"id": "uuid-opt-rojo", "attribute_id": "uuid-attr-color", "code": "rojo", "name": "Rojo", "display_order": 4, "is_active": true}
]
```

---

## 1.5 Listar productos del catálogo Glam Urban (glam_products)

Tras elegir una categoría, se listan los productos de esa categoría.
Cada producto incluye `attributes_config` (JSONB) con las opciones disponibles y sus modificadores de precio.

### Productos por categoría (ej. mugs)

```bash
CATEGORY_ID="uuid-categoria-mugs"

curl -X GET "${SUPABASE_URL}/rest/v1/glam_products?category_id=eq.${CATEGORY_ID}&is_active=eq.true&order=name.asc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Producto por código

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/glam_products?code=eq.mug-9oz" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

**Respuesta ejemplo:**
```json
[
  {
    "id": "uuid-glam-product-mug9",
    "code": "mug-9oz",
    "name": "Mug 9 oz",
    "description": "Taza cerámica 9 onzas",
    "category_id": "uuid-categoria-mugs",
    "base_price": 15000.00,
    "attributes_config": {
      "quality": {
        "options": ["estándar", "premium"],
        "price_modifier": {"estándar": 0, "premium": 3000}
      }
    },
    "image_url": "/storage/v1/object/public/product-images/glam_products/mug-9oz.png",
    "is_active": true,
    "created_at": "2026-02-11T00:00:00.000Z",
    "updated_at": "2026-02-11T00:00:00.000Z"
  }
]
```

---

## 1.6 Obtener atributos y precios de un producto del catálogo

Los atributos disponibles y sus precios se almacenan directamente en `glam_products.attributes_config` (JSONB).

```bash
GLAM_PRODUCT_ID="uuid-glam-product-mug9"

curl -X GET "${SUPABASE_URL}/rest/v1/glam_products?id=eq.${GLAM_PRODUCT_ID}&select=id,code,name,base_price,attributes_config,image_url" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

**Respuesta ejemplo (mug-9oz con quality):**
```json
[
  {
    "id": "uuid-glam-product-mug9",
    "code": "mug-9oz",
    "name": "Mug 9 oz",
    "base_price": 15000.00,
    "attributes_config": {
      "quality": {
        "options": ["estándar", "premium"],
        "price_modifier": {"estándar": 0, "premium": 3000}
      }
    },
    "image_url": "/storage/v1/object/public/product-images/glam_products/mug-9oz.png"
  }
]
```

### Consulta SQL equivalente (para referencia)

```sql
SELECT code, name, base_price, attributes_config, image_url
FROM gssc_db.glam_products
WHERE id = 'uuid-glam-product-mug9';
```

---

## 1.7 Subir imagen de un producto del catálogo (glam_products)

Las imágenes de glam_products se almacenan en el bucket `product-images` bajo la carpeta `glam_products/`.
La convención de path es: `glam_products/{code}.{ext}`

### Subir imagen

```bash
PRODUCT_CODE="mug-9oz"

curl -X POST "${SUPABASE_URL}/storage/v1/object/product-images/glam_products/${PRODUCT_CODE}.png" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: image/png" \
  -H "x-upsert: true" \
  --data-binary "@/path/to/mug-9oz.png"
```

### Actualizar image_url en el registro

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/glam_products?code=eq.${PRODUCT_CODE}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Profile: gssc_db" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "/storage/v1/object/public/product-images/glam_products/mug-9oz.png"
  }'
```

### Obtener URL pública de la imagen

```
${SUPABASE_URL}/storage/v1/object/public/product-images/glam_products/mug-9oz.png
```

> **Nota:** El bucket `product-images` es público, por lo que las imágenes son accesibles sin autenticación vía la URL pública.

---

# 2. Productos de Proyecto (project_products)

**Cambios importantes:**
- `glam_product_id` es **obligatorio** (todo producto de proyecto deriva de un producto del catálogo Glam)
- `category_id` fue eliminada (la categoría se hereda vía `glam_product → category_id`)
- `base_price` fue renombrada a `price`
- `selected_attributes` almacena los atributos elegidos por el organizador (JSONB, **inmutable**)
- `personalization_config` almacena la configuración de personalización (JSONB, **inmutable**)

## 2.1 Crear producto

**Importante:** Los campos `personalization_config` y `selected_attributes` son **inmutables** después de la creación.

### Producto Mug con atributos seleccionados

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/project_products" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "glam_product_id": "uuid-glam-product-mug9",
    "name": "Mug 9 oz - Tigres FC 2026",
    "description": "Mug conmemorativo del equipo Tigres FC",
    "price": 15000.00,
    "personalization_config": {
      "sizes": {
        "enabled": true,
        "options": ["único"],
        "price_modifier": 0
      }
    },
    "selected_attributes": {
      "quality": {
        "selected_option": "premium",
        "price_modifier": 3000
      }
    }
  }'
```

### Producto Termo con atributos de material

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/project_products" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "glam_product_id": "uuid-glam-product-termo600",
    "name": "Termo 600ml - Tigres FC",
    "description": "Termo deportivo del equipo Tigres FC",
    "price": 35000.00,
    "personalization_config": {
      "sizes": {
        "enabled": true,
        "options": ["único"],
        "price_modifier": 0
      }
    },
    "selected_attributes": {
      "quality": {
        "selected_option": "estandar",
        "price_modifier": 0
      },
      "material": {
        "selected_option": "acero_inoxidable",
        "price_modifier": 0
      }
    }
  }'
```

### Producto sin atributos seleccionados (atributos vacíos)

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/project_products" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "b0000000-0000-0000-0000-000000000002",
    "glam_product_id": "uuid-glam-product-mug15",
    "name": "Mug 15 oz - Profesores San José",
    "description": "Mug grande exclusivo para profesores",
    "price": 18000.00,
    "personalization_config": {
      "sizes": {
        "enabled": true,
        "options": ["único"],
        "price_modifier": 0
      }
    },
    "selected_attributes": {}
  }'
```

---

## 2.2 Obtener producto por ID

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/project_products?id=eq.${MUG_9OZ_TIGRES_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Con producto catálogo e imágenes (JOIN completo)

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/project_products?id=eq.${MUG_9OZ_COLEGIO_ID}&select=*,glam_products(code,name,base_price,attributes_config,image_url,product_categories(code,name,allowed_modules)),product_images(id,url,position,source)" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

**Respuesta ejemplo:**
```json
[
  {
    "id": "c0000000-0000-0000-0000-000000000005",
    "project_id": "b0000000-0000-0000-0000-000000000002",
    "glam_product_id": "uuid-mug9",
    "name": "Mug 9 oz - Colegio San José",
    "description": "Mug conmemorativo 50 aniversario del colegio",
    "status": "active",
    "price": 15000.00,
    "personalization_config": {"sizes": {"enabled": true, "options": ["único"], "price_modifier": 0}},
    "selected_attributes": {},
    "glam_products": {
      "code": "mug-9oz",
      "name": "Mug 9 oz",
      "base_price": 15000.00,
      "attributes_config": {"quality": {"options": ["estándar", "premium"], "price_modifier": {"estándar": 0, "premium": 3000}}},
      "image_url": "/storage/v1/object/public/product-images/glam_products/mug-9oz.png",
      "product_categories": {
        "code": "mugs",
        "name": "Mugs",
        "allowed_modules": ["sizes"]
      }
    },
    "product_images": [
      {"id": "uuid", "url": "https://...", "position": 1, "source": "upload"},
      {"id": "uuid", "url": "https://...", "position": 2, "source": "upload"},
      {"id": "uuid", "url": "https://...", "position": 3, "source": "upload"}
    ]
  }
]
```

---

## 2.3 Listar productos de un proyecto

### Todos los productos del proyecto

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/project_products?project_id=eq.${PROJECT_ID}&order=created_at.desc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Solo productos activos

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/project_products?project_id=eq.${PROJECT_ID}&status=eq.active&order=name.asc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Filtrar por producto del catálogo

```bash
GLAM_PRODUCT_ID="uuid-glam-product-mug9"

curl -X GET "${SUPABASE_URL}/rest/v1/project_products?project_id=eq.${PROJECT_ID}&glam_product_id=eq.${GLAM_PRODUCT_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Con imágenes y datos del catálogo (join)

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/project_products?project_id=eq.${PROJECT_ID}&select=*,glam_products(code,name,base_price,image_url),product_images(id,url,position,source)&order=created_at.desc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

---

## 2.4 Editar producto

**Nota:** Los campos `personalization_config` y `selected_attributes` **NO pueden ser modificados**. Solo se pueden editar: `name`, `description`, `status`, `price`.

### Actualizar información básica

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/project_products?id=eq.${MUG_9OZ_TIGRES_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "Mug 9 oz - Tigres FC 2026 - Edición Especial",
    "description": "Mug conmemorativo con nuevo diseño",
    "price": 17000.00
  }'
```

### Activar producto (publicar)

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/project_products?id=eq.${TERMO_600_TIGRES_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{"status": "active"}'
```

### Desactivar producto

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/project_products?id=eq.${MUG_9OZ_TIGRES_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{"status": "inactive"}'
```

---

## 2.5 Eliminar producto

**PROHIBIDO por regla de negocio.** El trigger `prevent_product_deletion` rechazará la operación.

```bash
# ❌ ESTO FALLARÁ
curl -X DELETE "${SUPABASE_URL}/rest/v1/project_products?id=eq.${MUG_9OZ_TIGRES_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Profile: gssc_db"
```

**Alternativa correcta:** Desactivar el producto (ver sección 2.4).

---

# 3. Imágenes de Productos (product_images)

## 3.1 Registrar imagen de producto

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/product_images" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "product_id": "'${MUG_9OZ_TIGRES_ID}'",
    "url": "https://storage.example.com/product-images/'${PROJECT_ID}'/'${MUG_9OZ_TIGRES_ID}'/4.png",
    "position": 4,
    "source": "upload"
  }'
```

## 3.2 Obtener imágenes de un producto

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/product_images?product_id=eq.${MUG_9OZ_TIGRES_ID}&order=position.asc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

## 3.3 Eliminar imagen

```bash
curl -X DELETE "${SUPABASE_URL}/rest/v1/product_images?id=eq.uuid-imagen-1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Profile: gssc_db"
```

---

# 4. Gestión de Archivos en Storage (product-images)

El bucket `product-images` es **público**.

## 4.1 Subir imagen al Storage

```bash
curl -X POST "${SUPABASE_URL}/storage/v1/object/product-images/${PROJECT_ID}/${MUG_9OZ_TIGRES_ID}/1.png" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: image/png" \
  --data-binary @/ruta/local/imagen.png
```

## 4.2 Obtener URL pública

```bash
# URL directa (no requiere autenticación)
curl -X GET "${SUPABASE_URL}/storage/v1/object/public/product-images/${PROJECT_ID}/${MUG_9OZ_TIGRES_ID}/1.png"
```

## 4.3 Listar archivos de un producto

```bash
curl -X POST "${SUPABASE_URL}/storage/v1/object/list/product-images" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"prefix": "'${PROJECT_ID}'/'${MUG_9OZ_TIGRES_ID}'/", "limit": 100}'
```

## 4.4 Eliminar imagen del Storage

```bash
curl -X DELETE "${SUPABASE_URL}/storage/v1/object/product-images/${PROJECT_ID}/${MUG_9OZ_TIGRES_ID}/1.png" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
```

---

# 5. Escenarios de Validación y Prueba

## 5.1 Intentar modificar personalization_config (debe fallar)

```bash
# ❌ El trigger prevent_personalization_config_change rechazará esto
curl -X PATCH "${SUPABASE_URL}/rest/v1/project_products?id=eq.${MUG_9OZ_TIGRES_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "personalization_config": {
      "sizes": {"enabled": true, "options": ["S", "M", "L"], "price_modifier": 0}
    }
  }'
```

**Resultado esperado:** Error 400 - "La configuración de personalización no puede ser modificada después de la creación del producto"

## 5.2 Intentar modificar selected_attributes (debe fallar)

```bash
# ❌ El trigger prevent_selected_attributes_change rechazará esto
curl -X PATCH "${SUPABASE_URL}/rest/v1/project_products?id=eq.${MUG_9OZ_TIGRES_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "selected_attributes": {
      "quality": {"selected_option": "estandar", "price_modifier": 0}
    }
  }'
```

**Resultado esperado:** Error 400 - "Los atributos seleccionados no pueden ser modificados después de la creación del producto"

## 5.3 Intentar eliminar un producto (debe fallar)

```bash
# ❌ El trigger prevent_product_deletion rechazará esto
curl -X DELETE "${SUPABASE_URL}/rest/v1/project_products?id=eq.${MUG_9OZ_TIGRES_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Profile: gssc_db"
```

**Resultado esperado:** Error 400 - "Los productos no pueden ser eliminados. Use status = 'inactive' para desactivar el producto."

## 5.4 Crear producto sin glam_product_id (debe fallar)

```bash
# ❌ glam_product_id es obligatorio (NOT NULL)
curl -X POST "${SUPABASE_URL}/rest/v1/project_products" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "b0000000-0000-0000-0000-000000000001",
    "name": "Producto sin catálogo",
    "price": 10000.00,
    "personalization_config": {
      "sizes": {"enabled": true, "options": ["S", "M", "L"], "price_modifier": 0}
    }
  }'
```

**Resultado esperado:** Error - null value in column "glam_product_id" violates not-null constraint

## 5.5 Verificar datos de prueba cargados

### Contar productos por proyecto

```bash
# Proyecto 1 (Tigres FC) - debe tener 4 productos
curl -X GET "${SUPABASE_URL}/rest/v1/project_products?project_id=eq.${PROJECT_ID}&select=id" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db" \
  -H "Prefer: count=exact"

# Proyecto 2 (Colegio) - debe tener 3 productos
curl -X GET "${SUPABASE_URL}/rest/v1/project_products?project_id=eq.${PROJECT_ID_2}&select=id" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db" \
  -H "Prefer: count=exact"
```

### Verificar productos por estado

```bash
# Productos activos del proyecto 1 (debe ser 2: mug-9oz + mug-15oz)
curl -X GET "${SUPABASE_URL}/rest/v1/project_products?project_id=eq.${PROJECT_ID}&status=eq.active&select=name,status" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"

# Productos borrador (debe ser 1: termo-600ml)
curl -X GET "${SUPABASE_URL}/rest/v1/project_products?project_id=eq.${PROJECT_ID}&status=eq.draft&select=name,status" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"

# Productos inactivos (debe ser 1: termo-1000ml)
curl -X GET "${SUPABASE_URL}/rest/v1/project_products?project_id=eq.${PROJECT_ID}&status=eq.inactive&select=name,status" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Verificar atributos de un producto del catálogo

```bash
# Atributos del mug-9oz (attributes_config JSONB)
curl -X GET "${SUPABASE_URL}/rest/v1/glam_products?code=eq.mug-9oz&select=code,name,base_price,attributes_config,image_url" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Verificar imágenes de productos activos

```bash
# Imágenes del mug 9oz Tigres (debe tener 3)
curl -X GET "${SUPABASE_URL}/rest/v1/product_images?product_id=eq.${MUG_9OZ_TIGRES_ID}&order=position.asc&select=position,source,url" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

---

# 6. Flujo Completo de Creación de Producto

Flujo end-to-end para crear un producto desde cero.

```bash
# ============================================================
# PASO 1: Consultar categorías disponibles
# ============================================================
curl -X GET "${SUPABASE_URL}/rest/v1/product_categories?order=name.asc&select=id,code,name,allowed_modules" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"

# ============================================================
# PASO 2: Consultar productos del catálogo Glam para la categoría elegida
# ============================================================
curl -X GET "${SUPABASE_URL}/rest/v1/glam_products?category_id=eq.${CATEGORY_ID}&is_active=eq.true&select=id,code,name,base_price,attributes_config,image_url" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"

# ============================================================
# PASO 3: Consultar módulos de personalización de la categoría
# ============================================================
curl -X GET "${SUPABASE_URL}/rest/v1/personalization_modules?order=name.asc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"

# ============================================================
# PASO 4: Crear el producto
#   - glam_product_id: obligatorio (producto del catálogo elegido)
#   - personalization_config: inmutable después de creación
#   - selected_attributes: inmutable después de creación
# ============================================================
curl -X POST "${SUPABASE_URL}/rest/v1/project_products" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "'${PROJECT_ID}'",
    "glam_product_id": "uuid-glam-product-mug9",
    "name": "Mi Mug Personalizado",
    "description": "Mug con diseño exclusivo",
    "price": 15000.00,
    "personalization_config": {
      "sizes": {"enabled": true, "options": ["único"], "price_modifier": 0}
    },
    "selected_attributes": {
      "quality": {"selected_option": "premium", "price_modifier": 3000}
    }
  }'
# Guardar el ID retornado como NEW_PRODUCT_ID

# ============================================================
# PASO 5: Subir imágenes al Storage (mínimo 3)
# ============================================================
curl -X POST "${SUPABASE_URL}/storage/v1/object/product-images/${PROJECT_ID}/${NEW_PRODUCT_ID}/1.png" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: image/png" \
  --data-binary @/ruta/local/frente.png

curl -X POST "${SUPABASE_URL}/storage/v1/object/product-images/${PROJECT_ID}/${NEW_PRODUCT_ID}/2.png" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: image/png" \
  --data-binary @/ruta/local/lateral.png

curl -X POST "${SUPABASE_URL}/storage/v1/object/product-images/${PROJECT_ID}/${NEW_PRODUCT_ID}/3.png" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: image/png" \
  --data-binary @/ruta/local/detalle.png

# ============================================================
# PASO 6: Registrar imágenes en la tabla product_images
# ============================================================
curl -X POST "${SUPABASE_URL}/rest/v1/product_images" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '[
    {"product_id": "'${NEW_PRODUCT_ID}'", "url": "https://storage.example.com/product-images/'${PROJECT_ID}'/'${NEW_PRODUCT_ID}'/1.png", "position": 1, "source": "upload"},
    {"product_id": "'${NEW_PRODUCT_ID}'", "url": "https://storage.example.com/product-images/'${PROJECT_ID}'/'${NEW_PRODUCT_ID}'/2.png", "position": 2, "source": "upload"},
    {"product_id": "'${NEW_PRODUCT_ID}'", "url": "https://storage.example.com/product-images/'${PROJECT_ID}'/'${NEW_PRODUCT_ID}'/3.png", "position": 3, "source": "upload"}
  ]'

# ============================================================
# PASO 7: Activar el producto
# ============================================================
curl -X PATCH "${SUPABASE_URL}/rest/v1/project_products?id=eq.${NEW_PRODUCT_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{"status": "active"}'
```

---

# Valores Permitidos

## product_status
- `draft` - Borrador (en configuración)
- `active` - Activo (publicado, visible para compradores)
- `inactive` - Inactivo (desactivado, no visible)

## visual_mode
- `upload_images` - Carga manual de imágenes
- `online_editor` - Editor online de diseño
- `designer_assisted` - Diseño asistido por Glam Urban

## personalization_module_code
- `sizes` - Selección de talla
- `numbers` - Número deportivo (1-99)
- `names` - Nombre personalizado
- `age_categories` - Categoría de edad

## product_image_source
- `upload` - Cargada manualmente
- `online_editor` - Generada por editor online
- `designer_assisted` - Generada por diseñador

## Categorías disponibles

| code | name | allowed_modules |
|------|------|-----------------|
| `jersey` | Camiseta/Jersey | sizes, numbers, names |
| `shorts` | Shorts/Pantalón corto | sizes |
| `tracksuit` | Conjunto deportivo | sizes, age_categories |
| `accessories` | Accesorios | sizes |
| `mugs` | Mugs | sizes |
| `termos` | Termos | sizes |

## Atributos disponibles (catálogo)

| code | name | opciones |
|------|------|----------|
| `quality` | Calidad | estandar, premium |
| `color` | Color | blanco, negro, azul, rojo |
| `material` | Material | ceramica, acero_inoxidable, plastico_bpa_free |

## Productos del catálogo Glam Urban

| code | name | base_price | attributes_config |
|------|------|-----------|-------------------|
| `mug-9oz` | Mug 9 oz | 15000 | quality (estándar: +0, premium: +3000) |
| `mug-15oz` | Mug 15 oz | 18000 | quality (estándar: +0, premium: +3500) |
| `termo-600ml` | Termo 600 ml | 35000 | quality (estándar: +0, premium: +5000) |
| `termo-1000ml` | Termo 1000 ml | 45000 | quality (estándar: +0, premium: +6000) |

---

# Estructura de personalization_config

## sizes (Selección de talla)
```json
{"sizes": {"enabled": true, "options": ["XS", "S", "M", "L", "XL", "XXL"], "price_modifier": 0}}
```

## numbers (Número deportivo)
```json
{"numbers": {"enabled": true, "min": 1, "max": 99, "price_modifier": 5000}}
```

## names (Nombre personalizado)
```json
{"names": {"enabled": true, "max_length": 15, "price_modifier": 8000}}
```

## age_categories (Categoría de edad)
```json
{"age_categories": {"enabled": true, "options": ["infantil", "juvenil", "adulto"], "price_modifier": 0}}
```

## Ejemplo completo (para categorías que permiten múltiples módulos)
```json
{
  "sizes": {"enabled": true, "options": ["XS", "S", "M", "L", "XL", "XXL"], "price_modifier": 0},
  "numbers": {"enabled": true, "min": 1, "max": 99, "price_modifier": 5000},
  "names": {"enabled": true, "max_length": 15, "price_modifier": 8000}
}
```

---

# Estructura de selected_attributes

## Ejemplo: solo calidad
```json
{"quality": {"selected_option": "premium", "price_modifier": 3000}}
```

## Ejemplo: calidad + material
```json
{
  "quality": {"selected_option": "estandar", "price_modifier": 0},
  "material": {"selected_option": "acero_inoxidable", "price_modifier": 0}
}
```

## Ejemplo: vacío (sin atributos seleccionados)
```json
{}
```

---

# Configuración del bucket product-images

| Propiedad | Valor |
|-----------|-------|
| **Nombre** | `product-images` |
| **Público** | Sí |
| **Límite** | 10MB |
| **Tipos** | `image/jpeg`, `image/png`, `image/webp` |

---

# Reglas de Negocio

1. **Producto siempre del catálogo:** `glam_product_id` es obligatorio (NOT NULL). Todo producto de proyecto deriva de un producto del catálogo Glam Urban
2. **Categoría heredada:** La categoría se obtiene vía `glam_product → product_categories` (no existe `category_id` en `project_products`)
3. **Productos no eliminables:** Solo se desactivan (`status = 'inactive'`)
4. **Configuración inmutable:** `personalization_config` NO puede modificarse después de creación
5. **Atributos inmutables:** `selected_attributes` NO puede modificarse después de creación
6. **Mínimo de imágenes:** Al menos 3 imágenes por producto (validación en app)
7. **Validación de módulos:** Los módulos configurados deben estar permitidos por la categoría (vía glam_product)
8. **Atributos en JSONB:** Los atributos disponibles se almacenan en `glam_products.attributes_config`, las selecciones en `project_products.selected_attributes`
9. **Precio final:** `price + sum(selected_attributes.price_modifier) + sum(personalization_price_modifiers)`

---

# Datos de Prueba Disponibles

Los datos de prueba se cargan automáticamente con la migración `20260212100006_seed_test_data_products.sql`.

| Tipo | ID | Descripción | Estado |
|------|----|-------------|--------|
| User | `a0..01` | Carlos Organizer | Active |
| User | `a0..02` | Maria Buyer | Active |
| User | `a0..03` | Pedro Organizer 2 | Active |
| Project | `b0..01` | Tigres FC 2026 | active |
| Project | `b0..02` | Colegio San José Gifts | active |
| Product | `c0..01` | Mug 9 oz - Tigres FC | **active** (mug-9oz) |
| Product | `c0..02` | Mug 15 oz - Tigres FC | **active** (mug-15oz) |
| Product | `c0..03` | Termo 600ml - Tigres FC | **draft** (termo-600ml) |
| Product | `c0..04` | Termo 1000ml - Tigres FC | **inactive** (termo-1000ml) |
| Product | `c0..05` | Mug 9 oz - Colegio | **active** (mug-9oz) |
| Product | `c0..06` | Termo 600ml - Colegio | **draft** (termo-600ml) |
| Product | `c0..07` | Mug 15 oz - Profesores | **active** (mug-15oz) |
