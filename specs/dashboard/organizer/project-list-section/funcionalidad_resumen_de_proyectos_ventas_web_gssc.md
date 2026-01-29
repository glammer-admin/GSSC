# Funcionalidad – Resumen de Proyectos (Ventas Web GSSC)

## 1. Objetivo

Mostrar al **organizador** un resumen consolidado de ventas **por proyecto**, basado únicamente en **ventas web confirmadas realizadas en la plataforma GSSC**, con el fin de soportar:

- Seguimiento comercial
- Reportes financieros
- Consulta rápida de desempeño por proyecto

Esta vista es **informativa y financiera**, no operativa.

---

## 2. Alcance

### Incluye
- Solo ventas **web GSSC**
- Solo ventas con estado **pagado / confirmado**
- Agregación de datos **por proyecto**
- Datos históricos e inmutables

### No incluye
- Checkout
- Carrito de compras
- Pagos
- Devoluciones o reembolsos

---

## 3. Fuente de datos

Los datos se obtienen exclusivamente del **módulo de ventas**, usando información histórica:

- `sales`
- `sale_items`
- `sale_breakdowns`
- `glam_projects`

⚠️ No se deben usar precios actuales de productos ni configuraciones vivas del proyecto.

---

## 4. Estructura de la tabla

La tabla muestra **una fila por proyecto**.

| Columna | Descripción |
|-------|------------|
| Proyecto | Nombre del proyecto |
| Estado | Estado actual del proyecto |
| Pedidos | Total de ventas confirmadas |
| Unidades | Total de unidades vendidas |
| Comisión | Comisión acumulada del organizador |

---

## 5. Definición funcional de columnas

### 5.1 Proyecto

**Descripción**  
Nombre comercial del proyecto.

**Origen**  
`glam_projects.name`

---

### 5.2 Estado

**Descripción**  
Estado actual del proyecto (informativo).

**Origen**  
`glam_projects.status`

**Valores esperados**  
- Activo
- Pausado
- Finalizado

---

### 5.3 Pedidos

**Descripción**  
Cantidad total de **ventas web confirmadas** asociadas al proyecto.

**Definición exacta**  
- Conteo de registros en `sales`

**Condiciones**  
- `sales.project_id = glam_projects.id`
- `sales.sale_status = 'paid'`

**Nota**  
Una venta equivale a **un pedido**, sin importar la cantidad de productos.

---

### 5.4 Unidades

**Descripción**  
Cantidad total de **unidades físicas vendidas** para el proyecto.

**Definición exacta**  
- Suma de `sale_items.quantity`

**Condiciones**  
- `sale_items.sale_id` pertenece a ventas `paid`

---

### 5.5 Comisión

**Descripción**  
Valor total de comisión generada para el organizador.

**Definición exacta**  
- Suma de `sale_breakdowns.organizer_commission_amount`

**Condiciones**  
- Solo ventas `paid`
- No se recalcula

**Formato**  
- Moneda del sistema (ej. COP)
- Formato monetario

---

## 6. Comportamiento de interacción

### Navegación por fila

Al hacer clic sobre una fila completa:

```
/project/{project_public_code}
```

Ejemplo:
```
/project/proj-001
```

---

## 7. Reglas de consistencia

- Los valores mostrados **no se recalculan dinámicamente**
- Se utilizan únicamente datos históricos
- Las métricas deben coincidir con reportes financieros

---

## 8. Casos borde

### Proyecto sin ventas

- Pedidos = 0
- Unidades = 0
- Comisión = $0
- El proyecto **sí se muestra**

---

### Proyecto finalizado

- Se muestra con métricas históricas
- No se filtra ni se oculta

---

## 9. Performance

- La consulta debe ser **agregada por proyecto**
- No se deben cargar ventas individuales
- Pensado para dashboards con múltiples proyectos

---

## 10. Evolución futura (fuera de alcance)

- Filtros por rango de fechas
- Comparativos entre proyectos
- Inclusión de devoluciones
- Indicadores visuales de tendencia

---

**Este documento debe usarse como contrato funcional para la implementación backend y frontend de la vista “Mis proyectos”.**

