# Specification (SDD) – Creación y Edición de Proyecto

> **Documento normativo de comportamiento del sistema**  
> Este archivo define **QUÉ debe hacer el sistema**, no **CÓMO se implementa**.  
> Es la **fuente única de verdad** para planes, código, tests y AI Agents.

---

## 1. Propósito

- **Problema de negocio**: Los organizadores necesitan crear y configurar proyectos que agrupen productos (uniformes, accesorios, souvenirs) para su venta a través de Glam Urban.
- **Valor que aporta**: Permite a los organizadores definir la configuración económica, logística y de entrega de sus proyectos de forma autónoma.
- **Por qué existe**: Es el punto de entrada para que un organizador pueda ofrecer productos personalizados a través de la plataforma.

---

## 2. Alcance funcional

### 2.1 Incluye
- Creación de nuevo proyecto con información básica
- Configuración de comisión del organizador
- Configuración de packaging personalizado
- Configuración de modos de entrega
- Definición del estado inicial del proyecto
- Edición de proyecto existente
- Validaciones de campos obligatorios
- Advertencias y confirmaciones al modificar configuración económica/logística
- Transiciones de estado del proyecto

### 2.2 Excluye (explícito)
> Todo lo no listado aquí se considera fuera de alcance.

- Carga y configuración de productos
- Cálculo real de precios
- Tienda pública
- Aplicación real de cambios masivos a productos
- Cálculo de costos de envío
- Gestión de pedidos

---

## 3. Actores

| Actor | Descripción | Nivel de acceso |
|-------|-------------|-----------------|
| Organizador | Usuario autenticado con rol de organizador que gestiona proyectos | Crear, editar, pausar y finalizar sus propios proyectos |

---

## 4. Glosario de dominio

| Término | Definición |
|---------|------------|
| Proyecto | Agrupación de productos que un organizador pone a la venta a través de Glam Urban |
| Comisión | Porcentaje que el organizador gana sobre cada venta de productos del proyecto |
| Packaging personalizado | Opción que permite empaquetar productos con branding del proyecto |
| Modo de entrega | Forma en que los productos llegan al comprador final |
| Borrador | Estado inicial de un proyecto que no está visible públicamente |
| Activo | Estado de un proyecto visible en la tienda pública y que acepta pedidos |
| Pausado | Estado de un proyecto que no acepta nuevos pedidos pero procesa los existentes |
| Finalizado | Estado terminal de un proyecto que ya no puede reactivarse |

---

## 5. Reglas de negocio (OBLIGATORIAS)

- **RN-01:** El nombre del proyecto debe ser único global en el sistema
- **RN-02:** El nombre del proyecto no puede modificarse después de la creación
- **RN-03:** El nombre del proyecto solo permite caracteres alfanuméricos y espacios, con longitud máxima de 100 caracteres
- **RN-04:** La comisión del organizador debe ser un número entero entre 0 y 100 (porcentaje)
- **RN-05:** Un proyecto debe tener al menos un modo de entrega activo para poder activarse
- **RN-06:** Un proyecto requiere nombre, tipo de proyecto, comisión y al menos un modo de entrega para activarse
- **RN-07:** El estado inicial de un proyecto siempre es "Borrador"
- **RN-08:** Un proyecto finalizado no puede volver a activarse
- **RN-09:** Al pausar un proyecto, los pedidos existentes continúan su flujo normal
- **RN-10:** El cambio de packaging solo aplica a nuevos productos, no modifica productos existentes
- **RN-11:** El logo del proyecto acepta formatos PNG, JPG, JPEG y WebP
- **RN-12:** El logo del proyecto tiene un tamaño máximo de 2MB; imágenes mayores deben comprimirse automáticamente
- **RN-13:** La descripción corta tiene un máximo de 500 caracteres
- **RN-14:** Si no se carga logo, se asigna un avatar por defecto

---

## 6. Estados del dominio

| Estado | Descripción |
|--------|-------------|
| Borrador | Proyecto en configuración, no visible públicamente |
| Activo | Proyecto visible en tienda pública, acepta pedidos |
| Pausado | Proyecto no acepta nuevos pedidos, procesa existentes |
| Finalizado | Proyecto cerrado permanentemente |

### 6.1 Transiciones válidas

| Estado actual | Evento | Nuevo estado |
|---------------|--------|--------------|
| Borrador | Activar proyecto (con validaciones completas) | Activo |
| Activo | Pausar proyecto | Pausado |
| Activo | Finalizar proyecto | Finalizado |
| Pausado | Reactivar proyecto | Activo |
| Pausado | Finalizar proyecto | Finalizado |

---

## 7. Casos de uso (Gherkin)

---

### 7.1 Caso de uso: Crear nuevo proyecto

```gherkin
Feature: Creación de nuevo proyecto
  Como organizador autenticado
  Quiero crear un nuevo proyecto
  Para agrupar productos que pondré a la venta

  Background:
    Given el organizador está autenticado
    And el organizador accede a la pantalla de crear proyecto en "/project/new"

  Scenario: Crear proyecto en borrador con información mínima
    Given el organizador completa el nombre del proyecto "Mi Proyecto 2024"
    And selecciona el tipo de proyecto "Equipo"
    And define una comisión del 10%
    And selecciona al menos un modo de entrega
    When el organizador hace clic en "Crear proyecto"
    Then el sistema genera un ID único para el proyecto
    And el proyecto se crea en estado "Borrador"
    And el organizador es redirigido al dashboard

  Scenario: Crear proyecto y activarlo directamente
    Given el organizador completa toda la información obligatoria
    And selecciona el estado "Activo"
    When el organizador hace clic en "Crear proyecto"
    Then el proyecto se crea en estado "Activo"
    And el organizador es redirigido al dashboard

  Scenario: Nombre de proyecto duplicado
    Given existe un proyecto con nombre "Proyecto Existente"
    When el organizador intenta crear un proyecto con nombre "Proyecto Existente"
    Then el sistema muestra error "El nombre del proyecto ya existe"
    And el proyecto no se crea

  Scenario: Nombre de proyecto con caracteres no permitidos
    Given el organizador ingresa el nombre "Proyecto@#$%"
    When el sistema valida el campo
    Then el sistema muestra error "El nombre solo puede contener letras, números y espacios"

  Scenario: Nombre de proyecto excede longitud máxima
    Given el organizador ingresa un nombre con más de 100 caracteres
    When el sistema valida el campo
    Then el sistema muestra error "El nombre no puede exceder 100 caracteres"

  Scenario: Activar proyecto sin modo de entrega
    Given el organizador no ha seleccionado ningún modo de entrega
    And selecciona el estado "Activo"
    When el organizador hace clic en "Crear proyecto"
    Then el sistema bloquea la acción
    And muestra mensaje "Debe seleccionar al menos un modo de entrega para activar el proyecto"

  Scenario: Activar proyecto sin comisión definida
    Given el organizador no ha definido la comisión
    And selecciona el estado "Activo"
    When el organizador hace clic en "Crear proyecto"
    Then el sistema bloquea la acción
    And muestra mensaje "Debe definir la comisión para activar el proyecto"

  Scenario: Cancelar creación con cambios sin guardar
    Given el organizador ha modificado algún campo del formulario
    When el organizador hace clic en "Cancelar"
    Then el sistema muestra modal de confirmación "¿Desea salir sin guardar los cambios?"
    And ofrece opciones "Salir sin guardar" y "Continuar editando"

  Scenario: Cancelar creación sin cambios
    Given el organizador no ha modificado ningún campo
    When el organizador hace clic en "Cancelar"
    Then el organizador es redirigido al dashboard sin confirmación
```

---

### 7.2 Caso de uso: Editar proyecto existente

```gherkin
Feature: Edición de proyecto existente
  Como organizador autenticado
  Quiero editar un proyecto existente
  Para actualizar su configuración

  Background:
    Given el organizador está autenticado
    And existe un proyecto con ID "proj-123" perteneciente al organizador
    And el organizador accede a la pantalla de edición en "/project/proj-123/edit"

  Scenario: Editar información básica del proyecto
    Given el proyecto está en estado "Borrador"
    When el organizador modifica la descripción corta
    And hace clic en "Guardar cambios"
    Then los cambios se guardan correctamente
    And el organizador ve mensaje de confirmación

  Scenario: Intentar modificar nombre del proyecto
    Given el proyecto ya fue creado
    When el organizador intenta editar el campo nombre
    Then el campo nombre está deshabilitado
    And muestra tooltip "El nombre no puede modificarse después de la creación"

  Scenario: Modificar comisión con advertencia
    Given el proyecto tiene productos asociados
    When el organizador modifica la comisión
    Then el sistema muestra modal de advertencia
    And el mensaje indica "Este cambio afectará el precio de todos los productos del proyecto"
    And el mensaje indica "Los pedidos existentes no se verán afectados"
    And ofrece opciones "Confirmar cambio" y "Cancelar"

  Scenario: Modificar packaging con advertencia
    Given el proyecto tiene productos asociados
    When el organizador cambia la opción de packaging personalizado
    Then el sistema muestra modal de advertencia
    And el mensaje indica "Este cambio solo aplicará a nuevos productos"
    And el mensaje indica "Los productos existentes mantendrán su configuración actual"

  Scenario: Modificar modos de entrega con advertencia
    Given el proyecto tiene productos asociados
    When el organizador modifica los modos de entrega
    Then el sistema muestra modal de advertencia
    And el mensaje indica "Este cambio afectará las opciones de entrega disponibles"
    And el mensaje indica "Los pedidos existentes no se verán afectados"
```

---

### 7.3 Caso de uso: Gestión de logo del proyecto

```gherkin
Feature: Gestión de logo del proyecto
  Como organizador autenticado
  Quiero cargar un logo para mi proyecto
  Para personalizar la identidad visual

  Background:
    Given el organizador está autenticado
    And el organizador está en la pantalla de crear/editar proyecto

  Scenario: Cargar logo válido
    Given el organizador selecciona una imagen PNG de 500KB
    When el sistema procesa la imagen
    Then la imagen se muestra como preview
    And el logo queda asociado al proyecto

  Scenario: Cargar logo con formato no soportado
    Given el organizador selecciona una imagen BMP
    When el sistema valida el archivo
    Then el sistema muestra error "Formato no soportado. Use PNG, JPG o WebP"
    And la imagen no se carga

  Scenario: Cargar logo que excede el tamaño máximo
    Given el organizador selecciona una imagen de 5MB
    When el sistema procesa la imagen
    Then el sistema comprime automáticamente la imagen a menos de 2MB
    And la imagen comprimida se muestra como preview
    And se muestra mensaje informativo "La imagen fue optimizada automáticamente"

  Scenario: Proyecto sin logo
    Given el organizador no ha cargado ningún logo
    When el proyecto se crea
    Then el sistema asigna un avatar por defecto al proyecto
```

---

### 7.4 Caso de uso: Configuración de modos de entrega

```gherkin
Feature: Configuración de modos de entrega
  Como organizador autenticado
  Quiero configurar los modos de entrega de mi proyecto
  Para definir cómo llegarán los productos a los compradores

  Background:
    Given el organizador está autenticado
    And el organizador está en la pantalla de crear/editar proyecto

  Scenario: Habilitar entrega en sede del organizador
    Given el organizador activa la opción "Entrega en sede del organizador"
    When el sistema muestra los campos adicionales
    Then el organizador debe ingresar la dirección de entrega
    And debe seleccionar la periodicidad de entrega

  Scenario: Seleccionar periodicidad de entrega en sede
    Given la opción "Entrega en sede del organizador" está activa
    When el organizador selecciona la periodicidad
    Then las opciones disponibles son "Semanal", "Quincenal", "Mensual" y "Lo más pronto posible"

  Scenario: Habilitar entrega a domicilio con costo para el cliente
    Given el organizador activa la opción "Entrega a domicilio del comprador"
    When el organizador selecciona "Se cobra el domicilio al cliente"
    Then el sistema registra que el costo se calculará según ubicación

  Scenario: Habilitar entrega a domicilio gratis
    Given el organizador activa la opción "Entrega a domicilio del comprador"
    When el organizador selecciona "Entrega gratis"
    Then el sistema muestra información "El costo está incluido en el precio del producto"
    And muestra advertencia "Esto reduce la ganancia del organizador"

  Scenario: Habilitar recolección en Glam Urban
    Given el organizador activa la opción "Recolección por el organizador en Glam Urban"
    Then el sistema muestra texto informativo "Sin costo adicional"
    And no solicita información adicional

  Scenario: Intentar guardar sin modo de entrega
    Given el organizador no ha seleccionado ningún modo de entrega
    And el proyecto está en estado "Activo" o se intenta activar
    When el organizador hace clic en "Guardar"
    Then el sistema muestra error "Debe seleccionar al menos un modo de entrega"
```

---

### 7.5 Caso de uso: Transiciones de estado del proyecto

```gherkin
Feature: Transiciones de estado del proyecto
  Como organizador autenticado
  Quiero cambiar el estado de mi proyecto
  Para controlar su visibilidad y disponibilidad

  Background:
    Given el organizador está autenticado
    And existe un proyecto perteneciente al organizador

  Scenario: Activar proyecto desde borrador
    Given el proyecto está en estado "Borrador"
    And el proyecto tiene toda la información obligatoria completa
    When el organizador cambia el estado a "Activo"
    Then el proyecto pasa a estado "Activo"
    And el proyecto será visible en la tienda pública

  Scenario: Pausar proyecto activo sin pedidos
    Given el proyecto está en estado "Activo"
    And el proyecto no tiene pedidos en curso
    When el organizador cambia el estado a "Pausado"
    Then el proyecto pasa a estado "Pausado"
    And el proyecto deja de ser visible en la tienda pública

  Scenario: Pausar proyecto activo con pedidos en curso
    Given el proyecto está en estado "Activo"
    And el proyecto tiene pedidos en curso
    When el organizador intenta cambiar el estado a "Pausado"
    Then el sistema muestra advertencia "Este proyecto tiene pedidos en curso. Estos pedidos continuarán su proceso normal de entrega."
    And ofrece opciones "Confirmar pausa" y "Cancelar"
    When el organizador confirma
    Then el proyecto pasa a estado "Pausado"
    And los pedidos existentes continúan su flujo normal

  Scenario: Reactivar proyecto pausado
    Given el proyecto está en estado "Pausado"
    When el organizador cambia el estado a "Activo"
    Then el proyecto pasa a estado "Activo"
    And el proyecto vuelve a ser visible en la tienda pública

  Scenario: Finalizar proyecto activo
    Given el proyecto está en estado "Activo"
    When el organizador cambia el estado a "Finalizado"
    Then el sistema muestra confirmación "Esta acción es permanente. ¿Desea finalizar el proyecto?"
    When el organizador confirma
    Then el proyecto pasa a estado "Finalizado"

  Scenario: Finalizar proyecto pausado
    Given el proyecto está en estado "Pausado"
    When el organizador cambia el estado a "Finalizado"
    Then el sistema muestra confirmación "Esta acción es permanente. ¿Desea finalizar el proyecto?"
    When el organizador confirma
    Then el proyecto pasa a estado "Finalizado"

  Scenario: Intentar reactivar proyecto finalizado
    Given el proyecto está en estado "Finalizado"
    When el organizador intenta cambiar el estado
    Then el campo de estado está deshabilitado
    And muestra mensaje "Los proyectos finalizados no pueden reactivarse"
```

---

### 7.6 Caso de uso: Configuración de comisión

```gherkin
Feature: Configuración de comisión del organizador
  Como organizador autenticado
  Quiero definir mi porcentaje de comisión
  Para establecer mi ganancia por cada venta

  Background:
    Given el organizador está autenticado
    And el organizador está en la pantalla de crear/editar proyecto

  Scenario: Definir comisión válida
    Given el organizador ingresa una comisión de 15
    When el sistema valida el campo
    Then el valor es aceptado
    And se muestra como "15%"

  Scenario: Definir comisión cero
    Given el organizador ingresa una comisión de 0
    When el sistema valida el campo
    Then el valor es aceptado
    And se muestra como "0%"

  Scenario: Definir comisión máxima
    Given el organizador ingresa una comisión de 100
    When el sistema valida el campo
    Then el valor es aceptado
    And se muestra como "100%"

  Scenario: Intentar comisión negativa
    Given el organizador ingresa una comisión de -5
    When el sistema valida el campo
    Then el sistema muestra error "La comisión debe ser un valor entre 0 y 100"

  Scenario: Intentar comisión mayor a 100
    Given el organizador ingresa una comisión de 150
    When el sistema valida el campo
    Then el sistema muestra error "La comisión debe ser un valor entre 0 y 100"

  Scenario: Intentar comisión con decimales
    Given el organizador ingresa una comisión de 10.5
    When el sistema valida el campo
    Then el sistema muestra error "La comisión debe ser un número entero"
```

---

## 8. Contratos funcionales (conceptuales)

### 8.1 Entradas

**Campos obligatorios para crear proyecto:**
- Nombre del proyecto (alfanumérico, máx 100 caracteres, único global)
- Tipo de proyecto (Equipo, Institución, Empresa, Grupo, Otro)

**Campos obligatorios para activar proyecto:**
- Nombre del proyecto
- Tipo de proyecto
- Comisión del organizador (entero 0-100)
- Al menos un modo de entrega configurado

**Campos opcionales:**
- Logo del proyecto (PNG, JPG, JPEG, WebP, máx 2MB)
- Descripción corta (máx 500 caracteres)
- Packaging personalizado (Sí/No)

**Configuración de entrega en sede (si habilitado):**
- Dirección de entrega (texto libre)
- Periodicidad (Semanal, Quincenal, Mensual, Lo más pronto posible)

**Configuración de entrega a domicilio (si habilitado):**
- Tipo de costo (Cobrado al cliente / Gratis)

### 8.2 Salidas

**Creación exitosa:**
- ID único del proyecto generado
- Proyecto creado en el estado seleccionado
- Redirección al dashboard

**Edición exitosa:**
- Cambios guardados
- Mensaje de confirmación

### 8.3 Errores de negocio

| Código lógico | Condición |
|---------------|-----------|
| PROJ_NAME_DUPLICATE | El nombre del proyecto ya existe en el sistema |
| PROJ_NAME_INVALID | El nombre contiene caracteres no permitidos |
| PROJ_NAME_TOO_LONG | El nombre excede 100 caracteres |
| PROJ_COMMISSION_INVALID | La comisión no es un entero entre 0 y 100 |
| PROJ_NO_DELIVERY_MODE | No se ha seleccionado ningún modo de entrega |
| PROJ_MISSING_REQUIRED | Faltan campos obligatorios para activar |
| PROJ_LOGO_INVALID_FORMAT | El formato del logo no es soportado |
| PROJ_STATE_TRANSITION_INVALID | La transición de estado no es válida |

---

## 9. Invariantes del sistema

- Un proyecto siempre tiene un ID único global
- Un proyecto siempre tiene un nombre único global
- Un proyecto siempre pertenece a un organizador
- Un proyecto siempre tiene un estado válido (Borrador, Activo, Pausado, Finalizado)
- Un proyecto activo siempre tiene al menos un modo de entrega
- Un proyecto activo siempre tiene una comisión definida

---

## 10. Casos límite y excepciones

- Si la compresión de imagen falla, mostrar error y solicitar imagen más pequeña
- Si el nombre del proyecto tiene solo espacios, tratarlo como inválido
- Si se pierde conexión durante la creación, mantener datos en formulario
- Nombres de proyecto con mayúsculas/minúsculas diferentes se consideran duplicados (case-insensitive)

---

## 11. Seguridad y permisos

| Actor | Acción permitida | Acción prohibida |
|-------|------------------|------------------|
| Organizador | Crear proyectos propios | Acceder a proyectos de otros organizadores |
| Organizador | Editar proyectos propios | Modificar nombre después de creación |
| Organizador | Cambiar estado de proyectos propios | Reactivar proyectos finalizados |
| Usuario no autenticado | Ninguna | Acceder a cualquier funcionalidad de proyectos |

---

## 12. No-objetivos explícitos

- No se implementa cálculo real de precios de productos
- No se implementa la tienda pública
- No se implementa la carga de productos
- No se implementa el cálculo de costos de envío
- No se implementa la modificación masiva de productos al cambiar configuración
- No se implementa la gestión de pedidos
- No se implementa integración con backend real (fase mock)

---

## 13. Versionado

- Versión: v1.0
- Fecha: 2025-12-18
- Cambios: Versión inicial del spec

---

## 14. Checklist de validación (AI + Humano)

Antes de aprobar este spec:
- [x] Todos los comportamientos están en Gherkin
- [x] No hay decisiones técnicas
- [x] Las reglas de negocio están numeradas
- [x] No hay ambigüedades
- [x] El alcance está claro
- [x] No hay ejemplos de código fuente

---

## 15. Rutas de la aplicación

| Ruta | Descripción |
|------|-------------|
| `/project/new` | Pantalla de creación de nuevo proyecto |
| `/project/{id_project}/edit` | Pantalla de edición de proyecto existente |

---

## 16. Nota final para AI Agents

- ❌ No inferir comportamiento no especificado
- ❌ No modificar este archivo durante la implementación
- ✅ Usar este spec como base para `plan.md`, tests y validaciones
- ✅ Preguntar si algo no está explícitamente definido

