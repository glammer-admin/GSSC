# Plan de Implementación – Conectar tabla "Mis proyectos" con datos reales

> **Rol del documento**  
> Contrato operativo para conectar el widget existente del dashboard organizador con la vista `project_sales_summary`.  
> No se modifica diseño ni columnas de la tabla; solo la fuente de datos.

---

## 1. Contexto

### 1.1 Referencias obligatorias
- Documento funcional: `specs/dashboard/organizer/project-list-section/funcionalidad_resumen_de_proyectos_ventas_web_gssc.md`
- API de datos: `specs/sells/sells-curl-example.md` (vista `project_sales_summary`)
- Documento técnico: `DOCS_TECHNICAL.md`
- Spec de la sección: `specs/dashboard/organizer/project-list-section/spec.md`

### 1.2 Objetivo del plan
Conectar la tabla "Mis proyectos" del dashboard organizador con los datos reales obtenidos desde la vista `project_sales_summary` del backend, manteniendo el diseño y la información actual de la tabla (Proyecto, Estado, Pedidos, Unidades, Comisión) y la navegación por fila.

---

## 2. Alcance

### 2.1 Incluye
- Obtener el listado de proyectos con resumen de ventas desde `project_sales_summary` (GET con JWT del organizador).
- Mapear la respuesta del backend al modelo que ya consume la tabla (`Project` con `name`, `status`, `metrics.orders`, `metrics.unitsSold`, `metrics.commission`).
- Usar `project_public_code` para la URL de navegación al detalle (`/dashboard/project/{project_public_code}`).
- Carga de datos en el Server Component del dashboard; sin llamadas desde Client Components.
- Manejo de errores de red/HTTP y estado vacío (lista vacía).

### 2.2 Excluye explícitamente
- Cambios en el diseño visual de la tabla o en las columnas mostradas.
- Nuevos filtros, ordenación por columnas o paginación en backend.
- Cambios en KPIs, gráficas u otras secciones del dashboard.
- Filtros por rango de fechas o comparativos entre proyectos.
- Modificación de la vista `project_sales_summary` o del backend.

> Todo lo no listado aquí se considera **fuera de alcance**.

---

## 3. Supuestos y restricciones

### 3.1 Supuestos
- La vista `project_sales_summary` existe y está disponible en el backend (Supabase REST) con el esquema `gssc_db`.
- El JWT del organizador se obtiene desde la sesión en el servidor y se usa en `Authorization: Bearer` para la petición.
- La vista filtra por `organizer_id = auth.uid()`; no se envían parámetros adicionales de filtro.
- Los valores de `project_status` en la respuesta son compatibles con los del frontend (`active`, `paused`, `finished`).
- La ruta de detalle del proyecto acepta `project_public_code` como identificador en la URL (o se documenta el uso de `project_public_code` para el enlace).

### 3.2 Restricciones técnicas
- Lenguajes/frameworks: TypeScript, Next.js 15 (App Router), React 19.
- Cliente HTTP: solo en servidor (`lib/http/`), nunca en Client Components.
- Autenticación: sesión validada en Server Component; JWT propagado en la petición al backend.
- Headers: `Accept-Profile: gssc_db` para GET a `project_sales_summary`.

---

## 4. Preguntas obligatorias para la AI (Checklist)

- **¿Qué problema de negocio se resuelve?** Mostrar al organizador el resumen real de ventas por proyecto (pedidos, unidades, comisión) en la tabla ya existente.
- **¿Quiénes son los actores?** Organizador autenticado.
- **¿Reglas de negocio críticas?** Solo ventas web confirmadas (paid); datos históricos; una fila por proyecto; proyectos sin ventas con 0 en métricas.
- **¿Decisiones que no deben cambiarse?** Columnas y diseño de la tabla; uso de `project_sales_summary` como fuente; navegación a detalle por `project_public_code`.
- **¿Configurable vs fijo?** Orden por defecto (ej. `last_sale_at.desc.nullslast`) puede fijarse en el plan; columnas y métricas son fijas según doc funcional.
- **¿Escenarios de error?** Backend no disponible, 401/403, lista vacía (mostrar estado vacío existente).
- **¿Qué no debe hacer el sistema?** No recalcular métricas en frontend; no exponer cliente HTTP en el cliente; no cambiar la UI de la tabla.

---

## 5. Descomposición del trabajo

### 5.1 Fase 1 – Contrato de datos
- Definir tipo de respuesta de `project_sales_summary` (o reutilizar si existe) con: `project_public_code`, `project_name`, `project_status`, `orders_count`, `units_sold`, `organizer_commission_total`, `currency` (opcional), `last_sale_at` (opcional).
- Definir mapeo: respuesta backend → tipo `Project` del dashboard (incluyendo `id`/identificador para fila y para URL: usar `project_public_code` en el enlace).
- Documentar mapeo de `project_status` (backend) → `ProjectStatus` (frontend) si hay diferencias de valor.

### 5.2 Fase 2 – Cliente HTTP y carga en servidor
- Añadir método en cliente HTTP de proyectos (o módulo existente que hable con Supabase) para GET `project_sales_summary` con:
  - Parámetros: `select` (columnas necesarias), `order=last_sale_at.desc.nullslast`.
  - Headers: `apikey`, `Authorization: Bearer <JWT>`, `Accept-Profile: gssc_db`.
- Obtener JWT del organizador desde la sesión en el servidor (según DOCS_TECHNICAL).
- Implementar función de mapeo: fila `project_sales_summary` → `Project` (con `metrics.orders`, `metrics.unitsSold`, `metrics.commission`; `completedOrders`/`inProgressOrders` pueden derivarse o fijarse según doc funcional, sin cambiar columnas visibles).

### 5.3 Fase 3 – Integración en el dashboard
- En la página del dashboard (Server Component), en lugar de `loadOrganizerDashboardData()` para la lista de proyectos:
  - Llamar al nuevo método que obtiene `project_sales_summary`.
  - Mapear resultado a `Project[]`.
  - Mantener el resto de datos del dashboard (métricas, gráficas) como hasta ahora (mocks o futuras integraciones).
- Pasar `projects` ya poblados con datos reales a `DashboardContent`; la tabla y los filtros (búsqueda, estado) siguen igual.
- Asegurar que el enlace desde la tabla use `project_public_code` (p. ej. `project.id` puede contener o reemplazarse por `project_public_code` según decisión de tipos).

### 5.4 Fase 4 – Validación y casos límite
- Lista vacía: organizador sin proyectos → estado vacío existente.
- Error de red/HTTP: manejo sin romper la página (mensaje o estado de error según estándar del proyecto).
- Proyecto sin ventas: fila con 0 en pedidos, unidades y comisión (comportamiento ya definido en doc funcional y en la vista).

---

## 6. Archivos y estructura esperada

- `lib/http/project/` – Añadir método (y tipos si aplica) para `project_sales_summary`; o módulo dedicado bajo `lib/http/` si se prefiere separar “sales summary” de CRUD de proyectos.
- `lib/types/dashboard/organizer.ts` – Solo si se añade campo explícito para `project_public_code` en `Project` (para URL); opcional si se usa `id` para portar el código público.
- `app/dashboard/page.tsx` – Obtener proyectos desde backend, mapear a `Project[]`, inyectar en `OrganizerDashboardData`.
- `lib/mocks/dashboard-loader.ts` – Ajustar para que `projects` provengan del backend cuando la integración esté activa; o mantener mocks para métricas/gráficas y solo reemplazar origen de `projects`.
- `components/dashboard/organizer/projects-table.tsx` – Solo cambio necesario: usar identificador adecuado para `href` (ej. `project_public_code`) si se añade al tipo `Project`; sin cambiar columnas ni diseño.

No crear archivos fuera de esta lista sin actualizar el plan.

---

## 7. Reglas estrictas para la AI Agent

- No inventar requisitos; ceñirse al doc funcional y a esta spec/plan.
- No modificar diseño ni columnas de la tabla "Mis proyectos".
- No optimizar ni añadir funcionalidad (filtros por fecha, export, etc.) sin que esté en el alcance.
- No asumir defaults no documentados (ej. moneda) sin preguntar.
- Preguntar ante ambigüedad (ej. si la ruta de detalle usa `id` vs `project_public_code`).
- Mantener consistencia con DOCS_TECHNICAL (SSR, cliente HTTP solo en servidor, sesión y JWT).

---

## 8. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Vista `project_sales_summary` no disponible o con otro esquema | Bloqueo | Verificar contra sells-curl-example y data-model antes de implementar. |
| JWT no disponible en Server Component | Sin datos | Usar flujo de sesión existente (getSession) y extraer token según DOCS_TECHNICAL. |
| Diferencias de nombres de estado (backend vs frontend) | Badges incorrectos | Mapear en una sola función backend → ProjectStatus. |

---

## 9. Criterios de aceptación del plan

El plan se considera **aprobado** cuando:
- Las preguntas de la sección 4 están resueltas.
- El alcance (solo conectar tabla con `project_sales_summary`) está claro y sin ambigüedad.
- Las fases 1–4 están definidas y los archivos acotados.
- Las restricciones técnicas y reglas para la AI están explícitas.

---

## 10. Aprobación

- Estado: ⬜ Draft / ⬜ Aprobado  
- Fecha:  
- Aprobado por:

---

> **Nota para la AI**  
> Este plan es vinculante. Cualquier desviación requiere actualización explícita del plan y nueva aprobación.
