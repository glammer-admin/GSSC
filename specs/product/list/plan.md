# Plan de Implementación – Lista y Menú de Productos

> **Documento técnico de implementación**  
> Basado en `specs/product/list/spec.md` v1.0  
> Define **CÓMO** se implementará la lista y navegación de productos  
> Para plan de creación, ver `specs/product/creation/plan.md`  
> Para plan de edición, ver `specs/product/update/plan.md`

---

## 1. Resumen de arquitectura

### 1.1 Principios técnicos

- **Server-Side Rendering (SSR)**: La página de lista es un Server Component
- **Patrón existente**: Seguir estructura de páginas SSR existentes en el proyecto
- **Reutilización**: Usar cliente HTTP de productos existente (`lib/http/product/product-client.ts`)

### 1.2 Estructura de archivos a crear/modificar

```
app/
├── api/
│   └── product/
│       └── route.ts                    # GET listar productos del proyecto [YA EXISTENTE]
└── project/
    └── [id]/
        └── products/
            └── page.tsx                # Lista de productos del proyecto [CREAR]
```

---

## 2. Implementación

### 2.1 API de listado (`app/api/product/route.ts`)

```typescript
// GET /api/product?projectId=xxx - Listar productos del proyecto
// - Validar sesión
// - Validar permisos sobre el proyecto (organizer_id === user_id)
// - Retornar productos con información resumida e imágenes
```

### 2.2 Página de lista de productos (`app/project/[id]/products/page.tsx`)

- Server Component
- Validar sesión y permisos (organizador dueño del proyecto)
- Obtener productos del proyecto via cliente HTTP
- Renderizar tabla/grid de productos con:
  - Nombre del producto
  - Estado con badge de color (draft, active, inactive)
  - Categoría (derivada del glam_product)
  - Precio
  - Conteo de imágenes
  - Thumbnail de imagen principal
  - Acciones (enlace a editar)
- Incluir botón prominente "Crear producto" que navega a `/project/{id}/products/new`
- Manejar estado vacío (sin productos) con mensaje y CTA para crear

### 2.3 Integración con dashboard

- Agregar enlace a productos desde el dashboard del proyecto
- Agregar navegación en sidebar/menú hacia la lista de productos

---

## 3. Validaciones

| Validación | Ubicación | Momento |
|------------|-----------|---------|
| Sesión válida | Servidor (Middleware) | Cada request |
| Permisos de organizador | Servidor (API + Página) | Cada request |
| Proyecto existe | Servidor | Carga de página |

---

## 4. Testing

### 4.1 Tests de integración

- GET productos del proyecto retorna lista correcta
- GET productos de proyecto ajeno retorna 403
- GET productos de proyecto sin productos retorna lista vacía

### 4.2 Tests E2E (si aplica)

- Ver lista de productos con productos existentes
- Ver estado vacío sin productos
- Navegar a creación desde la lista
- Navegar a edición desde la lista

---

## 5. Checklist de implementación

- [ ] Crear `app/project/[id]/products/page.tsx` (Server Component)
- [ ] Implementar tabla/grid de productos con estado, categoría, precio, imágenes
- [ ] Implementar estado vacío con CTA para crear producto
- [ ] Agregar enlace a productos desde dashboard de proyecto
- [ ] Agregar navegación en sidebar/menú
- [ ] Probar flujo completo E2E

---

## 6. Estimación de esfuerzo

| Área | Tareas | Estimación |
|------|--------|------------|
| Página SSR | Lista de productos con tabla/grid | 3-4 horas |
| Integración | Dashboard + navegación | 1-2 horas |
| Testing | Integration + E2E | 1-2 horas |
| **Total** | | **5-8 horas** |

---

## 7. Notas para AI Agent

1. **Server Component**: La página de lista es un Server Component (SSR)
2. **Cliente existente**: Usar `getProductsByProject()` del cliente HTTP de productos
3. **Patrones existentes**: Seguir patrones de listado ya existentes en el proyecto
4. **Estado vacío**: Siempre manejar el caso de proyecto sin productos
5. **Navegación**: Asegurar que la lista sea accesible desde el dashboard del proyecto
