# Specification – Resumen de proyectos (tabla "Mis proyectos") – Conexión con datos

> **Documento normativo de comportamiento del sistema**  
> Define **QUÉ** debe hacer la tabla "Mis proyectos" del dashboard organizador en cuanto a datos y navegación.  
> No define diseño visual ni columnas nuevas; solo la fuente de datos y el comportamiento ya existente.

---

## 0. Instrucciones obligatorias para la AI Agent

Antes de completar o usar este documento, la AI **DEBE**:
- Leer el documento funcional `funcionalidad_resumen_de_proyectos_ventas_web_gssc.md` y la referencia de API en `specs/sells/sells-curl-example.md`.
- No escribir código a partir de este spec sin un plan aprobado (`plan.md`).
- No tomar decisiones de implementación no cubiertas por este spec o el plan.
- Preguntar cualquier ambigüedad al humano.

---

## 1. Propósito

Mostrar al **organizador** un resumen consolidado de ventas **por proyecto** basado en **ventas web confirmadas en la plataforma GSSC**, para seguimiento comercial, reportes financieros y consulta rápida de desempeño. La tabla ya existe en el dashboard; este spec regula **conectar esa tabla con los datos reales** (vista `project_sales_summary`) sin cambiar el diseño ni la información mostrada (Proyecto, Estado, Pedidos, Unidades, Comisión).

---

## 2. Alcance funcional

### 2.1 Incluye
- Obtener el listado de proyectos del organizador con resumen de ventas (pedidos confirmados, unidades vendidas, comisión del organizador) desde la fuente de datos autorizada (`project_sales_summary`).
- Mostrar una fila por proyecto con: nombre del proyecto, estado actual, total de pedidos confirmados, total de unidades vendidas, comisión acumulada del organizador.
- Navegación al detalle del proyecto al hacer clic en la fila (o enlace equivalente), usando el identificador público del proyecto.
- Filtrado por nombre y por estado en cliente (comportamiento actual de la tabla), sin cambiar la UI.
- Proyectos sin ventas mostrados con cero en pedidos, unidades y comisión.

### 2.2 Excluye (explícito)
- Cambios en el diseño, columnas o textos de la tabla.
- Checkout, carrito, pagos, devoluciones o reembolsos.
- Filtros por rango de fechas, comparativos entre proyectos o indicadores de tendencia.
- Modificación de la definición de la vista `project_sales_summary` o del backend.
- Cálculo o recálculo de métricas en el frontend; los valores son los provistos por la fuente de datos.

> Todo lo no listado aquí se considera **fuera de alcance**.

---

## 3. Actores

| Actor | Descripción | Nivel de acceso |
|-------|-------------|-----------------|
| Organizador | Usuario autenticado con rol organizador | Ver solo sus proyectos y sus resúmenes de ventas en la tabla "Mis proyectos". |

---

## 4. Glosario de dominio

| Término | Definición |
|---------|------------|
| Ventas web confirmadas | Ventas con estado pagado/confirmado realizadas en la plataforma GSSC. |
| Pedidos | Conteo de ventas confirmadas asociadas al proyecto (una venta = un pedido). |
| Unidades | Suma de unidades físicas vendidas en ítems de esas ventas confirmadas. |
| Comisión | Suma de la comisión del organizador en los desgloses de esas ventas confirmadas. |
| Proyecto sin ventas | Proyecto del organizador sin ventas confirmadas; se muestra con 0 en pedidos, unidades y comisión. |
| Identificador público del proyecto | Código usado en la URL para acceder al detalle del proyecto (p. ej. `project_public_code`). |

---

## 5. Reglas de negocio (OBLIGATORIAS)

- **RN-01:** Los datos mostrados provienen exclusivamente de la fuente autorizada (vista de resumen por proyecto que consolida ventas confirmadas); no se recalculan en el frontend.
- **RN-02:** Solo se cuentan ventas con estado pagado/confirmado para pedidos, unidades y comisión.
- **RN-03:** Una fila corresponde a un único proyecto; las métricas son agregadas por proyecto.
- **RN-04:** Un proyecto sin ventas confirmadas se muestra con pedidos = 0, unidades = 0, comisión = 0.
- **RN-05:** El organizador solo ve sus propios proyectos (filtrado por organizador en la fuente de datos).
- **RN-06:** La navegación al detalle del proyecto utiliza el identificador público del proyecto.
- **RN-07:** Los valores mostrados son históricos e inmutables; no se usan precios ni configuraciones “vivas” del proyecto para estas métricas.

---

## 6. Estados del dominio (proyecto)

| Estado | Descripción |
|--------|-------------|
| Activo | Proyecto en curso. |
| Pausado | Proyecto pausado. |
| Finalizado | Proyecto finalizado. |

La tabla muestra el estado actual del proyecto con fines informativos; no define transiciones.

---

## 7. Casos de uso (Gherkin)

### 7.1 Caso de uso: Ver listado de proyectos con resumen de ventas

```gherkin
Feature: Listado de proyectos con resumen de ventas en dashboard organizador
  Como organizador autenticado
  Quiero ver la tabla "Mis proyectos" con datos reales de ventas por proyecto
  Para hacer seguimiento comercial y consultar desempeño

  Background:
    Given que he iniciado sesión como organizador
    And que la fuente de datos de resumen por proyecto está disponible

  Scenario: Ver tabla con proyectos que tienen ventas
    Given existen proyectos míos con ventas confirmadas
    When accedo al dashboard del organizador
    Then veo la tabla "Mis proyectos"
    And cada fila muestra el nombre del proyecto
    And cada fila muestra el estado del proyecto (Activo, Pausado o Finalizado)
    And cada fila muestra el total de pedidos confirmados
    And cada fila muestra el total de unidades vendidas
    And cada fila muestra la comisión acumulada del organizador
    And los valores coinciden con los de la fuente de datos

  Scenario: Ver tabla con proyecto sin ventas
    Given tengo al menos un proyecto sin ventas confirmadas
    When accedo al dashboard del organizador
    Then ese proyecto aparece en la tabla
    And los pedidos mostrados son 0
    And las unidades mostradas son 0
    And la comisión mostrada es 0

  Scenario: Organizador sin proyectos
    Given no tengo ningún proyecto
    When accedo al dashboard del organizador
    Then veo el estado vacío definido para la sección de proyectos
    And no se muestran filas en la tabla

  Scenario: Fuente de datos no disponible
    Given he iniciado sesión como organizador
    And la fuente de datos de resumen no está disponible
    When accedo al dashboard del organizador
    Then el sistema maneja el error sin romper la página
    And se muestra un comportamiento de error coherente con el resto de la aplicación
```

### 7.2 Caso de uso: Navegar al detalle del proyecto desde la tabla

```gherkin
Feature: Navegación al detalle del proyecto desde la tabla "Mis proyectos"
  Como organizador
  Quiero abrir el detalle de un proyecto desde una fila de la tabla
  Para consultar información del proyecto

  Background:
    Given que he iniciado sesión como organizador
    And la tabla "Mis proyectos" muestra al menos un proyecto

  Scenario: Navegar al detalle al interactuar con la fila
    Given la tabla muestra un proyecto con identificador público conocido
    When hago clic en el enlace o fila correspondiente a ese proyecto
    Then soy llevado a la pantalla de detalle del proyecto
    And la URL utiliza el identificador público del proyecto
```

### 7.3 Reglas para Gherkin

- Lenguaje de negocio; no mencionar endpoints, tablas ni clases.
- Cada `Then` debe ser verificable.
- No añadir expectativas no cubiertas por este spec.

---

## 8. Contratos funcionales (conceptuales)

### 8.1 Entradas
- Sesión válida de organizador (autenticación).
- La petición a la fuente de datos debe realizarse con el identificador/token del organizador para que el backend devuelva solo sus proyectos.

### 8.2 Salidas
- Lista de proyectos del organizador, cada uno con: nombre, estado, total de pedidos confirmados, total de unidades vendidas, comisión acumulada del organizador, e identificador público para navegación.
- Posible lista vacía (organizador sin proyectos).
- En caso de error de fuente de datos: manejo de error según estándares de la aplicación, sin exponer detalles internos al usuario de forma insegura.

### 8.3 Errores de negocio

| Código lógico | Condición |
|---------------|-----------|
| Sin sesión o rol no organizador | No se muestra la tabla con datos; flujo de autenticación/roles existente. |
| Fuente de datos no disponible | Error manejado; no se asumen datos mock para esta tabla sin decisión explícita. |

---

## 9. Invariantes del sistema

- La tabla "Mis proyectos" no muestra datos de otros organizadores.
- Las métricas de la tabla (pedidos, unidades, comisión) no se recalculan en el cliente; provienen de la fuente de datos.
- La navegación al detalle del proyecto usa siempre el identificador público del proyecto.

---

## 10. Casos límite y excepciones

- Proyecto finalizado: se muestra con sus métricas históricas; no se filtra ni oculta.
- Proyecto sin ventas: se muestra con 0 en todas las métricas numéricas.
- Lista vacía: se muestra el estado vacío ya definido para la sección.
- Fallo de red o backend: manejo según estándares del proyecto; la página no debe quedar en estado inconsistente.

---

## 11. Seguridad y permisos

| Actor | Acción permitida | Acción prohibida |
|-------|------------------|------------------|
| Organizador | Ver la tabla "Mis proyectos" con sus propios proyectos y métricas. Navegar al detalle de sus proyectos. | Ver proyectos o métricas de otros organizadores. Modificar datos de la vista desde esta pantalla. |

La fuente de datos debe filtrar por organizador (p. ej. `organizer_id = auth.uid()`); el frontend no envía filtros de organizador, sino que usa la identidad de la sesión.

---

## 12. No-objetivos explícitos

- No añadir ni quitar columnas en la tabla.
- No cambiar el diseño ni los textos de la tabla.
- No implementar filtros por rango de fechas ni comparativos.
- No incluir devoluciones o reembolsos en las métricas.
- No definir en este spec la implementación técnica (eso queda en el plan).

---

## 13. Versionado

- Versión: 1.0
- Fecha: 2025-01-28
- Cambios: Spec inicial para conexión de la tabla "Mis proyectos" con datos reales (`project_sales_summary`).

---

## 14. Checklist de validación (AI + Humano)

Antes de aprobar este spec:
- [ ] Todos los comportamientos relevantes están en Gherkin.
- [ ] No hay decisiones de implementación (código, endpoints concretos).
- [ ] Las reglas de negocio están numeradas.
- [ ] El alcance (solo conectar datos, sin cambiar diseño) está claro.
- [ ] No hay ejemplos de código fuente.

---

## 15. Nota final para AI Agents

- No inferir comportamiento no especificado.
- No modificar este archivo durante la implementación sin acuerdo.
- Usar este spec como base para `plan.md`, tests y validaciones.
- Preguntar si algo no está explícitamente definido.
