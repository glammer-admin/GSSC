# Specification (SDD) – Lista y Menú de Productos

> **Documento normativo de comportamiento del sistema**  
> Este archivo define **QUÉ debe hacer el sistema** para la lista y navegación de productos.  
> Es la **fuente única de verdad** para planes, código, tests y AI Agents.  
> Para creación de productos, ver `specs/product/creation/spec.md`.  
> Para edición de productos, ver `specs/product/update/spec.md`.

---

## 0. Instrucciones obligatorias para la AI Agent

Antes de implementar este documento, la AI **DEBE**:
- Leer `specs/product/creation/spec.md` para entender el dominio completo de productos
- Leer `specs/product/update/spec.md` para entender los estados y transiciones
- Leer `DOCS_TECHNICAL.md` para entender la arquitectura SSR
- Leer `data-model.md` para entender el modelo de datos
- No tomar decisiones de implementación no especificadas aquí
- Preguntar cualquier ambigüedad

---

## 1. Propósito

Este módulo permite a los **organizadores** visualizar y navegar la lista de productos de sus proyectos, accediendo desde el dashboard del proyecto al menú de productos.

**Problema de negocio que resuelve:**
- Los organizadores necesitan una vista centralizada de todos los productos de un proyecto
- Se requiere acceso rápido a la creación de nuevos productos y edición de existentes
- Se necesita visibilidad del estado de cada producto (borrador, activo, inactivo)

**Valor que aporta:**
- Vista consolidada de todos los productos del proyecto
- Filtros por estado y categoría para localizar productos rápidamente
- Tags visuales de estado con colores diferenciados (borrador, activo, inactivo)
- Menú de acciones contextual (kebab menu) por producto
- Navegación directa a creación y edición de productos
- Información resumida de cada producto (nombre, estado, categoría, precio, imágenes)

---

## 2. Alcance funcional

### 2.1 Incluye

- Página de lista de productos de un proyecto
- Visualización de productos en tabla/grid con información resumida
- Tag de estado por producto con colores diferenciados: Borrador (amarillo/default), Activo (verde), Inactivo (gris)
- Conteo de imágenes por producto
- Barra de filtros en una sola línea horizontal con:
  - Buscador de productos por nombre (lado izquierdo)
  - Filtros desplegables (dropdowns) con selección múltiple: Estado, Categoría
  - Botón para limpiar filtros (cuando hay filtros activos)
- Enlace/botón para crear nuevo producto
- Menú de acciones por producto (icono de 3 puntos verticales / kebab menu) con opción de editar
- Enlace a productos desde el dashboard del proyecto
- Navegación en sidebar/menú hacia la lista de productos
- Validación de permisos (solo organizador dueño del proyecto)

### 2.2 Excluye (explícito)

- Creación de productos (ver `specs/product/creation/spec.md`)
- Edición de productos (ver `specs/product/update/spec.md`)
- Eliminación de productos (no existe eliminación física)
- Paginación (fuera de alcance MVP, evaluar si lista crece)
- Vista pública de productos para compradores (fuera de alcance)
- Gestión de pedidos/compras (fuera de alcance)

---

## 3. Actores

| Actor | Descripción | Nivel de acceso |
|-------|-------------|-----------------|
| Organizador | Usuario con rol `organizer`, dueño del proyecto | Visualización de productos de sus proyectos |

---

## 4. Reglas de negocio (OBLIGATORIAS)

### Permisos

- **RN-35:** Solo el organizador dueño del proyecto puede ver la lista de productos de ese proyecto
- **RN-36:** La verificación de propiedad se realiza comparando `organizer_id` del proyecto con el `user_id` de la sesión

### Filtros y búsqueda

- **RN-F01:** La página de lista de productos incluye una barra de filtros en una sola línea horizontal, sin título "Filtros", en la parte superior de la lista
- **RN-F02:** Los filtros disponibles son listas desplegables (dropdowns) con selección múltiple y checkboxes:
  - **Estado:** dropdown que permite seleccionar uno o más estados: `draft` (Borrador), `active` (Activo), `inactive` (Inactivo)
  - **Categoría:** dropdown que permite seleccionar una o más categorías del producto (derivada de `glam_products.category_id → product_categories.name`)
- **RN-F03:** Por defecto, al entrar a la página NO hay filtros activos (se muestran todos los productos)
- **RN-F04:** Los filtros se aplican de forma combinada (AND entre búsqueda de texto, filtros de estado y categoría; OR dentro del mismo filtro). Ejemplo: búsqueda="taza" AND estado=active AND categoría=mugs muestra solo productos activos de la categoría mugs cuyo nombre contiene "taza"
- **RN-F05:** Al limpiar todos los filtros (incluida la búsqueda), se vuelven a mostrar todos los productos del proyecto
- **RN-F06:** La interfaz indica visualmente cuántos filtros están activos en cada dropdown
- **RN-F07:** La barra de filtros incluye un buscador de productos por nombre en el lado izquierdo, los dropdowns de filtros en el centro, y el botón "Limpiar filtros" a la derecha (visible solo cuando hay filtros o búsqueda activos)
- **RN-F08:** La búsqueda por nombre filtra los productos cuyo nombre contenga el texto ingresado (case-insensitive, client-side)

### Visualización

- **RN-L01:** La lista de productos muestra TODOS los productos del proyecto cuando no hay filtros activos
- **RN-L02:** Cada producto en la lista muestra como mínimo: nombre, estado, categoría (derivada del glam_product), y conteo de imágenes
- **RN-L03:** El estado de cada producto se muestra con un tag/badge de color:
  - `draft`: tag "Borrador" (color por defecto/amarillo)
  - `active`: tag "Activo" (color verde)
  - `inactive`: tag "Inactivo" (color gris)
- **RN-L04:** Cada producto tiene un menú de acciones representado por un icono de tres puntos verticales (kebab menu) ubicado en la esquina superior derecha del producto. Este menú contiene la opción "Editar" que navega al formulario de edición
- **RN-L08:** El conteo de imágenes se muestra como un tag/badge en la parte superior de la imagen del producto (junto al tag de estado), con fondo blanco semi-transparente
- **RN-L09:** La card de producto es compacta: sin padding superior antes de la imagen, espaciado reducido entre secciones internas
- **RN-L05:** La página incluye una acción prominente para crear un nuevo producto
- **RN-L06:** Si el proyecto no tiene productos, se muestra un estado vacío con mensaje orientativo e invitación a crear el primer producto
- **RN-L07:** El estado inactivo NO se representa con un radio button ni toggle; se muestra como un tag visual con el mismo estilo que los demás estados (borrador, activo)

---

## 5. Flujos

### 5.1 Caso de uso: Visualizar lista de productos

```gherkin
Feature: Visualizar lista de productos del proyecto
  Como organizador
  Quiero ver todos los productos de mi proyecto
  Para gestionar mi catálogo de productos

  Background:
    Given el organizador está autenticado con sesión válida
    And el organizador tiene un proyecto existente

  Scenario: Ver lista de productos con productos existentes
    Given el proyecto tiene 5 productos (2 draft, 2 active, 1 inactive)
    When el organizador accede a la página de productos del proyecto
    Then se muestran los 5 productos
    And cada producto muestra su nombre, estado y categoría
    And los productos draft muestran tag "Borrador" en color por defecto/amarillo
    And los productos active muestran tag "Activo" en color verde
    And el producto inactive muestra tag "Inactivo" en color gris
    And se muestra un botón para crear nuevo producto
    And se muestra la barra de filtros en una sola línea con buscador, dropdowns de Estado y Categoría, sin filtros activos

  Scenario: Ver lista vacía de productos
    Given el proyecto no tiene productos
    When el organizador accede a la página de productos del proyecto
    Then se muestra un estado vacío con mensaje "No hay productos creados"
    And se muestra un botón/enlace para crear el primer producto

  Scenario: Navegar a creación de producto desde la lista
    Given el organizador está en la página de productos del proyecto
    When hace clic en "Crear producto" (o acción equivalente)
    Then se redirige a la página de creación de producto del proyecto

  Scenario: Navegar a edición de producto desde el menú de acciones
    Given el organizador está en la página de productos del proyecto
    And existe un producto en la lista
    When hace clic en el icono de tres puntos verticales (kebab menu) del producto
    Then se despliega un menú con la opción "Editar"
    When hace clic en "Editar"
    Then se redirige a la página de edición del producto

  Scenario: Navegar a productos desde el dashboard del proyecto
    Given el organizador está en el dashboard de su proyecto
    When hace clic en el enlace/sección de "Productos"
    Then se redirige a la página de lista de productos del proyecto
```

### 5.2 Caso de uso: Filtrar y buscar productos

```gherkin
Feature: Filtrar y buscar productos en la lista
  Como organizador
  Quiero filtrar los productos por estado, categoría y buscar por nombre
  Para encontrar rápidamente los productos que necesito gestionar

  Background:
    Given el organizador está autenticado con sesión válida
    And el organizador tiene un proyecto con productos en diversos estados y categorías

  Scenario: Filtrar productos por estado usando dropdown
    Given el proyecto tiene 5 productos (2 draft, 2 active, 1 inactive)
    When el organizador abre el dropdown de "Estado"
    And selecciona el checkbox "Activo"
    Then se muestran solo los 2 productos con estado active
    And los demás productos no se muestran
    And el dropdown "Estado" indica visualmente que hay 1 opción seleccionada

  Scenario: Filtrar productos por categoría usando dropdown
    Given el proyecto tiene productos en las categorías "Mugs" y "Termos"
    When el organizador abre el dropdown de "Categoría"
    And selecciona el checkbox "Mugs"
    Then se muestran solo los productos de la categoría "Mugs"
    And los productos de otras categorías no se muestran

  Scenario: Buscar productos por nombre
    Given el proyecto tiene productos "Taza Premium", "Taza Básica" y "Termo Sport"
    When el organizador escribe "taza" en el buscador de productos
    Then se muestran solo "Taza Premium" y "Taza Básica"
    And "Termo Sport" no se muestra

  Scenario: Combinar búsqueda con filtros de estado y categoría
    Given el proyecto tiene productos activos e inactivos en las categorías "Mugs" y "Termos"
    When el organizador escribe "premium" en el buscador
    And selecciona el filtro de estado "Activo"
    And selecciona el filtro de categoría "Mugs"
    Then se muestran solo los productos activos de la categoría "Mugs" cuyo nombre contiene "premium"

  Scenario: Seleccionar múltiples valores dentro del mismo filtro
    Given el proyecto tiene productos en estado draft, active e inactive
    When el organizador abre el dropdown de "Estado"
    And selecciona los checkboxes "Borrador" y "Activo"
    Then se muestran los productos con estado draft y active
    And los productos inactive no se muestran

  Scenario: Limpiar filtros
    Given el organizador tiene filtros activos de estado, categoría y/o texto de búsqueda
    When el organizador hace clic en "Limpiar filtros"
    Then se muestran todos los productos del proyecto
    And no se indica ningún filtro activo
    And el campo de búsqueda se limpia

  Scenario: Sin resultados con filtros aplicados
    Given el organizador tiene filtros activos
    And ningún producto cumple los criterios de filtro y/o búsqueda
    Then se muestra un mensaje indicando "No se encontraron productos con los filtros seleccionados"
    And se ofrece la opción de limpiar los filtros
```

### 5.3 Caso de uso: Validación de permisos en lista

```gherkin
Feature: Validación de permisos en lista de productos
  Como sistema
  Quiero validar que solo el organizador dueño pueda ver los productos
  Para garantizar la seguridad de los datos

  Scenario: Organizador accede a lista de productos de su proyecto
    Given el organizador tiene un proyecto con organizer_id igual a su user_id
    When accede a la página de productos de ese proyecto
    Then se permite la visualización

  Scenario: Organizador intenta acceder a productos de otro proyecto
    Given existe un proyecto con organizer_id diferente al user_id del organizador
    When intenta acceder a la página de productos de ese proyecto
    Then se rechaza la operación con error 403
    And se muestra mensaje "No tiene permisos para gestionar este proyecto"

  Scenario: Usuario sin rol organizador intenta ver productos
    Given el usuario tiene rol "buyer" pero no "organizer"
    When intenta acceder a la lista de productos
    Then se redirige al dashboard correspondiente a su rol
```

---

## 6. Contrato funcional: Listar Productos

**Entradas:**
- `project_id` (obligatorio): UUID del proyecto
- `search` (opcional, client-side): Texto de búsqueda por nombre del producto (case-insensitive)
- `status` (opcional, client-side): Filtro por estado(s) del producto. Acepta uno o más valores: `draft`, `active`, `inactive`
- `category` (opcional, client-side): Filtro por categoría(s) del producto. Acepta uno o más `category_id` (UUID)

**Restricciones:**
- El usuario debe ser organizador del proyecto
- Sin filtros activos, se retornan todos los productos del proyecto independientemente de su estado
- Con filtros activos, se aplican de forma combinada (AND entre tipos de filtro, OR dentro del mismo tipo)

**Salidas:**
- Lista de productos del proyecto (filtrada si aplica) con:
  - `id`: UUID del producto
  - `name`: Nombre del producto
  - `status`: Estado actual (draft, active, inactive)
  - `category`: Categoría del producto (derivada del glam_product)
  - `price`: Precio del producto
  - `images_count`: Cantidad de imágenes del producto
  - `created_at`: Fecha de creación
  - `updated_at`: Fecha de última actualización
- Lista de categorías disponibles para el filtro (derivada de los productos existentes del proyecto)

**Errores de negocio:**

| Código lógico | Condición |
|---------------|-----------|
| PROJECT_NOT_FOUND | Proyecto no existe |
| PERMISSION_DENIED | Usuario no es organizador del proyecto |

---

## 7. Información mostrada por producto

| Campo | Descripción | Origen |
|-------|-------------|--------|
| Nombre | Nombre del producto | `project_products.name` |
| Estado | Tag de estado: "Borrador" (amarillo/default), "Activo" (verde), "Inactivo" (gris) | `project_products.status` |
| Categoría | Nombre de la categoría | `glam_products.category → product_categories.name` |
| Precio | Precio del producto | `project_products.price` |
| Imágenes | Conteo de imágenes (tag superpuesto en imagen, junto al estado, fondo blanco semi-transparente) | `count(product_images)` |
| Imagen principal | Thumbnail de la primera imagen (posición 1) | `product_images` donde `position = 1` |
| Fecha | Fecha de creación o última actualización | `project_products.created_at / updated_at` |
| Acciones | Menú kebab (icono de 3 puntos verticales) en esquina superior derecha, con opción "Editar" | Navegación a `/project/{id}/products/{productId}/edit` |

---

## 8. Invariantes del sistema (lista)

- La lista muestra todos los productos del proyecto cuando NO hay filtros activos
- Al aplicar filtros, la lista muestra SOLO los productos que cumplen los criterios seleccionados
- Los filtros se combinan con lógica AND entre tipos (estado + categoría) y OR dentro del mismo tipo
- El acceso a la lista SIEMPRE requiere autenticación y ser organizador dueño del proyecto
- La lista NUNCA muestra productos de otros proyectos
- La navegación a edición SIEMPRE se realiza a través del menú kebab del producto
- El estado inactivo SIEMPRE se muestra como tag visual, NUNCA como radio button o toggle

---

## 9. Seguridad y permisos

| Actor | Acción permitida | Acción prohibida |
|-------|------------------|------------------|
| Organizador (dueño) | Ver lista de productos de sus proyectos | Acceder a productos de otros proyectos |
| Organizador (no dueño) | Ninguna | Ver productos de proyectos ajenos |
| Buyer | Ninguna (MVP) | Ver lista de productos |
| No autenticado | Ninguna | Cualquier operación |

---

## 10. Versionado

| Versión | Fecha | Cambios |
|---------|-------|---------|
| v1.0 | 2026-02-22 | Documento inicial, extraído y expandido desde `specs/product/creation/spec.md` y `specs/product/creation/plan.md` |
| v1.1 | 2026-02-22 | Agregar filtros por estado y categoría; menú kebab para acciones; tags de color por estado (borrador: amarillo, activo: verde, inactivo: gris); eliminar radio button de inactivo |
| v1.2 | 2026-02-22 | Rediseño visual de filtros: barra en una sola línea con buscador de productos, dropdowns con selección múltiple (Estado, Categoría), botón limpiar filtros; eliminar título "Filtros"; agregar búsqueda por nombre (client-side) |
| v1.3 | 2026-02-22 | Cambios visuales en card de producto: conteo de imágenes como tag en overlay de imagen (fondo blanco semi-transparente), card más compacta con espaciado reducido, sin padding superior antes de la imagen |

---

## 11. Checklist de validación (AI + Humano)

Antes de aprobar este spec:
- [x] Todos los comportamientos están en Gherkin
- [x] No hay decisiones técnicas de implementación
- [x] Las reglas de negocio están numeradas
- [x] No hay ambigüedades
- [x] El alcance está claro
- [x] Permisos y seguridad definidos
- [x] Información por producto documentada
- [x] Estado vacío documentado
- [x] Navegación documentada
- [x] Filtros documentados (estado y categoría) con UI de dropdowns
- [x] Búsqueda por nombre documentada
- [x] Barra de filtros en una sola línea (sin título)
- [x] Menú de acciones (kebab) documentado
- [x] Colores de tags de estado definidos

---

## 12. Nota final para AI Agents

- ❌ No inferir comportamiento no especificado
- ❌ No modificar este archivo durante la implementación
- ✅ Usar este spec como base para `plan.md`, tests y validaciones
- ✅ Preguntar si algo no está explícitamente definido
- ✅ Referirse a `specs/product/creation/spec.md` para dominio completo
- ✅ Referirse a `specs/product/update/spec.md` para estados y transiciones
- ✅ Toda la gestión es Server-Side Rendering (SSR)
