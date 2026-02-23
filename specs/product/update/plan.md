# Plan de Implementación – Edición y Actualización de Productos

> **Documento técnico de implementación**  
> Basado en `specs/product/update/spec.md` v1.1  
> Define **CÓMO** se implementará la edición y actualización de productos  
> Para plan de creación, ver `specs/product/creation/plan.md`

---

## 1. Resumen de arquitectura

### 1.1 Principios técnicos

- **Server-Side Rendering (SSR)**: Toda la lógica de negocio y validación en el servidor
- **Patrón existente**: Seguir estructura de `lib/http/project/` y `lib/types/project/`
- **Cliente HTTP solo servidor**: Nunca importar clientes HTTP en componentes `"use client"`
- **Reutilización**: Compartir tipos, clientes y componentes con el módulo de creación

### 1.2 Estructura de archivos a modificar

```
lib/
├── types/
│   └── product/
│       └── types.ts                    # FIX: toProduct() categoryId resolution [MODIFICAR]

components/
└── product/
    └── product-form.tsx                # FIX: useEffect no debe limpiar glamProducts en edit mode inicial [MODIFICAR]
```

---

## 2. Diagnóstico del problema: Categoría y producto del catálogo no se precargan

### 2.1 Síntoma

Al editar un producto, la categoría y el producto del catálogo seleccionados en la creación NO aparecen cargados en el formulario. Las secciones de categoría y producto del catálogo están vacías.

### 2.2 Causa raíz

**La tabla `project_products` NO almacena `category_id`** (RN-04, RN-51). La categoría se hereda vía `glam_product → category_id`. Sin embargo, la función `toProduct()` intenta leer `backend.category_id` directamente del backend, que siempre es `undefined`:

```typescript
// PROBLEMA en toProduct():
categoryId: backend.category_id ?? "",  // ← backend.category_id es SIEMPRE undefined
```

Esto genera una cadena de fallos:

1. `Product.categoryId` se establece como `""` (string vacío)
2. El formulario inicializa `categoryId` como `""` → `selectedCategoryId` es `""`
3. `CategorySelector` no encuentra ninguna categoría con `id === ""` → no muestra selección
4. `selectedCategory` es `undefined` → la sección de personalización no se renderiza
5. El `useEffect` que carga `glamProducts` evalúa `!categoryId` (string vacío es falsy) → limpia `glamProducts` a `[]`
6. La sección de producto del catálogo no muestra nada

### 2.3 Datos disponibles

La **página de edición** (`edit/page.tsx`) YA resuelve correctamente:
- Carga el `glam_product` vía `backendProduct.glam_product_id` → obtiene `productCategory` vía `glamProduct.category_id`
- Pasa `productCategory` como tercer argumento a `toProduct(backendProduct, images, productCategory)`
- Carga `glamProductData` y `glamProductsForCategory`

El problema es que `toProduct()` ignora el `category` resuelto para asignar `categoryId`.

---

## 3. Plan de corrección

### 3.1 Fix en `toProduct()` (`lib/types/product/types.ts`)

**Cambio:** Usar el `category.id` resuelto como fallback cuando `backend.category_id` es vacío/undefined.

**Antes:**
```typescript
categoryId: backend.category_id ?? "",
```

**Después:**
```typescript
categoryId: backend.category_id || category?.id || "",
```

**Justificación (RN-51, RN-53):** La categoría se resuelve vía `glam_product → category_id`. La página de edición ya pasa el `category` resuelto como argumento. Este fix asegura que `categoryId` refleje la categoría real del producto.

### 3.2 Fix en `useEffect` de glam products (`components/product/product-form.tsx`)

**Cambio:** En modo edición, no limpiar `glamProducts` al inicio si ya se tienen datos iniciales.

**Antes:**
```typescript
useEffect(() => {
  if (!categoryId) {
    setGlamProducts([])     // ← Limpia ANTES de verificar edit mode
    return
  }
  if (isEditMode && !isConfigEditable) {
    return
  }
  // fetch...
}, [categoryId, isEditMode, isConfigEditable])
```

**Después:**
```typescript
useEffect(() => {
  if (!categoryId) {
    if (!isEditMode) {
      setGlamProducts([])
    }
    return
  }
  if (isEditMode && !isConfigEditable) {
    return
  }
  // fetch...
}, [categoryId, isEditMode, isConfigEditable])
```

**Justificación (RN-52):** En modo edición, los `glamProducts` iniciales ya vienen precargados como prop desde el servidor. El `useEffect` no debe limpiarlos durante el mount.

> **Nota:** Con el fix 3.1, `categoryId` ya no será `""` en edit mode, por lo que este fix es un guardia adicional de seguridad.

---

## 4. Flujo corregido de carga de datos

```
1. edit/page.tsx (servidor):
   - Obtiene backendProduct (tiene glam_product_id, NO tiene category_id)
   - Obtiene glamProduct vía glam_product_id
   - Resuelve productCategory vía glamProduct.category_id
   - Carga glamProductsForCategory filtrando por productCategory.id
   - Llama toProduct(backendProduct, images, productCategory)
     → Product.categoryId = productCategory.id  ← CORREGIDO
   
2. ProductForm (cliente):
   - categoryId = product.categoryId (ahora es el ID real de la categoría)
   - CategorySelector muestra la categoría correcta seleccionada
   - selectedCategory = categories.find(c => c.id === categoryId) → encontrada
   - glamProducts = initialGlamProducts (no se limpian en mount)
   - selectedGlamProduct = glamProducts.find(gp => gp.id === glamProductId) → encontrado
   - Sección de atributos renderiza con selectedGlamProduct.attributesConfig
   - Sección de personalización renderiza con selectedCategory.allowedModules
```

---

## 5. Archivos impactados y alcance del cambio

| Archivo | Cambio | Líneas | Riesgo |
|---------|--------|--------|--------|
| `lib/types/product/types.ts` | `toProduct()`: usar `category?.id` como fallback | 1 línea | Bajo - solo afecta cuando `category_id` no viene del backend |
| `components/product/product-form.tsx` | `useEffect`: no limpiar glamProducts en edit mode | 4 líneas | Bajo - solo afecta el comportamiento en edit mode |

**No se requieren cambios en:**
- `app/project/[id]/products/[productId]/edit/page.tsx` — ya carga correctamente los datos
- `app/api/product/[id]/route.ts` — el PATCH ya funciona correctamente
- `components/product/category-selector.tsx` — ya soporta `disabled` y `selectedCategoryId`
- `components/product/glam-product-selector.tsx` — ya soporta `disabled` y `selectedId`

---

## 6. Validaciones post-fix

### 6.1 Verificar que se corrige el problema

- [ ] Al editar un producto draft: categoría muestra la seleccionada, producto del catálogo muestra el seleccionado, atributos y personalización precargados
- [ ] Al editar un producto active: categoría en solo lectura con valor correcto, producto del catálogo en solo lectura con valor correcto
- [ ] Al editar un producto inactive: todas las secciones en solo lectura con valores correctos

### 6.2 Verificar que no se rompe la creación

- [ ] Al crear un producto nuevo: flujo progresivo funciona normalmente (categoría → producto → atributos → personalización)
- [ ] Cambiar categoría en creación: limpia selecciones dependientes

---

## 7. Checklist de implementación

- [ ] Fix `toProduct()` en `lib/types/product/types.ts` — usar `category?.id` como fallback para `categoryId`
- [ ] Fix `useEffect` en `components/product/product-form.tsx` — no limpiar `glamProducts` en edit mode
- [ ] Verificar sin errores de lint
- [ ] Verificar que la creación de productos no se rompe

---

## 8. Notas para AI Agent

1. **Spec v1.1**: Priorizar RN-51, RN-52, RN-53 para resolución de datos
2. **Cambio mínimo**: Solo 2 archivos, ~5 líneas de código
3. **No romper creación**: El fix debe ser condicional (fallback, no reemplazo)
4. **Sin imágenes en edición**: El formulario de edición NO debe incluir gestión de imágenes (RN-50)
5. **Precarga de datos**: El formulario de edición DEBE mostrar todos los datos existentes (RN-48, RN-49)
