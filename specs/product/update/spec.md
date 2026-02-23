# Specification (SDD) – Edición y Actualización de Productos

> **Documento normativo de comportamiento del sistema**  
> Este archivo define **QUÉ debe hacer el sistema** para la edición y actualización de productos.  
> Es la **fuente única de verdad** para planes, código, tests y AI Agents.  
> Para creación de productos, ver `specs/product/creation/spec.md`.

---

## 0. Instrucciones obligatorias para la AI Agent

Antes de implementar este documento, la AI **DEBE**:
- Leer `specs/product/creation/spec.md` para entender el dominio completo de productos
- Leer `DOCS_TECHNICAL.md` para entender la arquitectura SSR
- Leer `data-model.md` para entender el modelo de datos
- Leer `product-curl-example.md` para entender los contratos de API y estructura de datos
- Revisar `lib/http/project/project-storage-client.ts` como patrón de referencia para Storage
- Revisar `lib/types/project/types.ts` como patrón de referencia para tipos
- No tomar decisiones de implementación no especificadas aquí
- Preguntar cualquier ambigüedad

---

## 1. Propósito

Este módulo permite a los **organizadores** editar, actualizar y gestionar el estado de los productos existentes dentro de sus proyectos.

**Problema de negocio que resuelve:**
- Los organizadores necesitan modificar información de productos ya creados según el estado del producto
- La plataforma debe garantizar inmutabilidad de configuración en productos activos para proteger pedidos existentes
- Se requiere un flujo claro de transiciones de estado (draft → active → inactive) con validaciones

**Valor que aporta:**
- Edición flexible en borrador (todo modificable)
- Protección de configuración en productos activos (solo nombre y descripción editables)
- Visualización de solo lectura para productos inactivos con opción de reactivación
- Formulario de edición con misma estructura visual que el de creación
- Control de transiciones de estado con validaciones (mínimo 3 imágenes para activar)

---

## 2. Alcance funcional

### 2.1 Incluye

- Edición de productos con restricciones según estado (draft: todo editable, active: solo nombre/descripción/estado, inactive: solo lectura)
- Formulario de edición con misma estructura que creación y datos precargados
- Cambio de estado del producto (draft → active → inactive)
- Validación de requisitos para activación (mínimo 3 imágenes)
- Visualización de producto inactivo (solo lectura)
- Desactivación de productos activos
- Reactivación de productos inactivos (requiere mínimo 3 imágenes)

### 2.2 Excluye (explícito)

> Todo lo no listado aquí se considera fuera de alcance.

- Creación de productos (ver `specs/product/creation/spec.md`)
- Gestión de imágenes dentro del formulario de edición (las imágenes se gestionan de forma independiente)
- Modificación de `personalization_config` después de activar el producto
- Modificación de `selected_attributes` después de activar el producto
- Eliminación física de productos (solo desactivación)
- Creación/modificación de categorías, módulos, productos del catálogo o atributos (solo plataforma)
- Tienda pública de productos (fuera de alcance)
- Gestión de pedidos/compras (fuera de alcance)

---

## 3. Actores

| Actor | Descripción | Nivel de acceso |
|-------|-------------|-----------------|
| Organizador | Usuario con rol `organizer`, dueño del proyecto | Edición de productos de sus proyectos |
| Plataforma (Glam Urban) | Sistema | Gestiona catálogos (categorías, módulos, glam_products, atributos) |

---

## 4. Glosario de dominio

> Para glosario completo, ver `specs/product/creation/spec.md` sección 4.

| Término | Definición |
|---------|------------|
| Producto de proyecto | Oferta publicada dentro de un proyecto, derivada de un producto del catálogo Glam Urban |
| Producto del catálogo (glam_product) | Producto base del catálogo Glam Urban; referenciado por `project_products.glam_product_id`; contiene `category_id`, `base_price` y `attributes_config` |
| Categoría resuelta | La categoría del producto de proyecto se obtiene vía `glam_product → category_id → product_categories`; `project_products` NO almacena `category_id` directamente |
| Configuración inmutable | Estado en el que `personalization_config` y `selected_attributes` no pueden modificarse (producto activo o inactivo) |
| Transición de estado | Cambio válido de estado de un producto (draft→active, active→inactive, inactive→active) |
| Reactivación | Proceso de cambiar un producto de `inactive` a `active`, requiere mínimo 3 imágenes |

---

## 5. Reglas de negocio (OBLIGATORIAS)

### Resolución de datos para edición (categoría y producto del catálogo)

- **RN-51:** La tabla `project_products` NO almacena `category_id`; la categoría del producto se resuelve SIEMPRE a través de la relación `project_products.glam_product_id → glam_products.category_id → product_categories` (coherente con RN-04 de creación)
- **RN-52:** Al cargar el formulario de edición, el sistema DEBE obtener los datos completos del `glam_product` asociado al producto (nombre, código, precio base, `attributes_config`, imagen, `category_id`) para mostrarlo como producto seleccionado en la sección de producto del catálogo
- **RN-53:** Al cargar el formulario de edición, el sistema DEBE resolver la categoría del producto consultando `glam_products.category_id` del `glam_product` asociado, y luego buscar la categoría correspondiente en `product_categories`; este `category_id` resuelto es el que se usa para preseleccionar la categoría en el formulario y para cargar la lista de productos del catálogo de esa categoría

### Edición de productos por estado

- **RN-46:** En estado `inactive`, NINGÚN campo de datos puede modificarse; el formulario de edición es de solo lectura (visualización), pero se permite la transición de estado a `active` (reactivación, requiere mínimo 3 imágenes)
- **RN-47:** En estado `active`, solo se pueden modificar `name`, `description` y la transición de estado a `inactive`; los campos `category`, `glam_product`, `selected_attributes` y `personalization_config` son de solo lectura
- **RN-48:** El formulario de edición debe presentar la misma estructura visual que el formulario de creación (todas las secciones visibles) con los datos precargados del producto existente
- **RN-49:** Las secciones de categoría, producto del catálogo, atributos y personalización deben mostrar sus valores existentes incluso cuando están deshabilitadas (solo lectura); no se deben ocultar ni perder datos al cargar el formulario de edición
- **RN-50:** El formulario de edición NO incluye gestión de imágenes; las imágenes se gestionan de forma independiente

### Inmutabilidad

- **RN-21:** La configuración de personalización (`personalization_config`) puede modificarse mientras el producto esté en `draft`
- **RN-22:** Una vez el producto pasa a estado `active`, la configuración de personalización es INMUTABLE
- **RN-23:** `selected_attributes` puede modificarse mientras el producto esté en `draft`; una vez en `active` o `inactive`, es INMUTABLE
- **RN-24:** Si el organizador requiere cambiar la configuración o atributos, debe desactivar el producto y crear uno nuevo
- **RN-25:** Los productos NO pueden eliminarse físicamente, solo desactivarse

### Atributos (referencia de creación)

- **RN-10:** `selected_attributes` es modificable mientras el producto esté en estado `draft`; una vez en estado `active` o `inactive`, es **inmutable**

### Estados y Transiciones

- **RN-33:** Las transiciones de estado válidas son:
  - `draft` → `active` (requiere mínimo 3 imágenes)
  - `active` → `inactive`
  - `inactive` → `active` (requiere mínimo 3 imágenes)
- **RN-34:** No existe transición de `active` → `draft` ni de `inactive` → `draft`

### Imágenes (referencia para validación de activación)

- **RN-26:** Todo producto activo debe tener mínimo 3 imágenes
- **RN-27:** Un producto en borrador puede guardarse sin imágenes
- **RN-28:** No se puede activar un producto con menos de 3 imágenes

### Permisos

- **RN-35:** Solo el organizador dueño del proyecto puede crear/editar productos en ese proyecto
- **RN-36:** La verificación de propiedad se realiza comparando `organizer_id` del proyecto con el `user_id` de la sesión

---

## 6. Estados del dominio

| Estado | Descripción | Campos editables |
|--------|-------------|-----------------|
| `draft` | Producto en configuración, no visible para compradores | Todos: nombre, descripción, categoría, producto del catálogo, atributos, personalización, estado |
| `active` | Producto publicado, visible en tienda, configuración inmutable | Solo nombre, descripción y estado (a `inactive`) |
| `inactive` | Producto desactivado, no visible, solo lectura | Solo estado (a `active`, requiere mínimo 3 imágenes) |

### 6.1 Transiciones válidas

| Estado actual | Evento | Nuevo estado | Condiciones |
|---------------|--------|--------------|-------------|
| `draft` | Activar | `active` | Mínimo 3 imágenes |
| `active` | Desactivar | `inactive` | Ninguna |
| `inactive` | Reactivar | `active` | Mínimo 3 imágenes |

---

## 7. Flujos de edición y actualización de producto

### 7.0 Estructura del formulario de edición

**Formulario de edición (RN-48, RN-49, RN-50):**

El formulario de edición sigue la **misma estructura visual** que el de creación, con las siguientes diferencias:
- Los datos del producto se cargan precargados en todas las secciones (categoría, producto del catálogo, atributos, personalización)
- Las secciones y subsecciones existentes se muestran con sus valores actuales, nunca se ocultan ni se pierden datos
- La editabilidad de cada sección depende del estado del producto (ver RN-46, RN-47)
- El formulario de edición **NO incluye** la sección de gestión de imágenes (RN-50)

| Estado | Secciones editables | Secciones solo lectura |
|--------|--------------------|-----------------------|
| `draft` | Todas: información básica, categoría, producto del catálogo, atributos, personalización, estado | Ninguna |
| `active` | Nombre, descripción, estado (solo a `inactive`) | Categoría, producto del catálogo, atributos, personalización |
| `inactive` | Solo estado (reactivación a `active`, requiere mínimo 3 imágenes) | Todas las secciones de datos |

### 7.0.1 Resolución y precarga de datos del formulario de edición

**Problema de dominio:** La tabla `project_products` almacena `glam_product_id` pero NO almacena `category_id` (RN-04, RN-51). Por lo tanto, al cargar el formulario de edición se requiere un proceso de resolución de datos para que todas las secciones se muestren correctamente precargadas.

**Datos que se DEBEN cargar (RN-51, RN-52, RN-53):**

1. **Producto del proyecto** (`project_products`): datos básicos del producto (nombre, descripción, precio, estado, `glam_product_id`, `personalization_config`, `selected_attributes`)
2. **Producto del catálogo** (`glam_products`): se consulta usando `project_products.glam_product_id`; se necesitan sus datos completos (nombre, código, `base_price`, `attributes_config`, `image_url`, `category_id`) para mostrar el producto seleccionado en la sección de producto del catálogo y para resolver la categoría
3. **Categoría** (`product_categories`): se resuelve usando `glam_products.category_id` del producto del catálogo obtenido en el paso anterior; se usa para preseleccionar la categoría en el selector
4. **Lista de productos del catálogo para la categoría**: se consultan todos los `glam_products` de la categoría resuelta; se usan para poblar el selector de producto del catálogo (necesario especialmente en modo draft cuando el organizador puede cambiar de producto)
5. **Catálogo de categorías**: lista completa de categorías para el selector (necesario especialmente en modo draft cuando el organizador puede cambiar de categoría)
6. **Módulos de personalización**: catálogo completo de módulos para la sección de personalización
7. **Imágenes del producto**: para validación de activación (conteo de imágenes)

**Cadena de resolución:**
```
project_products.glam_product_id
  → glam_products (datos del producto del catálogo)
    → glam_products.category_id
      → product_categories (datos de la categoría)
        → glam_products filtrados por category_id (lista de productos del catálogo de esa categoría)
```

**Resultado esperado:**
- El selector de categoría muestra la categoría resuelta como seleccionada
- El selector de producto del catálogo muestra el `glam_product` asociado como seleccionado y lista los demás productos de la misma categoría
- La sección de atributos muestra los `selected_attributes` del producto con los `attributes_config` del `glam_product` como referencia
- La sección de personalización muestra la `personalization_config` del producto
- El precio tentativo refleja el `price` del producto + recargos de atributos

### 7.1 Caso de uso: Editar producto

```gherkin
Feature: Editar producto
  Como organizador
  Quiero modificar mi producto según su estado
  Para ajustar la configuración o visualizar su información

  Background:
    Given el organizador está autenticado con sesión válida
    And el organizador tiene un proyecto existente
    And existe un producto en dicho proyecto

  # ─── Estructura del formulario de edición ───

  Scenario: El formulario de edición presenta la misma estructura que el de creación
    Given el organizador accede a la página de edición del producto
    Then el formulario muestra las mismas secciones que el formulario de creación:
      | Sección                    |
      | Información básica         |
      | Categoría                  |
      | Producto del catálogo      |
      | Atributos                  |
      | Personalización            |
      | Precio tentativo           |
    And todas las secciones muestran los datos actuales del producto precargados
    And el formulario NO incluye la sección de gestión de imágenes

  # ─── Resolución de categoría y producto del catálogo (RN-51, RN-52, RN-53) ───

  Scenario: La categoría se resuelve desde el producto del catálogo asociado
    Given el producto fue creado con glam_product_id apuntando a "Mug 9 oz"
    And "Mug 9 oz" pertenece a la categoría "mugs" (vía glam_products.category_id)
    And la tabla project_products NO almacena category_id directamente
    When el organizador accede a la página de edición
    Then el sistema consulta el glam_product asociado al producto (usando glam_product_id)
    And obtiene el category_id del glam_product
    And busca la categoría correspondiente en product_categories
    And la sección de categoría muestra "mugs" seleccionada (resuelta desde glam_product → category_id)

  Scenario: El producto del catálogo se carga con sus datos completos
    Given el producto fue creado con glam_product_id apuntando a "Mug 9 oz"
    When el organizador accede a la página de edición
    Then el sistema carga los datos completos del glam_product "Mug 9 oz":
      | Campo              | Uso en el formulario                                       |
      | name               | Se muestra como producto seleccionado en el selector       |
      | code               | Identificación visual del producto del catálogo            |
      | base_price         | Referencia para precio base en la sección de precio        |
      | attributes_config  | Se usa para renderizar las opciones en la sección atributos|
      | image_url          | Se muestra como imagen del producto en el selector         |
      | category_id        | Se usa para resolver la categoría del producto             |
    And la sección de producto del catálogo muestra "Mug 9 oz" seleccionado
    And se listan los demás productos del catálogo de la categoría "mugs" en el selector

  Scenario: Las subsecciones muestran datos existentes del producto
    Given el producto fue creado con categoría "mugs" (resuelta desde glam_product), producto "Mug 9 oz", atributo "quality" = "premium"
    And el producto tiene módulo "sizes" habilitado con opciones ["S", "M", "L"]
    When el organizador accede a la página de edición
    Then la sección de categoría muestra "mugs" seleccionada
    And la sección de producto del catálogo muestra "Mug 9 oz" seleccionado
    And la sección de atributos muestra "quality" = "premium" (+3000)
    And la sección de personalización muestra "sizes" habilitado con ["S", "M", "L"]
    And la sección de precio tentativo refleja el precio base + recargos

  Scenario: Error si el glam_product asociado ya no existe
    Given el producto fue creado con un glam_product_id que ya no existe en el catálogo
    When el organizador accede a la página de edición
    Then el formulario muestra los datos almacenados del producto (nombre, descripción, personalización, atributos)
    And la sección de categoría no puede resolverse (referencia histórica)
    And la sección de producto del catálogo indica que el producto del catálogo ya no está disponible

  # ─── Edición en estado DRAFT (todo editable) ───

  Scenario: Editar información básica en borrador
    Given el producto está en estado "draft"
    And el organizador está en la página de edición del producto
    When modifica el nombre a "Mug 9 oz - Tigres FC Edición Especial"
    And modifica la descripción
    And guarda los cambios
    Then el producto se actualiza con la nueva información
    And se muestra mensaje de éxito

  Scenario: Cambiar categoría en borrador reinicia selecciones dependientes
    Given el producto está en estado "draft"
    And el producto tiene categoría "mugs" con producto "Mug 9 oz" y atributos seleccionados
    When el organizador cambia la categoría a "jersey"
    Then se limpia la selección de producto del catálogo
    And se limpian los atributos seleccionados (selected_attributes = {})
    And se limpian los módulos de personalización
    And el precio base vuelve a 0
    And el precio tentativo muestra $0
    And se listan los productos de la nueva categoría "jersey"

  Scenario: Cambiar producto del catálogo en borrador reinicia atributos
    Given el producto está en estado "draft"
    And el producto tiene producto del catálogo "Mug 9 oz" con atributo "quality" = "premium"
    When el organizador selecciona otro producto del catálogo "Mug 15 oz"
    Then se actualizan nombre, descripción y precio base según el nuevo producto
    And se limpian los atributos seleccionados (selected_attributes = {})
    And se muestran los atributos del nuevo producto del catálogo

  Scenario: Modificar atributos seleccionados en borrador
    Given el producto está en estado "draft"
    And el producto tiene atributo "quality" = "estándar" (+0)
    When el organizador cambia "quality" a "premium" (+3000)
    And guarda los cambios
    Then selected_attributes se actualiza con {"quality": {"selected_option": "premium", "price_modifier": 3000}}
    And el precio tentativo refleja el nuevo recargo

  Scenario: Modificar configuración de personalización en borrador
    Given el producto está en estado "draft"
    And el producto tiene módulo "sizes" habilitado con opciones ["S", "M", "L"]
    When el organizador agrega la opción "XL"
    And guarda los cambios
    Then personalization_config se actualiza con la nueva opción
    And el producto permanece en estado "draft"

  Scenario: Deshabilitar módulo de personalización en borrador
    Given el producto está en estado "draft"
    And el producto tiene módulos "sizes" y "numbers" habilitados
    When el organizador deshabilita el módulo "numbers"
    And guarda los cambios
    Then personalization_config se actualiza con el módulo "numbers" en enabled: false

  # ─── Edición en estado ACTIVE (solo nombre, descripción, estado) ───

  Scenario: Editar nombre y descripción de producto activo
    Given el producto está en estado "active"
    And el organizador está en la página de edición
    When modifica el nombre o descripción
    And guarda los cambios
    Then la información básica se actualiza
    And personalization_config NO se modifica
    And selected_attributes NO se modifica

  Scenario: Secciones bloqueadas en producto activo
    Given el producto está en estado "active"
    And el organizador está en la página de edición
    Then la sección de categoría está deshabilitada y muestra la categoría actual
    And la sección de producto del catálogo está deshabilitada y muestra el producto actual
    And la sección de atributos está deshabilitada y muestra los atributos seleccionados como solo lectura
    And la sección de personalización está deshabilitada y muestra la configuración actual como solo lectura
    And solo los campos nombre y descripción son editables

  Scenario: Cambiar estado de activo a inactivo
    Given el producto está en estado "active"
    When el organizador cambia el estado a "inactive"
    And guarda los cambios
    Then el estado cambia a "inactive"
    And se muestra mensaje de confirmación

  Scenario: No se puede volver a estado borrador desde activo
    Given el producto está en estado "active"
    Then la opción de cambiar a estado "draft" NO está disponible
    And el producto jamás puede volver a estado "draft"

  # ─── Visualización en estado INACTIVE (solo lectura + reactivación) ───

  Scenario: Producto inactivo muestra formulario de solo lectura con opción de reactivar
    Given el producto está en estado "inactive"
    And el organizador accede a la página de edición
    Then TODOS los campos de datos están deshabilitados (solo lectura)
    And se muestran los datos actuales del producto en todas las secciones
    And NO se puede modificar ningún campo de datos (nombre, descripción, categoría, atributos, personalización)
    And se muestra la opción de reactivar el producto (cambiar estado a "active")

  Scenario: Reactivar producto inactivo con requisitos cumplidos
    Given el producto está en estado "inactive"
    And el producto tiene al menos 3 imágenes
    When el organizador reactiva el producto
    Then el estado cambia a "active"
    And personalization_config permanece igual (inmutable)
    And selected_attributes permanece igual (inmutable)

  Scenario: Error al reactivar producto inactivo sin imágenes suficientes
    Given el producto está en estado "inactive"
    And el producto tiene solo 2 imágenes
    When el organizador intenta reactivar el producto
    Then se muestra error "El producto requiere mínimo 3 imágenes para ser activado"
    And el producto permanece en "inactive"

  # ─── Errores de edición ───

  Scenario: Error al guardar producto sin nombre
    Given el producto está en estado "draft"
    When el organizador deja el nombre vacío
    And intenta guardar
    Then se muestra error "El nombre del producto es obligatorio"

  Scenario: Error al guardar producto sin descripción
    Given el producto está en estado "draft"
    When el organizador deja la descripción vacía
    And intenta guardar
    Then se muestra error "La descripción del producto es obligatoria"

  Scenario: Error al guardar sin producto del catálogo seleccionado
    Given el producto está en estado "draft"
    And el organizador cambió la categoría pero no seleccionó un nuevo producto del catálogo
    When intenta guardar
    Then se muestra error "Selecciona un producto del catálogo"
```

### 7.2 Caso de uso: Activar producto

```gherkin
Feature: Activar producto (publicar)
  Como organizador
  Quiero activar mi producto
  Para que esté disponible en la tienda

  Background:
    Given el organizador está autenticado
    And tiene un producto en estado "draft"

  Scenario: Activar producto con requisitos cumplidos
    Given el producto tiene nombre, precio y al menos 3 imágenes
    When el organizador activa el producto
    Then el estado cambia a "active"
    And personalization_config se vuelve inmutable
    And se muestra mensaje de éxito

  Scenario: Error al activar producto sin imágenes suficientes
    Given el producto tiene solo 2 imágenes
    When el organizador intenta activar el producto
    Then se muestra error "El producto requiere mínimo 3 imágenes para ser activado"
    And el producto permanece en estado "draft"

  Scenario: Error al activar producto sin imágenes
    Given el producto no tiene imágenes
    When el organizador intenta activar el producto
    Then se muestra error "El producto requiere mínimo 3 imágenes para ser activado"
    And el producto permanece en estado "draft"
```

### 7.3 Caso de uso: Gestionar producto activo

```gherkin
Feature: Gestionar producto activo
  Como organizador
  Quiero gestionar mi producto publicado
  Para mantener actualizada mi oferta

  Background:
    Given el organizador está autenticado
    And tiene un producto en estado "active"

  Scenario: Editar información básica de producto activo
    Given el organizador está en la página de edición
    When modifica el nombre o descripción
    And guarda los cambios
    Then la información básica se actualiza
    And personalization_config NO se modifica
    And selected_attributes NO se modifica

  Scenario: Intentar modificar personalización de producto activo
    Given el organizador está en la página de edición
    Then la sección de personalización está deshabilitada
    And se muestra la configuración actual como solo lectura

  Scenario: Intentar modificar atributos de producto activo
    Given el organizador está en la página de edición
    Then la sección de atributos está deshabilitada
    And los atributos seleccionados se muestran como solo lectura

  Scenario: Intentar modificar categoría o producto del catálogo de producto activo
    Given el organizador está en la página de edición
    Then la sección de categoría está deshabilitada y muestra la categoría actual
    And la sección de producto del catálogo está deshabilitada y muestra el producto actual

  Scenario: Desactivar producto
    Given el producto está activo
    When el organizador desactiva el producto
    Then el estado cambia a "inactive"
    And se muestra mensaje de confirmación

  Scenario: No se puede volver a estado borrador
    Given el producto está en estado "active"
    Then la opción de cambiar a estado "draft" NO está disponible
```

### 7.4 Caso de uso: Visualizar y reactivar producto inactivo

```gherkin
Feature: Visualizar y reactivar producto inactivo
  Como organizador
  Quiero ver la información de un producto desactivado y poder reactivarlo
  Para consultar su configuración o volver a ofrecerlo en la tienda

  Background:
    Given el organizador está autenticado
    And tiene un producto en estado "inactive"

  Scenario: Visualizar producto inactivo en modo solo lectura
    Given el organizador accede a la página de edición del producto inactivo
    Then el formulario muestra todas las secciones con los datos del producto
    And TODOS los campos de datos están deshabilitados (solo lectura)
    And se muestra la categoría, producto del catálogo, atributos y personalización actuales
    And la sección de precio tentativo muestra el desglose actual
    And se muestra la opción de reactivar el producto

  Scenario: No se puede modificar ningún campo de datos de producto inactivo
    Given el organizador accede a la página de edición del producto inactivo
    Then no puede modificar el nombre ni la descripción
    And no puede modificar la categoría ni el producto del catálogo
    And no puede modificar los atributos ni la personalización

  Scenario: Reactivar producto con requisitos cumplidos
    Given el producto tiene al menos 3 imágenes
    When el organizador reactiva el producto
    Then el estado cambia a "active"
    And personalization_config permanece igual (inmutable)
    And selected_attributes permanece igual (inmutable)

  Scenario: Error al reactivar sin imágenes suficientes
    Given el producto tiene solo 2 imágenes
    When el organizador intenta reactivar
    Then se muestra error "El producto requiere mínimo 3 imágenes para ser activado"
    And el producto permanece en "inactive"
```

---

## 8. Contrato funcional: Actualizar Producto

**Entradas (dependen del estado actual del producto):**

**Si estado = `draft` (todo editable):**
- `product_id` (obligatorio): UUID del producto
- `glam_product_id` (opcional): Nuevo producto del catálogo (cambia categoría, precio base, atributos disponibles)
- `name` (opcional): Nuevo nombre
- `description` (opcional): Nueva descripción
- `personalization_config` (opcional): Nueva configuración de módulos
- `selected_attributes` (opcional): Nuevos atributos seleccionados
- `status` (opcional): Nuevo estado (`active`)

**Si estado = `active` (solo nombre, descripción, estado):**
- `product_id` (obligatorio): UUID del producto
- `name` (opcional): Nuevo nombre
- `description` (opcional): Nueva descripción
- `status` (opcional): Nuevo estado (solo `inactive`)

**Si estado = `inactive` (solo cambio de estado):**
- `product_id` (obligatorio): UUID del producto
- `status` (opcional): Nuevo estado (solo `active`, requiere mínimo 3 imágenes)

**Restricciones:**
- Si producto está `active`: no se puede modificar `personalization_config`, `selected_attributes`, `glam_product_id` ni categoría; solo `name`, `description` y transición a `inactive`
- Si producto está `inactive`: no se puede modificar ningún campo de datos; solo se permite la transición de estado a `active` (reactivación, requiere mínimo 3 imágenes)
- Si producto está `draft`: todos los campos son modificables; al cambiar `glam_product_id` se debe recalcular precio base y resetear atributos
- Transiciones de estado deben ser válidas (RN-33, RN-34)

**Salidas:**
- Producto actualizado

**Errores de negocio:**

| Codigo logico | Condicion |
|---------------|-----------|
| PRODUCT_NOT_FOUND | Producto no existe |
| PRODUCT_INACTIVE_READONLY | Intento de modificar campos de datos en producto `inactive` (solo se permite cambio de estado) |
| CONFIG_IMMUTABLE | Intento de modificar config/atributos/categoria en producto `active` |
| ATTRIBUTES_IMMUTABLE | Intento de modificar selected_attributes en producto `active` o `inactive` |
| INVALID_STATUS_TRANSITION | Transicion de estado no permitida |
| PERMISSION_DENIED | Usuario no es organizador del proyecto |
| GLAM_PRODUCT_NOT_FOUND | Producto del catalogo no existe o no activo (al cambiar en draft) |
| CATEGORY_NOT_FOUND | Categoria del glam_product no existe (al cambiar en draft) |
| INSUFFICIENT_IMAGES | Intento de activar producto con menos de 3 imágenes |
| PRODUCT_NAME_REQUIRED | Nombre vacío o no proporcionado (en draft) |
| PRODUCT_DESCRIPTION_REQUIRED | Descripción vacía o no proporcionada (en draft) |

---

## 9. Invariantes del sistema (edición)

- La categoría de un producto SIEMPRE se resuelve vía `glam_product_id → glam_products.category_id → product_categories`; la tabla `project_products` NUNCA almacena `category_id` (RN-51)
- El formulario de edición SIEMPRE carga los datos completos del `glam_product` asociado para mostrar la categoría y el producto del catálogo seleccionados (RN-52, RN-53)
- La configuración de personalización de un producto activo o inactivo NUNCA cambia
- Los atributos seleccionados (`selected_attributes`) de un producto activo o inactivo NUNCA cambian; son modificables solo en estado `draft`
- Un producto inactivo es SIEMPRE de solo lectura en sus campos de datos (ningún campo de datos modificable); solo permite reactivación (cambio de estado a `active`)
- Un producto activo solo permite modificar nombre, descripción y transición a inactivo
- Un producto NUNCA puede volver al estado `draft` después de haber sido activado
- Un producto activo SIEMPRE tiene al menos 3 imágenes
- Un producto NUNCA se elimina físicamente de la base de datos

---

## 10. Casos límite y excepciones (edición)

- **Resolución de categoría fallida**: Si el `glam_product` asociado ya no existe o fue desactivado, la categoría no puede resolverse; el formulario debe mostrar los datos almacenados del producto pero indicar que el producto del catálogo ya no está disponible (referencia histórica)
- **`glam_product` eliminado o desactivado**: El producto de proyecto sigue funcionando con sus datos almacenados (`name`, `description`, `price`, `personalization_config`, `selected_attributes`); la referencia a `glam_product_id` es histórica
- **Cambio de categoría en draft**: Debe reiniciar producto del catálogo, atributos y personalización (RN-42); al seleccionar nueva categoría se cargan los `glam_products` de esa categoría
- **Cambio de glam_product en draft**: Debe recalcular precio base y resetear atributos seleccionados; debe cargar el `attributes_config` del nuevo glam_product
- **Todas las imágenes de un producto activo eliminadas por error externo**: El sistema debe impedir reactivación hasta tener 3 imágenes; las imágenes se gestionan de forma independiente al formulario de edición

---

## 11. Seguridad y permisos

| Actor | Acción permitida | Acción prohibida |
|-------|------------------|------------------|
| Organizador (dueño) | Editar productos de sus proyectos según estado | Acceder a productos de otros proyectos |
| Organizador (no dueño) | Ninguna | Cualquier operación en proyectos ajenos |
| Buyer | Ninguna (MVP) | Editar productos |
| No autenticado | Ninguna | Cualquier operación |

---

## 12. Versionado

| Versión | Fecha | Cambios |
|---------|-------|---------|
| v1.0 | 2026-02-22 | Documento inicial, extraído de `specs/product/creation/spec.md` v2.2. Incluye todas las especificaciones de edición, actualización, transiciones de estado, inmutabilidad y restricciones por estado |
| v1.1 | 2026-02-22 | Agrega RN-51, RN-52, RN-53: resolución de categoría vía `glam_product → category_id` (project_products NO almacena category_id). Agrega sección 7.0.1 con cadena de resolución de datos para el formulario de edición. Agrega escenarios Gherkin para resolución de categoría y carga de glam_product. Actualiza glosario, invariantes y casos límite |

---

## 13. Checklist de validación (AI + Humano)

Antes de aprobar este spec:
- [x] Todos los comportamientos están en Gherkin
- [x] No hay decisiones técnicas de implementación
- [x] Las reglas de negocio están referenciadas con su numeración original (RN-xx)
- [x] No hay ambigüedades
- [x] El alcance está claro
- [x] No hay ejemplos de código fuente
- [x] Estados y transiciones documentados
- [x] Permisos y seguridad definidos
- [x] Formulario de edición con restricciones por estado documentado (RN-46 a RN-50)
- [x] Resolución de categoría y producto del catálogo documentada (RN-51 a RN-53)
- [x] Cadena de resolución de datos para el formulario de edición especificada (sección 7.0.1)
- [x] Comportamiento de edición por estado (draft/active/inactive) especificado
- [x] Contrato de actualización con restricciones por estado

---

## 14. Nota final para AI Agents

- ❌ No inferir comportamiento no especificado
- ❌ No modificar este archivo durante la implementación
- ✅ Usar este spec como base para `plan.md`, tests y validaciones
- ✅ Preguntar si algo no está explícitamente definido
- ✅ Referirse a `specs/product/creation/spec.md` para dominio completo (categorías, atributos, módulos, precio tentativo)
- ✅ Referirse a `product-curl-example.md` para contratos de API detallados
- ✅ Toda la gestión es Server-Side Rendering (SSR)
