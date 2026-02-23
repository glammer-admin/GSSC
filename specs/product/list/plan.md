# Plan de Implementación – Lista y Menú de Productos

> **Documento técnico de implementación**  
> Basado en `specs/product/list/spec.md` v1.2  
> Define **CÓMO** se implementará la lista y navegación de productos  
> Para plan de creación, ver `specs/product/creation/plan.md`  
> Para plan de edición, ver `specs/product/update/plan.md`

---

## 1. Resumen de arquitectura

### 1.1 Principios técnicos

- **Server-Side Rendering (SSR)**: La página de lista carga los datos en un Server Component
- **Client Components para interactividad**: Los filtros y el menú kebab requieren interactividad del lado del cliente
- **Patrón existente**: Seguir estructura de páginas SSR existentes en el proyecto
- **Reutilización**: Usar cliente HTTP de productos existente (`lib/http/product/product-client.ts`)
- **Filtrado client-side**: Los filtros de estado y categoría se aplican en el cliente sobre la lista completa ya cargada (MVP, sin paginación)

### 1.2 Estructura de archivos a crear/modificar

```
app/
└── project/
    └── [id]/
        └── products/
            └── page.tsx                    # Lista de productos del proyecto [CREAR] (Server Component)

components/
└── product/
    ├── product-list.tsx                    # Componente de lista con filtros [CREAR] (Client Component "use client")
    ├── product-filters.tsx                 # Sección de filtros por estado y categoría [CREAR] (Client Component)
    └── product-kebab-menu.tsx              # Menú de acciones (3 puntos verticales) [CREAR] (Client Component)

lib/
└── types/
    └── product/
        └── types.ts                        # Actualizar PRODUCT_STATUS_CONFIG colores [MODIFICAR]
```

---

## 2. Implementación

### 2.1 Actualización de constantes (`lib/types/product/types.ts`)

La constante `PRODUCT_STATUS_CONFIG` debe actualizarse para reflejar los colores definidos en el spec v1.1 (RN-L03):

**Antes:**
```typescript
export const PRODUCT_STATUS_CONFIG = {
  draft: { label: "Borrador", color: "gray", ... },
  active: { label: "Activo", color: "green", ... },
  inactive: { label: "Inactivo", color: "red", ... },
}
```

**Después:**
```typescript
export const PRODUCT_STATUS_CONFIG = {
  draft: { label: "Borrador", color: "yellow", ... },
  active: { label: "Activo", color: "green", ... },
  inactive: { label: "Inactivo", color: "gray", ... },
}
```

**Justificación (RN-L03, RN-L07):**
- `draft` → amarillo/default (antes era gris)
- `active` → verde (sin cambio)
- `inactive` → gris (antes era rojo). El estado inactivo ya no se distingue como radio button; es un tag visual igual que los demás

### 2.2 API de listado (`app/api/product/route.ts`)

**Sin cambios requeridos.** La API GET existente ya retorna todos los productos del proyecto con categorías e imágenes. El filtrado se realiza en el cliente (MVP, sin paginación).

El endpoint `GET /api/product?projectId=xxx` ya provee:
- Lista completa de productos con estado, categoría e imágenes
- Validación de sesión y permisos
- Categorías mapeadas por producto

### 2.3 Página de lista de productos (`app/project/[id]/products/page.tsx`)

- **Server Component**
- Validar sesión y permisos (organizador dueño del proyecto)
- Obtener productos del proyecto via cliente HTTP
- Obtener lista de categorías para poblar el filtro de categorías
- Extraer las categorías únicas presentes en los productos del proyecto
- Pasar datos al Client Component `ProductList`

### 2.4 Componente de lista (`components/product/product-list.tsx`)

- **Client Component** (`"use client"`)
- Recibe como props: `products`, `categories` (categorías disponibles en el proyecto), `projectId`
- Mantiene estado local de filtros activos: `searchQuery: string`, `selectedStatuses: ProductStatus[]`, `selectedCategories: string[]`
- Aplica filtros y búsqueda sobre la lista completa:
  - Sin filtros ni búsqueda → muestra todos
  - Con filtros/búsqueda → lógica AND entre búsqueda, estado y categoría; OR dentro del mismo tipo (RN-F04)
- Renderiza:
  - Sección de filtros (`ProductFilters`)
  - Botón "Crear producto" prominente (navega a `/project/{id}/products/new`)
  - Grid/tabla de productos filtrados
  - Cada producto con: nombre, tag de estado, categoría, precio, conteo de imágenes, thumbnail, menú kebab
  - Estado vacío cuando no hay productos (RN-L06)
  - Mensaje "No se encontraron productos" cuando los filtros no tienen resultados

### 2.5 Componente de filtros (`components/product/product-filters.tsx`)

- **Client Component** (`"use client"`)
- Recibe como props: `searchQuery`, `selectedStatuses`, `selectedCategories`, `categories`, `onSearchChange`, `onStatusChange`, `onCategoryChange`, `onClear`
- Renderiza barra de filtros en una sola línea horizontal, sin título "Filtros" (RN-F01, RN-F07):
  - **Buscador de productos:** Input con icono de búsqueda en el lado izquierdo. Filtra por nombre del producto (case-insensitive, client-side) (RN-F08)
  - **Filtro por estado:** Dropdown (Popover) con checkboxes para "Borrador", "Activo", "Inactivo" (selección múltiple, RN-F02). Badge con contador de opciones seleccionadas
  - **Filtro por categoría:** Dropdown (Popover) con checkboxes para las categorías disponibles (selección múltiple, RN-F02). Badge con contador de opciones seleccionadas
  - **Botón limpiar filtros:** Visible cuando hay filtros o búsqueda activos (RN-F05). Limpia también el campo de búsqueda

### 2.6 Componente de menú kebab (`components/product/product-kebab-menu.tsx`)

- **Client Component** (`"use client"`)
- Recibe como props: `productId`, `projectId`
- Renderiza icono de tres puntos verticales (⋮) posicionado en la esquina superior derecha del card/fila del producto (RN-L04)
- Al hacer clic, despliega menú dropdown con opción "Editar"
- La opción "Editar" navega a `/project/{projectId}/products/{productId}/edit`
- El menú se cierra al hacer clic fuera de él

### 2.7 Integración con dashboard

- Agregar enlace a productos desde el dashboard del proyecto
- Agregar navegación en sidebar/menú hacia la lista de productos

---

## 3. Lógica de filtrado (client-side)

```typescript
function filterProducts(
  products: Product[],
  searchQuery: string,
  selectedStatuses: ProductStatus[],
  selectedCategories: string[]
): Product[] {
  const normalizedQuery = searchQuery.trim().toLowerCase()
  return products.filter(product => {
    const matchesSearch = normalizedQuery.length === 0
      || product.name.toLowerCase().includes(normalizedQuery)
    const matchesStatus = selectedStatuses.length === 0 
      || selectedStatuses.includes(product.status)
    const matchesCategory = selectedCategories.length === 0 
      || selectedCategories.includes(product.categoryId)
    return matchesSearch && matchesStatus && matchesCategory  // AND entre todos los filtros
  })
}
```

**Justificación del filtrado client-side (vs server-side):**
- MVP sin paginación: toda la lista ya se carga completa
- La API actual retorna todos los productos en una sola llamada
- Menor complejidad: no requiere modificar API ni backend client
- UX instantánea: los filtros y búsqueda se aplican sin round-trip al servidor
- Si la lista crece significativamente, migrar a filtrado server-side con query params

---

## 4. Mapeo visual de tags de estado

| Estado | Label | Color | Estilo (referencia) |
|--------|-------|-------|---------------------|
| `draft` | Borrador | Amarillo/default | `bg-yellow-100 text-yellow-800` |
| `active` | Activo | Verde | `bg-green-100 text-green-800` |
| `inactive` | Inactivo | Gris | `bg-gray-100 text-gray-800` |

Los tres estados se representan como **tags visuales** con el mismo estilo de componente (RN-L07). El estado inactivo **NO** usa radio button ni toggle.

---

## 5. Validaciones

| Validación | Ubicación | Momento |
|------------|-----------|---------|
| Sesión válida | Servidor (Middleware) | Cada request |
| Permisos de organizador | Servidor (API + Página) | Cada request |
| Proyecto existe | Servidor | Carga de página |
| Filtros válidos | Cliente | Al cambiar filtros |

---

## 6. Testing

### 6.1 Tests de integración

- GET productos del proyecto retorna lista correcta
- GET productos de proyecto ajeno retorna 403
- GET productos de proyecto sin productos retorna lista vacía

### 6.2 Tests E2E (si aplica)

- Ver lista de productos con productos existentes y tags de colores correctos
- Ver estado vacío sin productos
- Navegar a creación desde la lista
- Abrir menú kebab y navegar a edición desde "Editar"
- Buscar por nombre → solo muestra productos cuyo nombre contiene el texto
- Filtrar por estado via dropdown (seleccionar "Activo" → solo muestra activos)
- Filtrar por categoría via dropdown (seleccionar "Mugs" → solo muestra mugs)
- Filtros combinados (búsqueda + estado + categoría → intersección)
- Seleccionar múltiples valores en un filtro dropdown (Borrador + Activo)
- Limpiar filtros → muestra todos los productos y limpia búsqueda
- Sin resultados con filtros aplicados → muestra mensaje y opción de limpiar

---

## 7. Checklist de implementación

- [ ] Actualizar `PRODUCT_STATUS_CONFIG` en `lib/types/product/types.ts` (draft: yellow, inactive: gray)
- [ ] Crear `app/project/[id]/products/page.tsx` (Server Component)
- [ ] Crear `components/product/product-list.tsx` (Client Component con lógica de filtrado)
- [ ] Crear `components/product/product-filters.tsx` (filtros por estado y categoría)
- [ ] Crear `components/product/product-kebab-menu.tsx` (menú de 3 puntos verticales)
- [ ] Implementar tags de estado con colores (amarillo, verde, gris)
- [ ] Implementar estado vacío con CTA para crear producto
- [ ] Implementar mensaje "No se encontraron productos" cuando filtros no tienen resultados
- [ ] Agregar enlace a productos desde dashboard de proyecto
- [ ] Agregar navegación en sidebar/menú
- [ ] Probar flujo completo E2E

---

## 8. Estimación de esfuerzo

| Área | Tareas | Estimación |
|------|--------|------------|
| Constantes | Actualizar `PRODUCT_STATUS_CONFIG` colores | 0.5 horas |
| Página SSR | `page.tsx` con carga de datos y permisos | 1-2 horas |
| Lista | `product-list.tsx` con grid y lógica de filtrado | 2-3 horas |
| Filtros | `product-filters.tsx` con estado y categoría | 1-2 horas |
| Menú kebab | `product-kebab-menu.tsx` con dropdown | 1 hora |
| Integración | Dashboard + navegación | 1-2 horas |
| Testing | Integration + E2E | 1-2 horas |
| **Total** | | **7-12 horas** |

---

## 9. Dependencias y orden de ejecución

```
1. Actualizar PRODUCT_STATUS_CONFIG (sin dependencias)
2. Crear page.tsx (depende de API existente)
3. Crear product-kebab-menu.tsx (sin dependencias)
4. Crear product-filters.tsx (sin dependencias)
5. Crear product-list.tsx (depende de 3 y 4)
6. Integrar page.tsx con product-list.tsx (depende de 2 y 5)
7. Integración con dashboard/sidebar
8. Testing
```

Pasos 1, 3, 4 pueden ejecutarse en paralelo.

---

## 10. Notas para AI Agent

1. **Server Component + Client Component**: La página es Server Component (carga datos), pero la lista con filtros y kebab menu es Client Component (interactividad)
2. **Cliente existente**: Usar `getProductsByProject()` del cliente HTTP de productos — no modificar
3. **Filtrado client-side**: Aplicar filtros y búsqueda sobre la lista completa en el cliente (no modificar API)
4. **PRODUCT_STATUS_CONFIG**: Actualizar colores ANTES de implementar componentes (draft: yellow, inactive: gray)
5. **Sin radio buttons**: El estado inactivo se muestra como tag, NO como radio button ni toggle (RN-L07)
6. **Menú kebab**: Usar un dropdown posicionado en la esquina superior derecha del card/fila del producto
7. **Patrones existentes**: Seguir patrones de componentes y listado ya existentes en el proyecto
8. **Estado vacío**: Manejar tanto el caso "sin productos" como el caso "sin resultados por filtros/búsqueda"
9. **Categorías para filtro**: Extraer solo las categorías que existen en los productos del proyecto (no todas las categorías del sistema)
10. **Filtros como dropdowns**: Los filtros de estado y categoría son Popover con checkboxes (selección múltiple), NO chips/buttons
11. **Barra de filtros en una línea**: Sin título "Filtros". Layout: [Buscador] [Dropdown Estado] [Dropdown Categoría] [Limpiar filtros]
12. **Limpiar filtros**: El botón "Limpiar filtros" también limpia el campo de búsqueda
