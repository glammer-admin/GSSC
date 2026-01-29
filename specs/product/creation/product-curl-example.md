# Ejemplos cURL para Productos (project_products)

Ejemplos de peticiones cURL para interactuar con las tablas de productos via Supabase REST API.

## Variables de entorno

```bash
# URL base de Supabase (local)
SUPABASE_URL="http://127.0.0.1:54321"

# API Key (anon key para desarrollo local)
SUPABASE_KEY="tu-anon-key"

# Token de autenticación (JWT del usuario logueado)
AUTH_TOKEN="tu-jwt-token"

# IDs de ejemplo
PROJECT_ID="550e8400-e29b-41d4-a716-446655440000"
PRODUCT_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

## Headers importantes

Las tablas de productos están en el esquema `gssc_db`, por lo que se requieren headers adicionales:

| Header | Uso | Valor |
|--------|-----|-------|
| `Accept-Profile` | Para operaciones GET | `gssc_db` |
| `Content-Profile` | Para operaciones POST/PATCH/DELETE | `gssc_db` |

---

# 1. Catálogos (Solo Lectura)

Los catálogos de categorías y módulos de personalización son gestionados exclusivamente por la plataforma. Los organizadores solo pueden consultarlos.

## 1.1 Listar categorías de productos

Obtiene todas las categorías disponibles con sus modos visuales y módulos permitidos.

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/product_categories?order=name.asc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Obtener categoría por código

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/product_categories?code=eq.jersey" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

**Respuesta ejemplo:**
```json
[
  {
    "id": "uuid-categoria-jersey",
    "code": "jersey",
    "name": "Camiseta/Jersey",
    "description": "Camisetas y jerseys deportivos con personalización completa",
    "allowed_visual_modes": ["upload_images", "online_editor", "designer_assisted"],
    "allowed_modules": ["sizes", "numbers", "names"],
    "created_at": "2026-01-16T04:31:58.000Z",
    "updated_at": "2026-01-16T04:31:58.000Z"
  }
]
```

---

## 1.2 Listar módulos de personalización

Obtiene todos los módulos de personalización disponibles.

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/personalization_modules?order=name.asc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

**Respuesta ejemplo:**
```json
[
  {
    "id": "uuid-modulo-sizes",
    "code": "sizes",
    "name": "Selección de talla",
    "description": "Permite al comprador elegir talla (XS, S, M, L, XL, etc.)",
    "created_at": "2026-01-16T04:31:58.000Z",
    "updated_at": "2026-01-16T04:31:58.000Z"
  },
  {
    "id": "uuid-modulo-numbers",
    "code": "numbers",
    "name": "Número deportivo",
    "description": "Permite agregar número en la espalda del jersey (1-99)",
    "created_at": "2026-01-16T04:31:58.000Z",
    "updated_at": "2026-01-16T04:31:58.000Z"
  }
]
```

---

# 2. Productos (project_products)

## 2.1 Crear producto

Crea un nuevo producto dentro de un proyecto. **Importante:** El campo `personalization_config` es **inmutable** después de la creación.

### Producto tipo Jersey con personalización completa

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/project_products" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "category_id": "uuid-categoria-jersey",
    "name": "Camiseta Local Tigres FC 2026",
    "description": "Camiseta oficial del equipo local con diseño exclusivo temporada 2026",
    "base_price": 85000.00,
    "personalization_config": {
      "sizes": {
        "enabled": true,
        "options": ["XS", "S", "M", "L", "XL", "XXL"],
        "price_modifier": 0
      },
      "numbers": {
        "enabled": true,
        "min": 1,
        "max": 99,
        "price_modifier": 5000
      },
      "names": {
        "enabled": true,
        "max_length": 15,
        "price_modifier": 8000
      }
    }
  }'
```

### Producto tipo Shorts (solo tallas)

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/project_products" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "category_id": "uuid-categoria-shorts",
    "name": "Short Local Tigres FC 2026",
    "description": "Short deportivo oficial temporada 2026",
    "base_price": 45000.00,
    "personalization_config": {
      "sizes": {
        "enabled": true,
        "options": ["XS", "S", "M", "L", "XL", "XXL"],
        "price_modifier": 0
      }
    }
  }'
```

### Producto tipo Conjunto deportivo (tallas + categorías de edad)

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/project_products" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "category_id": "uuid-categoria-tracksuit",
    "name": "Conjunto de Calentamiento Tigres FC",
    "description": "Conjunto completo de calentamiento (chaqueta + pantalón)",
    "base_price": 150000.00,
    "personalization_config": {
      "sizes": {
        "enabled": true,
        "options": ["4", "6", "8", "10", "12", "14", "S", "M", "L", "XL"],
        "price_modifier": 0
      },
      "age_categories": {
        "enabled": true,
        "options": ["infantil", "juvenil", "adulto"],
        "price_modifier": 0
      }
    }
  }'
```

### Producto tipo Accesorios

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/project_products" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "category_id": "uuid-categoria-accessories",
    "name": "Medias Deportivas Tigres FC",
    "description": "Medias oficiales del equipo",
    "base_price": 25000.00,
    "personalization_config": {
      "sizes": {
        "enabled": true,
        "options": ["S", "M", "L"],
        "price_modifier": 0
      }
    }
  }'
```

---

## 2.2 Obtener producto por ID

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/project_products?id=eq.${PRODUCT_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Con información de la categoría (join)

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/project_products?id=eq.${PRODUCT_ID}&select=*,product_categories(code,name,allowed_visual_modes)" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
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

### Filtrar por categoría

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/project_products?project_id=eq.${PROJECT_ID}&category_id=eq.uuid-categoria-jersey" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Con imágenes incluidas (join)

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/project_products?project_id=eq.${PROJECT_ID}&select=*,product_images(id,url,position,source)&order=created_at.desc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

---

## 2.4 Editar producto

**Nota importante:** El campo `personalization_config` **NO puede ser modificado** después de la creación. Solo se pueden editar: `name`, `description`, `status`, `base_price`.

### Actualizar información básica

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/project_products?id=eq.${PRODUCT_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "Camiseta Local Tigres FC 2026 - Edición Especial",
    "description": "Camiseta oficial con nuevo diseño conmemorativo",
    "base_price": 95000.00
  }'
```

### Activar producto (publicar)

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/project_products?id=eq.${PRODUCT_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "status": "active"
  }'
```

### Desactivar producto

**Nota:** Los productos no se eliminan, solo se desactivan.

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/project_products?id=eq.${PRODUCT_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "status": "inactive"
  }'
```

### Volver a borrador

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/project_products?id=eq.${PRODUCT_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "status": "draft"
  }'
```

---

## 2.5 Eliminar producto

**⚠️ IMPORTANTE:** La eliminación de productos está **PROHIBIDA** por regla de negocio. Los productos solo pueden ser desactivados (`status = 'inactive'`). Si intentas eliminar un producto, el trigger `prevent_product_deletion` rechazará la operación.

```bash
# ❌ ESTO FALLARÁ - No se permite eliminar productos
curl -X DELETE "${SUPABASE_URL}/rest/v1/project_products?id=eq.${PRODUCT_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Profile: gssc_db"
```

**Alternativa correcta:** Desactivar el producto (ver sección 2.4).

---

# 3. Imágenes de Productos (product_images)

## 3.1 Registrar imagen de producto

Después de subir la imagen al Storage, registra la referencia en la tabla `product_images`.

### Imagen cargada manualmente (upload)

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/product_images" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "url": "product-images/550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890/1.png",
    "position": 1,
    "source": "upload"
  }'
```

### Múltiples imágenes

```bash
# Imagen posición 2
curl -X POST "${SUPABASE_URL}/rest/v1/product_images" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "url": "product-images/550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890/2.png",
    "position": 2,
    "source": "upload"
  }'

# Imagen posición 3
curl -X POST "${SUPABASE_URL}/rest/v1/product_images" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "url": "product-images/550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890/3.png",
    "position": 3,
    "source": "upload"
  }'
```

### Imagen generada por editor online

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/product_images" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "url": "product-images/550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890/4.png",
    "position": 4,
    "source": "online_editor"
  }'
```

### Imagen generada por diseñador asistido

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/product_images" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "url": "product-images/550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890/5.png",
    "position": 5,
    "source": "designer_assisted"
  }'
```

---

## 3.2 Obtener imágenes de un producto

### Todas las imágenes ordenadas por posición

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/product_images?product_id=eq.${PRODUCT_ID}&order=position.asc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Imagen por ID

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/product_images?id=eq.uuid-imagen-1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

---

## 3.3 Editar imagen

### Cambiar posición de una imagen

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/product_images?id=eq.uuid-imagen-1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "position": 2
  }'
```

### Actualizar URL de imagen

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/product_images?id=eq.uuid-imagen-1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "url": "product-images/550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890/1-updated.png"
  }'
```

---

## 3.4 Eliminar imagen

Las imágenes sí pueden ser eliminadas (a diferencia de los productos).

```bash
curl -X DELETE "${SUPABASE_URL}/rest/v1/product_images?id=eq.uuid-imagen-1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Profile: gssc_db"
```

### Eliminar todas las imágenes de un producto

```bash
curl -X DELETE "${SUPABASE_URL}/rest/v1/product_images?product_id=eq.${PRODUCT_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Profile: gssc_db"
```

---

# 4. Gestión de Archivos en Storage (product-images)

El bucket `product-images` es **público**, por lo que las imágenes se pueden acceder directamente sin autenticación.

## 4.1 Subir imagen al Storage

### Subir imagen PNG

```bash
curl -X POST "${SUPABASE_URL}/storage/v1/object/product-images/${PROJECT_ID}/${PRODUCT_ID}/1.png" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: image/png" \
  --data-binary @/ruta/local/imagen.png
```

### Subir imagen JPEG

```bash
curl -X POST "${SUPABASE_URL}/storage/v1/object/product-images/${PROJECT_ID}/${PRODUCT_ID}/2.jpg" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: image/jpeg" \
  --data-binary @/ruta/local/imagen.jpg
```

### Subir imagen WebP

```bash
curl -X POST "${SUPABASE_URL}/storage/v1/object/product-images/${PROJECT_ID}/${PRODUCT_ID}/3.webp" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: image/webp" \
  --data-binary @/ruta/local/imagen.webp
```

---

## 4.2 Actualizar imagen existente (upsert)

```bash
curl -X POST "${SUPABASE_URL}/storage/v1/object/product-images/${PROJECT_ID}/${PRODUCT_ID}/1.png" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: image/png" \
  -H "x-upsert: true" \
  --data-binary @/ruta/local/nueva-imagen.png
```

---

## 4.3 Obtener URL pública de imagen

El bucket es público, por lo que las imágenes se acceden directamente:

```bash
# URL pública (no requiere autenticación)
curl -X GET "${SUPABASE_URL}/storage/v1/object/public/product-images/${PROJECT_ID}/${PRODUCT_ID}/1.png"
```

**URL directa para usar en aplicaciones:**
```
${SUPABASE_URL}/storage/v1/object/public/product-images/{project_id}/{product_id}/{position}.{extension}
```

---

## 4.4 Listar archivos de un producto

```bash
curl -X POST "${SUPABASE_URL}/storage/v1/object/list/product-images" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "prefix": "550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890/",
    "limit": 100,
    "offset": 0
  }'
```

---

## 4.5 Eliminar imagen del Storage

```bash
curl -X DELETE "${SUPABASE_URL}/storage/v1/object/product-images/${PROJECT_ID}/${PRODUCT_ID}/1.png" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
```

### Eliminar múltiples imágenes

```bash
curl -X DELETE "${SUPABASE_URL}/storage/v1/object/product-images" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "prefixes": [
      "550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890/1.png",
      "550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890/2.png"
    ]
  }'
```

---

# Valores Permitidos

## product_status
- `draft` - Borrador (en configuración)
- `active` - Activo (publicado, visible para compradores)
- `inactive` - Inactivo (desactivado, no visible)

## visual_mode (modos de representación visual)
- `upload_images` - Carga manual de imágenes
- `online_editor` - Editor online de diseño
- `designer_assisted` - Diseño asistido por Glam Urban

## personalization_module_code (módulos de personalización)
- `sizes` - Selección de talla
- `numbers` - Número deportivo (1-99)
- `names` - Nombre personalizado
- `age_categories` - Categoría de edad

## product_image_source (origen de imágenes)
- `upload` - Cargada manualmente por el organizador
- `online_editor` - Generada por el editor online
- `designer_assisted` - Generada por el diseñador de Glam Urban

## Categorías disponibles

| code | name | allowed_visual_modes | allowed_modules |
|------|------|---------------------|-----------------|
| `jersey` | Camiseta/Jersey | `upload_images`, `online_editor`, `designer_assisted` | `sizes`, `numbers`, `names` |
| `shorts` | Shorts/Pantalón corto | `upload_images`, `online_editor`, `designer_assisted` | `sizes` |
| `tracksuit` | Conjunto deportivo | `upload_images`, `designer_assisted` | `sizes`, `age_categories` |
| `accessories` | Accesorios | `upload_images` | `sizes` |

---

# Estructura de personalization_config

El campo `personalization_config` es un JSONB que almacena la configuración de cada módulo habilitado.

## Estructura por módulo

### sizes (Selección de talla)
```json
{
  "sizes": {
    "enabled": true,
    "options": ["XS", "S", "M", "L", "XL", "XXL"],
    "price_modifier": 0
  }
}
```

### numbers (Número deportivo)
```json
{
  "numbers": {
    "enabled": true,
    "min": 1,
    "max": 99,
    "price_modifier": 5000
  }
}
```

### names (Nombre personalizado)
```json
{
  "names": {
    "enabled": true,
    "max_length": 15,
    "price_modifier": 8000
  }
}
```

### age_categories (Categoría de edad)
```json
{
  "age_categories": {
    "enabled": true,
    "options": ["infantil", "juvenil", "adulto"],
    "price_modifier": 0
  }
}
```

## Ejemplo completo (Jersey con todas las personalizaciones)
```json
{
  "sizes": {
    "enabled": true,
    "options": ["XS", "S", "M", "L", "XL", "XXL"],
    "price_modifier": 0
  },
  "numbers": {
    "enabled": true,
    "min": 1,
    "max": 99,
    "price_modifier": 5000
  },
  "names": {
    "enabled": true,
    "max_length": 15,
    "price_modifier": 8000
  }
}
```

---

# Configuración del bucket product-images

| Propiedad | Valor |
|-----------|-------|
| **Nombre** | `product-images` |
| **Público** | Sí |
| **Límite de archivo** | 10MB |
| **Tipos permitidos** | `image/jpeg`, `image/png`, `image/webp` |

### Estructura de paths

```
product-images/
  └── {project_id}/
      └── {product_id}/
          ├── 1.{extension}
          ├── 2.{extension}
          └── 3.{extension}

Ejemplo: product-images/550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890/1.png
```

---

# Reglas de Negocio Importantes

1. **Productos no eliminables:** Los productos solo se desactivan (`status = 'inactive'`), nunca se eliminan físicamente
2. **Configuración inmutable:** El campo `personalization_config` NO puede modificarse después de la creación
3. **Mínimo de imágenes:** Se requieren al menos 3 imágenes por producto (validación en capa de aplicación)
4. **Validación de módulos:** Los módulos configurados deben estar permitidos por la categoría seleccionada
5. **Catálogos cerrados:** Las categorías y módulos son gestionados exclusivamente por la plataforma

---

# Flujo Típico de Creación de Producto

1. **Consultar catálogos** - Obtener categorías y módulos disponibles
2. **Crear producto** - Crear el producto con `personalization_config` (inmutable)
3. **Subir imágenes al Storage** - Subir archivos al bucket `product-images`
4. **Registrar imágenes** - Crear registros en `product_images` con las URLs
5. **Activar producto** - Cambiar status a `active` cuando esté listo

```bash
# Paso 1: Obtener categoría jersey
curl -X GET "${SUPABASE_URL}/rest/v1/product_categories?code=eq.jersey" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"

# Paso 2: Crear producto (guardar el ID retornado)
# ... (ver sección 2.1)

# Paso 3: Subir imágenes al Storage
# ... (ver sección 4.1)

# Paso 4: Registrar imágenes en la tabla
# ... (ver sección 3.1)

# Paso 5: Activar producto
curl -X PATCH "${SUPABASE_URL}/rest/v1/project_products?id=eq.${PRODUCT_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{"status": "active"}'
```
