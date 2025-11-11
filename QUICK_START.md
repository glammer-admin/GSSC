# 🚀 Guía de Inicio Rápido

## Sistema de Navegación por Roles - GSSC

Esta guía te ayudará a entender y usar el sistema de navegación basado en roles implementado en la plataforma GSSC.

---

## 📋 ¿Qué se implementó?

✅ **Barra de navegación colapsable** (solo desktop)  
✅ **3 roles de usuario**: Organizador, Proveedor, Pagador  
✅ **Menús específicos por rol** controlados desde JSON/Config  
✅ **Protección de rutas** basada en permisos  
✅ **Sistema de autenticación simulado** con SSO  

---

## 🎯 Cómo Funciona

### 1. Login con Simulación de SSO

Cada proveedor de autenticación asigna un rol automáticamente:

| Proveedor | Rol | Ruta por defecto |
|-----------|-----|------------------|
| 🔵 Google | Organizador | `/dashboard` |
| 🟦 Microsoft | Proveedor | `/customer-dash` |
| 🔷 Meta | Pagador | `/product/1234asdf` |

### 2. Menús por Rol

**👔 Proveedor** (4 menús)
- Dashboard
- Proyectos  
- Clientes
- Calendario

**📊 Organizador** (4 menús)
- Dashboard
- Proyectos
- Pagos
- Configuración

**💳 Pagador** (1 menú)
- Historial

---

## 🛠️ Archivos Importantes

```
├── lib/menu-config.ts          ← Configuración de menús (MODIFICAR AQUÍ)
├── components/navbar.tsx       ← Barra de navegación
├── components/authenticated-layout.tsx  ← Layout con protección
├── config/menu-roles.json      ← Ejemplo de configuración JSON
```

---

## 🎨 Características de la Navbar

### Modo Expandido (256px)
```
┌─────────────────────┐
│ [Logo] GSSC    [×]  │ ← Header con toggle
├─────────────────────┤
│ 🏠 Dashboard        │ ← Menús con iconos y texto
│ 📄 Proyectos        │
│ 👥 Clientes         │
│ 📅 Calendario       │
│                     │
│ (espacio flexible)  │
│                     │
├─────────────────────┤
│ [👤] Nombre         │ ← Avatar + Info
│      Rol            │
│ [Cerrar sesión]     │ ← Logout
└─────────────────────┘
```

### Modo Colapsado (80px)
```
┌──────┐
│ [☰] │ ← Toggle
├──────┤
│  🏠  │ ← Solo iconos con tooltips
│  📄  │
│  👥  │
│  📅  │
│      │
├──────┤
│ [👤] │ ← Avatar
│ [→]  │ ← Logout icon
└──────┘
```

---

## 🔧 Modificar Menús

### Agregar un menú a un rol existente

1. Abre `lib/menu-config.ts`
2. Importa el icono necesario:
   ```typescript
   import { NuevoIcono } from "lucide-react"
   ```
3. Agrega el menú al rol:
   ```typescript
   Proveedor: [
     // ... menús existentes
     {
       id: "nuevo-menu",
       icon: NuevoIcono,
       label: "Nuevo Menú",
       href: "/customer-dash/nuevo",
       roles: ["Proveedor"],
     },
   ]
   ```
4. Crea la página correspondiente en `app/`

### Cambiar menús existentes

Edita directamente el objeto `menuConfig` en `lib/menu-config.ts`

---

## 🔐 Protección de Rutas

El sistema automáticamente:
- ✅ Verifica si el usuario tiene acceso a la ruta actual
- ✅ Redirige a la ruta por defecto si no tiene acceso
- ✅ Muestra solo los menús permitidos para el rol

**Ejemplo:**
Si un Proveedor intenta acceder a `/dashboard/payments`:
1. `RouteGuard` detecta que no tiene acceso
2. Lo redirige automáticamente a `/customer-dash`

---

## 🧪 Cómo Probar

### Opción 1: Desarrollo Local
```bash
# Iniciar el servidor
npm run dev

# Abrir en el navegador
http://localhost:3000
```

### Opción 2: Probar cada rol

1. **Probar como Organizador:**
   - Click en "Continuar con Google"
   - Verificar que aparezcan 4 menús
   - Intentar navegar entre páginas

2. **Probar como Proveedor:**
   - Hacer logout
   - Click en "Continuar con Microsoft"
   - Verificar que aparezcan 4 menús diferentes

3. **Probar como Pagador:**
   - Hacer logout
   - Click en "Continuar con Meta"
   - Verificar que aparezca 1 solo menú

---

## 📱 Versión Móvil

Actualmente, la navbar está configurada solo para **desktop** (`hidden md:flex`).

Para móvil, el contenido se muestra sin navbar lateral.

📝 **Próximo paso**: Implementar drawer/sidebar para móvil (ver `EXAMPLES.md` ejemplo #10)

---

## 🐛 Solución de Problemas

### El menú no aparece
```bash
# Verificar en consola del navegador
localStorage.getItem('user')
# Debe retornar un objeto con role: "Organizador" | "Proveedor" | "Pagador"
```

### Redirige automáticamente
Esto es normal si intentas acceder a una ruta no permitida. El sistema te redirige a tu dashboard por defecto.

### Navbar no colapsa/expande
Verifica que:
- Estás en vista desktop (> 768px)
- No hay errores en la consola
- El botón X/☰ es clickeable

---

## 📚 Documentación Adicional

- **`MENU_SYSTEM.md`** - Documentación completa del sistema
- **`EXAMPLES.md`** - 10 ejemplos prácticos de uso
- **`IMPLEMENTATION_SUMMARY.md`** - Resumen técnico de la implementación
- **`config/menu-roles.json`** - Ejemplo de configuración en JSON

---

## 🎓 Conceptos Clave

### Menu Config
Archivo central que define todos los menús y sus permisos.

### Authenticated Layout  
Wrapper que verifica autenticación y aplica la navbar.

### Route Guard
Componente que protege rutas según el rol del usuario.

### Role-Based Access
Sistema que controla qué puede ver y hacer cada rol.

---

## 💡 Tips Rápidos

1. **¿Cómo cambiar el rol de un usuario?**
   ```javascript
   // En consola del navegador
   let user = JSON.parse(localStorage.getItem('user'))
   user.role = 'Organizador' // o 'Proveedor' o 'Pagador'
   localStorage.setItem('user', JSON.stringify(user))
   location.reload()
   ```

2. **¿Cómo agregar un icono nuevo?**
   ```typescript
   import { MiIcono } from "lucide-react"
   // Ver todos los iconos en: https://lucide.dev/icons
   ```

3. **¿Cómo cambiar el ancho de la navbar?**
   ```typescript
   // components/navbar.tsx línea 42-44
   className={`... ${isExpanded ? "w-64" : "w-20"}`}
   //                              ^^^^       ^^^^
   //                           Cambiar estos valores
   ```

---

## ✨ Próximas Funcionalidades Sugeridas

- [ ] Navbar responsive para móvil
- [ ] Notificaciones en los menús (badges)
- [ ] Búsqueda global
- [ ] Tema oscuro/claro
- [ ] Multi-idioma
- [ ] Breadcrumbs
- [ ] Indicador de ruta activa
- [ ] Animaciones mejoradas

---

## 🆘 ¿Necesitas Ayuda?

1. **Lee la documentación**: Revisa los archivos `.md` en la raíz del proyecto
2. **Revisa los ejemplos**: `EXAMPLES.md` tiene 10 casos de uso comunes
3. **Verifica la consola**: Los errores suelen dar pistas claras
4. **Revisa el código**: Está bien comentado y estructurado

---

**¡Listo para empezar! 🎉**

Simplemente haz `npm run dev` y comienza a explorar el sistema.

