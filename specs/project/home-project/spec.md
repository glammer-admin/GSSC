# Specification (SDD) – Home del Proyecto (Organizer)

> **Documento normativo de comportamiento del sistema**  
> Este archivo define **QUÉ debe hacer el sistema**, no **CÓMO se implementa**.  
> Es la **fuente única de verdad** para planes, código, tests y AI Agents.

---

## 0. Instrucciones obligatorias para la AI Agent

Antes de completar este documento, la AI **DEBE**:
- Leer toda la documentación técnica existente
- No escribir código
- No tomar decisiones de implementación
- Preguntar cualquier ambigüedad

La AI **DEBE preguntar** explícitamente al humano si falta información.

---

## 1. Propósito

- **Problema de negocio:** El organizer necesita una vista única por proyecto para monitorear rendimiento, administrar productos y modificar la configuración, accediendo mediante un identificador público del proyecto.
- **Valor:** Centralizar la gestión de un proyecto en una URL estable y compartible, con navegación interna coherente y datos reales donde el modelo lo soporta.
- **Por qué existe:** Separar la experiencia del organizer por proyecto (home del proyecto) de la lista general de proyectos (dashboard), permitiendo deep-links y flujos enfocados en un solo proyecto.

---

## 2. Alcance funcional

### 2.1 Incluye

- Acceso a la vista de gestión del proyecto mediante `/project/{project_public_code}`.
- Validación de existencia del proyecto y de que el usuario es el organizer propietario.
- Redirección a la pantalla genérica de error 404 cuando el proyecto no existe o no es accesible.
- Estructura de pantalla: header del proyecto, menú de navegación interna, vista de contenido principal.
- Header con nombre del proyecto, estado del proyecto (draft, active, paused, finished) y código público (solo lectura).
- Menú con estructura visual y de interacción análoga a `/settings/billing`: Estadísticas, Productos, Notificaciones, Configuración.
- Navegación SSR; el `project_public_code` se transporta en todas las rutas del proyecto.
- Estadísticas del proyecto con métricas calculadas a partir del modelo (ventas, órdenes pagadas, unidades vendidas, comisión, neto) y métricas placeholder (satisfacción, NPS, ratings, tendencias) solo visuales.
- Gestión de productos: listado, visualización de nombre, categoría, estado, precio; acciones de activar/desactivar y editar.
- Configuración del proyecto: reutilizar la UI existente de creación/edición de proyecto, con campos cargados con valores actuales; nombre del proyecto solo lectura; registro de cambios en el modelo de auditoría correspondiente.
- Notificaciones: placeholder visual con mensaje tipo "Próximamente".
- Restricción de acceso: solo el organizer propietario del proyecto.

### 2.2 Excluye (explícito)

> Todo lo no listado en 2.1 se considera fuera de alcance.

- Flujos de compra, checkout y experiencia del buyer.
- Creación de nuevos proyectos (pertenece a otro flujo).
- Lógica funcional para métricas no soportadas por el modelo (satisfacción, NPS, ratings, tendencias); solo representación visual.
- Implementación real del módulo de notificaciones.
- Cambios en otras partes del sistema (dashboard general, settings, auth, etc.).

---

## 3. Actores

| Actor | Descripción | Nivel de acceso |
|-------|-------------|-----------------|
| Organizer propietario | Usuario con rol `organizer` que es dueño del proyecto (`glam_projects.organizer_id`) | Acceso completo a la vista del proyecto: estadísticas, productos, notificaciones, configuración |
| Otros roles (supplier, buyer) | Usuarios con otros roles o sin ser propietarios del proyecto | Sin acceso; si intentan acceder se aplica el mismo criterio que proyecto inexistente/no accesible (404) |

---

## 4. Glosario de dominio

| Término | Definición |
|---------|------------|
| Código público del proyecto | `glam_projects.public_code`; identificador único y visible del proyecto (ej. formato PRJ-XXXXX). Usado en la URL. |
| Organizer propietario | Usuario cuyo identificador coincide con `glam_projects.organizer_id` del proyecto. |
| Métricas con datos reales | Cálculos obtenidos a partir de `sales`, `sale_items`, `sale_breakdowns` (y vistas/agregaciones existentes). |
| Métricas placeholder | Indicadores mostrados solo a nivel visual, sin cálculos ni acciones; diferenciados claramente en la UI. |
| Registro de cambios de configuración | Auditoría en el modelo (p. ej. `glam_project_config_changes`) cuando se modifica la configuración del proyecto. |

---

## 5. Reglas de negocio (OBLIGATORIAS)

- **RN-01:** El acceso a `/project/{project_public_code}` está permitido solo si el proyecto existe, está identificado por `public_code` y el usuario autenticado es el organizer propietario (`organizer_id`).
- **RN-02:** Si el proyecto no existe o el usuario no es el propietario, se debe redirigir a la pantalla genérica de error 404 existente; no se crea una pantalla nueva.
- **RN-03:** El nombre del proyecto es solo lectura en la pantalla de configuración.
- **RN-04:** Los cambios de configuración del proyecto deben quedar registrados en el modelo de auditoría definido para ello (p. ej. `glam_project_config_changes`).
- **RN-05:** Las métricas no soportadas por el modelo (satisfacción, NPS, ratings, tendencias avanzadas) se muestran únicamente como placeholder visual, sin lógica ni cálculos.
- **RN-06:** La navegación entre secciones del proyecto (Estadísticas, Productos, Notificaciones, Configuración) debe mantener siempre el `project_public_code` en la ruta y resolverse en servidor (SSR).
- **RN-07:** Al acceder a la URL base del proyecto (`/project/{project_public_code}`), la sección Estadísticas debe estar seleccionada en el menú de navegación.

---

## 6. Estados del dominio (si aplica)

### 6.1 Estado del proyecto

| Estado | Descripción |
|--------|-------------|
| draft | Borrador |
| active | Activo |
| paused | Pausado |
| finished | Finalizado |

### 6.2 Transiciones válidas

Las transiciones de estado del proyecto quedan fuera del alcance de esta spec; aquí solo se refleja el estado actual en el header. No se definen eventos de cambio de estado en esta vista.

---

## 7. Casos de uso (Gherkin)

> ⚠️ Regla clave:  
> Todo comportamiento del sistema **DEBE** estar expresado aquí.  
> Si no existe un escenario Gherkin, el comportamiento **NO EXISTE**.

---

### 7.1 Caso de uso: Acceder al home del proyecto

```gherkin
Feature: Acceso al home del proyecto
  Como organizer propietario del proyecto
  Quiero acceder a la vista de gestión del proyecto mediante el código público
  Para monitorear y administrar ese proyecto

  Background:
    Given el usuario está autenticado con rol organizer

  Scenario: Camino feliz – proyecto existe y usuario es propietario
    Given existe un proyecto con código público "PRJ-ABCDE"
    And el usuario es el organizer propietario de ese proyecto
    When el usuario accede a la URL del proyecto con código "PRJ-ABCDE"
    Then se muestra la pantalla de gestión del proyecto
    And el header muestra el nombre del proyecto
    And el header muestra el estado del proyecto
    And el header muestra el código público en solo lectura
    And está visible el menú con Estadísticas, Productos, Notificaciones y Configuración
    And la sección Estadísticas está seleccionada en el menú

  Scenario: Proyecto no existe
    Given no existe un proyecto con el código público indicado en la URL
    When el usuario accede a esa URL
    Then se redirige a la pantalla genérica de error 404

  Scenario: Usuario no es propietario del proyecto
    Given existe un proyecto con código público "PRJ-ABCDE"
    And el usuario autenticado no es el organizer propietario de ese proyecto
    When el usuario accede a la URL del proyecto con código "PRJ-ABCDE"
    Then se redirige a la pantalla genérica de error 404
```

---

### 7.2 Caso de uso: Navegar entre secciones del proyecto

```gherkin
Feature: Navegación interna del proyecto
  Como organizer propietario
  Quiero navegar entre Estadísticas, Productos, Notificaciones y Configuración sin perder el contexto del proyecto
  Para usar todas las funciones de gestión del mismo proyecto

  Background:
    Given el usuario está autenticado con rol organizer
    And el usuario es propietario del proyecto con código "PRJ-ABCDE"

  Scenario: Navegación mantiene el código del proyecto
    Given el usuario está en la vista del proyecto "PRJ-ABCDE"
    When el usuario navega a Productos
    Then la URL corresponde a la sección de productos del mismo proyecto
    And el código público del proyecto sigue presente en la ruta
    When el usuario navega a Configuración
    Then la URL corresponde a la sección de configuración del mismo proyecto
    And el código público del proyecto sigue presente en la ruta
```

---

### 7.3 Caso de uso: Ver estadísticas del proyecto

```gherkin
Feature: Estadísticas del proyecto
  Como organizer propietario
  Quiero ver una vista consolidada del rendimiento del proyecto
  Para tomar decisiones basadas en ventas y comisiones

  Background:
    Given el usuario está autenticado con rol organizer
    And el usuario es propietario del proyecto con código "PRJ-ABCDE"

  Scenario: Métricas con datos reales
    Given el proyecto tiene ventas y órdenes pagadas en el modelo
    When el usuario está en las estadísticas del proyecto
    Then se muestran el total de ventas calculado a partir del modelo
    And se muestran el total de órdenes pagadas
    And se muestran las unidades vendidas
    And se muestra la comisión del organizer
    And se muestra el neto para el organizer

  Scenario: Métricas placeholder solo visuales
    When el usuario está en las estadísticas del proyecto
    Then las métricas de satisfacción, NPS, ratings y tendencias se muestran como placeholder
    And no se ejecuta lógica de cálculo ni acciones sobre esas métricas
    And están claramente diferenciadas como visuales
```

---

### 7.4 Caso de uso: Gestionar productos del proyecto

```gherkin
Feature: Gestión de productos del proyecto
  Como organizer propietario
  Quiero ver y administrar los productos del proyecto
  Para controlar qué está publicado y la información de cada producto

  Background:
    Given el usuario está autenticado con rol organizer
    And el usuario es propietario del proyecto con código "PRJ-ABCDE"

  Scenario: Listado de productos
    Given el proyecto tiene productos asociados
    When el usuario accede a la sección de productos del proyecto
    Then se muestra el listado de productos del proyecto
    And cada producto muestra nombre, categoría, estado y precio

  Scenario: Activar o desactivar producto
    Given el usuario está en la sección de productos del proyecto
    And existe un producto con estado activo
    When el usuario desactiva ese producto
    Then el estado del producto se actualiza según las reglas del sistema
    Given existe un producto con estado inactivo
    When el usuario activa ese producto
    Then el estado del producto se actualiza según las reglas del sistema

  Scenario: Editar información del producto
    Given el usuario está en la sección de productos del proyecto
    When el usuario edita la información de un producto
    Then se permite modificar los datos editables del producto
    And los cambios se persisten según las reglas del sistema
```

---

### 7.5 Caso de uso: Configurar el proyecto

```gherkin
Feature: Configuración del proyecto
  Como organizer propietario
  Quiero editar la configuración del proyecto reutilizando la pantalla existente
  Para ajustar comisión, entrega u otras opciones sin cambiar el nombre

  Background:
    Given el usuario está autenticado con rol organizer
    And el usuario es propietario del proyecto con código "PRJ-ABCDE"

  Scenario: Edición con campos cargados
    When el usuario accede a la configuración del proyecto
    Then se muestra la misma UI utilizada para creación/edición de proyecto
    And los campos se cargan con los valores actuales del proyecto
    And el nombre del proyecto se muestra en solo lectura

  Scenario: Cambios quedan registrados
    Given el usuario está en la configuración del proyecto
    When el usuario modifica algún campo de configuración y confirma
    Then los cambios se persisten
    And queda registrado el cambio en el modelo de auditoría de configuración
```

---

### 7.6 Caso de uso: Notificaciones (placeholder)

```gherkin
Feature: Notificaciones del proyecto
  Como organizer propietario
  Quiero ver un espacio reservado para notificaciones futuras
  Para conocer que la funcionalidad llegará

  Background:
    Given el usuario está autenticado con rol organizer
    And el usuario es propietario del proyecto

  Scenario: Placeholder de notificaciones
    When el usuario accede al área de notificaciones del proyecto
    Then se muestra una pantalla con mensaje tipo "Próximamente"
    And no hay lógica funcional de notificaciones
```

---

### 7.7 Reglas para escribir Gherkin

- Usar lenguaje de negocio, no técnico.
- No mencionar endpoints, clases o tablas.
- Cada `Then` debe ser verificable.
- Evitar múltiples expectativas en un mismo `Then`.
- Preferir escenarios pequeños y claros.

---

## 8. Contratos funcionales (conceptuales)

### 8.1 Entradas

- **URL:** `project_public_code` en la ruta; debe corresponder a `glam_projects.public_code`.
- **Sesión:** Usuario autenticado con rol `organizer`; se compara con `glam_projects.organizer_id` para el proyecto identificado por `public_code`.

### 8.2 Salidas

- Pantalla de gestión del proyecto (header + menú + contenido) cuando el proyecto existe y el usuario es propietario.
- Redirección a la pantalla genérica 404 cuando el proyecto no existe o el usuario no es propietario.
- Estadísticas: métricas reales (numéricas) y placeholder (visuales).
- Listado de productos con nombre, categoría, estado, precio; acciones de activar/desactivar y editar.
- Pantalla de configuración con campos cargados y nombre en solo lectura; persistencia y registro en auditoría.

### 8.3 Errores de negocio

| Código lógico | Condición |
|---------------|-----------|
| Proyecto no encontrado / no accesible | `project_public_code` no existe o usuario no es organizer propietario → 404 genérico |

---

## 9. Invariantes del sistema

- La vista de gestión del proyecto solo es accesible para el organizer propietario del proyecto.
- El nombre del proyecto no es editable en la pantalla de configuración.
- Toda navegación entre secciones del proyecto conserva el `project_public_code` en la ruta y se resuelve en servidor.
- Las métricas sin soporte en el modelo no generan cálculos ni acciones; solo representación visual.

---

## 10. Casos límite y excepciones

- Proyecto inexistente o código inválido: redirección a 404 genérico.
- Usuario no autenticado o sin rol organizer: comportamiento según middleware y rutas protegidas existentes (fuera de alcance de esta spec).
- Usuario organizer pero no propietario del proyecto: mismo tratamiento que proyecto no accesible (404).
- Proyecto sin ventas: estadísticas muestra métricas numéricas en cero o vacías según el modelo/vistas existentes; placeholders se muestran igual.

---

## 11. Seguridad y permisos

| Actor | Acción permitida | Acción prohibida |
|-------|------------------|------------------|
| Organizer propietario | Acceder al home, estadísticas, productos, notificaciones y configuración del proyecto | Acceder a proyectos de otros organizers |
| Otros usuarios (incl. otros roles) | — | Acceder a `/project/{project_public_code}` del proyecto; se trata como no accesible (404) |

---

## 12. No-objetivos explícitos

- Modificar el flujo de creación de proyectos.
- Implementar lógica real para satisfacción, NPS, ratings o tendencias avanzadas.
- Implementar el módulo de notificaciones.
- Cambiar middleware, auth, dashboard general, settings ni otras áreas del sistema.
- Definir o cambiar APIs externas; solo se describe el comportamiento funcional de esta vista.

---

## 13. Versionado

- Versión: v1.0
- Fecha: (a completar)
- Cambios: Versión inicial según definición funcional de gestión de proyecto (organizer).

---

## 14. Checklist de validación (AI + Humano)

Antes de aprobar este spec:
- [ ] Todos los comportamientos están en Gherkin
- [ ] No hay decisiones técnicas
- [ ] Las reglas de negocio están numeradas
- [ ] No hay ambigüedades
- [ ] El alcance está claro
- [ ] No hay ejemplos de código fuente

---

## 15. Nota final para AI Agents

- ❌ No inferir comportamiento no especificado
- ❌ No modificar este archivo durante la implementación
- ✅ Usar este spec como base para `plan.md`, tests y validaciones
- ✅ Preguntar si algo no está explícitamente definido
