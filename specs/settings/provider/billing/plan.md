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

### 1.2 Objetivo del plan
Implementar el módulo de **Configuración de Facturación y Pagos** que permite a los Organizers registrar su información legal, de contacto y bancaria para poder recibir pagos por las ventas realizadas en la plataforma.

---

## 2. Alcance

### 2.1 Incluye
- Página Server Component en `/settings/billing`
- Formulario de configuración de facturación (Client Component)
- Selección de tipo de entidad (Persona Natural / Persona Jurídica)
- Secciones dinámicas según tipo de entidad:
  - Información Legal
  - Datos de Contacto
  - Información Bancaria
  - Documentos Soporte (mock/placeholder)
- Visualización del estado de verificación de cuenta bancaria
- Autocompletado de datos desde `user-data` (si disponible) para Persona Natural
- Sistema de mocks para persistencia temporal
- Estructura base del menú de Settings con parámetro `visible`
- Actualización del middleware para permitir acceso a `/settings/*` para rol `organizer`
- Actualización de la configuración de menú

### 2.2 Excluye explícitamente
- Integración real con backend/Supabase (se usarán mocks)
- Carga real de archivos a storage (placeholder visual)
- Proceso de verificación de cuentas (backoffice)
- Ejecución de transferencias/pagos
- Otras páginas del menú Settings (Perfil, Seguridad, etc.)
- Creación de endpoints para setear datos adicionales en sesión

> ⚠️ Regla: todo lo no listado aquí se considera **fuera de alcance**.

---

## 3. Supuestos y restricciones

### 3.1 Supuestos
- El usuario con rol `organizer` ya está autenticado con sesión completa
- Los datos de `user-data` (name, phone_number, delivery_address) pueden o no existir en la sesión; si no existen, se solicitan al usuario
- El sistema de mocks es suficiente para esta fase de desarrollo
- Los componentes UI de shadcn/ui están disponibles y configurados

### 3.2 Restricciones técnicas
- **Framework:** Next.js 15.1.3 con App Router
- **Renderizado:** Server-Side Rendering obligatorio para validaciones
- **Lenguaje:** TypeScript 5
- **Estilos:** Tailwind CSS 4.0
- **Componentes UI:** shadcn/ui existentes en `/components/ui/`
- **Autenticación:** Sistema de sesiones existente (`lib/auth/session-manager`)
- **Cliente HTTP:** Solo en servidor (patrón existente en `lib/http/`)
- **Archivos:** Mock/placeholder (sin storage real)

---

## 4. Respuestas a preguntas obligatorias

| Pregunta | Respuesta |
|----------|-----------|
| ¿Qué problema de negocio se resuelve? | Permitir a Organizers configurar datos fiscales y bancarios para recibir pagos de sus ventas |
| ¿Quiénes son los actores involucrados? | Organizer (usuario con rol `organizer`) |
| ¿Cuáles son las reglas de negocio críticas? | RN-01 a RN-10 definidas en spec.md (tipo entidad inmutable, documentos obligatorios, estado verificación, etc.) |
| ¿Qué decisiones ya están tomadas? | Ruta `/settings/billing`, mocks para backend y archivos, estructura menú con `visible` |
| ¿Qué partes son configurables vs fijas? | Fijo: estructura de formulario, campos obligatorios. Configurable: datos precargados desde user-data |
| ¿Qué escenarios de error deben contemplarse? | Validación de campos, formatos de archivo, tipo de entidad bloqueado |
| ¿Qué no debe hacer el sistema? | Ejecutar pagos, verificar cuentas, almacenar archivos realmente, cambiar tipo de entidad una vez guardado |

---

## 5. Descomposición del trabajo

### Fase 1 – Infraestructura y Routing

#### 1.1 Actualizar middleware para rutas `/settings/*`
- Agregar `/settings` a `ROLE_ROUTES.organizer`
- Mantener validación de sesión completa

#### 1.2 Crear estructura de menú Settings
- Crear tipo `SettingsMenuItem` con propiedad `visible`
- Crear configuración de submenú en `lib/settings-menu-config.ts`
- Items: Perfil (visible: false), Facturación (visible: true), Seguridad (visible: false), etc.

#### 1.3 Actualizar menú principal de Organizer
- Modificar `lib/menu-config.ts` para apuntar a `/settings/billing`
- Actualizar `config/menu-roles.json`

### Fase 2 – Tipos y Mocks

#### 2.1 Definir tipos del dominio
- Crear `lib/types/billing/types.ts` con:
  - `EntityType`: "natural" | "legal"
  - `DocumentType`: "cedula_ciudadania" | "cedula_extranjeria"
  - `AccountType`: "savings" | "checking" | "wallet"
  - `VerificationStatus`: "pending" | "verified" | "rejected"
  - `BillingSettings` (modelo completo)
  - DTOs para crear/actualizar

#### 2.2 Crear sistema de mocks
- Crear `lib/mocks/billing-loader.ts`
- Funciones: `loadBillingSettings()`, `saveBillingSettings()`
- Crear `mocks/billing/settings.json` (datos iniciales vacíos)

### Fase 3 – Componentes UI

#### 3.1 Crear layout de Settings
- Crear `app/settings/layout.tsx` (Server Component)
- Validar sesión y rol `organizer`
- Incluir navegación lateral del submenú Settings

#### 3.2 Crear componente de navegación Settings
- Crear `components/settings/settings-sidebar.tsx` (Client Component)
- Renderizar items según `visible`
- Marcar item activo

#### 3.3 Crear página de Billing
- Crear `app/settings/billing/page.tsx` (Server Component)
- Validar sesión
- Cargar datos de mocks
- Cargar `user-data` si disponible
- Pasar datos a formulario

#### 3.4 Crear formulario de Billing
- Crear `components/settings/billing/billing-form.tsx` (Client Component)
- Secciones:
  - Selector de tipo de entidad
  - Información Legal (condicional)
  - Datos de Contacto
  - Información Bancaria
  - Documentos Soporte (placeholder)
  - Estado de Verificación

#### 3.5 Crear subcomponentes del formulario
- `components/settings/billing/entity-type-selector.tsx`
- `components/settings/billing/legal-info-natural.tsx`
- `components/settings/billing/legal-info-legal.tsx`
- `components/settings/billing/contact-info.tsx`
- `components/settings/billing/bank-info.tsx`
- `components/settings/billing/document-upload.tsx` (placeholder)
- `components/settings/billing/verification-status.tsx`

### Fase 4 – API Routes

#### 4.1 Crear endpoint para guardar configuración
- Crear `app/api/settings/billing/route.ts`
- Métodos: GET (obtener), POST (crear/actualizar)
- Validar sesión y rol
- Usar mocks para persistencia

### Fase 5 – Validaciones y UX

#### 5.1 Implementar validaciones frontend
- Campos obligatorios según tipo de entidad
- Formato de email
- Formatos de archivo permitidos (visual, sin upload real)

#### 5.2 Implementar estados de UI
- Loading states
- Error states
- Success feedback (toast)
- Bloqueo de tipo de entidad después de guardar

#### 5.3 Implementar autocompletado
- Checkbox "Usar datos de mi perfil"
- Precargar desde `user-data` si disponible
- Campos editables después de precargar

---

## 6. Archivos y estructura esperada

> La AI **NO puede crear archivos fuera de esta lista**.

### Nuevos archivos a crear

```
app/
├── settings/
│   ├── layout.tsx                          # Layout con sidebar
│   └── billing/
│       └── page.tsx                        # Página principal

app/api/
└── settings/
    └── billing/
        └── route.ts                        # API endpoint

components/
└── settings/
    ├── settings-sidebar.tsx                # Navegación lateral
    └── billing/
        ├── billing-form.tsx                # Formulario principal
        ├── entity-type-selector.tsx        # Selector Natural/Jurídica
        ├── legal-info-natural.tsx          # Info legal persona natural
        ├── legal-info-legal.tsx            # Info legal persona jurídica
        ├── contact-info.tsx                # Datos de contacto
        ├── bank-info.tsx                   # Información bancaria
        ├── document-upload.tsx             # Placeholder carga archivos
        └── verification-status.tsx         # Indicador de estado

lib/
├── settings-menu-config.ts                 # Config submenú settings
├── types/
│   └── billing/
│       └── types.ts                        # Tipos del dominio
└── mocks/
    └── billing-loader.ts                   # Funciones de mock

mocks/
└── billing/
    └── settings.json                       # Datos mock iniciales
```

### Archivos a modificar

```
middleware.ts                               # Agregar /settings a rutas organizer
lib/menu-config.ts                          # Actualizar href de Configuración
config/menu-roles.json                      # Actualizar href de Configuración
```

---

## 7. Reglas estrictas para la AI Agent

- ❌ No inventar requisitos no especificados
- ❌ No modificar la documentación técnica (`DOCS_TECHNICAL.md`)
- ❌ No modificar el spec (`spec.md`)
- ❌ No optimizar sin justificación
- ❌ No asumir defaults no documentados
- ❌ No implementar carga real de archivos
- ❌ No integrar con backend real (solo mocks)
- ❌ No crear endpoints para setear datos en sesión
- ✅ Preguntar ante ambigüedad
- ✅ Mantener consistencia con la spec
- ✅ Seguir patrones existentes del codebase
- ✅ Usar componentes UI existentes de shadcn/ui
- ✅ Implementar SSR para validaciones de sesión/rol
- ✅ Explicar decisiones complejas

---

## 8. Dependencias entre fases

```
Fase 1 (Infraestructura)
    │
    ├──► Fase 2 (Tipos y Mocks)
    │        │
    │        └──► Fase 3 (Componentes UI)
    │                  │
    │                  └──► Fase 4 (API Routes)
    │                            │
    │                            └──► Fase 5 (Validaciones)
```

**Orden de ejecución obligatorio:**
1. Fase 1 debe completarse primero (routing funcional)
2. Fase 2 antes de Fase 3 (tipos necesarios para componentes)
3. Fase 3 y 4 pueden ejecutarse en paralelo parcialmente
4. Fase 5 al final (requiere todo lo anterior)

---

## 9. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| `user-data` no disponible en sesión | Medio | Formulario solicita todos los datos; autocompletado es opcional |
| Componentes UI faltantes | Bajo | Usar componentes base de shadcn/ui existentes |
| Conflicto con rutas existentes | Medio | Verificar middleware antes de implementar |
| Pérdida de datos mock al reiniciar | Bajo | Aceptable para fase de desarrollo |

---

## 10. Criterios de aceptación del plan

El plan se considera **aprobado** cuando:
- [x] Todas las preguntas de la sección 4 están resueltas
- [x] El alcance es claro y sin ambigüedad
- [x] Las fases están completas y ordenadas
- [x] Las restricciones están explícitas
- [x] Los archivos a crear/modificar están listados
- [x] Las dependencias entre fases están definidas

---

## 11. Criterios de aceptación de la implementación

La implementación se considera **completa** cuando:

### Funcionales
- [ ] Organizer puede acceder a `/settings/billing` desde el menú
- [ ] Organizer puede seleccionar tipo de entidad (Natural/Jurídica)
- [ ] Formulario muestra campos correctos según tipo de entidad
- [ ] Persona Natural puede usar autocompletado si `user-data` existe
- [ ] Todos los campos obligatorios se validan antes de guardar
- [ ] Placeholder de carga de documentos es visible
- [ ] Estado de verificación se muestra correctamente
- [ ] Tipo de entidad se bloquea después de primer guardado
- [ ] Cambios en datos bancarios resetean estado a "Pendiente"

### Técnicos
- [ ] Página usa SSR para validación de sesión/rol
- [ ] Middleware permite acceso a `/settings/*` para `organizer`
- [ ] Mocks funcionan correctamente
- [ ] No hay errores de TypeScript
- [ ] No hay errores de linting
- [ ] Componentes siguen patrones del codebase

---

## 12. Aprobación

- **Estado:** ⬜ Draft / ⬜ Aprobado  
- **Fecha:**  
- **Aprobado por:**

---

> 🧠 **Nota para la AI**  
> Este plan es vinculante.  
> Cualquier desviación requiere una actualización explícita del plan y nueva aprobación.
> 
> **Comenzar implementación solo después de aprobación explícita del humano.**

