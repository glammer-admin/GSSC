# Definición funcional – Gestión de Proyecto (Organizer)

## 1. Objetivo
Definir el comportamiento funcional de la vista de **gestión de proyecto** para el **organizer**, accesible mediante una URL pública del proyecto. Esta vista permite al organizer monitorear el rendimiento del proyecto, administrar productos y modificar la configuración del proyecto, reutilizando componentes y pantallas existentes cuando aplique.

---

## 2. Alcance
- Aplica **exclusivamente** a proyectos gestionados por un usuario con rol **organizer**.
- No cubre flujos de compra, checkout ni experiencia de buyer.
- En esta versión:
  - Los datos existentes en el modelo se muestran como **datos reales**.
  - Los datos no soportados aún por el modelo se representan como **mock / placeholder (rock)** sin lógica funcional.

---

## 3. Acceso y routing

### 3.1 URL
```
/project/{project_public_code}
```

- `project_public_code` corresponde a `glam_projects.public_code`.
- Es el identificador público y único del proyecto.

### 3.2 Validaciones
- Si el `project_public_code` **no existe** o no es accesible:
  - Redirigir a la **pantalla genérica de error 404 existente**.
  - No crear una pantalla nueva.

- El acceso está restringido al **organizer propietario del proyecto**.

---

## 4. Estructura general de la pantalla

La pantalla se compone de:

1. **Header del proyecto**
2. **Menú de navegación interna**
3. **Vista de contenido principal**

### 4.1 Header del proyecto
Debe mostrar:
- Nombre del proyecto
- Estado del proyecto (draft, active, paused, etc.)
- Código público del proyecto (solo lectura)

---

## 5. Menú de navegación

El menú debe reutilizar la **estructura visual y de interacción** del menú existente en:
```
/settings/billing
```

### Consideraciones clave
- La navegación es **Server Side Render (SSR)**.
- El `project_public_code` debe **transportarse siempre** entre secciones.
- No se permite navegación client-side que pierda el contexto del proyecto.

### Ítems del menú y rutas

1. **Home (Dashboard)**
```
/project/{project_public_code}
```

2. **Productos**
```
/project/{project_public_code}/product/
```

3. **Configuración**
```
/project/{project_public_code}/edit
```

> Todas las rutas deben resolverse vía SSR y validar existencia y permisos del proyecto antes de renderizar.

---

## 6. Dashboard del proyecto

### 6.1 Objetivo
Mostrar al organizer una vista consolidada del rendimiento del proyecto.

### 6.2 Métricas con datos reales
Estas métricas se calculan a partir del modelo existente:

- Total de ventas
- Total de órdenes pagadas
- Unidades vendidas
- Comisión del organizer
- Neto para el organizer

**Fuentes de datos:**
- `sales`
- `sale_items`
- `sale_breakdowns`

### 6.3 Métricas placeholder (rock)
Se muestran solo a nivel visual, sin lógica:
- Satisfacción del cliente
- NPS
- Ratings
- Tendencias avanzadas

Estas métricas deben:
- Estar claramente diferenciadas como visuales
- No generar acciones ni cálculos reales

---

## 7. Gestión de productos

### 7.1 Objetivo
Permitir al organizer visualizar y administrar los productos asociados al proyecto.

### 7.2 Funcionalidades
- Listado de productos del proyecto
- Visualización de:
  - Nombre
  - Categoría
  - Estado
  - Precio

### 7.3 Acciones permitidas
- Activar / desactivar productos
- Editar información del producto

> La creación de nuevos productos puede estar disponible o no según la configuración actual del sistema.

---

## 8. Configuración del proyecto

### 8.1 Objetivo
Permitir la edición de la configuración del proyecto reutilizando la pantalla de creación existente.

### 8.2 Comportamiento
- Se reutiliza la **misma UI** de creación de proyecto.
- Los campos se cargan con los valores actuales del proyecto.

### 8.3 Restricciones
- El nombre del proyecto es **solo lectura**.
- Los cambios deben quedar registrados en:
  - `glam_project_config_changes`

---

## 9. Notificaciones

### 9.1 Estado actual
- Funcionalidad **no implementada**.
- Se muestra como placeholder visual.
- Pantalla vacía con mensaje tipo:
  > "Próximamente"

---

## 10. Permisos

- Solo el **organizer propietario** puede:
  - Acceder al dashboard
  - Ver métricas financieras
  - Gestionar productos
  - Modificar la configuración

- Otros roles no tienen acceso a esta vista.

---

## 11. Consideraciones generales

- Reutilizar componentes existentes siempre que sea posible.
- No introducir lógica simulada para métricas que no existen en el modelo.
- Mantener consistencia visual y de navegación con el resto del sistema.

---

**Estado del documento:** Versión inicial – basada en modelo de datos actual

