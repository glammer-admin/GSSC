# Plan de Implementación – Creación de Productos

> **Documento técnico de implementación**  
> Basado en `spec.md` v3.0  
> Define **CÓMO** se implementará la creación de productos  
> Para plan de edición, ver `specs/product/update/plan.md`  
> Para plan de lista, ver `specs/product/list/plan.md`

---

## 1. Resumen de arquitectura

### 1.1 Principios técnicos

- **Server-Side Rendering (SSR)**: Toda la lógica de negocio y validación en el servidor
- **Patrón existente**: Seguir estructura de `lib/http/project/` y `lib/types/project/`
- **Cliente HTTP solo servidor**: Nunca importar clientes HTTP en componentes `"use client"`
- **Storage reutilizable**: Crear cliente de Storage siguiendo patrón de `project-storage-client.ts`

### 1.2 Estructura de archivos a crear/modificar

```
lib/
├── http/
│   └── product/
│       ├── index.ts                    # Re-exports
│       ├── product-client.ts           # Cliente HTTP para productos
│       ├── product-storage-client.ts   # Cliente Storage para imágenes
│       ├── category-client.ts          # Cliente HTTP para categorías (solo lectura)
│       └── types.ts                    # Re-export de tipos
├── types/
│   └── product/
│       └── types.ts                    # Tipos del dominio de productos [MODIFICAR]
└── utils/
    └── image-compressor.ts             # (Reutilizar existente)

app/
├── api/
│   └── product/
│       ├── route.ts                    # POST crear producto
│       └── [id]/
│           └── images/
│               └── route.ts            # POST subir, DELETE eliminar imagen
└── project/
    └── [id]/
        └── products/
            └── new/
                └── page.tsx            # Formulario creación

components/
└── product/
    ├── product-form.tsx                # Formulario principal [MODIFICAR]
    ├── category-selector.tsx           # Selector de categoría
    ├── glam-product-selector.tsx       # Selector de producto del catálogo
    ├── attribute-selector.tsx          # Selector de atributos
    ├── personalization-config.tsx      # Configurador de módulos
    ├── image-manager.tsx               # Gestor de imágenes (independiente del form de edición)
    ├── image-upload.tsx                # Componente de subida
    ├── image-gallery.tsx               # Galería con reordenamiento
    ├── cost-summary-section.tsx        # Sección de precio tentativo
    └── confirm-cancel-modal.tsx        # Modal de cancelar
```

---

## 2. Fases de implementación

### Fase 1: Tipos y Cliente HTTP (Fundamentos)

**Objetivo**: Establecer la base de tipos y comunicación con backend

#### 2.1.1 Crear tipos del dominio (`lib/types/product/types.ts`)

```typescript
// Tipos base (alineados con backend)
export type ProductStatus = "draft" | "active" | "inactive"
export type VisualMode = "upload_images" | "online_editor" | "designer_assisted"
export type PersonalizationModuleCode = "sizes" | "numbers" | "names" | "age_categories"
export type ProductImageSource = "upload" | "online_editor" | "designer_assisted"

// Interfaces de backend
export interface BackendProductCategory { ... }
export interface BackendPersonalizationModule { ... }
export interface BackendProduct { ... }
export interface BackendProductImage { ... }

// Interfaces de frontend
export interface ProductCategory { ... }
export interface PersonalizationModule { ... }
export interface Product { ... }
export interface ProductImage { ... }

// DTOs
export interface CreateProductDTO { ... }
export interface CreateProductImageDTO { ... }

// Configuración de personalización
export interface SizesConfig { enabled: boolean; options: string[]; price_modifier: number }
export interface NumbersConfig { enabled: boolean; min: number; max: number; price_modifier: number }
export interface NamesConfig { enabled: boolean; max_length: number; price_modifier: number }
export interface AgeCategoriesConfig { enabled: boolean; options: string[]; price_modifier: number }
export interface PersonalizationConfig { ... }

// Constantes
export const PRODUCT_IMAGES_BUCKET = "product-images"
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
export const MIN_IMAGES_FOR_ACTIVATION = 3
export const ALLOWED_IMAGE_FORMATS = ["png", "jpg", "jpeg", "webp"]

// Validaciones
export function validateProductName(name: string): { valid: boolean; error?: string }
export function validateProductDescription(description: string): { valid: boolean; error?: string }
export function validateBasePrice(price: number): { valid: boolean; error?: string }
export function validateCategory(categoryId: string | null): { valid: boolean; error?: string }
export function canActivateProduct(product: Product): { valid: boolean; errors: string[] }
export function isValidStatusTransition(current: ProductStatus, next: ProductStatus): boolean
export function buildDefaultPersonalizationConfig(allowedModules: PersonalizationModuleCode[]): PersonalizationConfig

// Transformaciones
export function toProduct(backend: BackendProduct): Product
export function toCreateDTO(input: CreateProductInput, projectId: string): CreateProductDTO
```

#### 2.1.2 Crear cliente HTTP de productos (`lib/http/product/product-client.ts`)

Seguir patrón de `project-client.ts`:

```typescript
class ProductClient {
  // Categorías (solo lectura)
  async getCategories(): Promise<ProductCategory[]>
  async getCategoryByCode(code: string): Promise<ProductCategory | null>
  
  // Módulos (solo lectura)
  async getPersonalizationModules(): Promise<PersonalizationModule[]>
  
  // Productos CRUD
  async createProduct(dto: CreateProductDTO): Promise<BackendProduct>
  async getProduct(id: string): Promise<BackendProduct | null>
  async getProductsByProject(projectId: string): Promise<BackendProduct[]>
  
  // Imágenes
  async getProductImages(productId: string): Promise<BackendProductImage[]>
  async createProductImage(dto: CreateProductImageDTO): Promise<BackendProductImage>
  async updateProductImage(id: string, position: number): Promise<BackendProductImage>
  async deleteProductImage(id: string): Promise<boolean>
}

// Singleton
export function getProductClient(): ProductClient
```

#### 2.1.3 Crear cliente Storage de imágenes (`lib/http/product/product-storage-client.ts`)

Seguir patrón de `project-storage-client.ts`:

```typescript
class ProductStorageClient {
  private bucket = PRODUCT_IMAGES_BUCKET
  
  // Construir path: {project_id}/{product_id}/{position}.{extension}
  private buildPath(projectId: string, productId: string, position: number, extension: string): string
  
  // URL pública
  getPublicUrl(projectId: string, productId: string, position: number, extension: string): string
  
  // Operaciones
  async uploadImage(projectId: string, productId: string, position: number, file: Buffer, filename: string): Promise<ImageUploadResult>
  async deleteImage(projectId: string, productId: string, position: number, extension: string): Promise<boolean>
  async listProductImages(projectId: string, productId: string): Promise<string[]>
}

export function getProductStorageClient(): ProductStorageClient
```

---

### Fase 2: API Routes (Creación)

**Objetivo**: Crear endpoints para creación de productos e imágenes

#### 2.2.1 API de creación de productos (`app/api/product/route.ts`)

```typescript
// POST /api/product - Crear producto
// - Validar sesión y rol organizador
// - Validar que el usuario es dueño del proyecto
// - Validar nombre y descripción no vacíos (RN-19)
// - Validar categoría seleccionada (RN-43)
// - Validar glam_product_id proporcionado (RN-03)
// - Validar categoría existe
// - Validar módulos están permitidos por categoría
// - Validar que personalization_config incluye todos los módulos de la categoría (RN-45)
// - Precio = 0 si no hay glam_product seleccionado (RN-41)
// - Crear producto en estado draft
```

#### 2.2.2 API de imágenes (`app/api/product/[id]/images/route.ts`)

```typescript
// POST /api/product/[id]/images - Subir imagen
// - Validar formato y tamaño
// - Subir a Storage
// - Crear registro en product_images
// - Asignar siguiente posición disponible

// DELETE /api/product/[id]/images/[imageId] - Eliminar imagen
// - Si producto active, validar que no quede con < 3 imágenes
// - Eliminar de Storage
// - Eliminar registro
```

---

### Fase 3: Páginas SSR (Creación)

**Objetivo**: Crear página de creación de productos

#### 2.3.1 Crear producto (`app/project/[id]/products/new/page.tsx`)

- Server Component
- Validar sesión y permisos
- Obtener categorías y módulos
- Renderizar formulario (Client Component)

---

### Fase 4: Componentes de UI (Creación)

**Objetivo**: Crear componentes del formulario de creación de productos

#### 2.4.1 Formulario principal (`components/product/product-form.tsx`)

- Client Component (`"use client"`)
- Maneja estado del formulario
- Flujo secuencial: Info básica → Categoría → Producto del catálogo → Atributos → Personalización → Precio tentativo
- **Precio inicial = 0** (RN-41): Mientras no se seleccione un producto del catálogo, el precio es `0`
- **Reset al cambiar categoría** (RN-42): limpia producto del catálogo, atributos, personalización, precios
- **Campos obligatorios** (RN-19, RN-43): Nombre, descripción, categoría y producto del catálogo
- **Personalización siempre enviada** (RN-44, RN-45): `personalization_config` incluye todos los módulos de la categoría
- Validaciones en tiempo real
- Submit a API Routes

#### 2.4.2 Selector de categoría (`components/product/category-selector.tsx`)

- Muestra categorías disponibles (selección obligatoria, RN-43)
- Al seleccionar, actualiza módulos permitidos y lista de productos del catálogo
- **Al cambiar categoría** (RN-42): ejecuta reset completo
- Emite callback `onCategoryChange`

#### 2.4.3 Configurador de personalización (`components/product/personalization-config.tsx`)

- Muestra TODOS los módulos permitidos por categoría
- **Valor por defecto** (RN-44): cada módulo se inicializa con `enabled: false`
- Toggle para habilitar/deshabilitar cada módulo
- **Envío obligatorio** (RN-45): todos los módulos enviados en payload
- Configuración específica por módulo:
  - sizes: selector múltiple de opciones
  - numbers: rango min/max
  - names: longitud máxima
  - age_categories: selector múltiple

#### 2.4.4 Gestor de imágenes (`components/product/image-manager.tsx`)

- **Independiente del formulario de edición** (RN-50)
- Selector de modo visual (si categoría permite múltiples)
- Upload Images: componente de subida + galería
- Online Editor: botón que redirige a URL externa
- Designer Assisted: mensaje informativo

#### 2.4.5 Componente de subida (`components/product/image-upload.tsx`)

- Drag & drop o click para seleccionar
- Validación de formato y tamaño
- Compresión si necesario (reutilizar `image-compressor.ts`)
- Preview antes de subir
- Progress indicator

#### 2.4.6 Galería de imágenes (`components/product/image-gallery.tsx`)

- Grid de imágenes con posición
- Drag & drop para reordenar
- Botón eliminar (con validación de mínimo)
- Indicador de imagen principal (posición 1)

#### 2.4.7 Sección de precio tentativo (`components/product/cost-summary-section.tsx`)

- Muestra desglose: precio base, recargos atributos, comisión, IVA, total
- Solo lectura (calculado automáticamente)
- Se actualiza al seleccionar producto del catálogo y atributos

---

## 3. Dependencias entre tareas

```
Fase 1 (Fundamentos)
├── 1.1 Tipos ──────────────────┐
├── 1.2 Cliente HTTP ───────────┼──► Fase 2 (APIs)
└── 1.3 Cliente Storage ────────┘    ├── 2.1 API crear producto
                                     └── 2.2 API imágenes
                                              │
                                              ▼
                                     Fase 3 (Páginas SSR)
                                     └── 3.1 Crear producto
                                              │
                                              ▼
                                     Fase 4 (Componentes UI)
                                     ├── 4.1 Formulario principal
                                     ├── 4.2 Selector categoría
                                     ├── 4.3 Config personalización
                                     ├── 4.4 Gestor imágenes
                                     ├── 4.5 Upload imágenes
                                     ├── 4.6 Galería imágenes
                                     └── 4.7 Precio tentativo
```

---

## 4. Consideraciones técnicas

### 4.1 Validaciones

| Validacion | Ubicacion | Momento |
|------------|-----------|---------|
| Nombre no vacío (RN-19) | Cliente + Servidor | Submit |
| Descripción no vacía (RN-19) | Cliente + Servidor | Submit |
| Categoría seleccionada (RN-43) | Cliente + Servidor | Submit |
| Producto del catálogo seleccionado (RN-03) | Cliente + Servidor | Submit |
| Precio = 0 sin producto seleccionado (RN-41) | Cliente | Cambio de selección |
| Reset completo al cambiar categoría (RN-42) | Cliente | Cambio de categoría |
| Módulos con valor por defecto (RN-44) | Cliente | Carga de formulario |
| Todos los módulos enviados en payload (RN-45) | Cliente + Servidor | Submit |
| Módulos permitidos por categoría | Servidor | Submit |
| Permisos de organizador | Servidor (Middleware + API) | Cada request |
| Formato/tamaño imagen | Cliente + Servidor | Upload |

### 4.2 Manejo de errores

Usar códigos de error definidos en spec:
- `PRODUCT_NAME_REQUIRED`
- `PRODUCT_DESCRIPTION_REQUIRED`
- `CATEGORY_REQUIRED`
- `PRODUCT_PRICE_INVALID`
- `GLAM_PRODUCT_REQUIRED`
- `GLAM_PRODUCT_NOT_FOUND`
- `CATEGORY_NOT_FOUND`
- `MODULE_NOT_ALLOWED`
- `PROJECT_NOT_FOUND`
- `PERMISSION_DENIED`
- `INVALID_IMAGE_FORMAT`
- `IMAGE_TOO_LARGE`
- `POSITION_DUPLICATE`
- `IMAGE_NOT_FOUND`

### 4.3 Transacciones y rollback

Para subida de imágenes:
1. Subir a Storage
2. Si éxito, crear registro en BD
3. Si falla BD, eliminar de Storage

Para eliminación de imágenes:
1. Eliminar registro de BD
2. Si éxito, eliminar de Storage
3. Si falla Storage, log warning (archivo huérfano)

### 4.4 Reutilización de código

| Componente existente | Uso en productos |
|---------------------|------------------|
| `lib/utils/image-compressor.ts` | Compresión de imágenes de producto |
| `lib/http/client.ts` | Base para ProductClient |
| `components/ui/*` | Todos los componentes de UI base |
| `lib/auth/server-utils.ts` | Validación de sesión en páginas |

### 4.5 URLs del Online Editor

La URL del Online Editor se construirá como:
```
{ONLINE_EDITOR_BASE_URL}?productId={product_id}
```

Donde `ONLINE_EDITOR_BASE_URL` será una variable de entorno (por definir).

---

## 5. Testing

### 5.1 Tests unitarios

- Validaciones de tipos (`types.ts`)
- Transformaciones backend ↔ frontend
- `toCreateDTO()` con diferentes inputs

### 5.2 Tests de integración

- API Routes con mocks de BD
- Flujo completo de creación de producto
- Flujo de subida de imágenes
- POST con campos obligatorios faltantes

### 5.3 Tests E2E (si aplica)

- Crear producto completo con imágenes
- Crear producto sin atributos
- Crear producto sin personalización
- Error al crear sin nombre/descripción/categoría

---

## 6. Checklist de implementación

### Fase 1: Tipos y Clientes
- [ ] Crear `lib/types/product/types.ts`
- [ ] Crear `lib/http/product/product-client.ts`
- [ ] Crear `lib/http/product/product-storage-client.ts`
- [ ] Crear `lib/http/product/index.ts` (re-exports)

### Fase 2: API Routes
- [ ] Crear `app/api/product/route.ts` (POST crear)
- [ ] Crear `app/api/product/[id]/images/route.ts`

### Fase 3: Páginas
- [ ] Crear `app/project/[id]/products/new/page.tsx`

### Fase 4: Componentes
- [ ] Crear/Modificar `components/product/product-form.tsx`
- [ ] Crear `components/product/category-selector.tsx`
- [ ] Crear `components/product/glam-product-selector.tsx`
- [ ] Crear `components/product/attribute-selector.tsx`
- [ ] Crear `components/product/personalization-config.tsx`
- [ ] Crear `components/product/image-manager.tsx`
- [ ] Crear `components/product/image-upload.tsx`
- [ ] Crear `components/product/image-gallery.tsx`
- [ ] Crear `components/product/cost-summary-section.tsx`

---

## 7. Estimación de esfuerzo

| Fase | Tareas | Estimacion |
|------|--------|------------|
| Fase 1 | Tipos y Clientes | 4-6 horas |
| Fase 2 | API Routes (creación + imágenes) | 3-4 horas |
| Fase 3 | Página SSR creación | 1-2 horas |
| Fase 4 | Componentes UI creación | 8-10 horas |
| Testing | Unit + Integration | 3-4 horas |
| **Total** | | **19-26 horas** |

---

## 8. Notas para AI Agent

1. **Orden de implementación**: Seguir las fases en orden (1 → 2 → 3 → 4)
2. **No saltar pasos**: Cada fase depende de la anterior
3. **Validar en servidor**: Toda validación crítica DEBE estar en el servidor
4. **Patrones existentes**: Revisar código existente antes de crear nuevo
5. **No sobre-ingeniería**: Implementar solo lo especificado en spec.md
6. **Preguntar dudas**: Si algo no está claro, preguntar antes de implementar
7. **Solo creación**: Este plan cubre solo la creación de productos. Para edición ver `specs/product/update/plan.md`, para lista ver `specs/product/list/plan.md`
