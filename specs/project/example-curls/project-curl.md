# Ejemplos cURL para Proyectos (glam_projects)

Ejemplos de peticiones cURL para interactuar con la tabla `glam_projects` via Supabase REST API.

## Variables de entorno

```bash
# URL base de Supabase (local)
SUPABASE_URL="http://127.0.0.1:54321"

# API Key (anon key para desarrollo local)
SUPABASE_KEY="tu-anon-key"

# Token de autenticación (JWT del usuario logueado)
AUTH_TOKEN="tu-jwt-token"
```

---

## 1. Crear un proyecto

Crea un nuevo proyecto. El `public_code` se genera automáticamente.

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/glam_projects" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "Equipo Fútbol Los Tigres",
    "description": "Proyecto de uniformes para el equipo de fútbol",
    "type": "sports_team",
    "organizer_id": "550e8400-e29b-41d4-a716-446655440000",
    "created_by": "550e8400-e29b-41d4-a716-446655440000",
    "updated_by": "550e8400-e29b-41d4-a716-446655440000",
    "commission_percent": 15.00,
    "packaging_custom": false,
    "delivery_type": "organizer_location",
    "delivery_config": {
      "address": "Calle 123 #45-67, Bogotá",
      "periodicity": "weekly"
    }
  }'
```

---

## 2. Consultar proyecto por ID

Obtiene un proyecto específico por su UUID.

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/glam_projects?id=eq.550e8400-e29b-41d4-a716-446655440000" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
```

---

## 3. Listar todos los proyectos de un usuario (organizer_id)

Obtiene todos los proyectos de un organizador específico.

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/glam_projects?organizer_id=eq.550e8400-e29b-41d4-a716-446655440000&order=created_at.desc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
```

### Con filtros adicionales

**Por estado:**
```bash
curl -X GET "${SUPABASE_URL}/rest/v1/glam_projects?organizer_id=eq.550e8400-e29b-41d4-a716-446655440000&status=eq.active" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
```

**Por tipo de proyecto:**
```bash
curl -X GET "${SUPABASE_URL}/rest/v1/glam_projects?organizer_id=eq.550e8400-e29b-41d4-a716-446655440000&type=eq.sports_team" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
```

---

## 4. Editar proyecto por ID

Actualiza un proyecto existente. **Nota:** El campo `name` no puede ser modificado.

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/glam_projects?id=eq.550e8400-e29b-41d4-a716-446655440000" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "description": "Proyecto actualizado de uniformes",
    "status": "active",
    "commission_percent": 18.50,
    "updated_by": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Cambiar configuración de entrega

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/glam_projects?id=eq.550e8400-e29b-41d4-a716-446655440000" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "delivery_type": "customer_home",
    "delivery_config": {
      "delivery_fee_type": "charged_to_customer",
      "delivery_fee_value": 8500
    },
    "updated_by": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

## 5. Eliminar proyecto por ID

Elimina un proyecto por su UUID.

```bash
curl -X DELETE "${SUPABASE_URL}/rest/v1/glam_projects?id=eq.550e8400-e29b-41d4-a716-446655440000" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
```

---

## 6. Consultar historial de cambios de un proyecto

Obtiene el historial de cambios de configuración de un proyecto.

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/glam_project_config_changes?project_id=eq.550e8400-e29b-41d4-a716-446655440000&order=changed_at.desc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
```

---

## Valores permitidos

### project_status
- `draft` - Borrador
- `active` - Activo
- `paused` - Pausado
- `finished` - Finalizado

### project_type
- `sports_team` - Equipo deportivo
- `educational_institution` - Institución educativa
- `company` - Empresa
- `group` - Grupo
- `other` - Otro

### delivery_type
- `organizer_location` - Ubicación del organizador
- `customer_home` - Domicilio del cliente
- `glam_urban_pickup` - Punto de retiro Glam Urban

### delivery_config según delivery_type

**organizer_location:**
```json
{
  "address": "Dirección completa",
  "periodicity": "weekly|biweekly|monthly|immediately"
}
```

**customer_home:**
```json
{
  "delivery_fee_type": "charged_to_customer|included_in_price",
  "delivery_fee_value": 8500
}
```

**glam_urban_pickup:**
```json
null
```

---

## 7. Subir logo del proyecto (Storage)

Sube una imagen al bucket `project-logos`. La estructura del path debe ser `{project_id}/logo.{extension}`.

**Nota:** El usuario debe ser el `organizer_id` del proyecto para poder subir imágenes.

### Subir imagen desde archivo local

```bash
curl -X POST "${SUPABASE_URL}/storage/v1/object/project-logos/550e8400-e29b-41d4-a716-446655440000/logo.png" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: image/png" \
  --data-binary @/ruta/a/tu/imagen.png
```

### Subir imagen JPEG

```bash
curl -X POST "${SUPABASE_URL}/storage/v1/object/project-logos/550e8400-e29b-41d4-a716-446655440000/logo.jpg" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: image/jpeg" \
  --data-binary @/ruta/a/tu/imagen.jpg
```

### Subir imagen WebP

```bash
curl -X POST "${SUPABASE_URL}/storage/v1/object/project-logos/550e8400-e29b-41d4-a716-446655440000/logo.webp" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: image/webp" \
  --data-binary @/ruta/a/tu/imagen.webp
```

---

## 8. Actualizar logo del proyecto (Storage)

Reemplaza un logo existente. Usa el método PUT o POST con el header `x-upsert: true`.

```bash
curl -X POST "${SUPABASE_URL}/storage/v1/object/project-logos/550e8400-e29b-41d4-a716-446655440000/logo.png" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: image/png" \
  -H "x-upsert: true" \
  --data-binary @/ruta/a/tu/nueva-imagen.png
```

---

## 9. Obtener URL pública del logo

El bucket `project-logos` es público, por lo que las imágenes se pueden acceder directamente:

```bash
# URL pública (no requiere autenticación)
curl -X GET "${SUPABASE_URL}/storage/v1/object/public/project-logos/550e8400-e29b-41d4-a716-446655440000/logo.png"
```

**URL directa para usar en aplicaciones:**
```
${SUPABASE_URL}/storage/v1/object/public/project-logos/{project_id}/logo.{extension}
```

---

## 10. Listar archivos en el bucket del proyecto

Lista todos los archivos dentro de la carpeta del proyecto.

```bash
curl -X POST "${SUPABASE_URL}/storage/v1/object/list/project-logos" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "prefix": "550e8400-e29b-41d4-a716-446655440000/",
    "limit": 100,
    "offset": 0
  }'
```

---

## 11. Eliminar logo del proyecto (Storage)

Elimina un logo específico del bucket.

```bash
curl -X DELETE "${SUPABASE_URL}/storage/v1/object/project-logos/550e8400-e29b-41d4-a716-446655440000/logo.png" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
```

### Eliminar múltiples archivos

```bash
curl -X DELETE "${SUPABASE_URL}/storage/v1/object/project-logos" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "prefixes": [
      "550e8400-e29b-41d4-a716-446655440000/logo.png",
      "550e8400-e29b-41d4-a716-446655440000/logo-old.png"
    ]
  }'
```

---

## Configuración del bucket project-logos

| Propiedad | Valor |
|-----------|-------|
| **Nombre** | `project-logos` |
| **Público** | Sí |
| **Límite de archivo** | 5MB |
| **Tipos permitidos** | `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml` |

### Estructura de paths

```
project-logos/
  └── {project_id}/
      └── logo.{extension}

Ejemplo: project-logos/550e8400-e29b-41d4-a716-446655440000/logo.png
```
