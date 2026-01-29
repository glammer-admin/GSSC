# Plan de Implementación – Home del Proyecto (Organizer)

> **Rol del documento**  
Este archivo es el **contrato operativo** entre el humano y la(s) AI Agent(s).  
La AI **NO debe escribir código** hasta que este plan esté completo, validado y aprobado.

---

## 1. Contexto

### 1.1 Referencias obligatorias
- Documento técnico principal: `DOCS_TECHNICAL.md` (raíz del proyecto)
- Spec de esta funcionalidad: `specs/project/home-project/spec.md`
- Definición funcional: `specs/project/home-project/definicion_funcional_gestion_de_proyecto_organizer.md`
- Otras specs relevantes: `specs/dashboard/organizer/` (dashboard organizer), `specs/project/setting/` (creación/edición de proyecto), modelo de datos `data-model.md`

### 1.2 Objetivo del plan
Describir **qué se va a construir** (vista de gestión de proyecto para organizer en `/project/{project_public_code}`), **cómo** (SSR, validación de propietario, reutilización de componentes existentes) y **en qué orden**, respetando estrictamente la spec y la documentación técnica.

---

## 2. Alcance

### 2.1 Incluye
- Rutas y páginas para `/project/{project_public_code}`, `/project/{project_public_code}/product/`, `/project/{project_public_code}/edit` (y sección Home/Dashboard en la raíz del proyecto).
- Validación de sesión, rol organizer y propiedad del proyecto (`organizer_id`) en servidor antes de renderizar.
- Redirección a la pantalla genérica 404 cuando el proyecto no existe o el usuario no es propietario.
- Header del proyecto (nombre, estado, código público solo lectura).
- Menú de navegación interna con estructura/patrón análogo a `/settings/billing`, con SSR y `project_public_code` en todas las rutas.
- Dashboard del proyecto: métricas reales desde modelo (ventas, órdenes pagadas, unidades, comisión, neto) y métricas placeholder (satisfacción, NPS, ratings, tendencias) solo visuales.
- Sección de productos: listado (nombre, categoría, estado, precio), acciones activar/desactivar y editar.
- Sección de configuración: reutilizar UI existente de creación/edición de proyecto, campos cargados, nombre solo lectura, registro en modelo de auditoría (p. ej. `glam_project_config_changes`).
- Placeholder de notificaciones con mensaje tipo "Próximamente".

### 2.2 Excluye explícitamente
- Flujos de compra, checkout y experiencia buyer.
- Creación de nuevos proyectos (flujo ya especificado en otra spec).
- Lógica real para satisfacción, NPS, ratings, tendencias.
- Implementación real del módulo de notificaciones.
- Cambios en middleware, auth, dashboard general, settings, o en otras partes del sistema no listadas en 2.1.

> ⚠️ Regla: todo lo no listado en 2.1 se considera **fuera de alcance**.

---

## 3. Supuestos y restricciones

### 3.1 Supuestos
- Existe pantalla genérica de error 404 a la que se puede redirigir.
- Existe UI de creación/edición de proyecto reutilizable para la configuración.
- El menú de `/settings/billing` existe y su estructura visual y de interacción puede usarse como referencia para el menú del proyecto.
- El modelo expone o permite calcular métricas de ventas (sales, sale_items, sale_breakdowns) y existe o se puede usar una vista/agregación para el organizer (p. ej. `project_sales_summary`).
- El cliente HTTP y clientes de proyecto/ventas en `lib/http/` se usan solo en servidor (según DOCS_TECHNICAL.md).

### 3.2 Restricciones técnicas
- Lenguajes / frameworks: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS según DOCS_TECHNICAL.md.
- Infraestructura: App Router en `app/`; rutas bajo `app/project/[publicCode]/` (o equivalente).
- Base de datos: acceso vía backend/Supabase según DOCS_TECHNICAL.md; no acceso directo desde cliente.
- Autenticación / seguridad: sesión con `getSession()`, validación de rol `organizer` y de `organizer_id` en servidor; cliente HTTP solo en servidor; no exponer datos sensibles al cliente.

---

## 4. Preguntas obligatorias para la AI (Checklist)

> La AI **DEBE** responder estas preguntas antes de avanzar.  
Si alguna no tiene respuesta en la documentación, **DEBE preguntar al humano**.

- **¿Qué problema de negocio se resuelve exactamente?**  
  El organizer necesita una vista única por proyecto para monitorear rendimiento, administrar productos y editar configuración, accediendo por código público del proyecto.

- **¿Quiénes son los actores involucrados?**  
  Organizer propietario del proyecto (acceso completo). Otros roles o no propietarios → 404.

- **¿Cuáles son las reglas de negocio críticas?**  
  RN-01 a RN-06 del spec: solo propietario accede; 404 si no existe o no es propietario; nombre solo lectura en configuración; cambios de configuración auditados; métricas no soportadas solo placeholder; navegación SSR con `project_public_code` en ruta.

- **¿Qué decisiones ya están tomadas y no deben cambiarse?**  
  URL `/project/{project_public_code}`; uso de pantalla 404 existente; reutilización de UI de creación/edición para configuración; menú análogo a `/settings/billing`; fuentes de métricas (sales, sale_items, sale_breakdowns); nombre del proyecto no editable; registro en modelo de auditoría.

- **¿Qué partes son configurables vs fijas?**  
  Configurables dentro del alcance: contenido de métricas placeholder, textos de "Próximamente". Fijas: rutas base, criterio de acceso (propietario), nombre solo lectura, SSR, no implementar notificaciones ni métricas no soportadas.

- **¿Qué escenarios de error deben contemplarse?**  
  Proyecto inexistente → 404. Usuario no propietario → 404. Sesión inválida o sin rol organizer → según middleware existente (fuera de alcance de este plan).

- **¿Qué no debe hacer el sistema bajo ningún caso?**  
  No crear una pantalla 404 nueva; no permitir acceso a no propietarios; no editar el nombre del proyecto en configuración; no añadir lógica real a métricas placeholder; no modificar otras partes del sistema (dashboard, settings, auth, etc.).

---

## 5. Descomposición del trabajo

### 5.1 Fases

#### Fase 1 – Dominio y validación de acceso
- Confirmar entidades: proyecto (public_code, organizer_id, estado), productos del proyecto, configuración y auditoría.
- Invariantes: solo propietario accede; nombre no editable; cambios de configuración auditados.
- Reglas de negocio: RN-01 a RN-06 del spec.

#### Fase 2 – Contratos y rutas
- Rutas: `/project/[publicCode]`, `/project/[publicCode]/product/`, `/project/[publicCode]/edit` (y cualquier subruta de notificaciones si se deja placeholder).
- Contrato de datos: proyecto por `public_code`, validación de `organizer_id` frente a sesión; fuentes de métricas y de listado de productos según modelo/APIs existentes.
- Sin definir APIs externas nuevas en este plan; usar las existentes según DOCS_TECHNICAL y modelo.

#### Fase 3 – Implementación
- Páginas Server Components que validen sesión, rol y propiedad antes de renderizar.
- Layout del proyecto: header, menú (patrón tipo billing), contenido.
- Dashboard: métricas reales (servidor) + placeholders (UI).
- Productos: listado y acciones (activar/desactivar, editar) usando servicios existentes donde aplique.
- Configuración: reutilizar UI existente, carga de datos actuales, nombre solo lectura, persistencia y registro de cambios.
- Placeholder de notificaciones.
- Redirección a 404 cuando corresponda.

#### Fase 4 – Validación
- Tests que verifiquen: acceso solo propietario, 404 para proyecto inexistente o no propietario, presencia de header/menú/contenido, métricas reales vs placeholder, nombre solo lectura en configuración, registro de cambios de configuración según spec.

---

## 6. Archivos y estructura esperada

> La AI **NO puede crear archivos fuera de esta lista** sin actualizar este plan y aprobación.

- `app/project/[publicCode]/` – Páginas y layout del proyecto (home/dashboard, productos, configuración, placeholder notificaciones según rutas acordadas).
- Componentes bajo `app/project/` o `components/` necesarios para header del proyecto, menú de navegación del proyecto y bloques de dashboard/productos/config (reutilizando donde existan).
- Uso de `lib/http/` (solo servidor) para proyecto, ventas/productos según existan; sin nuevos clientes HTTP fuera del alcance acordado.
- Tests (p. ej. bajo `app/project/` o carpeta de tests del proyecto) para los criterios del spec.

No se listan aquí archivos de otras áreas (dashboard, settings, auth) porque no están en alcance.

---

## 7. Reglas estrictas para la AI Agent

- ❌ No inventar requisitos
- ❌ No modificar la documentación técnica ni otras specs
- ❌ No optimizar sin justificación
- ❌ No asumir defaults no documentados
- ❌ No sugerir ni realizar cambios en otras partes del sistema (middleware, dashboard general, settings, auth)
- ✅ Preguntar ante ambigüedad
- ✅ Mantener consistencia con `spec.md` y definición funcional
- ✅ Explicar decisiones complejas

---

## 8. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| UI de creación/edición de proyecto no sea reutilizable tal cual | Retraso en configuración | Especificar en spec que se reutiliza; si no existe o difiere, preguntar al humano antes de implementar |
| Diferencias entre menú billing y menú proyecto | Inconsistencia UX | Seguir estructura e interacción de billing; solo adaptar ítems y rutas al proyecto |
| Métricas reales dependan de vistas/APIs no documentadas aquí | Cálculos incorrectos o bloqueo | Usar modelo y vistas existentes (p. ej. project_sales_summary); preguntar si falta contrato |

---

## 9. Criterios de aceptación del plan

El plan se considera **aprobado** cuando:
- Todas las preguntas de la sección 4 están resueltas
- El alcance es claro y sin ambigüedad
- Las fases están completas
- Las restricciones están explícitas
- No se incluyen cambios a otras partes del sistema

---

## 10. Aprobación

- Estado: ⬜ Draft / ⬜ Aprobado  
- Fecha:  
- Aprobado por:

---

> 🧠 **Nota para la AI**  
Este plan es vinculante.  
Cualquier desviación requiere una actualización explícita del plan y nueva aprobación.
