

# Creación de Proyecto – Organizador

**Módulo: Proyectos | Rol: Organizador**

## 1. Propósito

La pantalla **Crear nuevo proyecto** permite a un **Organizador autenticado** configurar un proyecto que agrupa productos (uniformes, accesorios y souvenirs) que **Glam Urban pondrá a la venta** en una tienda pública asociada al organizador.

Un organizador puede tener **múltiples proyectos activos** de forma simultánea.

Esta pantalla define la **configuración genérica del proyecto**.
La carga de productos **no hace parte de este flujo**.

---

## 2. Acceso al flujo

**Ruta de acceso:**
Dashboard del Organizador → Botón **“Nuevo proyecto”**

Al hacer clic, se abre la pantalla de creación del proyecto.

---

## 3. Reglas generales del proyecto

* Cada proyecto:

  * Tiene un **ID interno único global**, generado automáticamente.
  * Tiene un **nombre único global**, no editable posteriormente.
  * Puede cambiar su configuración económica y logística, con advertencias.
* Los proyectos pueden estar en estado:

  * **Borrador**
  * **Activo**
  * **Pausado**
  * **Finalizado**
* Los proyectos activos serán visibles posteriormente en una **tienda pública** (fuera de alcance).

---

## 4. Estructura de la pantalla (Mock funcional)

La pantalla se presenta en **un solo formulario**, dividido en secciones claras.

---

## 5. Sección 1 – Información básica del proyecto

### Campos

| Campo               | Obligatorio | Comportamiento                               |
| ------------------- | ----------- | -------------------------------------------- |
| Nombre del proyecto | Sí          | Único global, no editable luego              |
| Logo del proyecto   | No          | Si no se carga, se asigna avatar por defecto |
| Descripción corta   | No          | Texto informativo para la tienda pública     |
| Tipo de proyecto    | Sí          | Equipo, institución, empresa, grupo, otro    |

---

## 6. Sección 2 – Configuración económica

### Comisión del organizador

* Campo numérico (%).
* **Sin límite mínimo ni máximo**.
* Aplica a **todos los productos del proyecto**.

### Reglas

* La comisión puede modificarse posteriormente.
* Al modificarla:

  * Se debe mostrar una **advertencia**.
  * El cambio impactará el precio de **todos los productos del proyecto**.
  * La modificación masiva **no hace parte de esta especificación**.

---

## 7. Sección 3 – Packaging

### Packaging personalizado

* Opción: **Sí / No**
* Afecta el costo y precio publicado de los productos.

### Reglas

* El cambio de packaging:

  * **No modifica productos existentes automáticamente**.
  * Solo aplica a **nuevos productos** hasta que se cambie manualmente en cada producto.
* Al modificar esta opción debe mostrarse una advertencia clara.

---

## 8. Sección 4 – Modos de entrega permitidos

El organizador puede habilitar **uno o varios** modos de entrega.

### Regla general

* El proyecto debe tener **al menos un modo de entrega activo** para poder activarse.

---

### 8.1 Entrega en sede del organizador

Si está habilitado, se solicita:

* Dirección de entrega
* Periodicidad:

  * Semanal
  * Quincenal
  * Mensual
  * Lo más pronto posible

---

### 8.2 Entrega a domicilio del comprador

Opciones excluyentes:

* Se cobra el domicilio al cliente

  * Se indica el valor del domicilio
* Entrega gratis

  * El costo está incluido en el precio del producto
  * Reduce la ganancia del organizador

---

### 8.3 Recolección por el organizador en Glam Urban

* No tiene costo
* Solo muestra texto informativo

---

## 9. Sección 5 – Estado inicial del proyecto

Opciones:

* **Borrador** (default)
* **Activo**

### Reglas

* Si se selecciona **Activo** y falta información obligatoria:

  * El sistema bloquea la acción
  * Muestra mensajes de validación claros

---

## 10. Sección 6 – Acciones

* **Cancelar**

  * Muestra confirmación
  * No guarda cambios
* **Crear proyecto**

  * Valida la información
  * Genera el ID del proyecto
  * Redirige al dashboard

---

## 11. Comportamiento posterior a la creación

### Pausar proyecto

* Un organizador puede pausar un proyecto **aunque tenga pedidos en curso**.
* Al pausar:

  * Se muestra advertencia:

    > “Este proyecto tiene pedidos en curso. Estos pedidos continuarán su proceso normal de entrega.”
  * No se aceptan nuevos pedidos.
  * Los pedidos existentes continúan su flujo normal.

---

## 12. Advertencias y confirmaciones obligatorias

Cuando se modifique cualquiera de los siguientes valores:

* Comisión
* Modos de entrega
* Packaging

El sistema debe mostrar un modal de confirmación indicando:

* Qué se está cambiando
* Qué productos o precios se verán afectados
* Qué no se modifica (pedidos existentes)

---

## 13. Preview de impacto (fase mock)

En esta fase:

* Se mostrará un **preview textual** (no cálculo real) indicando:

  * “Este cambio afectará el precio de todos los productos del proyecto.”
  * “Los pedidos existentes no se verán afectados.”

---

## 14. Alcance técnico (para este spec)

* Todo se construye con **mocks de comportamiento**.
* No hay conexión real con backend.
* La integración con servicios se definirá en un spec posterior.

---

## 15. Fuera de alcance explícito

* Carga y configuración de productos
* Cálculo real de precios
* Tienda pública
* Aplicación real de cambios masivos


