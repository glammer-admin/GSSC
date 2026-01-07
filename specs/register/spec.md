# Especificación: Sistema de Registro y Validación de Usuarios

## Resumen
Implementar un sistema de registro y validación de usuarios que, después de un login SSO exitoso, verifique si el usuario existe en la base de datos, permita la selección de rol si tiene múltiples roles, o lo dirija a un formulario de onboarding si es nuevo.

---

## Alcance

### Incluido
- Validación de usuarios existentes después del login SSO
- Creación de nuevos usuarios en la base de datos
- Pantalla de selección de rol para usuarios con múltiples roles
- Formulario de onboarding para nuevos usuarios
- Cliente HTTP genérico y abstracción de usuarios
- Integración con el flujo de autenticación existente

### Excluido
- Cambio de rol sin re-login (caso de uso futuro)
- Edición de perfil de usuario
- Gestión de roles por administradores
- Integración directa con SDK de Supabase
- Sistema de códigos de error (ver `specs/errors/`)
- **Configuración de facturación y pagos del Organizer** (ver `specs/settings/provider/billing/spec.md`) - Se realiza post-onboarding en `/settings/billing`

---

## Modelo de Datos

### Tabla: `glam_users`
Base de datos externa accesible vía REST API.

**Esquema:**
```json
{
  "id": "uuid (generado por la BD)",
  "name": "string (required)",
  "email": "string (required, unique)",
  "role": "string[] (required)",
  "phone_number": "string (required)",
  "status": "string (default: 'Active')",
  "delivery_address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "additional_info": "string"
  },
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Roles Permitidos:**
- `buyer` (Comprador) - Rol por defecto para nuevos usuarios
- `organizer` (Organizador) - Disponible en onboarding
- `supplier` (Proveedor) - Solo asignado internamente, no disponible en registro

---

## API REST - Endpoints Externos

### 1. Consultar Usuario por Email
```bash
GET {BACKEND_API_URL}/glam_users?email=eq.{email}
Headers:
  - apikey: {BACKEND_API_KEY}
  - Authorization: Bearer {BACKEND_API_KEY}
  - Accept-Profile: {BACKEND_DB_SCHEMA}

Response: 200 OK
[
  {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "role": ["buyer", "organizer"],
    "phone_number": "string",
    "status": "Active",
    "delivery_address": { ... }
  }
]

Response: 200 OK (usuario no existe)
[]
```

### 2. Crear Usuario
```bash
POST {BACKEND_API_URL}/glam_users
Headers:
  - apikey: {BACKEND_API_KEY}
  - Authorization: Bearer {BACKEND_API_KEY}
  - Content-Profile: {BACKEND_DB_SCHEMA}
  - Content-Type: application/json
  - Prefer: return=representation

Body:
{
  "name": "string",
  "email": "string",
  "role": ["buyer"],
  "phone_number": "string",
  "status": "Active",
  "delivery_address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "additional_info": "string"
  }
}

Response: 201 Created
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  ...
}
```

---

## Escenarios de Usuario (Gherkin)

### Feature: Validación y Registro de Usuarios Post-SSO

```gherkin
Feature: Validación y Registro de Usuarios Post-SSO
  Como usuario del sistema GSSC
  Quiero que mi cuenta sea validada después del login SSO
  Para poder acceder a la plataforma según mi rol asignado

  Background:
    Given el sistema de autenticación SSO está configurado
    And la base de datos externa está disponible
    And las variables de entorno están configuradas correctamente

  # ============================================================
  # Escenario 1: Usuario Existente con Un Solo Rol
  # ============================================================
  
  Scenario: Usuario existente con un solo rol accede directamente a su dashboard
    Given un usuario con email "juan.perez@example.com" existe en la base de datos
    And el usuario tiene el rol "buyer"
    When el usuario completa el login SSO exitosamente
    Then el BFF recibe el idToken validado
    And el BFF consulta la base de datos con el email "juan.perez@example.com"
    And la base de datos retorna el usuario con role ["buyer"]
    And el BFF crea una sesión JWT con role "buyer"
    And el usuario es redirigido a "/product/[id]"
    And no se muestra ninguna pantalla intermedia

  Scenario: Usuario existente con rol de organizador accede a su dashboard
    Given un usuario con email "maria.garcia@example.com" existe en la base de datos
    And el usuario tiene el rol "organizer"
    When el usuario completa el login SSO exitosamente
    Then el BFF crea una sesión JWT con role "organizer"
    And el usuario es redirigido a "/dashboard"

  Scenario: Usuario existente con rol de proveedor accede a su dashboard
    Given un usuario con email "pedro.lopez@example.com" existe en la base de datos
    And el usuario tiene el rol "supplier"
    When el usuario completa el login SSO exitosamente
    Then el BFF crea una sesión JWT con role "supplier"
    And el usuario es redirigido a "/customer-dash"

  # ============================================================
  # Escenario 2: Usuario Existente con Múltiples Roles
  # ============================================================
  
  Scenario: Usuario con múltiples roles ve pantalla de selección
    Given un usuario con email "ana.martinez@example.com" existe en la base de datos
    And el usuario tiene los roles ["buyer", "organizer"]
    When el usuario completa el login SSO exitosamente
    Then el BFF recibe el idToken validado
    And el BFF consulta la base de datos con el email "ana.martinez@example.com"
    And la base de datos retorna el usuario con role ["buyer", "organizer"]
    And el BFF detecta múltiples roles
    And el BFF crea una sesión temporal con needsRoleSelection = true
    And el BFF guarda availableRoles = ["buyer", "organizer"] en la sesión
    And el usuario es redirigido a "/select-role"

  Scenario: Usuario selecciona rol de comprador desde la pantalla de selección
    Given el usuario está en la página "/select-role"
    And la sesión tiene needsRoleSelection = true
    And la sesión tiene availableRoles = ["buyer", "organizer"]
    When el usuario selecciona el rol "buyer"
    And hace click en "Continuar"
    Then se envía una petición POST a "/api/auth/set-role" con body {"role": "buyer"}
    And el BFF valida que "buyer" está en availableRoles
    And el BFF actualiza la sesión JWT con role "buyer"
    And el BFF elimina los flags temporales needsRoleSelection y availableRoles
    And el usuario es redirigido a "/product/[id]"

  Scenario: Usuario selecciona rol de organizador desde la pantalla de selección
    Given el usuario está en la página "/select-role"
    And la sesión tiene needsRoleSelection = true
    And la sesión tiene availableRoles = ["buyer", "organizer"]
    When el usuario selecciona el rol "organizer"
    And hace click en "Continuar"
    Then se envía una petición POST a "/api/auth/set-role" con body {"role": "organizer"}
    And el BFF actualiza la sesión JWT con role "organizer"
    And el usuario es redirigido a "/dashboard"

  Scenario: Usuario intenta seleccionar un rol no disponible
    Given el usuario está en la página "/select-role"
    And la sesión tiene availableRoles = ["buyer"]
    When el usuario intenta enviar un rol "organizer" que no está en availableRoles
    Then el BFF rechaza la petición con error 400
    And se muestra el mensaje "Rol no disponible para este usuario"

  # ============================================================
  # Escenario 3: Usuario Nuevo (No Existe en BD)
  # ============================================================
  
  Scenario: Usuario nuevo es redirigido al formulario de onboarding
    Given un usuario con email "carlos.nuevo@example.com" NO existe en la base de datos
    When el usuario completa el login SSO exitosamente con Google
    Then el BFF recibe el idToken validado
    And el BFF consulta la base de datos con el email "carlos.nuevo@example.com"
    And la base de datos retorna un array vacío []
    And el BFF detecta que es un usuario nuevo
    And el BFF crea una sesión temporal con needsOnboarding = true
    And el usuario es redirigido a "/onboarding"

  Scenario: Usuario nuevo completa el formulario de onboarding con rol por defecto
    Given el usuario está en la página "/onboarding"
    And la sesión tiene needsOnboarding = true
    And el formulario pre-llena el nombre "Carlos Nuevo" y email "carlos.nuevo@example.com" del SSO
    When el usuario completa el formulario con:
      | campo               | valor                                |
      | Nombre completo     | Carlos Nuevo Rodriguez               |
      | Teléfono celular    | +573201234567                        |
      | Ciudad              | Bogotá                               |
      | Departamento        | Cundinamarca                         |
      | País                | Colombia                             |
      | Dirección           | Calle 123 #45-67                     |
      | Info adicional      | Apartamento 301                      |
      | Rol                 | buyer (pre-seleccionado)             |
    And hace click en "Completar Registro"
    Then se envía una petición POST a "/api/users/register"
    And el BFF valida los datos del formulario
    And el BFF crea el usuario en la base de datos externa
    And la base de datos retorna el usuario creado con id "uuid-123"
    And el BFF actualiza la sesión JWT con userId "uuid-123" y role "buyer"
    And el BFF elimina el flag temporal needsOnboarding
    And el usuario es redirigido a "/product/[id]"

  Scenario: Usuario nuevo se registra con múltiples roles
    Given el usuario está en la página "/onboarding"
    And la sesión tiene needsOnboarding = true
    When el usuario completa el formulario
    And selecciona los roles ["buyer", "organizer"]
    And hace click en "Completar Registro"
    Then el BFF crea el usuario en la base de datos con role ["buyer", "organizer"]
    And el BFF actualiza la sesión con needsRoleSelection = true
    And el BFF guarda availableRoles = ["buyer", "organizer"]
    And el usuario es redirigido a "/select-role"

  Scenario: Usuario nuevo intenta registrarse sin completar campos obligatorios
    Given el usuario está en la página "/onboarding"
    When el usuario deja el campo "Teléfono celular" vacío
    And hace click en "Completar Registro"
    Then se muestra un error de validación "El teléfono celular es obligatorio"
    And el formulario no se envía

  Scenario: Usuario nuevo intenta registrarse con teléfono inválido
    Given el usuario está en la página "/onboarding"
    When el usuario ingresa "123" en el campo "Teléfono celular"
    And hace click en "Completar Registro"
    Then se muestra un error de validación "Formato de teléfono inválido"
    And el formulario no se envía

  Scenario: Usuario nuevo intenta registrarse con dirección muy corta
    Given el usuario está en la página "/onboarding"
    When el usuario ingresa "Calle 1" en el campo "Dirección"
    And hace click en "Completar Registro"
    Then se muestra un error de validación "La dirección debe tener al menos 10 caracteres"
    And el formulario no se envía

  # ============================================================
  # Escenario 4: Cliente HTTP
  # ============================================================
  
  Scenario: Cliente HTTP consulta usuario existente
    Given el cliente HTTP está configurado con BACKEND_API_URL
    When se llama al método getUserByEmail("usuario@example.com")
    Then se envía una petición GET a "{BACKEND_API_URL}/glam_users?email=eq.usuario@example.com"
    And se incluyen los headers:
      | header          | valor                           |
      | apikey          | {BACKEND_API_KEY}               |
      | Authorization   | Bearer {BACKEND_API_KEY}        |
      | Accept-Profile  | {BACKEND_DB_SCHEMA}             |
    And la respuesta es un array con el usuario
    And el método retorna un objeto GlamUser

  Scenario: Cliente HTTP consulta usuario no existente
    Given el cliente HTTP está configurado con BACKEND_API_URL
    When se llama al método getUserByEmail("noexiste@example.com")
    Then se envía una petición GET a "{BACKEND_API_URL}/glam_users?email=eq.noexiste@example.com"
    And la respuesta es un array vacío []
    And el método retorna null

  Scenario: Cliente HTTP crea nuevo usuario
    Given el cliente HTTP está configurado con BACKEND_API_URL
    And los datos del usuario son:
      | campo               | valor                        |
      | name                | Pedro Martínez               |
      | email               | pedro@example.com            |
      | role                | ["buyer"]                    |
      | phone_number        | +573201234567                |
      | status              | Active                       |
    When se llama al método createUser(userData)
    Then se envía una petición POST a "{BACKEND_API_URL}/glam_users"
    And se incluyen los headers:
      | header          | valor                           |
      | apikey          | {BACKEND_API_KEY}               |
      | Authorization   | Bearer {BACKEND_API_KEY}        |
      | Content-Profile | {BACKEND_DB_SCHEMA}             |
      | Content-Type    | application/json                |
      | Prefer          | return=representation           |
    And el body contiene los datos del usuario
    And la respuesta retorna el usuario creado con id
    And el método retorna un objeto GlamUser

  Scenario: Cliente HTTP maneja error de red durante login
    Given el cliente HTTP está configurado con BACKEND_API_URL
    And la base de datos externa no está disponible
    When se llama al método getUserByEmail("usuario@example.com") durante el flujo de login
    Then se lanza una excepción de tipo NetworkError
    And el BFF captura la excepción
    And el BFF elimina las cookies de sesión
    And el BFF registra el error con código "AUTH-NET-001" en los logs
    And el usuario es redirigido a "/error?code=AUTH-NET-001"

  Scenario: Cliente HTTP maneja error 500 del servidor durante login
    Given el cliente HTTP está configurado con BACKEND_API_URL
    And la base de datos externa retorna error 500
    When se llama al método getUserByEmail("usuario@example.com") durante el flujo de login
    Then se lanza una excepción de tipo HttpError con status 500
    And el BFF captura la excepción
    And el BFF elimina las cookies de sesión
    And el BFF registra el error con código "AUTH-SRV-001" en los logs
    And el usuario es redirigido a "/error?code=AUTH-SRV-001"

  Scenario: Cliente HTTP maneja error de red durante registro
    Given el cliente HTTP está configurado con BACKEND_API_URL
    And la base de datos externa no está disponible
    When se llama al método createUser(userData) durante el flujo de registro
    Then se lanza una excepción de tipo NetworkError
    And el BFF captura la excepción
    And el BFF mantiene la sesión temporal (no elimina cookies)
    And el BFF registra el error con código "REG-NET-001" en los logs
    And el usuario es redirigido a "/error?code=REG-NET-001"

  Scenario: Cliente HTTP maneja error 500 del servidor durante registro
    Given el cliente HTTP está configurado con BACKEND_API_URL
    And la base de datos externa retorna error 500
    When se llama al método createUser(userData) durante el flujo de registro
    Then se lanza una excepción de tipo HttpError con status 500
    And el BFF captura la excepción
    And el BFF mantiene la sesión temporal (no elimina cookies)
    And el BFF registra el error con código "REG-SRV-001" en los logs
    And el usuario es redirigido a "/error?code=REG-SRV-001"

  # ============================================================
  # Escenario 5: Middleware y Seguridad
  # ============================================================
  
  Scenario: Middleware permite acceso a página de onboarding con sesión temporal
    Given el usuario tiene una sesión temporal con needsOnboarding = true
    When el usuario intenta acceder a "/onboarding"
    Then el middleware valida la sesión temporal
    And permite el acceso a la página

  Scenario: Middleware redirige desde onboarding si sesión está completa
    Given el usuario tiene una sesión completa con role "buyer"
    When el usuario intenta acceder a "/onboarding"
    Then el middleware detecta que la sesión está completa
    And redirige al usuario a "/product/[id]"

  Scenario: Middleware permite acceso a página de selección de rol con sesión temporal
    Given el usuario tiene una sesión temporal con needsRoleSelection = true
    When el usuario intenta acceder a "/select-role"
    Then el middleware valida la sesión temporal
    And permite el acceso a la página

  Scenario: Middleware bloquea acceso a select-role sin sesión temporal apropiada
    Given el usuario tiene una sesión completa con role "buyer"
    When el usuario intenta acceder a "/select-role"
    Then el middleware detecta que needsRoleSelection = false
    And redirige al usuario a su dashboard "/product/[id]"

  Scenario: Middleware valida que el email proviene del token SSO
    Given el usuario tiene una sesión temporal con email "validado@example.com"
    When se intenta consultar un usuario con email diferente
    Then el BFF solo permite consultar el email de la sesión
    And rechaza consultas con emails arbitrarios

  # ============================================================
  # Escenario 6: Sesión JWT
  # ============================================================
  
  Scenario: Sesión temporal se crea correctamente después de SSO
    Given el usuario completa el login SSO exitosamente
    And el usuario no existe en la base de datos
    When el BFF crea la sesión temporal
    Then la sesión incluye:
      | campo      | valor                           |
      | sub        | user-sso-id                     |
      | email      | usuario@example.com             |
      | name       | Usuario Ejemplo                 |
      | provider   | google                          |
      | role       | null                            |
      | needsOnboarding | true                       |
      | iat        | timestamp actual                |
      | exp        | timestamp + 8 horas             |

  Scenario: Sesión completa se crea después de validar usuario existente
    Given el usuario completa el login SSO exitosamente
    And el usuario existe en la base de datos con role "buyer"
    When el BFF crea la sesión completa
    Then la sesión incluye:
      | campo      | valor                           |
      | sub        | user-sso-id                     |
      | email      | usuario@example.com             |
      | name       | Usuario Ejemplo                 |
      | provider   | google                          |
      | role       | buyer                           |
      | userId     | uuid-from-database              |
      | iat        | timestamp actual                |
      | exp        | timestamp + 8 horas             |
    And no incluye needsOnboarding ni needsRoleSelection

  # ============================================================
  # Escenario 7: Manejo de Errores
  # ============================================================
  
  # Nota: Para el manejo completo de errores y redirección a /error, ver specs/errors/spec.md
  
  Scenario: Error al crear usuario en base de datos redirige a página de error
    Given el usuario está en la página de onboarding
    And completa el formulario correctamente
    When el BFF intenta crear el usuario en la base de datos
    And la base de datos retorna error 500
    Then el BFF captura la excepción HttpError
    And el BFF registra el error con código "REG-SRV-001" en los logs
    And el usuario es redirigido a "/error?code=REG-SRV-001"
    And la página de error muestra "Error al crear usuario. Intenta nuevamente."
    And la sesión temporal se mantiene válida (no se eliminan cookies)

  Scenario: Error de red al crear usuario redirige a página de error
    Given el usuario está en la página de onboarding
    And completa el formulario correctamente
    When el BFF intenta crear el usuario en la base de datos
    And la base de datos no está disponible (NetworkError)
    Then el BFF captura la excepción NetworkError
    And el BFF registra el error con código "REG-NET-001" en los logs
    And el usuario es redirigido a "/error?code=REG-NET-001"
    And la sesión temporal se mantiene válida (no se eliminan cookies)

  Scenario: Sesión temporal expira durante onboarding
    Given el usuario está en la página de onboarding
    And la sesión temporal tiene 5 minutos de antigüedad
    When el usuario intenta enviar el formulario
    And la sesión ha expirado
    Then se muestra un mensaje "Tu sesión ha expirado"
    And el usuario es redirigido a la página de login "/"

  # ============================================================
  # Escenario 8: Cancelación de Registro
  # ============================================================
  
  Scenario: Usuario nuevo cancela el proceso de registro
    Given el usuario está en la página "/onboarding"
    And la sesión tiene needsOnboarding = true
    When el usuario hace click en el botón "Cancelar"
    Then se muestra un diálogo de confirmación "¿Estás seguro de que deseas cancelar el registro?"
    And el diálogo tiene opciones "Sí, cancelar" y "No, continuar"

  Scenario: Usuario confirma cancelación del registro
    Given el usuario está en la página "/onboarding"
    And se muestra el diálogo de confirmación de cancelación
    When el usuario hace click en "Sí, cancelar"
    Then se envía una petición POST a "/api/auth/logout"
    And el BFF elimina la cookie de sesión
    And el usuario es redirigido a la página de login "/"
    And se muestra un mensaje "Registro cancelado"

  Scenario: Usuario decide no cancelar el registro
    Given el usuario está en la página "/onboarding"
    And se muestra el diálogo de confirmación de cancelación
    When el usuario hace click en "No, continuar"
    Then el diálogo se cierra
    And el usuario permanece en la página "/onboarding"
    And la sesión temporal se mantiene válida
```

> **Nota:** Para el manejo de errores críticos durante el login (errores de conexión al backend), ver `specs/errors/spec.md`.

---

## Estructura de Sesión JWT

### Sesión Temporal (después de SSO, antes de validar BD)
- `sub`: string - Subject (user ID)
- `email`: string - Email del usuario
- `name`: string - Nombre completo
- `picture`: string (opcional) - URL avatar
- `provider`: string - Proveedor SSO (google | microsoft | meta)
- `role`: null - Sin rol aún
- `needsRoleSelection`: boolean (opcional) - Flag para selección de rol
- `needsOnboarding`: boolean (opcional) - Flag para onboarding
- `availableRoles`: string[] (opcional) - Roles disponibles para el usuario
- `iat`: number - Issued at timestamp
- `exp`: number - Expiration timestamp

### Sesión Completa (después de validar BD)
- `sub`: string - Subject (user ID)
- `email`: string - Email del usuario
- `name`: string - Nombre completo
- `picture`: string (opcional) - URL avatar
- `provider`: string - Proveedor SSO (google | microsoft | meta)
- `role`: "buyer" | "organizer" | "supplier" - Rol seleccionado
- `userId`: string - UUID de glam_users
- `iat`: number - Issued at timestamp
- `exp`: number - Expiration timestamp

---

## Rutas y Componentes

### Nuevas Rutas

1. **`/select-role`** - Página de selección de rol
   - Server Component
   - Valida sesión temporal
   - Muestra lista de roles disponibles
   - Redirige si ya tiene rol asignado

2. **`/onboarding`** - Formulario de registro
   - Server Component (initial load)
   - Client Component (form)
   - Valida sesión temporal
   - Pre-llena datos del SSO
   - Redirige si usuario ya está registrado

### Nuevas API Routes

1. **`POST /api/auth/set-role`**
   - Recibe rol seleccionado
   - Valida que el rol esté en availableRoles
   - Actualiza sesión JWT
   - Retorna redirect URL

2. **`POST /api/users/register`**
   - Recibe datos del formulario de onboarding
   - Valida datos
   - Crea usuario en BD externa
   - Actualiza sesión JWT con userId y role
   - Retorna redirect URL

3. **`GET /api/users/me`** (opcional para debugging)
   - Retorna información del usuario logueado desde BD

---

## Cliente HTTP

### Estructura de Carpetas

```
lib/
├── http/
│   ├── client.ts              # Cliente HTTP genérico
│   └── users/
│       ├── users-client.ts    # Abstracción de usuarios
│       └── types.ts           # TypeScript types
```

### Cliente HTTP Genérico (`lib/http/client.ts`)

**Responsabilidades:**
- Manejo de peticiones HTTP genéricas (GET, POST, PUT, DELETE, PATCH)
- Configuración de headers base
- Manejo de query params
- Manejo de errores HTTP y de red
- Serialización/deserialización de JSON

**Métodos principales:**
- `request<T>(endpoint, options): Promise<T>` - Método genérico
- `get<T>(endpoint, params): Promise<T>` - GET request
- `post<T>(endpoint, body): Promise<T>` - POST request
- `put<T>(endpoint, body): Promise<T>` - PUT request
- `delete<T>(endpoint): Promise<T>` - DELETE request

### Cliente de Usuarios (`lib/http/users/users-client.ts`)

**Responsabilidades:**
- Abstracción de operaciones CRUD de usuarios
- Integración con el cliente HTTP genérico
- Validación de datos de usuario
- Transformación de respuestas

**Métodos principales:**
- `getUserByEmail(email): Promise<GlamUser | null>` - Consulta usuario por email
- `createUser(userData): Promise<GlamUser>` - Crea nuevo usuario
- `updateUser(id, userData): Promise<GlamUser>` - Actualiza usuario existente

---

## Configuración

### Variables de Entorno

**Nuevas variables requeridas en `.env.local`:**

- `BACKEND_API_URL` - URL base del API externa (ej: http://localhost:54321/rest/v1)
- `BACKEND_API_KEY` - API key para autenticación
- `BACKEND_DB_SCHEMA` - Schema de la base de datos (ej: gssc_db)

### Headers HTTP Requeridos

**Para Consultas (GET):**
- `apikey`: Valor de BACKEND_API_KEY
- `Authorization`: Bearer token con BACKEND_API_KEY
- `Accept-Profile`: Valor de BACKEND_DB_SCHEMA

**Para Creación/Modificación (POST/PUT):**
- `apikey`: Valor de BACKEND_API_KEY
- `Authorization`: Bearer token con BACKEND_API_KEY
- `Content-Profile`: Valor de BACKEND_DB_SCHEMA
- `Content-Type`: application/json
- `Prefer`: return=representation

---

## Validaciones

### Formulario de Onboarding

**Campos Obligatorios:**
- Nombre completo (mínimo 3 caracteres)
- Teléfono celular (formato internacional +57...)
- Ciudad (mínimo 2 caracteres)
- Departamento/Estado (mínimo 2 caracteres)
- Dirección (mínimo 10 caracteres)
- País (default: Colombia)

**Campos Opcionales:**
- Información adicional de dirección

**Validación de Roles:**
- Al menos un rol debe estar seleccionado
- Roles permitidos: `buyer`, `organizer`
- Por defecto: `buyer` viene pre-seleccionado

### Selección de Rol

**Validaciones:**
- El rol debe existir en `availableRoles` de la sesión
- Solo se puede seleccionar un rol a la vez

---

## Seguridad

### Medidas Implementadas

1. **Validación de Sesión:**
   - Todas las rutas protegidas validan sesión JWT
   - `/onboarding` y `/select-role` solo accesibles con sesión temporal

2. **Validación de Email:**
   - Solo se consulta el email del token SSO validado
   - No se permite consultar emails arbitrarios

3. **Protección CSRF:**
   - Cookies con SameSite: Lax
   - State parameter en OAuth flow

4. **Validación de Datos:**
   - Sanitización de inputs en formulario
   - Validación server-side antes de crear usuario

---

## Notas Técnicas

- La URL base del API externa se configura en `BACKEND_API_URL`
- El schema de la BD se configura en `BACKEND_DB_SCHEMA`
- La API key se configura en `BACKEND_API_KEY`
- No usar SDK de Supabase, solo HTTP fetch genérico
- Todos los roles se manejan en inglés internamente
- El mapeo provider → rol ya NO aplica (era solo para testing)
- **Manejo de errores HTTP:** Cuando el cliente HTTP lanza excepciones (`NetworkError`, `HttpError`), el BFF debe capturarlas y redirigir a `/error?code=XXX` según corresponda (ver `specs/errors/spec.md` para el catálogo completo de códigos)

---

## Especificaciones Relacionadas

- **Manejo de Errores:** Ver `specs/errors/spec.md` para el sistema de códigos de error y página de error genérica.
- **Configuración de Facturación (Organizer):** Ver `specs/settings/provider/billing/spec.md` para la configuración de datos fiscales y bancarios. Este flujo se realiza **después del onboarding**, cuando el organizador necesita configurar sus datos para recibir pagos.

---

## Dependencias

- No se requieren nuevas dependencias npm
- Usar `fetch` nativo de Node.js 18+
- Usar tipos TypeScript existentes
