# Creación de Productos en Glam Urban
## Descripción funcional

---

## 1. Concepto base

En Glam Urban, un producto es una **oferta publicada dentro de un proyecto**, diseñada para ser vendida en una tienda virtual y, según su categoría, permitir distintos niveles de personalización.

Un producto:
- Se crea una sola vez
- Puede cambiar de estado (borrador, activo, inactivo)
- **No puede eliminarse**
- **No puede modificar su configuración estructural una vez creado**

Este enfoque prioriza:
- Trazabilidad
- Estabilidad operativa
- Claridad para organizadores y compradores
- Simplicidad en el modelo mental del sistema

---

## 2. Principios generales

- Las **categorías de producto** son **datos maestros gestionados por la plataforma**.
- Solo **Glam Urban** puede crear, modificar o desactivar categorías.
- Los organizadores **no pueden** crear ni modificar categorías.
- Cada categoría tiene una **configuración fija** que define:
  - Qué módulos de personalización pueden usarse
  - Qué modos de representación visual están permitidos
- No se crean roles nuevos dentro del GSSC.
- La lógica del producto se gobierna por **categorías y reglas de plataforma**, no por permisos especiales.
- La personalización es **modular, controlada e inmutable por producto**.
- La plataforma mantiene el control estratégico de las capacidades disponibles.

- No se crean roles nuevos dentro del GSSC.
- La lógica del producto se gobierna por **categorías y reglas de plataforma**, no por permisos especiales.
- La personalización es **modular y controlada**.
- La plataforma mantiene el control estratégico de las capacidades disponibles.

---

## 3. Flujo funcional de creación de un producto

### Paso 1 – Selección de categoría

El organizador inicia la creación del producto seleccionando una **categoría** (por ejemplo: uniforme deportivo, camiseta, gorra, hoodie, souvenir).

La categoría:
- Define qué tipos de personalización son posibles
- Define qué modos de representación visual están disponibles
- No define precios ni diseños finales

Este paso establece el marco de posibilidades del producto.

---

### Paso 2 – Definición del producto base

El organizador define la información general del producto:
- Nombre
- Descripción comercial
- Precio base
- Estado inicial (borrador)

En este punto el producto aún no es visible para el comprador final.

---

## 4. Configuración de personalización (según categoría)

### Catálogo de módulos de personalización

Los módulos de personalización son un **catálogo cerrado definido por la plataforma**.

Ejemplos de módulos:
- Tallas
- Número
- Nombre personalizado
- Categoría de edad

Los organizadores **no pueden crear módulos nuevos**.

Cada categoría **declara qué módulos del catálogo están permitidos** para los productos de ese tipo.

---

### Configuración del organizador por módulo

Para cada producto, el organizador define la configuración de los módulos permitidos por la categoría.

La configuración por módulo puede incluir:
- Si el módulo está habilitado o no
- Si es obligatorio u opcional
- Valores permitidos
- Restricciones básicas (rangos, repeticiones, longitudes)

Esta configuración:
- Se almacena como parte de la definición del producto
- Es **inmutable una vez el producto es creado**

---

Una vez definida la categoría, la plataforma presenta los **módulos de personalización habilitados** para dicha categoría.

### Principio clave

> La categoría habilita módulos, el organizador decide cuáles activar.

Los módulos representan decisiones que el comprador final podrá o no tomar.

Ejemplos de módulos:
- Tallas
- Número
- Nombre personalizado
- Categoría de edad

Cada módulo puede configurarse con reglas simples:
- Habilitado / deshabilitado
- Obligatorio / opcional
- Valores permitidos
- Restricciones básicas (rangos, repeticiones, longitudes)

---

### Ejemplo: Uniformes deportivos

La categoría “uniforme deportivo” habilita los siguientes módulos del catálogo:
- Tallas
- Número
- Nombre del jugador
- Categorías de edad

El organizador configura por producto:
- Si el número es obligatorio u opcional
- El rango de números permitido
- La política de repetición de números (global o por categoría de edad)
- Si el nombre del jugador está habilitado

Las **categorías de edad**:
- Son un catálogo cerrado definido por la plataforma
- El organizador selecciona cuáles aplicar en cada producto
- Pueden afectar reglas de numeración (por ejemplo, permitir números repetidos entre categorías)

---

La categoría “uniforme deportivo” puede habilitar:
- Tallas
- Número
- Nombre del jugador
- Categorías de edad

El organizador decide:
- Si el número es obligatorio
- El rango de números permitido
- Si los números pueden repetirse (globalmente o por categoría de edad)
- Si el nombre del jugador está habilitado

---

### Ejemplo: Gorras

La categoría “gorra” habilita únicamente personalización por talla (si aplica).

No se habilitan módulos de nombre ni número.

---

### Ejemplo: Souvenirs

La categoría “souvenir” no habilita personalización individual.

El producto se vende tal como fue definido.

---

## 5. Inmutabilidad de la configuración

Una vez el producto es creado:

- La configuración de personalización **no puede modificarse**
- No se pueden agregar ni eliminar módulos
- No se pueden cambiar reglas de personalización

Si el organizador requiere un cambio:
1. Debe crear un nuevo producto
2. Configurarlo correctamente
3. Desactivar el producto anterior

Este comportamiento evita inconsistencias, errores en pedidos y complejidad técnica.

---

## 6. Modos de representación visual (imágenes del producto)

Las imágenes del producto son los **activos finales que se muestran al comprador en la tienda virtual**.

Independientemente del modo de generación, todas las imágenes:
- Se almacenan en el **mismo sistema de storage** de la plataforma
- Comparten el mismo modelo lógico

Cada imagen puede incluir metadatos como:
- Orden de visualización
- Indicador de imagen principal
- Origen (subida manual, editor online, designer assisted)

Las imágenes generadas por el Online Editor se almacenan **exactamente igual** que las subidas manualmente.

---

Los productos se publican en una tienda virtual, por lo que **toda oferta debe contar con imágenes visibles para el comprador final**.

La representación visual es el paso donde se generan las imágenes finales del producto.

---

### Modos disponibles

Existen tres modos posibles de generación de imágenes:

1. **Upload Images**: el organizador carga manualmente las imágenes del producto.
2. **Online Editor**: el producto se diseña mediante un editor online.
3. **Designer Assisted**: el diseño es realizado por el equipo de Glam Urban bajo un flujo operativo y comercial separado.

La disponibilidad de estos modos:
- Está definida por la categoría
- Es controlada por la plataforma
- Puede activarse o desactivarse para nuevos productos

---

### Reglas obligatorias de imágenes

Regla universal:

> Todo producto activo debe tener **mínimo 3 imágenes finales**.

Esta regla aplica a todos los modos:
- Upload Images → mínimo 3 imágenes cargadas
- Online Editor → el editor debe generar al menos 3 imágenes
- Designer Assisted → el proceso debe entregar al menos 3 imágenes

El sistema debe impedir:
- Activar un producto sin cumplir este mínimo
- Eliminar imágenes si el producto queda con menos de 3

---

Regla universal:

> Todo producto activo debe tener **mínimo 3 imágenes finales**.

Esta regla aplica a todos los modos:
- Upload Images → mínimo 3 imágenes cargadas
- Online Editor → el editor debe generar al menos 3 imágenes
- Designer Assisted → el proceso debe entregar al menos 3 imágenes

---

### Gestión de imágenes

- Las imágenes pueden agregarse y eliminarse
- El sistema debe impedir que un producto quede con menos de 3 imágenes
- No es posible activar un producto sin cumplir este mínimo

Estas reglas garantizan una experiencia visual consistente en la tienda.

---

### Ejemplos de control por categoría

- **Souvenirs**
  - Upload Images: permitido
  - Designer Assisted: permitido
  - Online Editor: no permitido

- **Gorras**
  - Upload Images: no permitido
  - Designer Assisted: permitido
  - Online Editor: no permitido

- **Uniformes / Camisetas**
  - Upload Images: permitido
  - Online Editor: permitido
  - Designer Assisted: permitido

---

## 7. Estados del producto

Un producto puede cambiar de estado durante su ciclo de vida:

- **Borrador**: no visible para compradores
- **Activo**: visible y disponible para la venta
- **Inactivo / Archivado**: no visible para nuevos compradores

Reglas:
- Los productos pertenecen a **un único proyecto**
- Un producto **no puede existir sin proyecto**
- Los productos no se eliminan
- El cambio de estado no afecta pedidos existentes

---

Un producto puede cambiar de estado durante su ciclo de vida:

- **Borrador**: no visible para compradores
- **Activo**: visible y disponible para la venta
- **Inactivo / Archivado**: no visible para nuevos compradores

Reglas:
- Los productos no se eliminan
- El cambio de estado no afecta pedidos existentes

---

## 8. Responsabilidades claras (sin nuevos roles)

| Actor | Responsabilidad |
|------|-----------------|
| Plataforma (Glam Urban) | Define categorías, capacidades y reglas globales |
| Organizador | Crea productos y configura opciones permitidas |
| Comprador final | Personaliza dentro de las reglas definidas |

No se introducen roles adicionales en el GSSC.

---

## 9. Precios y personalización

- Cada producto tiene un **precio base único**.
- En el MVP, el precio **no varía por talla u opción**.
- La personalización **no genera recargos adicionales** en el MVP.

Este modelo simplifica:
- La experiencia del comprador
- La lógica de pedidos
- La operación inicial

---

## 10. Flujo Designer Assisted

El modo **Designer Assisted** representa un flujo operativo especial:
- No es un estado del producto
- No bloquea la creación ni publicación del producto

Cuando se selecciona este modo:
- Se genera una **solicitud de diseño asociada al producto**
- El producto permanece en borrador o pendiente de activación
- El equipo de Glam Urban coordina diseño, tiempos y condiciones comerciales por fuera del flujo estándar

Este flujo puede modelarse como una entidad separada para gestión interna, sin impactar la experiencia del comprador.

---

## 11. Beneficio estratégico

Este modelo permite que Glam Urban sea una plataforma de personalización escalable, donde:
- La complejidad es controlada
- La experiencia del comprador es consistente
- El organizador maximiza su valor comercial
- La plataforma mantiene control estratégico y evolutivo

Este documento sirve como base directa para specs funcionales, user stories y diseño de experiencia.

