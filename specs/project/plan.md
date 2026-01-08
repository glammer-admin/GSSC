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

### 1.2 Objetivo del plan
Implementar las pantallas de **creación y edición de proyectos** para el rol Organizador, siguiendo los patrones establecidos en el proyecto y respetando la arquitectura Server/Client Components de Next.js 15.

---

## 2. Alcance

### 2.1 Incluye
- Página de creación de proyecto (`/project/new`)
- Página de edición de proyecto (`/project/[id]/edit`)
- Componentes del formulario de proyecto
- Tipos TypeScript del dominio
- Mock loader para datos de proyecto
- Datos mock JSON para desarrollo
- API Route para guardar proyecto (mock)
- Validaciones de formulario
- Modales de confirmación y advertencia
- Compresión de imagen del logo (client-side)

### 2.2 Excluye explícitamente
- Integración real con backend (fase mock)
- Carga de productos
- Cálculo real de precios
- Tienda pública
- Gestión de pedidos
- Modificación masiva de productos

> ⚠️ Regla: todo lo no listado aquí se considera **fuera de alcance**.

---

## 3. Supuestos y restricciones

### 3.1 Supuestos
- El organizador ya está autenticado y tiene sesión válida
- El middleware ya valida el rol `organizer` para las rutas `/project/*`
- Los componentes UI de shadcn/ui están disponibles
- El patrón de mocks establecido en billing es replicable

### 3.2 Restricciones técnicas
- **Framework**: Next.js 15.1.3 con App Router
- **React**: 19 con Server Components + Client Components
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 4.0
- **Componentes UI**: shadcn/ui (ya instalados)
- **Validación de sesión**: Server-side obligatorio
- **Cliente HTTP**: Solo en servidor (`lib/http/` nunca en client)
- **Autenticación**: Sesión en cookie HttpOnly

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
- Estados: Borrador, Activo, Pausado, Finalizado
- Tipos de proyecto: Equipo, Institución, Empresa, Grupo, Otro
- Periodicidades: Semanal, Quincenal, Mensual, Lo más pronto posible
- Formatos de logo: PNG, JPG, JPEG, WebP

### ¿Qué partes son configurables vs fijas?
**Configurables:**
- Comisión (0-100%)
- Packaging (Sí/No)
- Modos de entrega (múltiples)
- Estado (con restricciones de transición)
- Logo, descripción

**Fijas:**
- Nombre (después de creación)
- ID (autogenerado)
- Tipo de entidad (después de creación)

### ¿Qué escenarios de error deben contemplarse?
- Nombre duplicado
- Nombre con caracteres inválidos
- Nombre excede longitud
- Comisión fuera de rango
- Comisión con decimales
- Sin modo de entrega al activar
- Logo formato inválido
- Logo excede tamaño (compresión automática)
- Transición de estado inválida

### ¿Qué no debe hacer el sistema bajo ningún caso?
- Permitir editar nombre después de creación
- Reactivar proyecto finalizado
- Activar proyecto sin modo de entrega
- Exponer datos de proyectos de otros organizadores
- Ejecutar validaciones de sesión en cliente

---

## 5. Descomposición del trabajo

### Fase 1 – Dominio y Tipos

#### 1.1 Definir tipos TypeScript
- `ProjectStatus`: Enum de estados (draft, active, paused, finished)
- `ProjectType`: Enum de tipos de proyecto
- `DeliveryPeriodicity`: Enum de periodicidades
- `DeliveryMode`: Interfaz para modos de entrega
- `Project`: Interfaz completa del proyecto
- `ProjectInput`: DTO para crear/actualizar
- `ProjectResponse`: Respuesta del API

#### 1.2 Constantes del dominio
- Lista de tipos de proyecto con labels
- Lista de periodicidades con labels
- Estados con labels y colores
- Configuración de transiciones válidas
- Formatos de imagen permitidos
- Tamaño máximo de logo

### Fase 2 – Mock Data y Loaders

#### 2.1 Crear estructura de mocks
- `mocks/project/projects.json`: Lista de proyectos mock
- `mocks/project/project-detail.json`: Detalle de proyecto individual

#### 2.2 Implementar loader
- `lib/mocks/project-loader.ts`: Funciones para cargar mocks
  - `getProjects(organizerId)`: Lista de proyectos
  - `getProjectById(id)`: Proyecto por ID
  - `createProject(input)`: Crear proyecto (mock)
  - `updateProject(id, input)`: Actualizar proyecto (mock)

### Fase 3 – API Routes

#### 3.1 Endpoint de creación
- `app/api/project/route.ts`
  - POST: Crear nuevo proyecto
  - Validar sesión vía headers del middleware
  - Validar nombre único (mock)
  - Retornar proyecto creado

#### 3.2 Endpoint de edición
- `app/api/project/[id]/route.ts`
  - GET: Obtener proyecto por ID
  - PUT: Actualizar proyecto
  - Validar propiedad del proyecto
  - Validar transiciones de estado

### Fase 4 – Componentes de UI

#### 4.1 Componentes de formulario
- `components/project/project-form.tsx`: Formulario principal (Client Component)
- `components/project/basic-info-section.tsx`: Sección información básica
- `components/project/commission-section.tsx`: Sección comisión
- `components/project/packaging-section.tsx`: Sección packaging
- `components/project/delivery-modes-section.tsx`: Sección modos de entrega
- `components/project/delivery-venue-config.tsx`: Config entrega en sede
- `components/project/delivery-home-config.tsx`: Config entrega a domicilio
- `components/project/delivery-pickup-config.tsx`: Config recolección
- `components/project/status-section.tsx`: Sección estado
- `components/project/logo-upload.tsx`: Carga de logo con compresión

#### 4.2 Componentes de modales
- `components/project/confirm-cancel-modal.tsx`: Confirmación de cancelar
- `components/project/warning-modal.tsx`: Advertencias de cambios

#### 4.3 Utilidades
- `lib/utils/image-compressor.ts`: Compresión de imágenes client-side

### Fase 5 – Páginas

#### 5.1 Página de creación
- `app/project/new/page.tsx` (Server Component)
  - Validar sesión con `getSession()`
  - Verificar rol organizador
  - Renderizar formulario vacío

#### 5.2 Página de edición
- `app/project/[id]/edit/page.tsx` (Server Component)
  - Validar sesión
  - Cargar proyecto por ID
  - Verificar propiedad
  - Pasar datos al formulario

### Fase 6 – Validación y Testing

#### 6.1 Validaciones de formulario
- Validación de nombre (regex, longitud, unicidad)
- Validación de comisión (entero, rango)
- Validación de modos de entrega
- Validación de transiciones de estado

#### 6.2 Casos límite
- Nombre solo con espacios
- Comisión en límites (0, 100)
- Logo exactamente 2MB
- Múltiples modos de entrega

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
      route.ts                    # GET, PUT: Obtener/Actualizar proyecto

/components/
  /project/
    project-form.tsx              # Client Component - Formulario principal
    basic-info-section.tsx        # Sección información básica
    commission-section.tsx        # Sección comisión
    packaging-section.tsx         # Sección packaging
    delivery-modes-section.tsx    # Sección modos de entrega
    delivery-venue-config.tsx     # Config entrega en sede
    delivery-home-config.tsx      # Config entrega a domicilio
    delivery-pickup-config.tsx    # Config recolección
    status-section.tsx            # Sección estado
    logo-upload.tsx               # Carga de logo
    confirm-cancel-modal.tsx      # Modal cancelar
    warning-modal.tsx             # Modal advertencias

/lib/
  /types/
    /project/
      types.ts                    # Tipos del dominio
  /mocks/
    project-loader.ts             # Loader de mocks
  /utils/
    image-compressor.ts           # Compresión de imágenes

/mocks/
  /project/
    projects.json                 # Lista de proyectos mock
    project-detail.json           # Detalle de proyecto
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

---

## 9. Patrones a seguir (referencias del proyecto)

### Patrón de formulario (billing-form.tsx)
- Estado local con `useState` para cada sección
- Objeto de errores tipado
- Función `validateForm()` que retorna boolean
- `handleSubmit` async con try/catch
- Toast para feedback
- Secciones en Cards separados
- Botón de guardar deshabilitado durante submit

### Patrón de tipos (billing/types.ts)
- Tipos base como `type` o `enum`
- Interfaces para entidades completas
- DTOs separados para input
- Constantes con labels para selects
- Configuración de estados con colores y mensajes

### Patrón de loader (billing-loader.ts)
- Funciones async que leen JSON
- Simulación de delay para realismo
- Tipado estricto de retorno

### Patrón de página protegida
```typescript
// Server Component
import { getSession } from "@/lib/auth/server-utils"
import { redirect } from "next/navigation"

export default async function Page() {
  const session = await getSession()
  if (!session || session.role !== "organizer") {
    redirect("/")
  }
  // ... cargar datos y renderizar
}
```

---

## 10. Orden de implementación recomendado

1. **Tipos** (`lib/types/project/types.ts`)
2. **Mocks JSON** (`mocks/project/*.json`)
3. **Loader** (`lib/mocks/project-loader.ts`)
4. **Utilidad de compresión** (`lib/utils/image-compressor.ts`)
5. **Componentes de sección** (uno por uno)
6. **Modales**
7. **Formulario principal** (`project-form.tsx`)
8. **API Routes**
9. **Páginas** (new, edit)
10. **Actualizar `create-project-button.tsx`** (ajustar ruta si es necesario)

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
- Fecha: 2025-12-18
- Aprobado por: _Pendiente_

---

> 🧠 **Nota para la AI**  
Este plan es vinculante.  
Cualquier desviación requiere una actualización explícita del plan y nueva aprobación.

