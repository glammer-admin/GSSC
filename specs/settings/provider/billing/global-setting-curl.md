# Ejemplos cURL para Configuración Global (Facturación y Pagos)

Ejemplos de peticiones cURL para interactuar con las tablas de configuración de facturación y pagos del Organizer via Supabase REST API.

## Variables de entorno

```bash
# URL base de Supabase (local)
SUPABASE_URL="http://127.0.0.1:54321"

# API Key (anon key para desarrollo local)
SUPABASE_KEY="tu-anon-key"

# Token de autenticación (JWT del usuario logueado)
AUTH_TOKEN="tu-jwt-token"

# ID del usuario organizer
USER_ID="550e8400-e29b-41d4-a716-446655440000"
```

## Headers importantes

Las tablas de billing están en el esquema `gssc_db`, por lo que se requieren headers adicionales:

| Header | Uso | Valor |
|--------|-----|-------|
| `Accept-Profile` | Para operaciones GET | `gssc_db` |
| `Content-Profile` | Para operaciones POST/PATCH/DELETE | `gssc_db` |

---

# 1. Perfil de Facturación (billing_profiles)

El perfil de facturación contiene la **identidad legal y de contacto** del organizer para facturación y pagos. Solo puede existir **un perfil por usuario**.

## 1.1 Crear perfil de facturación

Crea el perfil de facturación para un organizer. Solo se permite un perfil por usuario.

### Persona Natural (entity_type: natural)

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/billing_profiles" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "entity_type": "natural",
    "full_name": "Juan Carlos Pérez García",
    "document_type": "CC",
    "document_number": "1234567890",
    "fiscal_address": "Calle 123 #45-67, Bogotá, Colombia",
    "contact_email": "juan.perez@email.com",
    "contact_phone": "+573001234567"
  }'
```

### Persona Jurídica (entity_type: legal)

Para empresas, el campo `tax_id` (NIT) es **obligatorio**.

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/billing_profiles" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "entity_type": "legal",
    "full_name": "Empresa Deportiva S.A.S",
    "document_type": "CC",
    "document_number": "1234567890",
    "tax_id": "9001234567",
    "fiscal_address": "Carrera 50 #100-20, Oficina 301, Medellín, Colombia",
    "contact_email": "finanzas@empresadeportiva.com",
    "contact_phone": "+574012345678"
  }'
```

---

## 1.2 Obtener perfil de facturación

Consulta el perfil de facturación de un usuario específico.

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/billing_profiles?user_id=eq.550e8400-e29b-41d4-a716-446655440000" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Por ID del perfil

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/billing_profiles?id=eq.660e8400-e29b-41d4-a716-446655440001" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

---

## 1.3 Editar perfil de facturación

Actualiza los datos del perfil de facturación existente.

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/billing_profiles?user_id=eq.550e8400-e29b-41d4-a716-446655440000" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "fiscal_address": "Nueva Calle 456 #78-90, Bogotá, Colombia",
    "contact_email": "nuevo.email@empresa.com",
    "contact_phone": "+573009876543"
  }'
```

### Cambiar de persona natural a jurídica

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/billing_profiles?user_id=eq.550e8400-e29b-41d4-a716-446655440000" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "entity_type": "legal",
    "full_name": "Mi Nueva Empresa S.A.S",
    "tax_id": "9009876543"
  }'
```

---

# 2. Cuentas Bancarias (bank_accounts)

Las cuentas bancarias almacenan la información para recibir pagos. Un organizer puede tener **múltiples cuentas**, **múltiples activas**, pero solo **una preferida** a la vez.

**Conceptos clave:**
- `is_active`: Indica si la cuenta está habilitada para uso. Puede haber múltiples cuentas activas.
- `is_preferred`: Indica la cuenta seleccionada para recibir pagos. Solo una por usuario. Requiere `is_active = true` AND `status = verified`.

**Restricciones:**
- No se pueden eliminar cuentas, solo inactivar (`is_active = false`)
- No se puede inactivar una cuenta que está marcada como preferida
- Para marcar como preferida, la cuenta debe estar activa y verificada

## 2.1 Crear cuenta bancaria

Crea una nueva cuenta bancaria. El `status` inicia como `pending` automáticamente.

### Cuenta de ahorros

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/bank_accounts" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "bank_name": "Bancolombia",
    "account_type": "savings",
    "account_number": "12345678901"
  }'
```

### Cuenta corriente

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/bank_accounts" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "bank_name": "Banco de Bogotá",
    "account_type": "checking",
    "account_number": "98765432109"
  }'
```

### Billetera digital (Nequi, Daviplata, etc.)

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/bank_accounts" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "bank_name": "Nequi",
    "account_type": "wallet",
    "account_number": "3001234567"
  }'
```

---

## 2.2 Obtener cuentas bancarias

### Todas las cuentas de un usuario (activas e inactivas)

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/bank_accounts?user_id=eq.550e8400-e29b-41d4-a716-446655440000&order=created_at.desc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Solo cuentas activas

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/bank_accounts?user_id=eq.550e8400-e29b-41d4-a716-446655440000&is_active=eq.true" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Solo la cuenta preferida (para recibir pagos)

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/bank_accounts?user_id=eq.550e8400-e29b-41d4-a716-446655440000&is_preferred=eq.true" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Cuentas elegibles para ser preferidas (activas + verificadas)

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/bank_accounts?user_id=eq.550e8400-e29b-41d4-a716-446655440000&is_active=eq.true&status=eq.verified" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Filtrar por estado

```bash
# Cuentas pendientes de verificación
curl -X GET "${SUPABASE_URL}/rest/v1/bank_accounts?user_id=eq.550e8400-e29b-41d4-a716-446655440000&status=eq.pending" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"

# Cuentas verificadas
curl -X GET "${SUPABASE_URL}/rest/v1/bank_accounts?user_id=eq.550e8400-e29b-41d4-a716-446655440000&status=eq.verified" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Por ID específico

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/bank_accounts?id=eq.770e8400-e29b-41d4-a716-446655440002" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

---

## 2.3 Editar cuenta bancaria

**Nota:** Al modificar campos sensibles (`account_number`, `bank_name`, `account_type`), el `status` se resetea automáticamente a `pending`.

### Actualizar número de cuenta

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/bank_accounts?id=eq.770e8400-e29b-41d4-a716-446655440002" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "account_number": "11122233344"
  }'
```

---

## 2.4 Activar/Reactivar cuenta

Reactiva una cuenta que estaba inactiva. No afecta otras cuentas activas.

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/bank_accounts?id=eq.770e8400-e29b-41d4-a716-446655440002" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "is_active": true
  }'
```

---

## 2.5 Inactivar cuenta

Inactiva una cuenta. **No se permite si la cuenta está marcada como preferida.**

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/bank_accounts?id=eq.770e8400-e29b-41d4-a716-446655440002" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "is_active": false
  }'
```

**Error si es cuenta preferida:**
```json
{
  "error": "CANNOT_INACTIVATE_PREFERRED",
  "message": "No puede inactivar la cuenta preferida. Seleccione otra primero"
}
```

---

## 2.6 Marcar como cuenta preferida

Marca una cuenta como la preferida para recibir pagos. 

**Requisitos:**
- La cuenta debe estar activa (`is_active = true`)
- La cuenta debe estar verificada (`status = verified`)

Al marcar una cuenta como preferida, cualquier otra cuenta preferida del mismo usuario se desmarca automáticamente.

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/bank_accounts?id=eq.770e8400-e29b-41d4-a716-446655440002" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "is_preferred": true
  }'
```

**Error si cuenta inactiva:**
```json
{
  "error": "CANNOT_SET_PREFERRED_INACTIVE",
  "message": "Cuenta inactiva. Reactívela primero"
}
```

**Error si cuenta no verificada:**
```json
{
  "error": "CANNOT_SET_PREFERRED_UNVERIFIED",
  "message": "Solo cuentas verificadas pueden ser seleccionadas como preferidas"
}
```

---

## 2.7 Desmarcar cuenta preferida

Desmarca la cuenta como preferida. **Nota:** Esto dejará al usuario sin cuenta preferida para recibir pagos.

```bash
curl -X PATCH "${SUPABASE_URL}/rest/v1/bank_accounts?id=eq.770e8400-e29b-41d4-a716-446655440002" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "is_preferred": false
  }'
```

---

## 2.8 Eliminar cuenta (NO PERMITIDO)

**Las cuentas bancarias NO se pueden eliminar**, solo inactivar. Esto es por razones de auditoría y trazabilidad.

```bash
# ❌ NO USAR - Retornará error
curl -X DELETE "${SUPABASE_URL}/rest/v1/bank_accounts?id=eq.770e8400-e29b-41d4-a716-446655440002" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Profile: gssc_db"
```

**Error:**
```json
{
  "error": "ACCOUNT_DELETE_NOT_ALLOWED",
  "message": "Las cuentas bancarias no se pueden eliminar, solo inactivar"
}
```

---

# 3. Documentos de Facturación (billing_documents)

Los documentos sensibles (cédula, RUT, certificación bancaria) se almacenan en un bucket privado de Supabase Storage.

## 3.1 Crear referencia de documento

Registra la metadata de un documento ya subido al storage.

### Documento de identidad

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/billing_documents" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "document_type": "id_document",
    "document_name": "Cédula de ciudadanía",
    "storage_bucket": "billing-documents",
    "storage_path": "550e8400-e29b-41d4-a716-446655440000/id_document/a1b2c3d4e5f6.pdf"
  }'
```

### RUT (para empresas)

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/billing_documents" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "document_type": "rut",
    "document_name": "RUT Empresa Deportiva S.A.S",
    "storage_bucket": "billing-documents",
    "storage_path": "550e8400-e29b-41d4-a716-446655440000/rut/f6e5d4c3b2a1.pdf"
  }'
```

### Certificación bancaria

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/billing_documents" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "document_type": "bank_certificate",
    "document_name": "Certificación Bancolombia - Cuenta Ahorros",
    "storage_bucket": "billing-documents",
    "storage_path": "550e8400-e29b-41d4-a716-446655440000/bank_certificate/x9y8z7w6v5u4.pdf"
  }'
```

---

## 3.2 Obtener documentos

### Todos los documentos de un usuario

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/billing_documents?user_id=eq.550e8400-e29b-41d4-a716-446655440000&order=created_at.desc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

### Por tipo de documento

```bash
# Documento de identidad
curl -X GET "${SUPABASE_URL}/rest/v1/billing_documents?user_id=eq.550e8400-e29b-41d4-a716-446655440000&document_type=eq.id_document" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"

# Certificación bancaria
curl -X GET "${SUPABASE_URL}/rest/v1/billing_documents?user_id=eq.550e8400-e29b-41d4-a716-446655440000&document_type=eq.bank_certificate" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Accept-Profile: gssc_db"
```

---

# 4. Verificar Elegibilidad de Pagos

Verifica si un organizer cumple con todos los requisitos para recibir pagos.

**Requisitos para elegibilidad:**
- Perfil de facturación completo
- Cuenta bancaria preferida (`is_preferred = true`)
- Cuenta preferida verificada (`status = verified`)
- Documentos requeridos cargados

```bash
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/check_organizer_payment_eligibility" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: gssc_db" \
  -d '{
    "p_user_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Respuesta exitosa:**
```json
{
  "eligible": true,
  "message": "Organizer is eligible to receive payments"
}
```

**Respuesta sin cuenta preferida:**
```json
{
  "eligible": false,
  "message": "No verified preferred bank account found"
}
```

**Respuesta con cuenta preferida no verificada:**
```json
{
  "eligible": false,
  "message": "Preferred bank account is not verified"
}
```

---

# 5. Gestión de Archivos en Storage

Subir y gestionar archivos en el bucket privado `billing-documents`. Los archivos se organizan por usuario: `{user_id}/{document_type}/{archivo}`.

## 5.1 Subir archivo

```bash
curl -X POST "${SUPABASE_URL}/storage/v1/object/billing-documents/${USER_ID}/id_document/cedula.pdf" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/pdf" \
  --data-binary "@/ruta/local/archivo.pdf"
```

## 5.2 Descargar archivo

```bash
curl -X GET "${SUPABASE_URL}/storage/v1/object/billing-documents/${USER_ID}/id_document/cedula.pdf" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  --output archivo_descargado.pdf
```

## 5.3 Eliminar archivo

```bash
curl -X DELETE "${SUPABASE_URL}/storage/v1/object/billing-documents/${USER_ID}/id_document/cedula.pdf" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
```

## 5.4 Listar archivos de un usuario

```bash
curl -X POST "${SUPABASE_URL}/storage/v1/object/list/billing-documents" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "prefix": "550e8400-e29b-41d4-a716-446655440000/"
  }'
```

---

# Valores Permitidos

## entity_type
- `natural` - Persona natural
- `legal` - Persona jurídica (empresa)

## document_type (identificación)
- `CC` - Cédula de ciudadanía
- `CE` - Cédula de extranjería
- `PASSPORT` - Pasaporte

## account_type
- `savings` - Cuenta de ahorros
- `checking` - Cuenta corriente
- `wallet` - Billetera digital

## bank_account_status
- `pending` - Pendiente de verificación
- `verified` - Verificada
- `rejected` - Rechazada

## billing_document_type
- `id_document` - Documento de identidad
- `rut` - RUT (obligatorio para empresas)
- `bank_certificate` - Certificación bancaria

---

# Validaciones Importantes

## Perfil de Facturación
- **CC/CE:** 6-10 dígitos numéricos
- **Pasaporte:** mínimo 5 caracteres
- **NIT:** 9-10 dígitos numéricos (obligatorio si `entity_type = legal`)
- Solo un perfil por usuario

## Cuentas Bancarias
- **Número de cuenta:** 6-20 dígitos numéricos
- Puede haber múltiples cuentas activas por usuario
- Solo una cuenta preferida por usuario
- Para ser preferida: `is_active = true` AND `status = verified`
- No se pueden eliminar cuentas, solo inactivar
- No se puede inactivar la cuenta preferida
- Al modificar datos sensibles, el estado vuelve a `pending`
- `rejection_reason` es obligatorio si `status = rejected`

## Documentos Requeridos
- **Persona natural:** `id_document` + `bank_certificate`
- **Empresa:** `rut` + `bank_certificate`

---

# Errores de Negocio

| Código | Descripción |
|--------|-------------|
| `CANNOT_INACTIVATE_PREFERRED` | No se puede inactivar la cuenta preferida. Seleccione otra primero |
| `CANNOT_SET_PREFERRED_INACTIVE` | No se puede marcar como preferida una cuenta inactiva. Reactívela primero |
| `CANNOT_SET_PREFERRED_UNVERIFIED` | Solo cuentas verificadas pueden ser seleccionadas como preferidas |
| `ACCOUNT_DELETE_NOT_ALLOWED` | Las cuentas bancarias no se pueden eliminar, solo inactivar |
| `PAYMENT_BLOCKED_NO_PREFERRED` | No hay cuenta preferida configurada para recibir pagos |

