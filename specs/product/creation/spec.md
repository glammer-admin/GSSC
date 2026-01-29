# Specification (SDD) – Creación de Productos

> **Documento normativo de comportamiento del sistema**  
> Este archivo define **QUÉ debe hacer el sistema**, no **CÓMO se implementa**.  
> Es la **fuente única de verdad** para planes, código, tests y AI Agents.

---

## 0. Instrucciones obligatorias para la AI Agent

Antes de implementar este documento, la AI **DEBE**:
- Leer `DOCS_TECHNICAL.md` para entender la arquitectura SSR
- Leer `data-model.md` para entender el modelo de datos
- Revisar `lib/http/project/project-storage-client.ts` como patrón de referencia para Storage
- Revisar `lib/types/project/types.ts` como patrón de referencia para tipos
- No tomar decisiones de implementación no especificadas aquí
- Preguntar cualquier ambigüedad

---

## 1. Propósito

Este módulo permite a los **organizadores** crear productos dentro de sus proyectos para ser vendidos en la tienda virtual de Glam Urban.

**Problema de negocio que resuelve:**
- Los organizadores necesitan publicar ofertas de productos personalizables (uniformes, camisetas, accesorios) para sus compradores
- La plataforma debe garantizar trazabilidad, estabilidad operativa y una experiencia consistente

**Valor que aporta:**
- Flujo guiado de creación de productos con configuración de personalización
- Control de calidad visual (mínimo 3 imágenes por producto activo)
- Inmutabilidad de configuración para garantizar consistencia en pedidos

---

## 2. Alcance funcional

### 2.1 Incluye

- Selección de categoría de producto (catálogo cerrado de plataforma)
- Definición de información básica del producto (nombre, descripción, precio base)
- Configuración de módulos de personalización según categoría
- Gestión de imágenes del producto (subida manual, redirección a editor, mensaje designer assisted)
- Cambio de estado del producto (draft → active → inactive)
- Validación de requisitos para activación (mínimo 3 imágenes)
- Edición de productos en estado borrador
- Desactivación de productos activos

### 2.2 Excluye (explícito)

> Todo lo no listado aquí se considera fuera de alcance.

- Creación/modificación de categorías de producto (solo plataforma)
- Creación/modificación de módulos de personalización (solo plataforma)
- Implementación del Online Editor (solo redirección a URL externa)
- Flujo operativo de Designer Assisted (solo mensaje informativo)
- Eliminación física de productos (solo desactivación)
- Modificación de `personalization_config` después de activar el producto
- Tienda pública de productos (fuera de alcance)
- Gestión de pedidos/compras (fuera de alcance)
- Recargos por personalización (MVP: siempre 0)

---

## 3. Actores

| Actor | Descripción | Nivel de acceso |
|-------|-------------|-----------------|
| Organizador | Usuario con rol `organizer`, dueño del proyecto | CRUD productos de sus proyectos |
| Plataforma (Glam Urban) | Sistema | Gestiona catálogos (categorías, módulos) |
| Comprador | Usuario con rol `buyer` | Solo visualización (fuera de alcance MVP) |

---

## 4. Glosario de dominio

| Término | Definición |
|---------|------------|
| Producto | Oferta publicada dentro de un proyecto, diseñada para ser vendida en tienda virtual |
| Categoría | Tipo de producto definido por la plataforma que determina módulos y modos visuales permitidos |
| Módulo de personalización | Opción configurable que el comprador puede elegir (tallas, números, nombres, categorías de edad) |
| Modo visual | Método de generación de imágenes del producto (upload, online_editor, designer_assisted) |
| Configuración de personalización | Objeto JSON inmutable que define qué módulos están habilitados y sus opciones |
| Precio base | Precio único del producto sin variaciones por talla u opción (MVP) |

---

## 5. Reglas de negocio (OBLIGATORIAS)

### Categorías y Módulos

- **RN-01:** Las categorías de producto son un catálogo cerrado gestionado exclusivamente por la plataforma
- **RN-02:** Los módulos de personalización son un catálogo cerrado gestionado exclusivamente por la plataforma
- **RN-03:** Cada categoría define qué módulos de personalización están permitidos (`allowed_modules`)
- **RN-04:** Cada categoría define qué modos visuales están permitidos (`allowed_visual_modes`)
- **RN-05:** Los módulos configurados en un producto DEBEN estar dentro de los `allowed_modules` de su categoría

### Creación y Configuración

- **RN-06:** Todo producto se crea inicialmente en estado `draft` (borrador)
- **RN-07:** Un producto pertenece a un único proyecto y no puede existir sin proyecto
- **RN-08:** El nombre del producto es obligatorio y no puede estar vacío
- **RN-09:** El precio base debe ser mayor a 0
- **RN-10:** Un producto puede no tener módulos de personalización habilitados (producto estándar)
- **RN-11:** En el MVP, `price_modifier` de todos los módulos es siempre 0

### Inmutabilidad

- **RN-12:** La configuración de personalización (`personalization_config`) puede modificarse mientras el producto esté en `draft`
- **RN-13:** Una vez el producto pasa a estado `active`, la configuración de personalización es INMUTABLE
- **RN-14:** Si el organizador requiere cambiar la configuración de un producto activo, debe desactivarlo y crear uno nuevo
- **RN-15:** Los productos NO pueden eliminarse físicamente, solo desactivarse

### Imágenes

- **RN-16:** Todo producto activo debe tener mínimo 3 imágenes
- **RN-17:** Un producto en borrador puede guardarse sin imágenes
- **RN-18:** No se puede activar un producto con menos de 3 imágenes
- **RN-19:** No se puede eliminar una imagen si el producto activo quedaría con menos de 3
- **RN-20:** Las imágenes tienen un atributo `source` que indica su origen (upload, online_editor, designer_assisted)
- **RN-21:** Las imágenes tienen una posición (`position`) que determina el orden de visualización
- **RN-22:** La posición de imagen debe ser única por producto (no duplicados)

### Estados y Transiciones

- **RN-23:** Las transiciones de estado válidas son:
  - `draft` → `active` (requiere mínimo 3 imágenes)
  - `active` → `inactive`
  - `inactive` → `active` (requiere mínimo 3 imágenes)
- **RN-24:** No existe transición de `active` → `draft` ni de `inactive` → `draft`

### Permisos

- **RN-25:** Solo el organizador dueño del proyecto puede crear/editar productos en ese proyecto
- **RN-26:** La verificación de propiedad se realiza comparando `organizer_id` del proyecto con el `user_id` de la sesión

---

## 6. Estados del dominio

| Estado | Descripción |
|--------|-------------|
| `draft` | Producto en configuración, no visible para compradores, configuración editable |
| `active` | Producto publicado, visible en tienda, configuración inmutable |
| `inactive` | Producto desactivado, no visible para nuevos compradores |

### 6.1 Transiciones válidas

| Estado actual | Evento | Nuevo estado | Condiciones |
|---------------|--------|--------------|-------------|
| `draft` | Activar | `active` | Mínimo 3 imágenes |
| `active` | Desactivar | `inactive` | Ninguna |
| `inactive` | Reactivar | `active` | Mínimo 3 imágenes |

---

## 7. Casos de uso (Gherkin)

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

  Scenario: Crear producto con información básica
    Given el organizador está en la página de creación de producto
    And selecciona la categoría "jersey"
    When completa el nombre "Camiseta Local Tigres FC 2026"
    And completa la descripción "Camiseta oficial temporada 2026"
    And ingresa el precio base 85000
    And guarda el producto
    Then el producto se crea en estado "draft"
    And el producto queda asociado al proyecto seleccionado
    And se muestra mensaje de éxito

  Scenario: Crear producto con personalización de tallas
    Given el organizador está en la página de creación de producto
    And selecciona la categoría "jersey" que permite módulo "sizes"
    When completa la información básica
    And habilita el módulo "sizes"
    And selecciona las opciones ["XS", "S", "M", "L", "XL"]
    And guarda el producto
    Then el producto se crea con personalization_config incluyendo sizes habilitado
    And las opciones de talla quedan almacenadas

  Scenario: Crear producto con múltiples módulos de personalización
    Given el organizador está en la página de creación de producto
    And selecciona la categoría "jersey" que permite módulos "sizes", "numbers", "names"
    When completa la información básica
    And habilita módulo "sizes" con opciones ["S", "M", "L", "XL"]
    And habilita módulo "numbers" con rango 1-99
    And habilita módulo "names" con longitud máxima 15
    And guarda el producto
    Then el producto se crea con los tres módulos configurados
    And price_modifier de cada módulo es 0

  Scenario: Crear producto sin personalización
    Given el organizador está en la página de creación de producto
    And selecciona la categoría "accessories"
    When completa la información básica
    And no habilita ningún módulo de personalización
    And guarda el producto
    Then el producto se crea como producto estándar sin personalización

  Scenario: Error al crear producto sin nombre
    Given el organizador está en la página de creación de producto
    When deja el nombre vacío
    And intenta guardar el producto
    Then se muestra error "El nombre del producto es obligatorio"
    And el producto no se crea

  Scenario: Error al crear producto con precio inválido
    Given el organizador está en la página de creación de producto
    When completa el nombre
    And ingresa precio base 0 o negativo
    And intenta guardar el producto
    Then se muestra error "El precio base debe ser mayor a 0"
    And el producto no se crea

  Scenario: Error al configurar módulo no permitido por categoría
    Given el organizador está en la página de creación de producto
    And selecciona la categoría "accessories" que solo permite "sizes"
    When intenta habilitar el módulo "numbers"
    Then el módulo "numbers" no está disponible para selección
    And solo se muestran los módulos permitidos por la categoría
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
    When modifica el nombre a "Camiseta Visitante Tigres FC 2026"
    And modifica la descripción
    And modifica el precio base a 90000
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

  Scenario: Cambiar categoría en borrador
    Given el producto tiene categoría "jersey"
    When el organizador cambia a categoría "shorts"
    Then los módulos no permitidos por la nueva categoría se deshabilitan
    And se muestra advertencia si había módulos configurados que ya no aplican
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

  Scenario: Intentar modificar personalización de producto activo
    Given el organizador está en la página de edición
    Then la sección de personalización está deshabilitada
    And se muestra mensaje "La configuración de personalización no puede modificarse en productos activos"

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
- `category_id` (obligatorio): UUID de la categoría seleccionada
- `name` (obligatorio): Nombre del producto (no vacío)
- `description` (opcional): Descripción comercial
- `base_price` (obligatorio): Precio base > 0
- `personalization_config` (obligatorio): Objeto JSON con configuración de módulos

**Restricciones:**
- El usuario debe ser organizador del proyecto
- La categoría debe existir en el catálogo
- Los módulos en `personalization_config` deben estar en `allowed_modules` de la categoría

**Salidas:**
- Producto creado en estado `draft`
- ID del producto generado

**Errores de negocio:**

| Código lógico | Condición |
|---------------|-----------|
| PRODUCT_NAME_REQUIRED | Nombre vacío o no proporcionado |
| PRODUCT_PRICE_INVALID | Precio <= 0 |
| CATEGORY_NOT_FOUND | Categoría no existe |
| MODULE_NOT_ALLOWED | Módulo no permitido por categoría |
| PROJECT_NOT_FOUND | Proyecto no existe |
| PERMISSION_DENIED | Usuario no es organizador del proyecto |

### 8.2 Actualizar Producto

**Entradas:**
- `product_id` (obligatorio): UUID del producto
- `name` (opcional): Nuevo nombre
- `description` (opcional): Nueva descripción
- `base_price` (opcional): Nuevo precio
- `personalization_config` (opcional): Nueva configuración (solo si draft)
- `status` (opcional): Nuevo estado

**Restricciones:**
- Si producto está `active` o `inactive`, no se puede modificar `personalization_config`
- Transiciones de estado deben ser válidas
- Activación requiere mínimo 3 imágenes

**Salidas:**
- Producto actualizado

**Errores de negocio:**

| Código lógico | Condición |
|---------------|-----------|
| PRODUCT_NOT_FOUND | Producto no existe |
| CONFIG_IMMUTABLE | Intento de modificar config en producto no-draft |
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

- Un producto SIEMPRE pertenece a exactamente un proyecto
- Un producto SIEMPRE tiene una categoría válida del catálogo
- Un producto activo SIEMPRE tiene al menos 3 imágenes
- La configuración de personalización de un producto activo NUNCA cambia
- Las posiciones de imágenes de un producto son SIEMPRE únicas
- Un producto NUNCA se elimina físicamente de la base de datos

---

## 10. Casos límite y excepciones

- **Producto sin personalización**: Válido, se crea con `personalization_config` vacío o con módulos deshabilitados
- **Categoría sin módulos permitidos**: El producto solo tiene información básica e imágenes
- **Todas las imágenes de un producto activo eliminadas por error externo**: El sistema debe impedir reactivación hasta tener 3 imágenes
- **Proyecto eliminado/desactivado**: Los productos asociados deben manejarse según reglas del proyecto (fuera de alcance)
- **Imagen subida pero falla registro en BD**: Debe haber rollback o limpieza de Storage

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
- NO implementar recargos por personalización (price_modifier siempre 0)
- NO implementar flujo operativo de Designer Assisted (solo mensaje)
- NO implementar el Online Editor (solo redirección a URL)
- NO implementar eliminación física de productos
- NO implementar roles adicionales (solo organizador gestiona)
- NO implementar notificaciones de cambios de estado
- NO implementar historial de cambios de producto

---

## 13. Versionado

- Versión: v1.0
- Fecha: 2026-01-22
- Cambios: Documento inicial basado en descripción funcional

---

## 14. Checklist de validación (AI + Humano)

Antes de aprobar este spec:
- [x] Todos los comportamientos están en Gherkin
- [x] No hay decisiones técnicas de implementación
- [x] Las reglas de negocio están numeradas (RN-01 a RN-26)
- [x] No hay ambigüedades
- [x] El alcance está claro
- [x] No hay ejemplos de código fuente
- [x] Estados y transiciones documentados
- [x] Permisos y seguridad definidos

---

## 15. Nota final para AI Agents

- ❌ No inferir comportamiento no especificado
- ❌ No modificar este archivo durante la implementación
- ✅ Usar este spec como base para `plan.md`, tests y validaciones
- ✅ Preguntar si algo no está explícitamente definido
- ✅ Seguir patrones existentes en `lib/http/project/` para Storage
- ✅ Seguir patrones existentes en `lib/types/project/types.ts` para tipos
- ✅ Toda la gestión es Server-Side Rendering (SSR)

---

## Anexo A: Categorías de producto (datos semilla)

| Código | Nombre | Modos Visuales | Módulos Permitidos |
|--------|--------|----------------|-------------------|
| `jersey` | Camiseta/Jersey | upload_images, online_editor, designer_assisted | sizes, numbers, names |
| `shorts` | Shorts/Pantalón corto | upload_images, online_editor, designer_assisted | sizes |
| `tracksuit` | Conjunto deportivo | upload_images, designer_assisted | sizes, age_categories |
| `accessories` | Accesorios | upload_images | sizes |

---

## Anexo B: Módulos de personalización (datos semilla)

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `sizes` | Selección de talla | Permite elegir talla (XS, S, M, L, XL, etc.) |
| `numbers` | Número deportivo | Permite agregar número en la espalda (1-99) |
| `names` | Nombre personalizado | Permite agregar nombre en la espalda |
| `age_categories` | Categoría de edad | Permite seleccionar categoría (infantil, juvenil, adulto) |

---

## Anexo C: Estructura de personalization_config

```
{
  "sizes": {
    "enabled": true/false,
    "options": ["XS", "S", "M", "L", "XL"],
    "price_modifier": 0  // Siempre 0 en MVP
  },
  "numbers": {
    "enabled": true/false,
    "min": 1,
    "max": 99,
    "price_modifier": 0
  },
  "names": {
    "enabled": true/false,
    "max_length": 15,
    "price_modifier": 0
  },
  "age_categories": {
    "enabled": true/false,
    "options": ["infantil", "juvenil", "adulto"],
    "price_modifier": 0
  }
}
```

---

## Anexo D: Configuración de Storage

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
