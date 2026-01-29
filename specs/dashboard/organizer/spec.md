# Specification (SDD) – Dashboard del Organizador

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

El Dashboard del Organizador es la pantalla de aterrizaje posterior al login para usuarios con rol `organizer`.

**Problema de negocio que resuelve:**
- Los organizadores necesitan una visión ejecutiva y consolidada del desempeño de todos sus proyectos sin tener que navegar a cada uno individualmente.

**Valor que aporta:**
- Permite tomar decisiones estratégicas basadas en métricas agregadas
- Facilita el monitoreo del nivel de cumplimiento del servicio
- Centraliza la información de comisiones generadas
- Identifica rápidamente qué proyectos están activos y aportando valor

**Por qué existe este módulo:**
- Es el centro de control ejecutivo del ecosistema de proyectos del organizador
- Proporciona información agregada y resumida, no operativa

---

## 2. Alcance funcional

### 2.1 Incluye
- Menú de navegación principal con ítems específicos para el rol organizador
- Métricas globales agregadas (no por proyecto individual)
- Visualización de comisión del organizador en distintos periodos
- Métricas volumétricas: unidades, productos y pedidos
- Estado general de los proyectos (activos, pausados, finalizados)
- Creación de nuevos proyectos
- Filtros temporales ejecutivos (mensual, trimestral, semestral)
- Búsqueda exclusivamente por proyecto (nombre, estado)
- Gráficas de tendencias: evolución de comisión, estado de pedidos, productos más vendidos

### 2.2 Excluye (explícito)
> Todo lo no listado aquí se considera fuera de alcance.

- Dashboard individual por proyecto (se accede navegando fuera de este dashboard)
- Gestión o edición de proyectos existentes
- Gestión de pedidos
- Gestión de productos
- Gestión de compradores
- Reportes descargables
- Drill-down desde gráficas
- Análisis diario u operacional
- Stock, inventarios o disponibilidad
- Flujos de devoluciones, cambios o incidencias
- Ventas brutas o ingresos totales de la plataforma

---

## 3. Actores

| Actor | Descripción | Nivel de acceso |
|-------|-------------|-----------------|
| Organizador (`organizer`) | Usuario autenticado con rol organizador que gestiona proyectos y coordina el trabajo | Acceso completo al dashboard, visualización de métricas propias, creación de proyectos |

---

## 4. Glosario de dominio

> Definiciones precisas y no ambiguas.

| Término | Definición |
|---------|------------|
| Comisión del organizador | Valor monetario correspondiente exclusivamente al porcentaje de ganancia del organizador. Nunca incluye ventas brutas. |
| Proyecto | Unidad de negocio gestionada por el organizador que agrupa pedidos, productos y genera comisiones |
| Pedido completado | Pedido que ha sido entregado exitosamente al destinatario final |
| Pedido en proceso | Pedido que ha sido creado pero aún no ha sido completado/entregado |
| Unidades vendidas | Cantidad total de productos vendidos expresada en unidades, sin valor monetario asociado |
| Periodo ejecutivo | Agrupación temporal de datos: mensual, trimestral o semestral |
| Estado del proyecto | Clasificación del proyecto: activo, pausado o finalizado |

---

## 5. Reglas de negocio (OBLIGATORIAS)

Cada regla debe ser:
- Verificable
- Independiente de la implementación
- Clara y atómica

- **RN-01:** Los valores monetarios mostrados corresponden EXCLUSIVAMENTE a la comisión del organizador, nunca a ventas brutas o ingresos totales.
- **RN-02:** Las métricas se presentan de forma agregada para todos los proyectos del organizador, no por proyecto individual.
- **RN-03:** Los periodos de análisis disponibles son únicamente: mensual, trimestral y semestral. No se permite análisis diario.
- **RN-04:** La búsqueda en el dashboard solo permite filtrar por proyectos (nombre y estado). No permite buscar productos, pedidos ni compradores.
- **RN-05:** El dashboard siempre muestra información consolidada de TODOS los proyectos del organizador.
- **RN-06:** Solo los usuarios con rol `organizer` pueden acceder al dashboard del organizador.
- **RN-07:** Las gráficas son informativas y no interactivas (sin drill-down).
- **RN-08:** La única acción primaria disponible es la creación de nuevos proyectos.
- **RN-09:** El detalle por proyecto individual se realiza navegando fuera de este dashboard.
- **RN-10:** Los estados válidos de un proyecto son: activo, pausado, finalizado.
- **RN-11:** El menú principal de navegación del Organizador incluye ÚNICAMENTE: Dashboard, Pagos y Configuración. NO incluye un ítem "Proyectos" directo.
- **RN-12:** El acceso a proyectos para el Organizador se realiza exclusivamente desde el Dashboard, a través de la sección de resumen de proyectos.

---

## 6. Estados del dominio (si aplica)

### 6.1 Estados de Proyecto

| Estado | Descripción |
|--------|-------------|
| Activo | Proyecto operando normalmente, generando pedidos y comisiones |
| Pausado | Proyecto temporalmente detenido, no genera nuevos pedidos |
| Finalizado | Proyecto cerrado definitivamente, solo consulta histórica |

### 6.2 Transiciones válidas

| Estado actual | Evento | Nuevo estado |
|---------------|--------|--------------|
| Activo | Organizador pausa el proyecto | Pausado |
| Activo | Organizador finaliza el proyecto | Finalizado |
| Pausado | Organizador reactiva el proyecto | Activo |
| Pausado | Organizador finaliza el proyecto | Finalizado |
| Finalizado | - | (Estado terminal, sin transiciones) |

---

## 7. Casos de uso (Gherkin)

> ⚠️ Regla clave:  
> Todo comportamiento del sistema **DEBE** estar expresado aquí.  
> Si no existe un escenario Gherkin, el comportamiento **NO EXISTE**.

---

### 7.1 Caso de uso: Visualización del Dashboard

```gherkin
Feature: Visualización del Dashboard del Organizador
  Como organizador
  Quiero ver una vista ejecutiva consolidada de todos mis proyectos
  Para tomar decisiones estratégicas basadas en métricas agregadas

  Background:
    Given el usuario está autenticado con rol "organizer"
    And el usuario tiene al menos un proyecto asociado

  Scenario: Camino feliz - Visualización inicial del dashboard
    Given el organizador accede al dashboard
    When la página termina de cargar
    Then se muestran los KPIs ejecutivos:
      | KPI                  | Descripción                                    |
      | Comisión generada    | Valor monetario de la comisión del organizador |
      | Pedidos totales      | Cantidad total de pedidos en todos los proyectos |
      | Pedidos completados  | Pedidos entregados exitosamente               |
      | Pedidos en proceso   | Pedidos aún no completados                    |
      | Productos vendidos   | Total de unidades vendidas                    |
    And se muestra el periodo actualmente seleccionado
    And se muestran las gráficas de tendencias
    And se muestra el resumen de proyectos

  Scenario: Dashboard sin proyectos
    Given el organizador no tiene proyectos asociados
    When el organizador accede al dashboard
    Then se muestra un estado vacío indicando que no hay proyectos
    And se muestra la opción de crear un nuevo proyecto

  Scenario: Acceso denegado - Usuario sin rol organizador
    Given el usuario está autenticado con rol "supplier"
    When el usuario intenta acceder al dashboard del organizador
    Then se deniega el acceso
    And se redirige al usuario a su dashboard correspondiente
```

---

### 7.2 Caso de uso: Filtrado por Periodo

```gherkin
Feature: Filtrado de métricas por periodo temporal
  Como organizador
  Quiero filtrar las métricas por diferentes periodos
  Para analizar el desempeño en distintos horizontes temporales

  Background:
    Given el usuario está autenticado con rol "organizer"
    And el usuario está en el dashboard

  Scenario: Cambio de periodo a mensual
    Given el periodo actual es "trimestral"
    When el organizador selecciona el periodo "mensual"
    Then todas las métricas se recalculan para el periodo mensual
    And las gráficas se actualizan mostrando datos mensuales
    And se indica visualmente el periodo activo

  Scenario: Cambio de periodo a trimestral
    Given el periodo actual es "mensual"
    When el organizador selecciona el periodo "trimestral"
    Then todas las métricas se recalculan para el periodo trimestral
    And las gráficas se actualizan mostrando datos trimestrales

  Scenario: Cambio de periodo a semestral
    Given el periodo actual es "mensual"
    When el organizador selecciona el periodo "semestral"
    Then todas las métricas se recalculan para el periodo semestral
    And las gráficas se actualizan mostrando datos semestrales

  Scenario: Periodo por defecto
    Given el organizador accede al dashboard por primera vez
    When la página termina de cargar
    Then el periodo seleccionado por defecto es "mensual"
```

---

### 7.3 Caso de uso: Visualización de Gráficas

```gherkin
Feature: Visualización de gráficas ejecutivas
  Como organizador
  Quiero ver gráficas de tendencias de mi ecosistema
  Para identificar patrones y tomar decisiones informadas

  Background:
    Given el usuario está autenticado con rol "organizer"
    And el usuario está en el dashboard
    And el usuario tiene proyectos con datos históricos

  Scenario: Visualización de evolución de comisión
    Given el organizador está viendo el dashboard
    When observa la gráfica de evolución de comisión
    Then se muestra la comisión generada a lo largo del tiempo
    And la agrupación corresponde al periodo seleccionado (mes/trimestre/semestre)
    And solo se muestra la comisión del organizador, no ventas brutas

  Scenario: Visualización de estado de pedidos
    Given el organizador está viendo el dashboard
    When observa la gráfica de estado de pedidos
    Then se muestra la distribución de pedidos por estado:
      | Estado       |
      | Completados  |
      | En proceso   |
    And la distribución puede ser porcentual o absoluta

  Scenario: Visualización de productos más vendidos
    Given el organizador está viendo el dashboard
    When observa la gráfica de productos más vendidos
    Then se muestra un ranking de productos por unidades vendidas
    And NO se muestran valores monetarios en esta gráfica

  Scenario: Gráficas no interactivas
    Given el organizador está viendo cualquier gráfica
    When el organizador hace clic en un elemento de la gráfica
    Then NO se produce navegación ni drill-down
    And la gráfica permanece en su estado actual
```

---

### 7.4 Caso de uso: Resumen de Proyectos

```gherkin
Feature: Resumen de proyectos del organizador
  Como organizador
  Quiero ver el estado general de todos mis proyectos
  Para identificar rápidamente cuáles están activos y su desempeño

  Background:
    Given el usuario está autenticado con rol "organizer"
    And el usuario está en el dashboard

  Scenario: Visualización del resumen de proyectos
    Given el organizador tiene múltiples proyectos
    When observa la sección de resumen de proyectos
    Then se muestra una lista de todos sus proyectos
    And para cada proyecto se muestra:
      | Campo              | Descripción                          |
      | Nombre             | Nombre del proyecto                  |
      | Estado             | activo, pausado o finalizado         |
      | Pedidos            | Cantidad de pedidos del proyecto     |
      | Unidades vendidas  | Total de unidades vendidas           |
      | Comisión generada  | Comisión del organizador del proyecto |

  Scenario: Navegación a detalle de proyecto
    Given el organizador está viendo el resumen de proyectos
    When el organizador selecciona un proyecto específico
    Then se navega a la vista individual del proyecto
    And esta navegación sale del dashboard actual
```

---

### 7.5 Caso de uso: Búsqueda de Proyectos

```gherkin
Feature: Búsqueda de proyectos en el dashboard
  Como organizador
  Quiero buscar proyectos específicos
  Para encontrar rápidamente la información que necesito

  Background:
    Given el usuario está autenticado con rol "organizer"
    And el usuario está en el dashboard
    And el usuario tiene múltiples proyectos

  Scenario: Búsqueda por nombre de proyecto
    Given el organizador tiene un proyecto llamado "Campaña Navidad 2024"
    When el organizador busca "Navidad"
    Then se filtran los proyectos mostrando solo los que coinciden
    And se muestra "Campaña Navidad 2024" en los resultados

  Scenario: Búsqueda por estado de proyecto
    Given el organizador tiene proyectos en diferentes estados
    When el organizador filtra por estado "activo"
    Then se muestran solo los proyectos con estado activo

  Scenario: Búsqueda sin resultados
    Given el organizador busca un término que no coincide con ningún proyecto
    When se ejecuta la búsqueda
    Then se muestra un mensaje indicando que no hay resultados
    And se sugiere crear un nuevo proyecto o modificar la búsqueda

  Scenario: Búsqueda de productos no permitida
    Given el organizador intenta buscar un producto
    When ingresa el nombre de un producto en el buscador
    Then el buscador solo filtra por proyectos
    And NO se muestran resultados de productos

  Scenario: Búsqueda de pedidos no permitida
    Given el organizador intenta buscar un pedido
    When ingresa un identificador de pedido en el buscador
    Then el buscador solo filtra por proyectos
    And NO se muestran resultados de pedidos

  Scenario: Limpiar búsqueda
    Given el organizador tiene una búsqueda activa
    When el organizador limpia el campo de búsqueda
    Then se muestran todos los proyectos nuevamente
```

---

### 7.6 Caso de uso: Creación de Nuevo Proyecto

```gherkin
Feature: Creación de nuevo proyecto desde el dashboard
  Como organizador
  Quiero crear nuevos proyectos desde el dashboard
  Para expandir mi ecosistema de negocio

  Background:
    Given el usuario está autenticado con rol "organizer"
    And el usuario está en el dashboard

  Scenario: Iniciar creación de proyecto
    Given el organizador quiere crear un nuevo proyecto
    When el organizador hace clic en "Crear nuevo proyecto"
    Then se inicia el flujo de creación de proyecto
    And se navega a la pantalla correspondiente de creación

  Scenario: Acción de crear proyecto siempre visible
    Given el organizador está en el dashboard
    When observa las acciones disponibles
    Then la opción "Crear nuevo proyecto" está visible y accesible
    And es la única acción primaria disponible en el dashboard
```

---

### 7.7 Caso de uso: KPIs Ejecutivos

```gherkin
Feature: Visualización de KPIs ejecutivos
  Como organizador
  Quiero ver métricas clave de mi negocio
  Para entender el desempeño general de mi ecosistema

  Background:
    Given el usuario está autenticado con rol "organizer"
    And el usuario está en el dashboard

  Scenario: Comisión generada muestra solo comisión del organizador
    Given el organizador tiene proyectos con ventas
    When observa el KPI de "Comisión generada"
    Then el valor mostrado es exclusivamente la comisión del organizador
    And NO se muestran ventas brutas ni ingresos totales

  Scenario: Pedidos totales agregados
    Given el organizador tiene múltiples proyectos con pedidos
    When observa el KPI de "Pedidos totales"
    Then se muestra la suma de todos los pedidos de todos los proyectos
    And el valor corresponde al periodo seleccionado

  Scenario: Pedidos completados
    Given el organizador tiene pedidos en diferentes estados
    When observa el KPI de "Pedidos completados"
    Then se muestra la cantidad de pedidos entregados exitosamente
    And el valor corresponde al periodo seleccionado

  Scenario: Pedidos en proceso
    Given el organizador tiene pedidos pendientes de entrega
    When observa el KPI de "Pedidos en proceso"
    Then se muestra la cantidad de pedidos aún no completados
    And el valor corresponde al periodo seleccionado

  Scenario: Productos vendidos sin valor monetario
    Given el organizador tiene ventas de productos
    When observa el KPI de "Productos vendidos"
    Then se muestra el total de unidades vendidas
    And NO se muestra ningún valor monetario asociado

  Scenario: KPIs no interactivos
    Given el organizador está viendo los KPIs
    When hace clic en cualquier KPI
    Then NO se produce navegación ni acción
    And los KPIs son puramente informativos
```

---

### 7.8 Caso de uso: Menú Principal de Navegación

```gherkin
Feature: Menú principal de navegación del Organizador
  Como organizador
  Quiero ver un menú de navegación adaptado a mi rol
  Para acceder rápidamente a las secciones relevantes de la plataforma

  Background:
    Given el usuario está autenticado con rol "organizer"

  Scenario: Visualización del menú principal del organizador
    Given el organizador accede a cualquier pantalla de la plataforma
    When se muestra el menú principal de navegación
    Then el menú contiene los siguientes ítems:
      | Ítem          | Destino            |
      | Dashboard     | /dashboard         |
      | Pagos         | /dashboard/payments|
      | Configuración | /settings/billing  |
    And NO aparece un ítem "Proyectos" en el menú principal

  Scenario: Acceso a proyectos desde el Dashboard
    Given el organizador está en el Dashboard
    When quiere acceder a un proyecto específico
    Then debe navegar a través de la sección de resumen de proyectos del Dashboard
    And seleccionar el proyecto deseado para ver su detalle

  Scenario: Menú NO incluye Proyectos como ítem directo
    Given el organizador está viendo el menú principal
    When observa las opciones disponibles
    Then NO existe un ítem de menú llamado "Proyectos"
    And el acceso a proyectos se realiza únicamente desde el Dashboard

  Scenario: Ruta por defecto del organizador
    Given el organizador inicia sesión en la plataforma
    When el login es exitoso
    Then es redirigido al Dashboard como pantalla de aterrizaje
    And el Dashboard es la ruta por defecto para el rol organizador
```

---

## 8. Contratos funcionales (conceptuales)

> Describe QUÉ entra y QUÉ sale, sin definir formato técnico.

### 8.1 Entradas

**Para visualización del dashboard:**
- Sesión válida de usuario con rol `organizer`
- Periodo seleccionado (mensual, trimestral, semestral)

**Para búsqueda de proyectos:**
- Texto de búsqueda (nombre de proyecto)
- Filtro de estado (activo, pausado, finalizado)

**Para creación de proyecto:**
- Acción de usuario (clic en crear)

### 8.2 Salidas

**Dashboard cargado:**
- KPIs ejecutivos con valores numéricos
- Lista de proyectos con métricas resumidas
- Datos para gráficas de tendencias
- Periodo activo indicado

**Búsqueda ejecutada:**
- Lista filtrada de proyectos que coinciden
- Mensaje si no hay resultados

**Creación iniciada:**
- Navegación al flujo de creación de proyecto

### 8.3 Errores de negocio

| Código lógico | Condición |
|---------------|-----------|
| ACCESO_DENEGADO | Usuario sin rol `organizer` intenta acceder |
| SIN_PROYECTOS | Organizador no tiene proyectos asociados |
| BUSQUEDA_SIN_RESULTADOS | Búsqueda no encuentra proyectos coincidentes |
| PERIODO_INVALIDO | Se solicita un periodo no soportado |

---

## 9. Invariantes del sistema

> Condiciones que SIEMPRE deben cumplirse.

- Los valores monetarios mostrados SIEMPRE corresponden a la comisión del organizador, NUNCA a ventas brutas.
- El dashboard SIEMPRE muestra datos agregados de TODOS los proyectos del organizador.
- Solo usuarios con rol `organizer` pueden acceder al dashboard.
- Las métricas SIEMPRE corresponden al periodo seleccionado.
- La búsqueda SOLO filtra por proyectos, nunca por productos, pedidos o compradores.
- Las gráficas NUNCA permiten drill-down o navegación interactiva.
- El menú principal del Organizador NUNCA incluye un ítem directo "Proyectos"; el acceso es siempre vía Dashboard.

---

## 10. Casos límite y excepciones

- **Organizador sin proyectos:** Mostrar estado vacío con opción de crear proyecto.
- **Organizador con un solo proyecto:** Las métricas agregadas corresponden a ese único proyecto.
- **Proyecto sin pedidos:** Mostrar valores en cero para métricas de pedidos.
- **Proyecto sin ventas:** Mostrar comisión en cero.
- **Periodo sin datos:** Mostrar gráficas vacías o mensaje indicativo.
- **Búsqueda con caracteres especiales:** Manejar sin error, buscar literalmente.
- **Todos los proyectos finalizados:** Mostrar datos históricos del periodo seleccionado.

---

## 11. Seguridad y permisos

| Actor | Acción permitida | Acción prohibida |
|-------|------------------|------------------|
| Organizador (`organizer`) | Ver dashboard propio, ver métricas propias, buscar proyectos propios, crear proyectos | Ver datos de otros organizadores, modificar proyectos desde dashboard, gestionar pedidos/productos/compradores |
| Proveedor (`supplier`) | - | Acceder al dashboard del organizador |
| Comprador (`buyer`) | - | Acceder al dashboard del organizador |
| Usuario no autenticado | - | Acceder al dashboard |

---

## 12. No-objetivos explícitos

> Para evitar suposiciones de la AI.

- NO implementar gestión de pedidos desde el dashboard
- NO implementar gestión de productos desde el dashboard
- NO implementar gestión de compradores desde el dashboard
- NO implementar reportes descargables
- NO implementar drill-down en gráficas
- NO implementar análisis diario
- NO implementar edición de proyectos existentes
- NO mostrar ventas brutas o ingresos totales
- NO implementar dashboard individual por proyecto (está fuera de este módulo)
- NO implementar filtros por proyecto individual dentro del dashboard
- NO implementar stock, inventarios o disponibilidad
- NO implementar flujos de devoluciones, cambios o incidencias
- NO agregar ítem "Proyectos" en el menú principal del Organizador (el acceso es vía Dashboard)

---

## 13. Versionado

- Versión: v1.1
- Fecha: 2025-01-29
- Cambios: Se agrega especificación del menú principal de navegación del Organizador (RN-11, RN-12, caso de uso 7.8). Se explicita que el menú NO incluye ítem "Proyectos".

### Historial
- v1.0 (2024-12-15): Versión inicial del spec

---

## 14. Checklist de validación (AI + Humano)

Antes de aprobar este spec:
- [x] Todos los comportamientos están en Gherkin
- [x] No hay decisiones técnicas
- [x] Las reglas de negocio están numeradas
- [x] No hay ambigüedades
- [x] El alcance está claro

---

## 15. Nota final para AI Agents

- ❌ No inferir comportamiento no especificado
- ❌ No modificar este archivo durante la implementación
- ✅ Usar este spec como base para `plan.md`, tests y validaciones
- ✅ Preguntar si algo no está explícitamente definido

