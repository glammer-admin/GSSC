# Plan de Implementación – Configuración de Facturación y Pagos

> **Rol del documento**  
> Este archivo es el **contrato operativo** entre el humano y la(s) AI Agent(s).  
> La AI **NO debe escribir código** hasta que este plan esté completo, validado y aprobado.

---

## 1. Contexto

### 1.1 Referencias obligatorias
- Documento técnico principal: `DOCS_TECHNICAL.md`
- Especificación funcional: `specs/settings/provider/billing/spec.md`
- Descripción funcional: `specs/settings/provider/billing/dec-funcional.md`
- Ejemplos cURL backend: `specs/register/global-setting-curl.md`

### 1.2 Objetivo del plan
Actualizar el módulo de **Configuración de Facturación y Pagos** para integrar con el backend real de Supabase, reemplazando los mocks actuales. El módulo permite a los Organizers registrar su información legal, de contacto y bancaria para poder recibir pagos.

**Cambio importante (v2.1):** Los documentos ahora se envían junto con el formulario al finalizar (no inmediatamente al seleccionarlos). El BFF procesa todo atómicamente con rollback en caso de error.

---

## 2. Alcance

### 2.1 Incluye
- Actualización de tipos TypeScript para mapear al modelo de datos del backend (3 tablas)
- Creación de cliente HTTP para billing (`lib/http/billing/`)
- Actualización de API routes para usar cliente HTTP real
- Integración con Supabase Storage para carga de documentos
- Actualización de componentes UI para soportar múltiples cuentas bancarias
- Implementación de verificación de elegibilidad de pagos

### 2.2 Excluye explícitamente
- Proceso de verificación de cuentas (backoffice)
- Ejecución de transferencias/pagos
- Otras páginas del menú Settings (Perfil, Seguridad, etc.)
- Flujo de onboarding/registro inicial (ver `specs/register/`)

> ⚠️ Regla: todo lo no listado aquí se considera **fuera de alcance**.

---

## 3. Supuestos y restricciones

### 3.1 Supuestos
- El usuario con rol `organizer` ya está autenticado con sesión completa
- El backend de Supabase está disponible y configurado
- Las tablas `billing_profiles`, `bank_accounts`, `billing_documents` existen en el schema
- El bucket `billing-documents` existe en Supabase Storage
- El RPC `check_organizer_payment_eligibility` está implementado en el backend
- Los componentes UI de shadcn/ui están disponibles y configurados

### 3.2 Restricciones técnicas
- **Framework:** Next.js 15.1.3 con App Router
- **Renderizado:** Server-Side Rendering obligatorio para validaciones
- **Lenguaje:** TypeScript 5
- **Estilos:** Tailwind CSS 4.0
- **Componentes UI:** shadcn/ui existentes en `/components/ui/`
- **Autenticación:** Sistema de sesiones existente (`lib/auth/session-manager`)
- **Cliente HTTP:** Patrón existente en `lib/http/` (fetch genérico, no SDK Supabase)
- **Storage:** Supabase Storage via REST API

---

## 4. Respuestas a preguntas obligatorias

| Pregunta | Respuesta |
|----------|-----------|
| ¿Qué problema de negocio se resuelve? | Permitir a Organizers configurar datos fiscales y bancarios para recibir pagos de sus ventas |
| ¿Quiénes son los actores involucrados? | Organizer (usuario con rol `organizer`) |
| ¿Cuáles son las reglas de negocio críticas? | RN-01 a RN-23 definidas en spec.md (tipo entidad inmutable, documentos obligatorios, múltiples cuentas con una activa, validaciones de formato, documentos enviados al finalizar formulario, guardado atómico con rollback) |
| ¿Qué decisiones ya están tomadas? | Modelo de 3 tablas (billing_profiles, bank_accounts, billing_documents), bucket `billing-documents`, RPC de elegibilidad |
| ¿Qué partes son configurables vs fijas? | Fijo: estructura de formulario, campos obligatorios, validaciones. Configurable: datos precargados desde user-data |
| ¿Qué escenarios de error deben contemplarse? | Validación de campos, formatos de archivo, tipo de entidad bloqueado, errores de red, errores del backend, fallo en subida de documentos (DOCUMENT_UPLOAD_FAILED con rollback) |
| ¿Qué no debe hacer el sistema? | Ejecutar pagos, verificar cuentas, cambiar tipo de entidad una vez guardado, acceder a datos de otros usuarios |

---

## 5. Descomposición del trabajo

### Fase 1 – Tipos y Cliente HTTP

#### 1.1 Actualizar tipos del dominio
- Modificar `lib/types/billing/types.ts` con:
  - Tipos que mapean a las 3 tablas del backend
  - `BillingProfile` (billing_profiles)
  - `BankAccount` (bank_accounts)
  - `BillingDocument` (billing_documents)
  - DTOs para crear/actualizar
  - Tipos de respuesta del backend

#### 1.2 Crear cliente HTTP para billing
- Crear `lib/http/billing/types.ts` - Tipos específicos del cliente
- Crear `lib/http/billing/billing-client.ts` - Cliente con métodos:
  - `getBillingProfile(userId)`
  - `createBillingProfile(data)`
  - `updateBillingProfile(userId, data)`
  - `getBankAccounts(userId)`
  - `getActiveBankAccount(userId)`
  - `createBankAccount(data)`
  - `updateBankAccount(id, data)`
  - `activateBankAccount(id)`
  - `getBillingDocuments(userId)`
  - `createBillingDocument(data)`
  - `checkPaymentEligibility(userId)`

#### 1.3 Crear cliente para Storage
- Crear `lib/http/billing/storage-client.ts` - Cliente con métodos:
  - `uploadDocument(userId, documentType, file)`
  - `downloadDocument(userId, documentType, filename)`
  - `listDocuments(userId)`
  - `deleteDocument(path)`

### Fase 2 – Actualización de API Routes

#### 2.1 Refactorizar endpoint de billing (CAMBIO IMPORTANTE)
- Modificar `app/api/settings/billing/route.ts`:
  - GET: Obtener perfil, cuentas y documentos (sin cambios)
  - POST: **Cambiar de JSON a `multipart/form-data`**
    - Recibir datos del formulario en campo `data` (JSON string)
    - Recibir archivos: `id_document_file`, `rut_file`, `bank_certificate_file`
    - **Flujo de guardado atómico:**
      1. Validar sesión y permisos
      2. Parsear y validar datos del formulario
      3. Validar que documentos obligatorios estén presentes
      4. Subir documentos a Storage (con tracking de paths subidos)
      5. Si falla alguna subida: rollback (eliminar archivos ya subidos) y retornar error
      6. Crear/actualizar perfil de facturación
      7. Crear/actualizar cuenta bancaria
      8. Crear referencias de documentos en BD
      9. Retornar configuración actualizada
    - Usar cliente HTTP real en lugar de mocks

#### 2.2 Crear endpoint para cuentas bancarias
- Crear `app/api/settings/billing/accounts/route.ts`:
  - GET: Listar cuentas del usuario
  - POST: Crear nueva cuenta

#### 2.3 Crear endpoint para cuenta específica
- Crear `app/api/settings/billing/accounts/[id]/route.ts`:
  - GET: Obtener cuenta por ID
  - PATCH: Actualizar cuenta
  - DELETE: Eliminar cuenta (si no está activa)

#### 2.4 Crear endpoint para activar cuenta
- Crear `app/api/settings/billing/accounts/[id]/activate/route.ts`:
  - POST: Activar cuenta específica

#### 2.5 Actualizar endpoint para documentos
- Modificar `app/api/settings/billing/documents/route.ts`:
  - GET: Listar documentos (mantener)
  - POST: **DEPRECADO** - La subida ahora se hace en el endpoint principal `/api/settings/billing`
  - Mantener el endpoint para compatibilidad pero documentar que está deprecado

#### 2.6 Crear endpoint de elegibilidad
- Crear `app/api/settings/billing/eligibility/route.ts`:
  - GET: Verificar elegibilidad de pagos

### Fase 3 – Actualización de Componentes UI

#### 3.1 Actualizar formulario principal (CAMBIO IMPORTANTE)
- Modificar `components/settings/billing/billing-form.tsx`:
  - Adaptar a nuevo modelo de datos
  - Separar secciones: Perfil, Cuentas, Documentos
  - Manejar múltiples cuentas bancarias
  - **Nuevo flujo de envío:**
    - Recolectar objetos `File` de los componentes `DocumentUpload`
    - Construir `FormData` con:
      - Campo `data`: JSON string con datos del formulario
      - Campo `id_document_file`: archivo de cédula (si aplica)
      - Campo `rut_file`: archivo RUT (si aplica)
      - Campo `bank_certificate_file`: archivo de certificación bancaria
    - Enviar como `multipart/form-data` en lugar de JSON
    - Mostrar estado de "Guardando..." durante todo el proceso (incluye subida de archivos)
    - Manejar error `DOCUMENT_UPLOAD_FAILED` con mensaje apropiado

#### 3.2 Actualizar componente de información bancaria
- Modificar `components/settings/billing/bank-info.tsx`:
  - Lista de cuentas existentes
  - Indicador de cuenta activa
  - Botón para activar cuenta
  - Formulario para nueva cuenta
  - **Pasar objeto `File` al padre** en lugar de subir inmediatamente

#### 3.3 Actualizar componente de documentos (CAMBIO IMPORTANTE)
- Modificar `components/settings/billing/document-upload.tsx`:
  - **NO subir archivos inmediatamente al seleccionarlos**
  - Almacenar objeto `File` en memoria
  - Exponer el `File` al componente padre via callback `onFileChange(file: File | undefined)`
  - Mantener preview del archivo seleccionado
  - Mostrar validación de formato y tamaño (cliente)
  - Eliminar lógica de subida (fetch a `/api/settings/billing/documents`)
  - Eliminar estados de `isUploading` y `uploadSuccess` relacionados con subida

#### 3.4 Actualizar componentes de información legal
- Modificar `components/settings/billing/legal-info-natural.tsx`:
  - Pasar objeto `File` al padre via `onFileChange(file: File | undefined)`
- Modificar `components/settings/billing/legal-info-legal.tsx`:
  - Pasar objeto `File` al padre via `onFileChange(file: File | undefined)`

#### 3.5 Crear componente de elegibilidad
- Crear `components/settings/billing/eligibility-status.tsx`:
  - Mostrar estado de elegibilidad
  - Lista de requisitos faltantes

### Fase 4 – Actualización de Página

#### 4.1 Actualizar página de billing
- Modificar `app/settings/billing/page.tsx`:
  - Cargar datos desde backend real
  - Pasar datos a componentes actualizados
  - Manejar estados de carga y error

### Fase 5 – Limpieza

#### 5.1 Eliminar mocks
- Eliminar `lib/mocks/billing-loader.ts`
- Eliminar `mocks/billing/settings.json`
- Actualizar imports en archivos que usaban mocks

---

## 6. Archivos y estructura esperada

> La AI **NO puede crear archivos fuera de esta lista**.

### Nuevos archivos a crear

```
lib/
├── http/
│   └── billing/
│       ├── types.ts                    # Tipos del cliente HTTP
│       ├── billing-client.ts           # Cliente para billing_profiles, bank_accounts, billing_documents
│       └── storage-client.ts           # Cliente para Supabase Storage

app/api/
└── settings/
    └── billing/
        ├── accounts/
        │   ├── route.ts                # GET/POST cuentas bancarias
        │   └── [id]/
        │       ├── route.ts            # GET/PATCH/DELETE cuenta específica
        │       └── activate/
        │           └── route.ts        # POST activar cuenta
        ├── documents/
        │   └── route.ts                # GET/POST documentos
        └── eligibility/
            └── route.ts                # GET elegibilidad

components/
└── settings/
    └── billing/
        └── eligibility-status.tsx      # Nuevo: estado de elegibilidad
```

### Archivos a modificar

```
lib/
├── types/
│   └── billing/
│       └── types.ts                    # Actualizar tipos al modelo del backend

app/
├── api/
│   └── settings/
│       └── billing/
│           ├── route.ts                # Cambiar POST a multipart/form-data con subida atómica
│           └── documents/
│               └── route.ts            # Deprecar POST, mantener GET
└── settings/
    └── billing/
        └── page.tsx                    # Actualizar para cargar datos reales

components/
└── settings/
    └── billing/
        ├── billing-form.tsx            # Enviar FormData con archivos, manejar errores de subida
        ├── bank-info.tsx               # Soportar múltiples cuentas, pasar File al padre
        ├── document-upload.tsx         # NO subir inmediatamente, solo almacenar File en memoria
        ├── legal-info-natural.tsx      # Pasar File object al padre
        └── legal-info-legal.tsx        # Pasar File object al padre
```

### Archivos a eliminar

```
lib/
└── mocks/
    └── billing-loader.ts               # Ya no necesario

mocks/
└── billing/
    └── settings.json                   # Ya no necesario
```

---

## 7. Reglas estrictas para la AI Agent

- ❌ No inventar requisitos no especificados
- ❌ No modificar la documentación técnica (`DOCS_TECHNICAL.md`)
- ❌ No modificar el spec (`spec.md`)
- ❌ No optimizar sin justificación
- ❌ No asumir defaults no documentados
- ❌ No usar SDK de Supabase (usar fetch genérico)
- ✅ Preguntar ante ambigüedad
- ✅ Mantener consistencia con la spec
- ✅ Seguir patrones existentes del codebase (`lib/http/client.ts`, `lib/http/users/`)
- ✅ Usar componentes UI existentes de shadcn/ui
- ✅ Implementar SSR para validaciones de sesión/rol
- ✅ Consultar `specs/register/global-setting-curl.md` para ejemplos de peticiones
- ✅ Explicar decisiones complejas

---

## 8. Dependencias entre fases

```
Fase 1 (Tipos y Cliente HTTP)
    │
    └──► Fase 2 (API Routes)
              │
              └──► Fase 3 (Componentes UI)
                        │
                        └──► Fase 4 (Página)
                                  │
                                  └──► Fase 5 (Limpieza)
```

**Orden de ejecución obligatorio:**
1. Fase 1 debe completarse primero (tipos y cliente necesarios para todo lo demás)
2. Fase 2 después de Fase 1 (API routes usan el cliente)
3. Fase 3 después de Fase 2 (componentes consumen las APIs)
4. Fase 4 después de Fase 3 (página usa los componentes)
5. Fase 5 al final (limpieza solo cuando todo funcione)

---

## 9. Diagrama del Flujo de Guardado (v2.1)

```mermaid
sequenceDiagram
    participant User
    participant BillingForm
    participant DocumentUpload
    participant BFF as API Route
    participant Storage
    participant DB as Database

    User->>DocumentUpload: Selecciona archivo
    DocumentUpload->>DocumentUpload: Almacena File en memoria
    DocumentUpload-->>BillingForm: Notifica archivo listo (onFileChange)
    
    User->>BillingForm: Click "Guardar"
    BillingForm->>BillingForm: Valida formulario + documentos obligatorios
    BillingForm->>BFF: POST FormData (datos + archivos)
    
    BFF->>BFF: Valida sesión y datos
    BFF->>Storage: Sube documento 1
    Storage-->>BFF: OK path1
    BFF->>Storage: Sube documento 2
    Storage-->>BFF: OK path2
    
    alt Fallo en subida
        BFF->>Storage: DELETE path1 (rollback)
        BFF-->>BillingForm: Error DOCUMENT_UPLOAD_FAILED
        BillingForm-->>User: Muestra error, puede reintentar
    else Éxito
        BFF->>DB: Guarda perfil + cuenta + referencias docs
        DB-->>BFF: OK
        BFF-->>BillingForm: Success con datos actualizados
        BillingForm-->>User: Muestra éxito
    end
```

---

## 10. Headers HTTP Requeridos

### Para Consultas (GET)
```typescript
{
  "apikey": process.env.BACKEND_API_KEY,
  "Authorization": `Bearer ${process.env.BACKEND_API_KEY}`,
  "Accept-Profile": process.env.BACKEND_DB_SCHEMA
}
```

### Para Creación/Modificación (POST/PATCH)
```typescript
{
  "apikey": process.env.BACKEND_API_KEY,
  "Authorization": `Bearer ${process.env.BACKEND_API_KEY}`,
  "Content-Profile": process.env.BACKEND_DB_SCHEMA,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
}
```

### Para Storage
```typescript
{
  "apikey": process.env.BACKEND_API_KEY,
  "Authorization": `Bearer ${AUTH_TOKEN}`, // Token del usuario
  "Content-Type": "application/pdf" // o image/*
}
```

---

## 11. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Backend no disponible | Alto | Timeout de 10 segundos, mensajes de error claros, redirección a `/error` |
| Fallo en subida de archivos | Alto | **Rollback atómico**: si falla un documento, se eliminan los ya subidos y se retorna error `DOCUMENT_UPLOAD_FAILED`. Usuario puede reintentar |
| Archivos grandes en memoria | Medio | Límite de tamaño (10MB por archivo), validación en cliente antes de enviar |
| Timeout en subida múltiple | Medio | Aumentar `maxDuration` del endpoint a 60 segundos, subir archivos secuencialmente |
| Conflicto de activación de cuentas | Medio | Transacción en backend garantiza solo una activa |
| Migración de datos mock existentes | Bajo | Los mocks solo tenían datos de prueba, no hay migración necesaria |
| Componentes UI incompatibles | Bajo | Mantener estructura similar, solo cambiar fuente de datos |

---

## 12. Criterios de aceptación del plan

El plan se considera **aprobado** cuando:
- [x] Todas las preguntas de la sección 4 están resueltas
- [x] El alcance es claro y sin ambigüedad
- [x] Las fases están completas y ordenadas
- [x] Las restricciones están explícitas
- [x] Los archivos a crear/modificar/eliminar están listados
- [x] Las dependencias entre fases están definidas
- [x] Los headers HTTP están documentados

---

## 13. Criterios de aceptación de la implementación

La implementación se considera **completa** cuando:

### Funcionales
- [ ] Organizer puede crear perfil de facturación (natural o legal)
- [ ] Tipo de entidad se bloquea después de primer guardado
- [ ] Organizer puede agregar múltiples cuentas bancarias
- [ ] Solo una cuenta bancaria puede estar activa
- [ ] Activar una cuenta desactiva las demás automáticamente
- [ ] Documentos se envían junto con el formulario al guardar (no inmediatamente)
- [ ] Documentos se suben a Supabase Storage de forma atómica
- [ ] Si falla la subida de un documento, se hace rollback de los ya subidos
- [ ] Error `DOCUMENT_UPLOAD_FAILED` se muestra correctamente al usuario
- [ ] Documentos se organizan por `{user_id}/{document_type}/`
- [ ] Estado de verificación se muestra correctamente
- [ ] Cambios en datos bancarios resetean estado a "Pendiente"
- [ ] Verificación de elegibilidad funciona correctamente
- [ ] Validaciones de formato funcionan (documento, NIT, cuenta)

### Técnicos
- [ ] Cliente HTTP sigue patrón de `lib/http/users/`
- [ ] No se usa SDK de Supabase
- [ ] Headers HTTP configurados correctamente
- [ ] Endpoint POST usa `multipart/form-data`
- [ ] Rollback de archivos implementado en el BFF
- [ ] DocumentUpload no hace fetch directo a Storage
- [ ] BillingForm envía FormData con archivos
- [ ] Página usa SSR para validación de sesión/rol
- [ ] Mocks eliminados completamente
- [ ] No hay errores de TypeScript
- [ ] No hay errores de linting
- [ ] Componentes siguen patrones del codebase

---

## 14. Aprobación

- **Estado:** ⬜ Draft / ⬜ Aprobado  
- **Fecha:**  
- **Aprobado por:**

---

> 🧠 **Nota para la AI**  
> Este plan es vinculante.  
> Cualquier desviación requiere una actualización explícita del plan y nueva aprobación.
> 
> **Comenzar implementación solo después de aprobación explícita del humano.**
> 
> **Referencia de cURLs:** Consultar `specs/register/global-setting-curl.md` para ejemplos de peticiones al backend.
