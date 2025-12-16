# Plan de Implementación (SDD + AI Agents)

> **Rol del documento**  
Este archivo es el **contrato operativo** entre el humano y la(s) AI Agent(s).  
La AI **NO debe escribir código** hasta que este plan esté completo, validado y aprobado.

---

## 1. Contexto

### 1.1 Referencias obligatorias
- Documento técnico principal: `../../DOCS_TECHNICAL.md`
- Especificación funcional: `./spec.md`
- Documentación funcional: `../../DOCS_FUNCTIONAL.md`

### 1.2 Objetivo del plan
Describir **qué se va a construir**, **cómo se va a construir** y **en qué orden**, respetando estrictamente las especificaciones existentes para el Dashboard del Organizador.

---

## 2. Alcance

### 2.1 Incluye
- Página del dashboard del organizador en `/dashboard`
- Componentes de visualización de KPIs ejecutivos (comisión, pedidos, productos vendidos)
- Componentes de gráficas de tendencias (evolución comisión, estado pedidos, productos más vendidos)
- Componente de resumen/lista de proyectos
- Funcionalidad de filtrado por periodo (mensual, trimestral, semestral)
- Funcionalidad de búsqueda de proyectos (por nombre y estado)
- Botón de acción para crear nuevo proyecto (navegación)
- Estado vacío cuando no hay proyectos
- Estructura de datos mock para desarrollo desacoplado del backend

### 2.2 Excluye explícitamente
- Conexión a servicios HTTP externos (backend real)
- Dashboard individual por proyecto
- Gestión o edición de proyectos existentes
- Gestión de pedidos, productos o compradores
- Reportes descargables
- Drill-down desde gráficas
- Análisis diario u operacional
- Flujo completo de creación de proyecto (solo navegación)
- Stock, inventarios o disponibilidad
- Flujos de devoluciones, cambios o incidencias

> ⚠️ Regla: todo lo no listado aquí se considera **fuera de alcance**.

---

## 3. Supuestos y restricciones

### 3.1 Supuestos
- El usuario ya está autenticado con rol `organizer` (validado por middleware existente)
- La estructura de sesión y validación de roles ya está implementada
- Los componentes UI base de shadcn/ui están disponibles
- La navegación y layout base del dashboard ya existen

### 3.2 Restricciones técnicas
- **Framework**: Next.js 15.1.3 con App Router
- **React**: v19 con Server Components + Client Components
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 4.0
- **Patrón de datos**: Server-Side Rendering obligatorio para operaciones sensibles
- **Cliente HTTP**: Solo en servidor (nunca en Client Components)
- **Datos**: Usar mocks JSON durante esta fase (sin conexión a backend real)

---

## 4. Preguntas obligatorias para la AI (Checklist)

> La AI **DEBE** responder estas preguntas antes de avanzar.  
Si alguna no tiene respuesta en la documentación, **DEBE preguntar al humano**.

- **¿Qué problema de negocio se resuelve exactamente?**
  - Los organizadores necesitan una visión ejecutiva y consolidada del desempeño de todos sus proyectos sin tener que navegar a cada uno individualmente.

- **¿Quiénes son los actores involucrados?**
  - Organizador (`organizer`): Usuario autenticado con rol organizador que gestiona proyectos.

- **¿Cuáles son las reglas de negocio críticas?**
  - RN-01 a RN-10 definidas en `spec.md`. Las más críticas:
    - Valores monetarios = SOLO comisión del organizador (nunca ventas brutas)
    - Métricas agregadas de TODOS los proyectos
    - Periodos: mensual, trimestral, semestral (NO diario)
    - Búsqueda SOLO por proyectos
    - Gráficas NO interactivas (sin drill-down)

- **¿Qué decisiones ya están tomadas y no deben cambiarse?**
  - Arquitectura SSR obligatoria
  - Patrón de sesiones dual existente
  - Sistema RBAC implementado
  - Middleware de autenticación existente

- **¿Qué partes son configurables vs fijas?**
  - **Fijas**: Tipos de periodo (mensual, trimestral, semestral), KPIs a mostrar, estados de proyecto
  - **Configurables**: Periodo por defecto (mensual), diseño visual de componentes

- **¿Qué escenarios de error deben contemplarse?**
  - ACCESO_DENEGADO: Usuario sin rol `organizer`
  - SIN_PROYECTOS: Organizador sin proyectos asociados
  - BUSQUEDA_SIN_RESULTADOS: Búsqueda sin coincidencias
  - PERIODO_INVALIDO: Periodo no soportado

- **¿Qué no debe hacer el sistema bajo ningún caso?**
  - Mostrar ventas brutas o ingresos totales
  - Permitir drill-down en gráficas
  - Permitir búsqueda de productos, pedidos o compradores
  - Exponer datos de otros organizadores

---

## 5. Descomposición del trabajo

### 5.1 Fases

#### Fase 1 – Estructura de Mocks y Tipos
- Crear carpeta `/mocks/dashboard/` para datos mock del dashboard
- Definir tipos TypeScript para entidades del dominio:
  - `Project` (id, nombre, estado, métricas)
  - `DashboardMetrics` (comisión, pedidos, productos)
  - `ChartData` (evolución comisión, estado pedidos, productos vendidos)
- Crear archivos JSON mock:
  - `projects.json` - Lista de proyectos del organizador
  - `metrics.json` - KPIs agregados por periodo
  - `charts.json` - Datos para gráficas

#### Fase 2 – Componentes de Presentación
- KPI Cards (comisión, pedidos totales, completados, en proceso, productos vendidos)
- Selector de periodo (tabs o dropdown)
- Gráfica de evolución de comisión (línea/área)
- Gráfica de estado de pedidos (pie/donut)
- Gráfica de productos más vendidos (barras horizontales)
- Lista/tabla de proyectos con métricas resumidas
- Buscador de proyectos
- Estado vacío (sin proyectos)
- Botón crear proyecto

#### Fase 3 – Integración en Página
- Server Component principal (`app/dashboard/page.tsx`)
- Validación de sesión y rol
- Carga de datos desde mocks
- Composición de componentes
- Manejo de estados (loading, empty, error)

#### Fase 4 – Interactividad
- Filtrado por periodo (Client Component)
- Búsqueda de proyectos (Client Component)
- Navegación a detalle de proyecto
- Navegación a crear proyecto

#### Fase 5 – Validación
- Verificar todos los escenarios Gherkin de `spec.md`
- Validar reglas de negocio
- Verificar casos límite
- Verificar acceso denegado para otros roles

---

## 6. Archivos y estructura esperada

> La AI **NO puede crear archivos fuera de esta lista**.

### Estructura de Mocks (NUEVO)

```
/mocks/
  └── dashboard/
      └── organizer/
          ├── projects.json       # Lista de proyectos mock
          ├── metrics.json        # KPIs por periodo
          └── charts.json         # Datos de gráficas
```

> **Propósito de la carpeta `/mocks/`**:
> - Desarrollar el frontend completamente desacoplado del backend
> - Definir la estructura de datos que se requerirá almacenar en el backend
> - Servir como contrato de datos para futura integración HTTP
> - Organizada por subcarpetas de funcionalidad para evitar confusión
> - Los archivos JSON representan las respuestas esperadas del servicio HTTP

### Tipos TypeScript

```
/lib/
  └── types/
      └── dashboard/
          └── organizer.ts        # Tipos del dashboard organizador
```

### Componentes

```
/components/
  └── dashboard/
      └── organizer/
          ├── kpi-card.tsx              # Card individual de KPI
          ├── kpi-grid.tsx              # Grid de KPIs
          ├── period-selector.tsx       # Selector de periodo
          ├── commission-chart.tsx      # Gráfica evolución comisión
          ├── orders-status-chart.tsx   # Gráfica estado pedidos
          ├── top-products-chart.tsx    # Gráfica productos más vendidos
          ├── projects-table.tsx        # Tabla de proyectos
          ├── project-search.tsx        # Buscador de proyectos
          ├── empty-state.tsx           # Estado sin proyectos
          └── create-project-button.tsx # Botón crear proyecto
```

### Página

```
/app/
  └── dashboard/
      └── page.tsx                # Server Component principal (modificar existente)
```

### Utilidades de Mock

```
/lib/
  └── mocks/
      └── dashboard-loader.ts     # Funciones para cargar datos mock
```

---

## 7. Reglas estrictas para la AI Agent

- ❌ No inventar requisitos
- ❌ No modificar la documentación técnica
- ❌ No optimizar sin justificación
- ❌ No asumir defaults
- ❌ No importar `lib/http/*` en Client Components
- ❌ No conectar a servicios HTTP externos
- ❌ No crear archivos fuera de la estructura definida
- ✅ Preguntar ante ambigüedad
- ✅ Mantener consistencia con la spec
- ✅ Explicar decisiones complejas
- ✅ Usar Server Components para carga de datos
- ✅ Pasar datos como props a Client Components
- ✅ Respetar el patrón SSR obligatorio
- ✅ Usar mocks JSON para todos los datos

---

## 8. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Estructura de mock no coincide con API real futura | Medio | Documentar claramente la estructura esperada en los JSON |
| Componentes de gráficas pesados | Bajo | Usar lazy loading y bibliotecas optimizadas |
| Confusión entre datos mock y reales | Medio | Carpeta `/mocks/` claramente separada y nombrada |
| Complejidad en filtrado de periodos | Bajo | Lógica de filtrado en Server Component |
| Inconsistencia de tipos entre mock y componentes | Medio | Tipos centralizados en `/lib/types/` |

---

## 9. Criterios de aceptación del plan

El plan se considera **aprobado** cuando:
- [x] Todas las preguntas de la sección 4 están resueltas
- [x] El alcance es claro y sin ambigüedad
- [x] Las fases están completas
- [x] Las restricciones están explícitas
- [x] La estructura de mocks está definida
- [x] Los archivos permitidos están listados

---

## 10. Aprobación

- Estado: ⬜ Draft / ⬜ Aprobado  
- Fecha:  
- Aprobado por:

---

> 🧠 **Nota para la AI**  
Este plan es vinculante.  
Cualquier desviación requiere una actualización explícita del plan y nueva aprobación.

---

## Anexo A: Estructura de Datos Mock

### A.1 Proyecto (`projects.json`)

```json
{
  "projects": [
    {
      "id": "proj-001",
      "name": "Campaña Navidad 2024",
      "status": "active",
      "metrics": {
        "orders": 150,
        "completedOrders": 120,
        "inProgressOrders": 30,
        "unitsSold": 450,
        "commission": 15000.00
      }
    }
  ]
}
```

### A.2 Métricas Agregadas (`metrics.json`)

```json
{
  "monthly": {
    "commission": 45000.00,
    "totalOrders": 500,
    "completedOrders": 420,
    "inProgressOrders": 80,
    "productsSold": 1500
  },
  "quarterly": { ... },
  "biannual": { ... }
}
```

### A.3 Datos de Gráficas (`charts.json`)

```json
{
  "commissionEvolution": {
    "monthly": [
      { "period": "Ene 2024", "value": 12000 },
      { "period": "Feb 2024", "value": 15000 }
    ]
  },
  "ordersStatus": {
    "completed": 420,
    "inProgress": 80
  },
  "topProducts": [
    { "name": "Producto A", "unitsSold": 250 },
    { "name": "Producto B", "unitsSold": 180 }
  ]
}
```

---

## Anexo B: Dependencias de Bibliotecas

Para las gráficas, se recomienda evaluar:
- `recharts` - Biblioteca de gráficas para React
- Componentes de shadcn/ui existentes

> La selección final de biblioteca de gráficas se decidirá en la fase de implementación según disponibilidad y compatibilidad.

