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
- Indicadores visuales de estado por producto
- Navegación directa a creación y edición de productos
- Información resumida de cada producto (nombre, estado, categoría, precio, imágenes)

---

## 2. Alcance funcional

### 2.1 Incluye

- Página de lista de productos de un proyecto
- Visualización de productos en tabla/grid con información resumida
- Indicador de estado por producto (draft, active, inactive)
- Conteo de imágenes por producto
- Enlace/botón para crear nuevo producto
- Enlace/botón para editar cada producto existente
- Enlace a productos desde el dashboard del proyecto
- Navegación en sidebar/menú hacia la lista de productos
- Validación de permisos (solo organizador dueño del proyecto)

### 2.2 Excluye (explícito)

- Creación de productos (ver `specs/product/creation/spec.md`)
- Edición de productos (ver `specs/product/update/spec.md`)
- Eliminación de productos (no existe eliminación física)
- Búsqueda o filtrado avanzado de productos (fuera de alcance MVP)
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

### Visualización

- **RN-L01:** La lista de productos muestra TODOS los productos del proyecto, independientemente de su estado
- **RN-L02:** Cada producto en la lista muestra como mínimo: nombre, estado, categoría (derivada del glam_product), y conteo de imágenes
- **RN-L03:** El estado de cada producto se muestra con un indicador visual diferenciado (badge de color):
  - `draft`: indicador de borrador
  - `active`: indicador de activo/publicado
  - `inactive`: indicador de inactivo
- **RN-L04:** Cada producto tiene una acción para navegar a su formulario de edición
- **RN-L05:** La página incluye una acción prominente para crear un nuevo producto
- **RN-L06:** Si el proyecto no tiene productos, se muestra un estado vacío con mensaje orientativo e invitación a crear el primer producto

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
    And los productos draft muestran indicador de borrador
    And los productos active muestran indicador de activo
    And el producto inactive muestra indicador de inactivo
    And se muestra un botón para crear nuevo producto

  Scenario: Ver lista vacía de productos
    Given el proyecto no tiene productos
    When el organizador accede a la página de productos del proyecto
    Then se muestra un estado vacío con mensaje "No hay productos creados"
    And se muestra un botón/enlace para crear el primer producto

  Scenario: Navegar a creación de producto desde la lista
    Given el organizador está en la página de productos del proyecto
    When hace clic en "Crear producto" (o acción equivalente)
    Then se redirige a la página de creación de producto del proyecto

  Scenario: Navegar a edición de producto desde la lista
    Given el organizador está en la página de productos del proyecto
    And existe un producto en la lista
    When hace clic en la acción de editar del producto
    Then se redirige a la página de edición del producto

  Scenario: Navegar a productos desde el dashboard del proyecto
    Given el organizador está en el dashboard de su proyecto
    When hace clic en el enlace/sección de "Productos"
    Then se redirige a la página de lista de productos del proyecto
```

### 5.2 Caso de uso: Validación de permisos en lista

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

**Restricciones:**
- El usuario debe ser organizador del proyecto
- Se retornan todos los productos del proyecto independientemente de su estado

**Salidas:**
- Lista de productos del proyecto con:
  - `id`: UUID del producto
  - `name`: Nombre del producto
  - `status`: Estado actual (draft, active, inactive)
  - `category`: Categoría del producto (derivada del glam_product)
  - `price`: Precio del producto
  - `images_count`: Cantidad de imágenes del producto
  - `created_at`: Fecha de creación
  - `updated_at`: Fecha de última actualización

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
| Estado | Badge de estado (draft/active/inactive) | `project_products.status` |
| Categoría | Nombre de la categoría | `glam_products.category → product_categories.name` |
| Precio | Precio del producto | `project_products.price` |
| Imágenes | Conteo de imágenes | `count(product_images)` |
| Imagen principal | Thumbnail de la primera imagen (posición 1) | `product_images` donde `position = 1` |
| Fecha | Fecha de creación o última actualización | `project_products.created_at / updated_at` |
| Acciones | Enlace a editar | Navegación a `/project/{id}/products/{productId}/edit` |

---

## 8. Invariantes del sistema (lista)

- La lista SIEMPRE muestra todos los productos del proyecto (sin filtro por estado por defecto)
- El acceso a la lista SIEMPRE requiere autenticación y ser organizador dueño del proyecto
- La lista NUNCA muestra productos de otros proyectos
- La navegación a edición SIEMPRE lleva al formulario de edición correspondiente

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

---

## 12. Nota final para AI Agents

- ❌ No inferir comportamiento no especificado
- ❌ No modificar este archivo durante la implementación
- ✅ Usar este spec como base para `plan.md`, tests y validaciones
- ✅ Preguntar si algo no está explícitamente definido
- ✅ Referirse a `specs/product/creation/spec.md` para dominio completo
- ✅ Referirse a `specs/product/update/spec.md` para estados y transiciones
- ✅ Toda la gestión es Server-Side Rendering (SSR)
