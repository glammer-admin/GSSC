# Specification (SDD) – Creación de Productos

> **Documento normativo de comportamiento del sistema**  
> Este archivo define **QUÉ debe hacer el sistema**, no **CÓMO se implementa**.  
> Es la **fuente única de verdad** para planes, código, tests y AI Agents.

---

## 0. Instrucciones obligatorias para la AI Agent

Antes de implementar este documento, la AI **DEBE**:
- Leer `DOCS_TECHNICAL.md` para entender la arquitectura SSR
- Leer `data-model.md` para entender el modelo de datos
- Leer `product-curl-example.md` para entender los contratos de API y estructura de datos
- Revisar `lib/http/project/project-storage-client.ts` como patrón de referencia para Storage
- Revisar `lib/types/project/types.ts` como patrón de referencia para tipos
- No tomar decisiones de implementación no especificadas aquí
- Preguntar cualquier ambigüedad

---

## 1. Propósito

Este módulo permite a los **organizadores** crear productos dentro de sus proyectos para ser vendidos en la tienda virtual de Glam Urban.

**Problema de negocio que resuelve:**
- Los organizadores necesitan publicar ofertas de productos personalizables (uniformes, camisetas, accesorios, mugs, termos) para sus compradores
- La plataforma debe garantizar trazabilidad, estabilidad operativa y una experiencia consistente

**Valor que aporta:**
- Flujo guiado de creación: categoría → producto del catálogo → atributos → personalización
- Productos del catálogo Glam Urban como base obligatoria para todo producto de proyecto
- Atributos configurables con modificadores de precio (calidad, material, etc.)
- Control de calidad visual (mínimo 3 imágenes por producto activo)
- Inmutabilidad de configuración y atributos para garantizar consistencia en pedidos

---

## 2. Alcance funcional

### 2.1 Incluye

- Selección de categoría de producto (catálogo cerrado de plataforma)
- Selección de producto del catálogo Glam Urban (`glam_products`) según categoría
- Selección de atributos del producto (`selected_attributes`) con modificadores de precio
- Definición de información básica del producto (nombre, descripción)
- Configuración de módulos de personalización según categoría (no afectan precio)
- Visualización de precio tentativo (precio base + recargos atributos + comisión + IVA)
- Gestión de imágenes del producto (subida manual, redirección a editor, mensaje designer assisted)
- Cambio de estado del producto (draft → active → inactive)
- Validación de requisitos para activación (mínimo 3 imágenes)
- Edición de productos en estado borrador
- Desactivación de productos activos

### 2.2 Excluye (explícito)

> Todo lo no listado aquí se considera fuera de alcance.

- Creación/modificación de categorías de producto (solo plataforma)
- Creación/modificación de módulos de personalización (solo plataforma)
- Creación/modificación de productos del catálogo Glam Urban (solo plataforma)
- Creación/modificación de atributos del catálogo (solo plataforma)
- Implementación del Online Editor (solo redirección a URL externa)
- Flujo operativo de Designer Assisted (solo mensaje informativo)
- Eliminación física de productos (solo desactivación)
- Modificación de `personalization_config` después de activar el producto
- Modificación de `selected_attributes` después de la creación del producto
- Tienda pública de productos (fuera de alcance)
- Gestión de pedidos/compras (fuera de alcance)

---

## 3. Actores

| Actor | Descripción | Nivel de acceso |
|-------|-------------|-----------------|
| Organizador | Usuario con rol `organizer`, dueño del proyecto | CRUD productos de sus proyectos |
| Plataforma (Glam Urban) | Sistema | Gestiona catálogos (categorías, módulos, glam_products, atributos) |
| Comprador | Usuario con rol `buyer` | Solo visualización (fuera de alcance MVP) |

---

## 4. Glosario de dominio

| Término | Definición |
|---------|------------|
| Producto de proyecto | Oferta publicada dentro de un proyecto, derivada de un producto del catálogo Glam Urban |
| Producto del catálogo (glam_product) | Producto base del catálogo Glam Urban con precio base y atributos configurables |
| Categoría | Tipo de producto definido por la plataforma que determina los productos del catálogo, módulos y modos visuales permitidos |
| Atributo | Propiedad configurable de un producto del catálogo (calidad, material, color) con opciones y modificadores de precio |
| Atributo seleccionado | Elección concreta de un atributo por el organizador, almacenada en `selected_attributes` (inmutable tras creación) |
| Módulo de personalización | Opción configurable que el comprador puede elegir (tallas, números, nombres, categorías de edad) |
| Modo visual | Método de generación de imágenes del producto (upload, online_editor, designer_assisted) |
| Configuración de personalización | Objeto JSON inmutable que define qué módulos están habilitados y sus opciones |
| Precio base | Precio del producto del catálogo Glam Urban (definido por la plataforma) |
| Precio del producto | `price` almacenado en `project_products`, equivale al precio base del glam_product seleccionado |
| Precio final tentativo | Precio base + recargos de atributos + comisión del proyecto + IVA |

---

## 5. Reglas de negocio (OBLIGATORIAS)

### Catálogo y Productos Glam Urban

- **RN-01:** Las categorías de producto son un catálogo cerrado gestionado exclusivamente por la plataforma
- **RN-02:** Los productos del catálogo (`glam_products`) son gestionados exclusivamente por la plataforma
- **RN-03:** Todo producto de proyecto **debe** derivar de un producto del catálogo (`glam_product_id` es obligatorio, NOT NULL)
- **RN-43:** La selección de categoría es obligatoria; no se puede guardar un producto sin haber seleccionado una categoría
- **RN-04:** La categoría del producto de proyecto se hereda del producto del catálogo (`glam_product → category_id`); no existe `category_id` en `project_products`
- **RN-05:** Cada categoría define qué módulos de personalización están permitidos (`allowed_modules`)
- **RN-06:** Cada categoría define qué modos visuales están permitidos (`allowed_visual_modes`)
- **RN-42:** Al cambiar la categoría en el formulario de creación, se debe reiniciar completamente la selección: se limpia el producto del catálogo seleccionado (`glam_product`), se limpian los atributos seleccionados (`selected_attributes`), se limpian los módulos de personalización configurados, y todos los precios (base, recargos, tentativo) vuelven a `0`

### Atributos

- **RN-07:** Los atributos disponibles se definen en `glam_products.attributes_config` (JSONB)
- **RN-08:** Cada atributo tiene opciones y modificadores de precio por opción (`price_modifier`)
- **RN-09:** Los atributos seleccionados se almacenan en `project_products.selected_attributes` (JSONB)
- **RN-10:** `selected_attributes` es **inmutable** después de la creación del producto
- **RN-11:** Un producto puede crearse sin atributos seleccionados (`selected_attributes: {}`) si el producto del catálogo no tiene atributos configurables
- **RN-12:** Los recargos por atributos se suman al precio base para calcular el precio final tentativo

### Módulos de personalización

- **RN-13:** Los módulos de personalización son un catálogo cerrado gestionado exclusivamente por la plataforma
- **RN-14:** Los módulos configurados en un producto DEBEN estar dentro de los `allowed_modules` de su categoría
- **RN-15:** Un producto puede no tener módulos de personalización habilitados (producto estándar)
- **RN-16:** Los módulos de personalización **no afectan** el precio del producto (price_modifier informativo, MVP: 0)
- **RN-44:** Los módulos de personalización permitidos por la categoría deben presentarse con un valor por defecto al cargar el formulario (`enabled: false` por defecto)
- **RN-45:** El formulario debe enviar siempre un valor para cada módulo de personalización disponible según la categoría, incluso si el valor es `enabled: false`; no se permite omitir módulos del payload

### Creación y Configuración

- **RN-17:** Todo producto se crea inicialmente en estado `draft` (borrador)
- **RN-18:** Un producto pertenece a un único proyecto y no puede existir sin proyecto
- **RN-19:** El nombre y la descripción del producto son obligatorios y no pueden estar vacíos
- **RN-20:** El precio (`price`) es obligatorio y se toma del precio base del producto del catálogo seleccionado
- **RN-41:** Mientras no se haya seleccionado un producto del catálogo, el precio del producto es `0` y la sección de precio tentativo muestra `$0`

### Inmutabilidad

- **RN-21:** La configuración de personalización (`personalization_config`) puede modificarse mientras el producto esté en `draft`
- **RN-22:** Una vez el producto pasa a estado `active`, la configuración de personalización es INMUTABLE
- **RN-23:** `selected_attributes` es INMUTABLE desde el momento de la creación (no se puede modificar nunca)
- **RN-24:** Si el organizador requiere cambiar la configuración o atributos, debe desactivar el producto y crear uno nuevo
- **RN-25:** Los productos NO pueden eliminarse físicamente, solo desactivarse

### Imágenes

- **RN-26:** Todo producto activo debe tener mínimo 3 imágenes
- **RN-27:** Un producto en borrador puede guardarse sin imágenes
- **RN-28:** No se puede activar un producto con menos de 3 imágenes
- **RN-29:** No se puede eliminar una imagen si el producto activo quedaría con menos de 3
- **RN-30:** Las imágenes tienen un atributo `source` que indica su origen (upload, online_editor, designer_assisted)
- **RN-31:** Las imágenes tienen una posición (`position`) que determina el orden de visualización
- **RN-32:** La posición de imagen debe ser única por producto (no duplicados)

### Estados y Transiciones

- **RN-33:** Las transiciones de estado válidas son:
  - `draft` → `active` (requiere mínimo 3 imágenes)
  - `active` → `inactive`
  - `inactive` → `active` (requiere mínimo 3 imágenes)
- **RN-34:** No existe transición de `active` → `draft` ni de `inactive` → `draft`

### Permisos

- **RN-35:** Solo el organizador dueño del proyecto puede crear/editar productos en ese proyecto
- **RN-36:** La verificación de propiedad se realiza comparando `organizer_id` del proyecto con el `user_id` de la sesión

### Precio final tentativo

- **RN-37:** El precio final tentativo se calcula como: `(precio_base + recargos_atributos + comisión_proyecto) + IVA`
- **RN-38:** La comisión del proyecto se calcula como porcentaje sobre `(precio_base + recargos_atributos)`
- **RN-39:** El IVA (19%) se calcula sobre `(precio_base + recargos_atributos + comisión)`
- **RN-40:** El precio final tentativo es informativo y puede variar; se muestra como sección de solo lectura

---

## 6. Estados del dominio

| Estado | Descripción |
|--------|-------------|
| `draft` | Producto en configuración, no visible para compradores, personalización editable |
| `active` | Producto publicado, visible en tienda, personalización y atributos inmutables |
| `inactive` | Producto desactivado, no visible para nuevos compradores |

### 6.1 Transiciones válidas

| Estado actual | Evento | Nuevo estado | Condiciones |
|---------------|--------|--------------|-------------|
| `draft` | Activar | `active` | Mínimo 3 imágenes |
| `active` | Desactivar | `inactive` | Ninguna |
| `inactive` | Reactivar | `active` | Mínimo 3 imágenes |

---

## 7. Flujo de creación de producto

### 7.0 Flujo progresivo en el formulario

El formulario de creación presenta un flujo secuencial donde cada paso habilita el siguiente:

1. **Información básica**: nombre y descripción del producto
2. **Categoría**: selecciona una categoría del catálogo
3. **Producto del catálogo**: se listan los `glam_products` de esa categoría; el organizador selecciona uno
4. **Atributos** (habilitado tras seleccionar producto): se muestran los atributos del producto (`attributes_config`); el organizador selecciona opciones; los atributos con `price_modifier > 0` se reflejan en la sección de precio
5. **Personalización** (habilitado tras seleccionar producto): se configuran los módulos de personalización permitidos por la categoría; estos no afectan el precio
6. **Precio tentativo** (solo lectura): muestra desglose de precio base, recargos atributos, comisión, IVA y total

### 7.1 Caso de uso: Crear producto en borrador

```gherkin
Feature: Crear producto en borrador
  Como organizador
  Quiero crear un nuevo producto en mi proyecto
  Para configurarlo y luego publicarlo en la tienda

  Background:
    Given el organizador está autenticado con sesión válida
    And el organizador tiene un proyecto existente
    And existen categorías de producto en el catálogo
    And existen productos del catálogo Glam Urban

  Scenario: Crear producto seleccionando del catálogo
    Given el organizador está en la página de creación de producto
    And selecciona la categoría "mugs"
    And se listan los productos del catálogo de esa categoría
    When selecciona el producto "Mug 9 oz" del catálogo
    Then se pre-rellenan nombre, descripción y precio base del producto
    And se habilita la sección de atributos (si el producto tiene attributes_config)
    And se habilita la sección de personalización

  Scenario: Seleccionar atributos con modificador de precio
    Given el organizador seleccionó el producto "Mug 9 oz" del catálogo
    And el producto tiene atributo "quality" con opciones ["estándar" (+0), "premium" (+3000)]
    When selecciona la opción "premium" para "quality"
    Then selected_attributes almacena {"quality": {"selected_option": "premium", "price_modifier": 3000}}
    And la sección de precio tentativo muestra el recargo de +3000

  Scenario: Crear producto con atributos y personalización
    Given el organizador seleccionó un producto del catálogo
    And seleccionó atributo "quality" = "premium" (+3000)
    And habilitó módulo de personalización "sizes" con opciones ["único"]
    When guarda el producto
    Then el producto se crea en estado "draft"
    And selected_attributes es {"quality": {"selected_option": "premium", "price_modifier": 3000}}
    And personalization_config incluye sizes habilitado
    And price es el precio base del glam_product seleccionado

  Scenario: Crear producto sin atributos (producto del catálogo sin attributes_config)
    Given el organizador seleccionó un producto del catálogo sin atributos configurables
    When configura la personalización
    And guarda el producto
    Then el producto se crea con selected_attributes: {}
    And la sección de atributos no se muestra

  Scenario: Crear producto con múltiples módulos de personalización
    Given el organizador seleccionó un producto de la categoría "jersey"
    And la categoría permite módulos "sizes", "numbers", "names"
    When habilita módulo "sizes" con opciones ["S", "M", "L", "XL"]
    And habilita módulo "numbers" con rango 1-99
    And habilita módulo "names" con longitud máxima 15
    And guarda el producto
    Then el producto se crea con los tres módulos configurados
    And los módulos de personalización no afectan el precio tentativo

  Scenario: Crear producto sin personalización
    Given el organizador seleccionó un producto del catálogo
    And no habilita ningún módulo de personalización
    And guarda el producto
    Then el producto se crea como producto estándar sin personalización

  Scenario: Error al crear producto sin seleccionar producto del catálogo
    Given el organizador seleccionó una categoría
    When no selecciona ningún producto del catálogo
    And intenta guardar el producto
    Then se muestra error "Selecciona un producto del catálogo"
    And el producto no se crea

  Scenario: Error al crear producto sin nombre
    Given el organizador está en la página de creación de producto
    When deja el nombre vacío
    And intenta guardar el producto
    Then se muestra error "El nombre del producto es obligatorio"
    And el producto no se crea

  Scenario: Error al crear producto sin descripción
    Given el organizador está en la página de creación de producto
    When deja la descripción vacía
    And intenta guardar el producto
    Then se muestra error "La descripción del producto es obligatoria"
    And el producto no se crea

  Scenario: Error al crear producto sin categoría
    Given el organizador está en la página de creación de producto
    When no selecciona ninguna categoría
    And intenta guardar el producto
    Then se muestra error "Selecciona una categoría de producto"
    And el producto no se crea

  Scenario: Error al configurar módulo no permitido por categoría
    Given el organizador seleccionó un producto de la categoría "accessories" que solo permite "sizes"
    When intenta habilitar el módulo "numbers"
    Then el módulo "numbers" no está disponible para selección
    And solo se muestran los módulos permitidos por la categoría

  Scenario: Módulos de personalización se envían siempre con valor por defecto
    Given el organizador seleccionó un producto de la categoría "jersey"
    And la categoría permite módulos "sizes", "numbers", "names"
    And el organizador no habilita ningún módulo
    When guarda el producto
    Then personalization_config contiene los 3 módulos con enabled: false
    And ningún módulo se omite del payload

  Scenario: Cambiar de categoría reinicia selección completa
    Given el organizador seleccionó la categoría "mugs"
    And seleccionó el producto "Mug 9 oz" con precio base 15000
    And seleccionó atributo "quality" = "premium" (+3000)
    When cambia la categoría a "jersey"
    Then se limpia la selección de producto del catálogo
    And se limpian los atributos seleccionados (selected_attributes = {})
    And se limpian los módulos de personalización
    And el precio base vuelve a 0
    And el precio tentativo muestra $0
    And se listan los productos de la nueva categoría "jersey"
```

### 7.2 Caso de uso: Gestionar imágenes del producto

```gherkin
Feature: Gestionar imágenes del producto
  Como organizador
  Quiero agregar imágenes a mi producto
  Para mostrar visualmente el producto a los compradores

  Background:
    Given el organizador está autenticado
    And tiene un producto en estado "draft"

  Scenario: Subir imagen manualmente (Upload Images)
    Given el organizador está en la sección de imágenes del producto
    And la categoría permite modo visual "upload_images"
    When selecciona la opción "Subir imágenes"
    And selecciona un archivo de imagen válido (PNG, JPG, WebP)
    And el archivo es menor a 10MB
    Then la imagen se sube al Storage
    And se crea registro en product_images con source "upload"
    And se asigna la siguiente posición disponible
    And se muestra vista previa de la imagen

  Scenario: Subir múltiples imágenes
    Given el organizador está en la sección de imágenes
    When sube 3 imágenes válidas
    Then las imágenes se almacenan con posiciones 1, 2, 3
    And todas tienen source "upload"

  Scenario: Reordenar imágenes
    Given el producto tiene 3 imágenes
    When el organizador cambia el orden de las imágenes
    Then las posiciones se actualizan según el nuevo orden

  Scenario: Eliminar imagen de producto en borrador
    Given el producto tiene 2 imágenes
    When el organizador elimina una imagen
    Then la imagen se elimina del Storage
    And se elimina el registro de product_images
    And el producto queda con 1 imagen

  Scenario: Usar Online Editor
    Given el organizador está en la sección de imágenes
    And la categoría permite modo visual "online_editor"
    When selecciona la opción "Editor Online"
    Then se redirige a la URL del editor con el product_id como parámetro
    And las imágenes generadas por el editor se almacenarán con source "online_editor"

  Scenario: Solicitar Designer Assisted
    Given el organizador está en la sección de imágenes
    And la categoría permite modo visual "designer_assisted"
    When selecciona la opción "Diseño Asistido"
    Then se muestra mensaje informativo
    And el mensaje indica que un representante de Glam Urban se contactará
    And las imágenes del diseñador se almacenarán con source "designer_assisted"

  Scenario: Error al subir imagen con formato inválido
    Given el organizador está en la sección de imágenes
    When intenta subir un archivo con formato no permitido (ej: .gif, .bmp)
    Then se muestra error "Formato no permitido. Use PNG, JPG o WebP"
    And la imagen no se sube

  Scenario: Error al subir imagen muy grande
    Given el organizador está en la sección de imágenes
    When intenta subir una imagen mayor a 10MB
    Then se muestra error "La imagen excede el tamaño máximo de 10MB"
    And la imagen no se sube
```

### 7.3 Caso de uso: Editar producto en borrador

```gherkin
Feature: Editar producto en borrador
  Como organizador
  Quiero modificar mi producto antes de publicarlo
  Para ajustar la configuración según mis necesidades

  Background:
    Given el organizador está autenticado
    And tiene un producto en estado "draft"

  Scenario: Editar información básica
    Given el organizador está en la página de edición del producto
    When modifica el nombre a "Mug 9 oz - Tigres FC Edición Especial"
    And modifica la descripción
    And guarda los cambios
    Then el producto se actualiza con la nueva información
    And se muestra mensaje de éxito

  Scenario: Modificar configuración de personalización en borrador
    Given el producto tiene módulo "sizes" habilitado con opciones ["S", "M", "L"]
    When el organizador agrega la opción "XL"
    And guarda los cambios
    Then personalization_config se actualiza con la nueva opción
    And el producto permanece en estado "draft"

  Scenario: Deshabilitar módulo de personalización en borrador
    Given el producto tiene módulos "sizes" y "numbers" habilitados
    When el organizador deshabilita el módulo "numbers"
    And guarda los cambios
    Then personalization_config se actualiza sin el módulo "numbers"

  Scenario: No se pueden modificar atributos seleccionados
    Given el producto fue creado con selected_attributes {"quality": {"selected_option": "premium", "price_modifier": 3000}}
    When el organizador intenta modificar los atributos seleccionados
    Then la sección de atributos está deshabilitada
    And se muestra mensaje indicando que los atributos son inmutables
```

### 7.4 Caso de uso: Activar producto

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

### 7.5 Caso de uso: Gestionar producto activo

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
    And se muestra mensaje "La configuración de personalización no puede modificarse en productos activos"

  Scenario: Intentar modificar atributos de producto activo
    Given el organizador está en la página de edición
    Then la sección de atributos está deshabilitada
    And los atributos seleccionados se muestran como solo lectura

  Scenario: Agregar imagen a producto activo
    Given el producto tiene 3 imágenes
    When el organizador sube una nueva imagen
    Then la imagen se agrega en la siguiente posición
    And el producto ahora tiene 4 imágenes

  Scenario: Eliminar imagen manteniendo mínimo
    Given el producto tiene 4 imágenes
    When el organizador elimina una imagen
    Then la imagen se elimina
    And el producto queda con 3 imágenes

  Scenario: Error al eliminar imagen quedando bajo el mínimo
    Given el producto tiene exactamente 3 imágenes
    When el organizador intenta eliminar una imagen
    Then se muestra error "No se puede eliminar. El producto activo requiere mínimo 3 imágenes"
    And la imagen no se elimina

  Scenario: Desactivar producto
    Given el producto está activo
    When el organizador desactiva el producto
    Then el estado cambia a "inactive"
    And se muestra mensaje de confirmación
```

### 7.6 Caso de uso: Reactivar producto inactivo

```gherkin
Feature: Reactivar producto inactivo
  Como organizador
  Quiero reactivar un producto desactivado
  Para volver a ofrecerlo en la tienda

  Background:
    Given el organizador está autenticado
    And tiene un producto en estado "inactive"

  Scenario: Reactivar producto con requisitos cumplidos
    Given el producto tiene al menos 3 imágenes
    When el organizador reactiva el producto
    Then el estado cambia a "active"
    And personalization_config permanece igual (inmutable)
    And selected_attributes permanece igual (inmutable)

  Scenario: Error al reactivar sin imágenes suficientes
    Given el producto tiene solo 2 imágenes (algunas fueron eliminadas)
    When el organizador intenta reactivar
    Then se muestra error "El producto requiere mínimo 3 imágenes para ser activado"
    And el producto permanece en "inactive"
```

### 7.7 Caso de uso: Validación de permisos

```gherkin
Feature: Validación de permisos
  Como sistema
  Quiero validar que solo el organizador dueño pueda gestionar productos
  Para garantizar la seguridad de los datos

  Scenario: Organizador accede a producto de su proyecto
    Given el organizador tiene un proyecto con organizer_id igual a su user_id
    When accede a crear/editar productos de ese proyecto
    Then se permite la operación

  Scenario: Organizador intenta acceder a producto de otro proyecto
    Given existe un proyecto con organizer_id diferente al user_id del organizador
    When intenta crear/editar productos de ese proyecto
    Then se rechaza la operación con error 403
    And se muestra mensaje "No tiene permisos para gestionar este proyecto"

  Scenario: Usuario sin rol organizador intenta crear producto
    Given el usuario tiene rol "buyer" pero no "organizer"
    When intenta acceder a la creación de productos
    Then se redirige al dashboard correspondiente a su rol
```

---

## 8. Contratos funcionales (conceptuales)

### 8.1 Crear Producto

**Entradas:**
- `project_id` (obligatorio): UUID del proyecto
- `glam_product_id` (obligatorio): UUID del producto del catálogo Glam Urban
- `name` (obligatorio): Nombre del producto (no vacío)
- `description` (obligatorio): Descripción comercial (no vacía)
- `price` (obligatorio): Precio del producto (tomado del precio base del glam_product)
- `personalization_config` (obligatorio): Objeto JSON con configuración de módulos
- `selected_attributes` (obligatorio): Objeto JSON con atributos seleccionados y sus price_modifier (puede ser `{}`)

**Restricciones:**
- El usuario debe ser organizador del proyecto
- El `glam_product_id` debe existir y estar activo en el catálogo
- La categoría se hereda del glam_product (no se envía category_id)
- Los módulos en `personalization_config` deben estar en `allowed_modules` de la categoría del glam_product
- Los atributos en `selected_attributes` deben corresponder a opciones válidas de `glam_products.attributes_config`

**Salidas:**
- Producto creado en estado `draft`
- ID del producto generado

**Errores de negocio:**

| Código lógico | Condición |
|---------------|-----------|
| PRODUCT_NAME_REQUIRED | Nombre vacío o no proporcionado |
| PRODUCT_DESCRIPTION_REQUIRED | Descripción vacía o no proporcionada |
| CATEGORY_REQUIRED | Categoría no seleccionada |
| GLAM_PRODUCT_REQUIRED | glam_product_id no proporcionado |
| GLAM_PRODUCT_NOT_FOUND | Producto del catálogo no existe o no activo |
| CATEGORY_NOT_FOUND | Categoría del glam_product no existe |
| MODULE_NOT_ALLOWED | Módulo no permitido por categoría |
| PROJECT_NOT_FOUND | Proyecto no existe |
| PERMISSION_DENIED | Usuario no es organizador del proyecto |

### 8.2 Actualizar Producto

**Entradas:**
- `product_id` (obligatorio): UUID del producto
- `name` (opcional): Nuevo nombre
- `description` (opcional): Nueva descripción
- `personalization_config` (opcional): Nueva configuración (solo si draft)
- `status` (opcional): Nuevo estado

**Restricciones:**
- Si producto está `active` o `inactive`, no se puede modificar `personalization_config`
- `selected_attributes` NUNCA puede modificarse (inmutable tras creación)
- Transiciones de estado deben ser válidas
- Activación requiere mínimo 3 imágenes

**Salidas:**
- Producto actualizado

**Errores de negocio:**

| Código lógico | Condición |
|---------------|-----------|
| PRODUCT_NOT_FOUND | Producto no existe |
| CONFIG_IMMUTABLE | Intento de modificar config en producto no-draft |
| ATTRIBUTES_IMMUTABLE | Intento de modificar selected_attributes |
| INVALID_STATUS_TRANSITION | Transición de estado no permitida |
| INSUFFICIENT_IMAGES | Activación con menos de 3 imágenes |
| PERMISSION_DENIED | Usuario no es organizador del proyecto |

### 8.3 Gestionar Imágenes

**Entradas (subir):**
- `product_id` (obligatorio): UUID del producto
- `file` (obligatorio): Archivo de imagen
- `position` (opcional): Posición deseada (auto-asignada si no se proporciona)
- `source` (obligatorio): Origen de la imagen (upload, online_editor, designer_assisted)

**Restricciones:**
- Formatos permitidos: PNG, JPG, JPEG, WebP
- Tamaño máximo: 10MB
- Posición debe ser única por producto

**Entradas (eliminar):**
- `image_id` (obligatorio): UUID de la imagen

**Restricciones:**
- Si producto está `active`, no puede quedar con menos de 3 imágenes

**Errores de negocio:**

| Código lógico | Condición |
|---------------|-----------|
| INVALID_IMAGE_FORMAT | Formato no permitido |
| IMAGE_TOO_LARGE | Archivo > 10MB |
| POSITION_DUPLICATE | Posición ya existe para el producto |
| MIN_IMAGES_REQUIRED | Eliminar dejaría producto activo con < 3 imágenes |
| IMAGE_NOT_FOUND | Imagen no existe |

---

## 9. Invariantes del sistema

- Un producto de proyecto SIEMPRE deriva de un producto del catálogo Glam Urban (`glam_product_id` NOT NULL)
- Un producto SIEMPRE pertenece a exactamente un proyecto
- La categoría de un producto SIEMPRE se obtiene vía `glam_product → category_id`
- Un producto activo SIEMPRE tiene al menos 3 imágenes
- La configuración de personalización de un producto activo NUNCA cambia
- Los atributos seleccionados (`selected_attributes`) NUNCA cambian después de la creación
- Las posiciones de imágenes de un producto son SIEMPRE únicas
- Un producto NUNCA se elimina físicamente de la base de datos

---

## 10. Casos límite y excepciones

- **Producto del catálogo sin atributos**: Válido, `selected_attributes` se almacena como `{}`
- **Producto sin personalización**: Válido, se crea con `personalization_config` vacío o con módulos deshabilitados
- **Categoría sin módulos permitidos**: El producto solo tiene información básica, atributos e imágenes
- **Todas las imágenes de un producto activo eliminadas por error externo**: El sistema debe impedir reactivación hasta tener 3 imágenes
- **Proyecto eliminado/desactivado**: Los productos asociados deben manejarse según reglas del proyecto (fuera de alcance)
- **Imagen subida pero falla registro en BD**: Debe haber rollback o limpieza de Storage
- **Producto del catálogo desactivado después de crear producto de proyecto**: El producto de proyecto sigue funcionando; la referencia es histórica

---

## 11. Seguridad y permisos

| Actor | Acción permitida | Acción prohibida |
|-------|------------------|------------------|
| Organizador (dueño) | CRUD productos de sus proyectos | Acceder a productos de otros proyectos |
| Organizador (no dueño) | Ninguna | Cualquier operación en proyectos ajenos |
| Buyer | Ninguna (MVP) | Crear/editar productos |
| Supplier | Ninguna | Crear/editar productos |
| No autenticado | Ninguna | Cualquier operación |

---

## 12. No-objetivos explícitos

> Para evitar suposiciones de la AI.

- NO implementar tienda pública de productos
- NO implementar carrito de compras ni checkout
- NO implementar flujo operativo de Designer Assisted (solo mensaje)
- NO implementar el Online Editor (solo redirección a URL)
- NO implementar eliminación física de productos
- NO implementar roles adicionales (solo organizador gestiona)
- NO implementar notificaciones de cambios de estado
- NO implementar historial de cambios de producto
- NO implementar edición de atributos del catálogo
- NO implementar edición de productos del catálogo Glam Urban

---

## 13. Versionado

| Versión | Fecha | Cambios |
|---------|-------|---------|
| v1.0 | 2026-01-22 | Documento inicial basado en descripción funcional |
| v2.0 | 2026-02-11 | Incorpora productos del catálogo (`glam_products`), atributos (`selected_attributes`), flujo progresivo de creación, precio derivado del catálogo, cálculo de precio tentativo con recargos de atributos |
| v2.1 | 2026-02-22 | Precio = 0 sin producto seleccionado (RN-41), reset completo al cambiar categoría (RN-42), categoría y descripción obligatorias (RN-43, RN-19 actualizada), módulos de personalización con valor por defecto y envío obligatorio (RN-44, RN-45) |

---

## 14. Checklist de validación (AI + Humano)

Antes de aprobar este spec:
- [x] Todos los comportamientos están en Gherkin
- [x] No hay decisiones técnicas de implementación
- [x] Las reglas de negocio están numeradas (RN-01 a RN-45)
- [x] No hay ambigüedades
- [x] El alcance está claro
- [x] No hay ejemplos de código fuente
- [x] Estados y transiciones documentados
- [x] Permisos y seguridad definidos
- [x] Flujo progresivo de creación documentado
- [x] Atributos y precio tentativo especificados

---

## 15. Nota final para AI Agents

- ❌ No inferir comportamiento no especificado
- ❌ No modificar este archivo durante la implementación
- ✅ Usar este spec como base para `plan.md`, tests y validaciones
- ✅ Preguntar si algo no está explícitamente definido
- ✅ Seguir patrones existentes en `lib/http/project/` para Storage
- ✅ Seguir patrones existentes en `lib/types/project/types.ts` para tipos
- ✅ Toda la gestión es Server-Side Rendering (SSR)
- ✅ Referirse a `product-curl-example.md` para contratos de API detallados

---

## Anexo A: Categorías de producto (datos semilla)

| Código | Nombre | Modos Visuales | Módulos Permitidos |
|--------|--------|----------------|-------------------|
| `jersey` | Camiseta/Jersey | upload_images, online_editor, designer_assisted | sizes, numbers, names |
| `shorts` | Shorts/Pantalón corto | upload_images, online_editor, designer_assisted | sizes |
| `tracksuit` | Conjunto deportivo | upload_images, designer_assisted | sizes, age_categories |
| `accessories` | Accesorios | upload_images | sizes |
| `mugs` | Mugs | upload_images | sizes |
| `termos` | Termos | upload_images | sizes |

---

## Anexo B: Módulos de personalización (datos semilla)

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `sizes` | Selección de talla | Permite elegir talla (XS, S, M, L, XL, etc.) |
| `numbers` | Número deportivo | Permite agregar número en la espalda (1-99) |
| `names` | Nombre personalizado | Permite agregar nombre en la espalda |
| `age_categories` | Categoría de edad | Permite seleccionar categoría (infantil, juvenil, adulto) |

---

## Anexo C: Productos del catálogo Glam Urban (datos semilla)

| Código | Nombre | Precio base | Atributos (attributes_config) |
|--------|--------|-------------|-------------------------------|
| `mug-9oz` | Mug 9 oz | 15000 | quality (estándar: +0, premium: +3000) |
| `mug-15oz` | Mug 15 oz | 18000 | quality (estándar: +0, premium: +3500) |
| `termo-600ml` | Termo 600 ml | 35000 | quality (estándar: +0, premium: +5000) |
| `termo-1000ml` | Termo 1000 ml | 45000 | quality (estándar: +0, premium: +6000) |

---

## Anexo D: Atributos del catálogo (datos semilla)

| Código | Nombre | Opciones |
|--------|--------|----------|
| `quality` | Calidad | estándar, premium |
| `color` | Color | blanco, negro, azul, rojo |
| `material` | Material | cerámica, acero_inoxidable, plástico_bpa_free |

---

## Anexo E: Estructura de personalization_config

> **Regla de envío (RN-44, RN-45):** El formulario SIEMPRE envía todos los módulos permitidos por la categoría, incluso si no fueron habilitados. Los módulos no habilitados se envían con `enabled: false`.

```
Ejemplo con módulos habilitados:
{
  "sizes": {
    "enabled": true,
    "options": ["XS", "S", "M", "L", "XL"],
    "price_modifier": 0
  },
  "numbers": {
    "enabled": true,
    "min": 1,
    "max": 99,
    "price_modifier": 0
  },
  "names": {
    "enabled": false,
    "max_length": 15,
    "price_modifier": 0
  },
  "age_categories": {
    "enabled": false,
    "options": ["infantil", "juvenil", "adulto"],
    "price_modifier": 0
  }
}

Ejemplo con NINGÚN módulo habilitado (categoría "jersey"):
El formulario SIEMPRE envía los 3 módulos con enabled: false:
{
  "sizes": {
    "enabled": false,
    "options": [],
    "price_modifier": 0
  },
  "numbers": {
    "enabled": false,
    "min": 1,
    "max": 99,
    "price_modifier": 0
  },
  "names": {
    "enabled": false,
    "max_length": 15,
    "price_modifier": 0
  }
}
```

---

## Anexo F: Estructura de selected_attributes

```
Ejemplo con atributo de calidad:
{
  "quality": {
    "selected_option": "premium",
    "price_modifier": 3000
  }
}

Ejemplo con calidad + material:
{
  "quality": {
    "selected_option": "estandar",
    "price_modifier": 0
  },
  "material": {
    "selected_option": "acero_inoxidable",
    "price_modifier": 0
  }
}

Ejemplo vacío (sin atributos seleccionados):
{}
```

---

## Anexo G: Cálculo de precio tentativo

```
precio_base            = glam_product.base_price         (ej. 15000)
recargos_atributos     = sum(selected_attributes[*].price_modifier)  (ej. 3000)
subtotal_producto      = precio_base + recargos_atributos (ej. 18000)
comision               = subtotal_producto * (project.commission / 100)
subtotal_con_comision  = subtotal_producto + comision
iva                    = subtotal_con_comision * 0.19
total_tentativo        = subtotal_con_comision + iva
```

---

## Anexo H: Configuración de Storage

| Bucket | Visibilidad | Tamaño máximo | Formatos |
|--------|-------------|---------------|----------|
| `product-images` | Público | 10MB | image/jpeg, image/png, image/webp |

**Estructura de paths:**
```
product-images/
  └── {project_id}/
      └── {product_id}/
          ├── 1.{extension}
          ├── 2.{extension}
          └── 3.{extension}
```
