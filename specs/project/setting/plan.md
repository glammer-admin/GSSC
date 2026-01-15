# Plan de Implementación – Creación y Edición de Proyecto

> **Rol del documento**  
Este archivo es el **contrato operativo** entre el humano y la(s) AI Agent(s).  
La AI **NO debe escribir código** hasta que este plan esté completo, validado y aprobado.

---

## 1. Contexto

### 1.1 Referencias obligatorias
- Especificación funcional: `./spec.md`
- Documento técnico principal: `../../DOCS_TECHNICAL.md`
- Documento funcional: `../../DOCS_FUNCTIONAL.md`
- Spec de billing (patrón de referencia): `../settings/provider/billing/`
- Ejemplos cURL del backend: `./example-curls/project-curl.md`

### 1.2 Objetivo del plan
Implementar las pantallas de **creación y edición de proyectos** para el rol Organizador, con **integración real al backend Supabase** (tabla `glam_projects` y bucket `project-logos`), siguiendo los patrones establecidos en el proyecto y respetando la arquitectura Server/Client Components de Next.js 15.

---

## 2. Alcance

### 2.1 Incluye
- Página de creación de proyecto (`/project/new`)
- Página de edición de proyecto (`/project/[id]/edit`)
- Componentes del formulario de proyecto
- Tipos TypeScript del dominio (alineados con backend)
- Cliente HTTP para proyectos (`lib/http/project/`)
- Cliente de Storage para logos (reutilizar/extender `storage-client.ts`)
- API Routes para CRUD de proyectos (conectadas al backend)
- Validaciones de formulario
- Modales de confirmación y advertencia
- Compresión de imagen del logo (client-side)
- Campo `public_code` visible en edición (solo lectura)

### 2.2 Excluye explícitamente
- Carga de productos
- Cálculo real de precios
- Tienda pública
- Gestión de pedidos
- Modificación masiva de productos
- Visualización del historial de cambios (gestionado por triggers del backend)

> ⚠️ Regla: todo lo no listado aquí se considera **fuera de alcance**.

---

## 3. Supuestos y restricciones

### 3.1 Supuestos
- El organizador ya está autenticado y tiene sesión válida
- El middleware ya valida el rol `organizer` para las rutas `/project/*`
- Los componentes UI de shadcn/ui están disponibles
- El patrón de cliente HTTP establecido en billing es replicable
- El backend Supabase está disponible y configurado
- El bucket `project-logos` existe en Supabase Storage
- La tabla `glam_projects` existe con la estructura definida en los curls

### 3.2 Restricciones técnicas
- **Framework**: Next.js 15.1.3 con App Router
- **React**: 19 con Server Components + Client Components
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 4.0
- **Componentes UI**: shadcn/ui (ya instalados)
- **Validación de sesión**: Server-side obligatorio
- **Cliente HTTP**: Solo en servidor (`lib/http/` nunca en client)
- **Autenticación**: Sesión en cookie HttpOnly
- **Backend**: Supabase REST API (tabla `glam_projects`)
- **Storage**: Supabase Storage (bucket `project-logos`)

---

## 4. Preguntas obligatorias para la AI (Checklist)

### ¿Qué problema de negocio se resuelve exactamente?
Los organizadores necesitan crear y configurar proyectos que agrupen productos para venta. Sin esta funcionalidad, no pueden iniciar operaciones en la plataforma.

### ¿Quiénes son los actores involucrados?
- **Organizador**: Usuario autenticado con rol `organizer`

### ¿Cuáles son las reglas de negocio críticas?
- **RN-01**: Nombre de proyecto único global
- **RN-02**: Nombre no editable después de creación
- **RN-03**: Nombre alfanumérico + espacios, máx 100 caracteres
- **RN-04**: Comisión entero 0-100
- **RN-05**: Al menos un modo de entrega para activar
- **RN-06**: Campos obligatorios para activar: nombre, tipo, comisión, modo de entrega
- **RN-07**: Estado inicial siempre "Borrador"
- **RN-08**: Proyecto finalizado no puede reactivarse
- **RN-12**: Logo máx 2MB, compresión automática si excede

### ¿Qué decisiones ya están tomadas y no deben cambiarse?
- Rutas: `/project/new` y `/project/[id]/edit`
- Estados: `draft`, `active`, `paused`, `finished`
- Tipos de proyecto: `sports_team`, `educational_institution`, `company`, `group`, `other`
- Modos de entrega: `organizer_location`, `customer_home`, `glam_urban_pickup` (selección única)
- Periodicidades: `weekly`, `biweekly`, `monthly`, `immediately`
- Formatos de logo: PNG, JPG, JPEG, WebP, SVG
- Bucket de logos: `project-logos`

### ¿Qué partes son configurables vs fijas?
**Configurables:**
- Comisión (0.00-100.00%)
- Packaging (Sí/No)
- Modo de entrega (uno solo, selección exclusiva)
- Estado (con restricciones de transición)
- Logo, descripción

**Fijas:**
- Nombre (después de creación)
- ID (UUID autogenerado por backend)
- public_code (autogenerado por backend)
- organizer_id (tomado de la sesión)

### ¿Qué escenarios de error deben contemplarse?
- Nombre duplicado (error del backend)
- Nombre con caracteres inválidos
- Nombre excede longitud
- Comisión fuera de rango (0-100)
- Sin modo de entrega al activar
- Logo formato inválido
- Logo excede tamaño (compresión automática si >2MB, error si >5MB)
- Transición de estado inválida
- Error de conexión con el backend (NetworkError)
- Error HTTP del backend (HttpError)
- Error al subir logo al Storage
- Proyecto no encontrado (404)
- Sin permisos para editar (403)

### ¿Qué no debe hacer el sistema bajo ningún caso?
- Permitir editar nombre después de creación
- Permitir editar public_code
- Reactivar proyecto finalizado
- Activar proyecto sin modo de entrega
- Exponer datos de proyectos de otros organizadores
- Ejecutar validaciones de sesión en cliente
- Importar `lib/http/*` en Client Components

---

## 5. Descomposición del trabajo

### Fase 1 – Dominio y Tipos (Actualizar)

#### 1.1 Actualizar tipos TypeScript (`lib/types/project/types.ts`)
- `ProjectStatus`: Tipo de estados (`draft`, `active`, `paused`, `finished`)
- `ProjectType`: Tipo backend (`sports_team`, `educational_institution`, `company`, `group`, `other`)
- `DeliveryType`: Tipo de entrega (`organizer_location`, `customer_home`, `glam_urban_pickup`)
- `DeliveryPeriodicity`: Periodicidades (`weekly`, `biweekly`, `monthly`, `immediately`)
- `DeliveryConfig`: Interfaz union según `delivery_type`
- `Project`: Interfaz alineada con `glam_projects`
- `CreateProjectDTO`: DTO para crear (POST)
- `UpdateProjectDTO`: DTO para actualizar (PATCH)
- `BackendProject`: Tipo de respuesta del backend

#### 1.2 Constantes del dominio (actualizar)
- Mapeo de tipos de proyecto (frontend label ↔ backend value)
- Lista de periodicidades con labels
- Estados con labels y colores
- Configuración de transiciones válidas
- Formatos de imagen permitidos (incluir SVG)
- Tamaño máximo de logo (2MB compresión, 5MB límite)
- Nombre del bucket: `project-logos`

### Fase 2 – Cliente HTTP para Proyectos

#### 2.1 Crear cliente de proyectos (`lib/http/project/`)
- `project-client.ts`: Cliente HTTP para `glam_projects`
  - `getProjects(organizerId)`: GET con filtro
  - `getProjectById(id)`: GET por ID
  - `createProject(data)`: POST
  - `updateProject(id, data)`: PATCH
  - Manejo de errores (HttpError, NetworkError)

#### 2.2 Extender cliente de Storage
- Evaluar si reutilizar `lib/http/billing/storage-client.ts`
- Opción A: Hacer genérico el cliente existente (pasar bucket como parámetro)
- Opción B: Crear `lib/http/project/project-storage-client.ts`
- Funciones necesarias:
  - `uploadLogo(projectId, file, filename)`: Subir logo
  - `updateLogo(projectId, file, filename)`: Actualizar logo (upsert)
  - `deleteLogo(projectId)`: Eliminar logo
  - `getLogoUrl(projectId, extension)`: Obtener URL pública

#### 2.3 Index y exports (`lib/http/project/index.ts`)
- Export de `getProjectClient()`
- Export de funciones de storage
- Re-export de errores

### Fase 3 – API Routes (Backend Real)

#### 3.1 Endpoint de creación (`app/api/project/route.ts`)
- POST: Crear nuevo proyecto
  - Validar sesión con `getSession()`
  - Verificar rol `organizer`
  - Parsear FormData (datos JSON + logo file)
  - Llamar a `projectClient.createProject()`
  - Si hay logo, subirlo al Storage con el ID retornado
  - Retornar proyecto creado

#### 3.2 Endpoint de edición (`app/api/project/[id]/route.ts`)
- GET: Obtener proyecto por ID
  - Validar sesión y rol
  - Verificar que `organizer_id` coincida con `userId`
  - Retornar proyecto
- PATCH: Actualizar proyecto
  - Validar sesión y rol
  - Verificar propiedad
  - Validar transiciones de estado
  - Actualizar en backend
  - Si hay nuevo logo, subirlo con upsert
  - Retornar proyecto actualizado

### Fase 4 – Componentes de UI (Actualizar)

#### 4.1 Componentes de formulario (actualizar)
- `components/project/project-form.tsx`: Formulario principal (Client Component)
  - Actualizar para enviar a API Route real
  - Manejar errores de backend
  - Mostrar `public_code` en modo edición (solo lectura)
- `components/project/basic-info-section.tsx`: Sección información básica
  - Campo `public_code` visible pero deshabilitado en edición
  - Mapear tipos de proyecto al formato backend
- `components/project/commission-section.tsx`: Sección comisión
  - Cambiar a decimal (0.00-100.00)
- `components/project/packaging-section.tsx`: Sección packaging (sin cambios)
- `components/project/delivery-modes-section.tsx`: **Refactorizar a selección única**
  - Cambiar de checkboxes a radio buttons
  - Un solo modo de entrega activo
- `components/project/delivery-venue-config.tsx`: Config entrega en sede
  - Mapear `periodicity` a valores backend (`immediately` en lugar de `asap`)
- `components/project/delivery-home-config.tsx`: Config entrega a domicilio
  - Mapear a `delivery_fee_type`: `charged_to_customer` | `included_in_price`
- `components/project/delivery-pickup-config.tsx`: Config recolección
  - `delivery_config` = null
- `components/project/status-section.tsx`: Sección estado (sin cambios)
- `components/project/logo-upload.tsx`: Carga de logo con compresión
  - Agregar SVG a formatos permitidos
  - Actualizar límite a 5MB (bucket) con compresión a 2MB

#### 4.2 Componentes de modales (sin cambios)
- `components/project/confirm-cancel-modal.tsx`: Confirmación de cancelar
- `components/project/warning-modal.tsx`: Advertencias de cambios

#### 4.3 Utilidades (sin cambios)
- `lib/utils/image-compressor.ts`: Compresión de imágenes client-side

### Fase 5 – Páginas (Actualizar)

#### 5.1 Página de creación
- `app/project/new/page.tsx` (Server Component)
  - Validar sesión con `getSession()`
  - Verificar rol organizador
  - Renderizar formulario vacío (sin `public_code`)

#### 5.2 Página de edición
- `app/project/[id]/edit/page.tsx` (Server Component)
  - Validar sesión
  - Cargar proyecto desde backend via API Route interna o cliente directo
  - Verificar propiedad (`organizer_id === userId`)
  - Pasar datos al formulario incluyendo `public_code`
  - Manejar 404 y 403

### Fase 6 – Validación y Testing

#### 6.1 Validaciones de formulario
- Validación de nombre (regex, longitud)
- Validación de comisión (decimal, rango 0-100)
- Validación de modo de entrega (uno requerido para activar)
- Validación de transiciones de estado
- Validación de `delivery_config` según `delivery_type`

#### 6.2 Casos límite
- Nombre solo con espacios
- Comisión en límites (0.00, 100.00)
- Logo exactamente 2MB (no comprimir)
- Logo entre 2MB y 5MB (comprimir)
- Logo mayor a 5MB (error)
- Error de conexión al guardar
- Error de unicidad en nombre

### Fase 7 – Limpieza

#### 7.1 Eliminar mocks
- Eliminar `mocks/project/projects.json`
- Eliminar `lib/mocks/project-loader.ts`
- Actualizar imports en componentes/páginas

---

## 6. Archivos y estructura esperada

> La AI **NO puede crear archivos fuera de esta lista**.

```
/app/
  /project/
    /new/
      page.tsx                    # Server Component - Crear proyecto
    /[id]/
      /edit/
        page.tsx                  # Server Component - Editar proyecto

/app/api/
  /project/
    route.ts                      # POST: Crear proyecto
    /[id]/
      route.ts                    # GET, PATCH: Obtener/Actualizar proyecto

/components/
  /project/
    project-form.tsx              # Client Component - Formulario principal (ACTUALIZAR)
    basic-info-section.tsx        # Sección información básica (ACTUALIZAR)
    commission-section.tsx        # Sección comisión (ACTUALIZAR)
    packaging-section.tsx         # Sección packaging
    delivery-modes-section.tsx    # Sección modo de entrega (REFACTORIZAR - selección única)
    delivery-venue-config.tsx     # Config entrega en sede (ACTUALIZAR)
    delivery-home-config.tsx      # Config entrega a domicilio (ACTUALIZAR)
    delivery-pickup-config.tsx    # Config recolección (ACTUALIZAR)
    status-section.tsx            # Sección estado
    logo-upload.tsx               # Carga de logo (ACTUALIZAR)
    confirm-cancel-modal.tsx      # Modal cancelar
    warning-modal.tsx             # Modal advertencias

/lib/
  /http/
    /project/
      project-client.ts           # Cliente HTTP para glam_projects (NUEVO)
      project-storage-client.ts   # Cliente Storage para project-logos (NUEVO o extender existente)
      types.ts                    # Tipos de backend (NUEVO)
      index.ts                    # Exports (NUEVO)
  /types/
    /project/
      types.ts                    # Tipos del dominio (ACTUALIZAR)
  /utils/
    image-compressor.ts           # Compresión de imágenes

# ARCHIVOS A ELIMINAR (fase de limpieza)
# /mocks/project/projects.json
# /lib/mocks/project-loader.ts
```

---

## 7. Reglas estrictas para la AI Agent

- ❌ No inventar requisitos
- ❌ No modificar la documentación técnica
- ❌ No optimizar sin justificación
- ❌ No asumir defaults no especificados
- ❌ No importar `lib/http/*` en Client Components
- ❌ No ejecutar validaciones de sesión en cliente
- ✅ Preguntar ante ambigüedad
- ✅ Mantener consistencia con la spec
- ✅ Explicar decisiones complejas
- ✅ Seguir patrones de `billing-form.tsx` para formularios
- ✅ Usar `getSession()` en Server Components
- ✅ Validar rol antes de renderizar

---

## 8. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Compresión de imagen falla en algunos navegadores | Medio | Fallback a error con mensaje claro |
| Validación de nombre único requiere llamada async | Bajo | Debounce en el input + indicador de carga |
| Formulario largo puede ser confuso | Medio | Dividir en secciones claras con Cards |
| Pérdida de datos al cancelar | Alto | Modal de confirmación + localStorage temporal |
| Estado inconsistente entre cliente y servidor | Medio | Revalidar después de cada operación |
| Error de conexión con backend | Alto | Mostrar error claro, mantener datos en formulario |
| Logo se sube pero proyecto falla | Medio | No subir logo hasta tener ID del proyecto creado |
| Proyecto se crea pero logo falla | Bajo | Proyecto queda sin logo, mostrar mensaje informativo |
| Timeout en subida de logo grande | Medio | Compresión obligatoria >2MB, límite 5MB |

---

## 9. Patrones a seguir (referencias del proyecto)

### Patrón de formulario (billing-form.tsx)
- Estado local con `useState` para cada sección
- Objeto de errores tipado
- Función `validateForm()` que retorna boolean
- `handleSubmit` async con try/catch
- Envío via `fetch` a API Route interna
- FormData para archivos (multipart/form-data)
- Toast para feedback
- Secciones en Cards separados
- Botón de guardar deshabilitado durante submit

### Patrón de tipos (billing/types.ts)
- Tipos base como `type` o `enum`
- Interfaces para entidades completas
- DTOs separados para input (Create, Update)
- Constantes con labels para selects
- Configuración de estados con colores y mensajes
- Mapeo frontend ↔ backend

### Patrón de cliente HTTP (billing-client.ts)
- Clase singleton con lazy initialization
- Headers separados para read (`Accept-Profile`) y write (`Content-Profile`)
- Métodos CRUD tipados
- Manejo de errores (HttpError, NetworkError)
- Logs de debug con emojis

### Patrón de Storage (storage-client.ts)
- Configuración desde variables de entorno
- Construcción de paths: `{entity_id}/{filename}`
- Headers con `x-upsert: true` para actualizar
- Manejo de errores con resultado estructurado

### Patrón de API Route (billing/route.ts)
- Validar sesión con `getSession()`
- Verificar `isCompleteSession()`
- Verificar rol
- Parsear FormData si hay archivos
- Llamar a cliente HTTP
- Subir archivos al Storage
- Manejo de errores con códigos específicos

### Patrón de página protegida
```typescript
// Server Component
import { getSession, isCompleteSession } from "@/lib/auth/session-manager"
import { redirect } from "next/navigation"

export default async function Page() {
  const session = await getSession()
  if (!session || !isCompleteSession(session) || session.role !== "organizer") {
    redirect("/")
  }
  // ... cargar datos via cliente HTTP y renderizar
}
```

---

## 10. Orden de implementación recomendado

1. **Tipos actualizados** (`lib/types/project/types.ts`) - Alinear con backend
2. **Cliente HTTP** (`lib/http/project/project-client.ts`)
3. **Cliente Storage** (`lib/http/project/project-storage-client.ts` o extender existente)
4. **API Routes** (`app/api/project/route.ts`, `app/api/project/[id]/route.ts`)
5. **Componentes de sección** (actualizar uno por uno)
   - `delivery-modes-section.tsx` (refactorizar a selección única)
   - `basic-info-section.tsx` (agregar public_code)
   - `commission-section.tsx` (decimal)
   - Resto de componentes
6. **Formulario principal** (`project-form.tsx`) - Conectar a API real
7. **Páginas** (actualizar new, edit)
8. **Limpieza** - Eliminar mocks y loader
9. **Testing manual** - Verificar flujo completo

---

## 11. Criterios de aceptación del plan

El plan se considera **aprobado** cuando:
- [x] Todas las preguntas de la sección 4 están resueltas
- [x] El alcance es claro y sin ambigüedad
- [x] Las fases están completas
- [x] Las restricciones están explícitas
- [x] Los archivos están listados
- [x] Los patrones de referencia están identificados

---

## 12. Aprobación

- Estado: ⬜ Draft / ⬜ Aprobado  
- Fecha: 2026-01-14
- Aprobado por: _Pendiente_
- Versión: 2.0 (Integración con backend real)

---

> 🧠 **Nota para la AI**  
Este plan es vinculante.  
Cualquier desviación requiere una actualización explícita del plan y nueva aprobación.

---

## Changelog

### v2.0 (2026-01-14)
- Eliminación de fase mock, integración directa con backend Supabase
- Cambio de múltiples modos de entrega a selección única
- Mapeo de campos al formato del backend (`glam_projects`)
- Integración con Storage (`project-logos` bucket)
- Campo `public_code` visible en edición
- Nuevos clientes HTTP: `project-client.ts`, `project-storage-client.ts`
- Eliminación de `mocks/project/` y `lib/mocks/project-loader.ts`

### v1.0 (2025-12-18)
- Versión inicial con mocks
