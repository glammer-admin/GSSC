# Specification (SDD) – Configuración de Facturación y Pagos

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

Este módulo permite a los **Organizers** (organizadores) configurar su información legal, de contacto y bancaria para poder recibir pagos por las ventas realizadas en la plataforma.

**Problema de negocio que resuelve:**
- Los Organizers necesitan registrar sus datos fiscales y bancarios para recibir transferencias de sus ventas
- La plataforma requiere verificar la identidad y cuenta bancaria antes de liberar pagos

**Valor que aporta:**
- Habilita el flujo de pagos hacia los organizadores
- Garantiza cumplimiento fiscal y legal
- Reduce riesgos de fraude mediante verificación de cuentas

**Ubicación:** `/settings/billing` (Settings › Facturación y Pagos)

**Flujo:** Este módulo se accede **después del onboarding**. El registro inicial del usuario se realiza en `/onboarding` (ver `specs/register/spec.md`). La configuración de facturación es un paso posterior requerido solo para recibir pagos.

---

## 2. Alcance funcional

### 2.1 Incluye
- Selección de tipo de entidad (Persona Natural / Persona Jurídica)
- Registro de información legal según tipo de entidad
- Registro de datos de contacto financiero
- Gestión de cuentas bancarias (crear, editar, activar/desactivar)
- Carga de documentos soporte a Supabase Storage (cédula, RUT, certificación bancaria)
- Visualización del estado de verificación de la cuenta bancaria
- Autocompletado de datos desde el perfil de registro (solo Persona Natural)
- Verificación de elegibilidad para recibir pagos

### 2.2 Excluye (explícito)
> Todo lo no listado aquí se considera fuera de alcance.

- Página pública / microsite del Organizer
- Configuración de tienda
- Catálogo de productos
- Perfil general del usuario
- Configuración de seguridad
- Configuración de notificaciones
- Proceso de verificación manual/automática de cuentas (backoffice)
- Ejecución de transferencias/pagos
- Registro inicial de usuario (ver `specs/register/spec.md`)

---

## 3. Actores

| Actor | Descripción | Nivel de acceso |
|-------|-------------|-----------------|
| Organizer | Proveedor que vende productos en la plataforma | Lectura y escritura de su propia configuración de facturación |
| Sistema | Plataforma GSSC | Gestión de estados de verificación |
| Soporte | Equipo de soporte de la plataforma | Cambio de tipo de entidad (fuera de alcance de este módulo) |

---

## 4. Glosario de dominio

> Definiciones precisas y no ambiguas.

| Término | Definición |
|---------|------------|
| Organizer | Usuario con rol de proveedor que puede vender productos en la plataforma |
| Persona Natural | Individuo que actúa a título personal, identificado con cédula (`entity_type: natural`) |
| Persona Jurídica | Empresa legalmente constituida, identificada con NIT y RUT (`entity_type: legal`) |
| Perfil de Facturación | Registro único por usuario que contiene la identidad legal y datos de contacto (`billing_profiles`) |
| Cuenta Bancaria | Información de una cuenta para recibir pagos. Un usuario puede tener múltiples cuentas, múltiples activas, pero solo una preferida (`bank_accounts`) |
| Cuenta Preferida | La cuenta bancaria seleccionada para recibir pagos. Debe estar activa y verificada (`is_preferred: true`) |
| Cuenta Activa | Cuenta bancaria habilitada para uso. Puede ser reactivada si está inactiva (`is_active: true`) |
| Documento de Facturación | Referencia a un archivo almacenado en Storage (cédula, RUT, certificación bancaria) (`billing_documents`) |
| Verificación de cuenta | Proceso de validación de que la cuenta bancaria pertenece al Organizer |
| Certificación bancaria | Documento emitido por el banco que acredita titularidad de una cuenta |
| RUT | Registro Único Tributario, documento fiscal obligatorio para empresas en Colombia |
| NIT | Número de Identificación Tributaria, identificador fiscal de empresas (9-10 dígitos) |
| Dirección fiscal | Dirección oficial registrada para efectos tributarios |
| Elegibilidad de pagos | Estado que indica si un Organizer cumple todos los requisitos para recibir transferencias |

---

## 5. Reglas de negocio (OBLIGATORIAS)

Cada regla debe ser:
- Verificable
- Independiente de la implementación
- Clara y atómica

### Perfil de Facturación
- **RN-01:** El tipo de entidad (Persona Natural o Persona Jurídica) solo puede seleccionarse una vez. Cambios posteriores requieren intervención de Soporte.
- **RN-02:** Solo puede existir un perfil de facturación por usuario.
- **RN-03:** Todos los campos marcados como obligatorios deben completarse para guardar la configuración.
- **RN-04:** El NIT es obligatorio únicamente para Persona Jurídica.

### Documentos
- **RN-05:** La Persona Natural debe cargar copia del documento de identidad (`id_document`) como documento obligatorio.
- **RN-06:** La Persona Jurídica debe cargar el RUT (`rut`) como documento obligatorio.
- **RN-07:** La certificación bancaria (`bank_certificate`) es obligatoria para ambos tipos de entidad.
- **RN-08:** Los documentos se almacenan en un bucket privado organizado por usuario: `{user_id}/{document_type}/{archivo}`.

### Cuentas Bancarias
- **RN-09:** Un usuario puede tener múltiples cuentas bancarias registradas.
- **RN-10:** Solo una cuenta bancaria puede estar marcada como preferida (`is_preferred: true`) por usuario.
- **RN-11:** Para marcar una cuenta como preferida, debe estar activa (`is_active: true`) Y verificada (`status: verified`).
- **RN-12:** Al marcar una cuenta como preferida, cualquier otra cuenta preferida del mismo usuario se desmarca automáticamente.
- **RN-13:** Las cuentas bancarias NUNCA se marcan como preferidas automáticamente. El usuario debe seleccionar manualmente la cuenta preferida después de que sea verificada.
- **RN-14:** Al crear una cuenta bancaria, se marca como activa automáticamente (`is_active: true`), pero NO como preferida (`is_preferred: false`).
- **RN-15:** No se pueden eliminar cuentas bancarias, solo inactivarlas (`is_active: false`).
- **RN-16:** No se puede inactivar una cuenta que está marcada como preferida.
- **RN-17:** Una cuenta inactiva no puede ser seleccionada como preferida hasta que sea reactivada.
- **RN-18:** Al guardar o modificar datos sensibles de la cuenta bancaria (número, banco, tipo), el estado de verificación vuelve a "Pendiente".
- **RN-19:** No se pueden realizar transferencias/pagos si no hay una cuenta preferida con estado "Verificada".
- **RN-20:** El campo `rejection_reason` es obligatorio cuando el estado es "Rechazada".
- **RN-21:** Los cambios en la información bancaria deben quedar auditados con timestamps.

### Validaciones de Formato
- **RN-22:** Número de documento (CC/CE): 6-10 dígitos numéricos.
- **RN-23:** Pasaporte: mínimo 5 caracteres alfanuméricos.
- **RN-24:** NIT: 9-10 dígitos numéricos.
- **RN-25:** Número de cuenta bancaria: 6-20 dígitos numéricos.

### Autocompletado
- **RN-26:** Para Persona Natural, si no existe perfil de facturación previo, los datos de contacto se autocompletan automáticamente desde el perfil de registro (nombre, teléfono, dirección). No se muestra opción manual para activar el autocompletado.
- **RN-27:** Si ya existe un perfil de facturación guardado, se muestran los datos existentes del servicio sin modificar.
- **RN-28:** Los datos autocompletados (en caso de perfil nuevo) son editables manualmente después de cargarse.

### Flujo de Guardado de Documentos
- **RN-29:** Los documentos se envían junto con el formulario al finalizar, no de forma inmediata al seleccionarlos. El usuario selecciona los archivos y estos se mantienen en memoria hasta que se envía el formulario completo.
- **RN-30:** El proceso de guardado es atómico: si falla la subida de algún documento al Storage, se hace rollback de los documentos ya subidos y no se guarda el registro en la base de datos. El usuario recibe un error y puede reintentar.

### Interfaz de Lista de Cuentas Bancarias
- **RN-31:** Si el usuario no tiene cuentas bancarias registradas, se muestra el formulario de nueva cuenta automáticamente.
- **RN-32:** Si el usuario tiene cuentas bancarias, se muestra una lista con todas las cuentas (activas e inactivas).
- **RN-33:** La lista muestra radio buttons para seleccionar la cuenta preferida.
- **RN-34:** El radio button solo está habilitado si la cuenta está activa (`is_active: true`) Y verificada (`status: verified`).
- **RN-35:** Las cuentas inactivas se muestran en gris/deshabilitadas con botón "Reactivar".
- **RN-36:** El botón "Inactivar" está deshabilitado para la cuenta preferida, con tooltip explicativo.
- **RN-37:** El cambio de cuenta preferida requiere confirmación explícita (botón "Confirmar selección").
- **RN-38:** Después de guardar exitosamente la configuración de facturación, el sistema redirige automáticamente al dashboard (`/dashboard`).

---

## 6. Estados del dominio

### 6.1 Estados de Verificación de Cuenta Bancaria

| Estado | Valor | Descripción |
|--------|-------|-------------|
| Pendiente | `pending` | La cuenta bancaria está en proceso de verificación. No se pueden realizar transferencias. |
| Verificada | `verified` | La cuenta bancaria ha sido validada. Se pueden recibir transferencias. |
| Rechazada | `rejected` | La verificación de la cuenta bancaria falló. Se requiere corrección de datos. |

### 6.2 Transiciones válidas

| Estado actual | Evento | Nuevo estado |
|---------------|--------|--------------|
| (ninguno) | Organizer guarda datos bancarios por primera vez | Pendiente |
| Pendiente | Verificación exitosa (backoffice) | Verificada |
| Pendiente | Verificación fallida (backoffice) | Rechazada |
| Verificada | Organizer modifica datos sensibles de la cuenta | Pendiente |
| Rechazada | Organizer modifica datos de la cuenta | Pendiente |

---

## 7. Casos de uso (Gherkin)

> ⚠️ Regla clave:  
> Todo comportamiento del sistema **DEBE** estar expresado aquí.  
> Si no existe un escenario Gherkin, el comportamiento **NO EXISTE**.

---

### 7.1 Caso de uso: Selección de tipo de entidad

```gherkin
Feature: Selección de tipo de entidad
  Como Organizer
  Quiero seleccionar mi tipo de entidad (Natural o Jurídica)
  Para configurar mi información de facturación según corresponda

  Background:
    Given soy un Organizer autenticado
    And estoy en la página de Facturación y Pagos

  Scenario: Seleccionar Persona Natural por primera vez
    Given no he seleccionado un tipo de entidad previamente
    When selecciono "Persona Natural"
    And guardo la configuración
    Then el tipo de entidad queda registrado como "Persona Natural"
    And se muestra el formulario correspondiente a Persona Natural

  Scenario: Seleccionar Persona Jurídica por primera vez
    Given no he seleccionado un tipo de entidad previamente
    When selecciono "Persona Jurídica"
    And guardo la configuración
    Then el tipo de entidad queda registrado como "Persona Jurídica"
    And se muestra el formulario correspondiente a Persona Jurídica

  Scenario: Intentar cambiar tipo de entidad ya guardado
    Given ya tengo un tipo de entidad guardado
    When intento cambiar el tipo de entidad
    Then el sistema no permite el cambio
    And se muestra un mensaje indicando que debe contactar a Soporte
```

---

### 7.2 Caso de uso: Registro de información legal - Persona Natural

```gherkin
Feature: Registro de información legal para Persona Natural
  Como Organizer de tipo Persona Natural
  Quiero registrar mi información legal
  Para cumplir con los requisitos fiscales de la plataforma

  Background:
    Given soy un Organizer autenticado
    And mi tipo de entidad es "Persona Natural"
    And estoy en la sección de Información Legal

  Scenario: Completar información legal correctamente
    Given los campos están vacíos
    When ingreso mi nombre completo
    And selecciono el tipo de documento "Cédula de ciudadanía"
    And ingreso mi número de documento (6-10 dígitos)
    And ingreso mi dirección fiscal
    And cargo una copia de mi cédula en formato PDF
    And guardo la información
    Then la información legal queda registrada exitosamente

  Scenario: Intentar guardar sin documento de identidad
    Given he completado todos los campos de texto
    But no he cargado la copia de la cédula
    When intento guardar la información
    Then el sistema muestra un error indicando que la copia de la cédula es obligatoria

  Scenario: Cargar documento en formato inválido
    Given he completado todos los campos de texto
    When intento cargar un documento en formato no permitido
    Then el sistema rechaza el archivo
    And muestra un mensaje indicando los formatos válidos (PDF, JPG, PNG)

  Scenario: Intentar guardar con número de documento inválido
    Given he completado todos los campos
    When ingreso un número de documento con menos de 6 dígitos
    And intento guardar la información
    Then el sistema muestra un error de formato de documento

  Scenario: Fallo en carga de documento durante guardado
    Given he completado todos los campos de texto
    And he seleccionado una copia de mi cédula
    When intento guardar la información
    And ocurre un error al subir el documento al Storage
    Then el sistema muestra un error indicando que falló la carga del documento
    And ningún dato queda guardado en la base de datos
    And puedo reintentar el guardado
```

---

### 7.3 Caso de uso: Registro de información legal - Persona Jurídica

```gherkin
Feature: Registro de información legal para Persona Jurídica
  Como Organizer de tipo Persona Jurídica
  Quiero registrar la información legal de mi empresa
  Para cumplir con los requisitos fiscales de la plataforma

  Background:
    Given soy un Organizer autenticado
    And mi tipo de entidad es "Persona Jurídica"
    And estoy en la sección de Información Legal

  Scenario: Completar información legal de empresa correctamente
    Given los campos están vacíos
    When ingreso la razón social
    And ingreso el NIT (9-10 dígitos)
    And ingreso la dirección fiscal
    And cargo el RUT en formato PDF
    And guardo la información
    Then la información legal de la empresa queda registrada exitosamente

  Scenario: Intentar guardar sin RUT
    Given he completado todos los campos de texto
    But no he cargado el RUT
    When intento guardar la información
    Then el sistema muestra un error indicando que el RUT es obligatorio

  Scenario: Intentar guardar sin NIT
    Given he completado los demás campos
    But no he ingresado el NIT
    When intento guardar la información
    Then el sistema muestra un error indicando que el NIT es obligatorio para empresas

  Scenario: Cargar RUT en formato inválido
    Given he completado todos los campos de texto
    When intento cargar el RUT en formato diferente a PDF
    Then el sistema rechaza el archivo
    And muestra un mensaje indicando que solo se acepta formato PDF

  Scenario: Fallo en carga de RUT durante guardado
    Given he completado todos los campos de texto
    And he seleccionado el RUT
    When intento guardar la información
    And ocurre un error al subir el RUT al Storage
    Then el sistema muestra un error indicando que falló la carga del documento
    And ningún dato queda guardado en la base de datos
    And puedo reintentar el guardado
```

---

### 7.4 Caso de uso: Autocompletado de datos para Persona Natural

```gherkin
Feature: Autocompletado de datos desde perfil de registro
  Como Organizer de tipo Persona Natural
  Quiero que mis datos se autocompleten desde mi perfil de registro
  Para agilizar el proceso de configuración inicial

  Background:
    Given soy un Organizer autenticado
    And mi tipo de entidad es "Persona Natural"

  Scenario: Autocompletado automático en perfil nuevo
    Given no tengo perfil de facturación guardado previamente
    And tengo datos en mi perfil de registro (nombre, teléfono, dirección)
    When accedo a la página de Facturación y Pagos
    Then los campos de contacto se autocompletan automáticamente con mis datos del perfil
    And los campos permanecen editables
    And no se muestra opción manual de autocompletado

  Scenario: Cargar datos existentes del servicio
    Given ya tengo un perfil de facturación guardado previamente
    When accedo a la página de Facturación y Pagos
    Then los campos muestran los datos guardados del servicio
    And no se autocompletan desde el perfil de registro
    And no se muestra opción manual de autocompletado

  Scenario: Modificar datos autocompletados antes de guardar
    Given no tengo perfil de facturación guardado previamente
    And los campos se han autocompletado desde mi perfil de registro
    When modifico manualmente alguno de los campos
    And guardo la información
    Then se guardan los valores modificados
    And no se afectan los datos originales del perfil de registro

  Scenario: Sin datos de registro para autocompletar
    Given no tengo perfil de facturación guardado previamente
    And no tengo datos en mi perfil de registro
    When accedo a la página de Facturación y Pagos
    Then los campos de contacto aparecen vacíos
    And debo completarlos manualmente
```

---

### 7.5 Caso de uso: Registro de datos de contacto

```gherkin
Feature: Registro de datos de contacto financiero
  Como Organizer
  Quiero registrar mis datos de contacto para asuntos financieros
  Para que la plataforma pueda comunicarse conmigo sobre pagos

  Background:
    Given soy un Organizer autenticado
    And estoy en la sección de Datos de Contacto

  Scenario: Completar datos de contacto correctamente
    Given los campos están vacíos
    When ingreso el email de contacto financiero
    And ingreso el teléfono principal
    And ingreso la dirección fiscal completa
    And guardo la información
    Then los datos de contacto quedan registrados exitosamente

  Scenario: Intentar guardar con email inválido
    Given he completado todos los campos
    But el email tiene formato inválido
    When intento guardar la información
    Then el sistema muestra un error de formato de email

  Scenario: Intentar guardar sin completar campos obligatorios
    Given algunos campos obligatorios están vacíos
    When intento guardar la información
    Then el sistema muestra errores indicando los campos faltantes
```

---

### 7.6 Caso de uso: Gestión de cuentas bancarias

```gherkin
Feature: Gestión de cuentas bancarias
  Como Organizer
  Quiero gestionar mis cuentas bancarias
  Para recibir los pagos de mis ventas

  Background:
    Given soy un Organizer autenticado
    And estoy en la sección de Información Bancaria

  # --- Visualización ---
  
  Scenario: Ver lista vacía - mostrar formulario automáticamente
    Given no tengo cuentas bancarias registradas
    When accedo a la sección de Información Bancaria
    Then se muestra el formulario de nueva cuenta automáticamente
    And no se muestra la lista de cuentas

  Scenario: Ver lista de cuentas existentes
    Given tengo una o más cuentas bancarias registradas
    When accedo a la sección de Información Bancaria
    Then se muestra la lista de todas mis cuentas
    And cada cuenta muestra: banco, tipo, número (parcial), estado de verificación
    And las cuentas activas y verificadas se muestran con radio button habilitado
    And las cuentas activas no verificadas se muestran con radio button deshabilitado
    And las cuentas inactivas se muestran en gris/deshabilitadas
    And se muestra un botón "Agregar cuenta"

  # --- Creación ---

  Scenario: Registrar primera cuenta bancaria
    Given no tengo cuentas bancarias registradas
    When selecciono el banco "Bancolombia"
    And selecciono el tipo de cuenta "Ahorros"
    And ingreso el número de cuenta (6-20 dígitos)
    And cargo la certificación bancaria
    And guardo la información
    Then la cuenta bancaria queda registrada
    And la cuenta queda marcada como activa (is_active: true)
    And la cuenta NO queda marcada como preferida (is_preferred: false)
    And el estado de verificación es "Pendiente"
    And el sistema redirige al dashboard
    And se muestra el mensaje de verificación en proceso
    And se muestra mensaje indicando que debe seleccionar la cuenta como preferida después de verificación

  Scenario: Registrar cuenta de billetera digital
    Given no tengo cuentas bancarias registradas
    When selecciono el proveedor "Nequi"
    And selecciono el tipo de cuenta "Billetera digital"
    And ingreso el número de celular asociado
    And cargo el comprobante de la billetera digital
    And guardo la información
    Then la cuenta bancaria queda registrada
    And el estado de verificación es "Pendiente"
    And el sistema redirige al dashboard

  Scenario: Agregar cuenta adicional
    Given ya tengo una o más cuentas bancarias
    When hago clic en "Agregar cuenta"
    And completo el formulario con banco, tipo y número de cuenta
    And cargo la certificación bancaria
    And guardo la información
    Then la nueva cuenta queda registrada con estado "Pendiente"
    And la cuenta queda activa pero NO preferida
    And la cuenta preferida anterior permanece sin cambios
    And el sistema redirige al dashboard

  # --- Selección de cuenta preferida ---

  Scenario: Seleccionar cuenta como preferida
    Given tengo múltiples cuentas bancarias
    And la cuenta A está verificada y activa
    And la cuenta B está como preferida actualmente
    When selecciono la cuenta A con el radio button
    And hago clic en "Confirmar selección"
    Then la cuenta A queda como preferida
    And la cuenta B se desmarca como preferida automáticamente

  Scenario: Intentar seleccionar cuenta no verificada como preferida
    Given tengo una cuenta con estado "Pendiente"
    When intento seleccionar esa cuenta con el radio button
    Then el radio button está deshabilitado
    And se muestra tooltip: "Solo cuentas verificadas pueden ser seleccionadas"

  Scenario: Intentar seleccionar cuenta inactiva como preferida
    Given tengo una cuenta inactiva (is_active = false)
    When veo la lista de cuentas
    Then la cuenta inactiva se muestra en gris
    And el radio button está deshabilitado
    And se muestra tooltip: "Cuenta inactiva. Reactívela primero"

  # --- Activación/Inactivación ---

  Scenario: Reactivar cuenta inactiva
    Given tengo una cuenta inactiva
    When hago clic en el botón "Reactivar"
    Then la cuenta se marca como activa (is_active = true)
    And puede ser seleccionada como preferida (si está verificada)

  Scenario: Inactivar cuenta no preferida
    Given tengo una cuenta activa que NO es la preferida
    When hago clic en el botón "Inactivar"
    Then la cuenta se marca como inactiva (is_active = false)
    And se muestra en gris en la lista
    And no puede ser seleccionada como preferida

  Scenario: Intentar inactivar cuenta preferida
    Given tengo una cuenta marcada como preferida
    When intento inactivarla
    Then el botón "Inactivar" está deshabilitado
    And se muestra tooltip: "No puede inactivar la cuenta preferida. Seleccione otra primero"

  # --- Restricciones ---

  Scenario: No se permite eliminar cuentas
    Given tengo cuentas bancarias registradas
    When veo la lista de cuentas
    Then no existe opción de eliminar/borrar cuentas
    And solo existe opción de inactivar

  # --- Validaciones y errores ---

  Scenario: Intentar guardar sin certificación bancaria
    Given he completado todos los campos de información bancaria
    But no he cargado la certificación bancaria
    When intento guardar la información
    Then el sistema muestra un error indicando que la certificación es obligatoria

  Scenario: Modificar cuenta bancaria verificada
    Given tengo una cuenta bancaria con estado "Verificada"
    When modifico el número de cuenta
    And guardo los cambios
    Then la información bancaria se actualiza
    And el estado de verificación cambia a "Pendiente"
    And se registra el cambio con timestamp de auditoría
    And el sistema redirige al dashboard

  Scenario: Intentar guardar con número de cuenta inválido
    Given he completado los campos de información bancaria
    When ingreso un número de cuenta con menos de 6 dígitos
    And intento guardar la información
    Then el sistema muestra un error de formato de número de cuenta

  Scenario: Fallo en carga de certificación bancaria durante guardado
    Given he completado todos los campos de información bancaria
    And he seleccionado la certificación bancaria
    When intento guardar la información
    And ocurre un error al subir la certificación al Storage
    Then el sistema muestra un error indicando que falló la carga del documento
    And ningún dato queda guardado en la base de datos
    And puedo reintentar el guardado

  Scenario: Rollback de documentos cuando falla uno de varios
    Given he completado todos los campos del formulario
    And he seleccionado el documento de identidad
    And he seleccionado la certificación bancaria
    When intento guardar la información
    And el documento de identidad se sube exitosamente
    And la certificación bancaria falla al subirse
    Then el sistema elimina el documento de identidad ya subido (rollback)
    And muestra un error indicando que falló la carga
    And ningún dato queda guardado en la base de datos
```

---

### 7.7 Caso de uso: Visualización de estado de verificación

```gherkin
Feature: Visualización de estado de verificación
  Como Organizer
  Quiero ver el estado de verificación de mi cuenta bancaria
  Para saber si puedo recibir pagos

  Background:
    Given soy un Organizer autenticado
    And tengo información bancaria registrada

  Scenario: Ver estado Pendiente
    Given el estado de mi cuenta bancaria activa es "Pendiente"
    When accedo a la sección de Información Bancaria
    Then veo el indicador de estado en color amarillo
    And veo el mensaje "La cuenta bancaria se encuentra en proceso de verificación. Mientras este proceso no finalice, no se podrán realizar transferencias."

  Scenario: Ver estado Verificada
    Given el estado de mi cuenta bancaria activa es "Verificada"
    When accedo a la sección de Información Bancaria
    Then veo el indicador de estado en color verde
    And el mensaje de bloqueo de transferencias no se muestra

  Scenario: Ver estado Rechazada
    Given el estado de mi cuenta bancaria activa es "Rechazada"
    When accedo a la sección de Información Bancaria
    Then veo el indicador de estado en color rojo
    And veo el mensaje con la razón del rechazo
    And veo un mensaje indicando que debe corregir la información
```

---

### 7.8 Caso de uso: Verificación de elegibilidad de pagos

```gherkin
Feature: Verificación de elegibilidad de pagos
  Como plataforma
  Quiero verificar si un Organizer puede recibir pagos
  Para asegurar que cumple todos los requisitos

  Scenario: Organizer elegible para recibir pagos
    Given un Organizer tiene perfil de facturación completo
    And tiene una cuenta bancaria preferida con estado "Verificada"
    And tiene todos los documentos requeridos cargados
    When se verifica la elegibilidad de pagos
    Then el resultado es "elegible"
    And el mensaje indica "Organizer is eligible to receive payments"

  Scenario: Organizer sin cuenta bancaria preferida verificada
    Given un Organizer tiene perfil de facturación completo
    But no tiene cuenta bancaria preferida
    When se verifica la elegibilidad de pagos
    Then el resultado es "no elegible"
    And el mensaje indica "No verified preferred bank account found"

  Scenario: Organizer con cuenta preferida no verificada
    Given un Organizer tiene perfil de facturación completo
    And tiene cuenta preferida pero con estado "Pendiente"
    When se verifica la elegibilidad de pagos
    Then el resultado es "no elegible"
    And el mensaje indica "Preferred bank account is not verified"

  Scenario: Organizer sin perfil de facturación
    Given un Organizer no ha configurado su perfil de facturación
    When se verifica la elegibilidad de pagos
    Then el resultado es "no elegible"
    And el mensaje indica la información faltante
```

---

### 7.9 Caso de uso: Bloqueo de pagos por verificación

```gherkin
Feature: Bloqueo de pagos por estado de verificación
  Como plataforma
  Quiero bloquear transferencias a cuentas no verificadas
  Para proteger contra fraudes y errores

  Scenario: Intentar transferencia sin cuenta preferida
    Given un Organizer tiene ventas pendientes de pago
    And no tiene cuenta bancaria preferida
    When el sistema intenta procesar una transferencia
    Then la transferencia no se ejecuta
    And queda en espera hasta que tenga una cuenta preferida verificada

  Scenario: Intentar transferencia con cuenta preferida pendiente
    Given un Organizer tiene ventas pendientes de pago
    And su cuenta bancaria preferida tiene estado "Pendiente"
    When el sistema intenta procesar una transferencia
    Then la transferencia no se ejecuta
    And queda en espera hasta que la cuenta sea verificada

  Scenario: Intentar transferencia con cuenta preferida rechazada
    Given un Organizer tiene ventas pendientes de pago
    And su cuenta bancaria preferida tiene estado "Rechazada"
    When el sistema intenta procesar una transferencia
    Then la transferencia no se ejecuta
    And el Organizer es notificado para corregir sus datos bancarios

  Scenario: Transferencia exitosa con cuenta preferida verificada
    Given un Organizer tiene ventas pendientes de pago
    And su cuenta bancaria preferida tiene estado "Verificada"
    When el sistema procesa una transferencia
    Then la transferencia se ejecuta normalmente
```

---

## 8. Modelo de Datos

> Estructura de las entidades en el backend.

### 8.1 Perfil de Facturación (`billing_profiles`)

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| id | uuid | Auto | Identificador único del perfil |
| user_id | uuid | Sí | ID del usuario (FK) |
| entity_type | enum | Sí | `natural` o `legal` |
| full_name | string | Sí | Nombre completo o razón social |
| document_type | enum | Sí | `CC`, `CE`, `PASSPORT` |
| document_number | string | Sí | Número del documento de identidad |
| tax_id | string | Solo legal | NIT (obligatorio si entity_type = legal) |
| fiscal_address | string | Sí | Dirección fiscal completa |
| contact_email | string | Sí | Email de contacto financiero |
| contact_phone | string | Sí | Teléfono de contacto |
| created_at | timestamp | Auto | Fecha de creación |
| updated_at | timestamp | Auto | Fecha de última modificación |

**Restricción:** Solo un perfil por `user_id`.

### 8.2 Cuentas Bancarias (`bank_accounts`)

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| id | uuid | Auto | Identificador único de la cuenta |
| user_id | uuid | Sí | ID del usuario (FK) |
| bank_name | string | Sí | Nombre del banco o proveedor |
| account_type | enum | Sí | `savings`, `checking`, `wallet` |
| account_number | string | Sí | Número de cuenta (6-20 dígitos) |
| status | enum | Auto | `pending`, `verified`, `rejected` |
| is_active | boolean | Auto | Indica si la cuenta está habilitada. Default: true al crear |
| is_preferred | boolean | Auto | Indica si es la cuenta para recibir pagos (solo una por usuario) |
| rejection_reason | string | Si rejected | Razón del rechazo (obligatorio si status = rejected) |
| created_at | timestamp | Auto | Fecha de creación |
| updated_at | timestamp | Auto | Fecha de última modificación |

**Restricciones:**
- Solo una cuenta con `is_preferred = true` por `user_id`
- `is_preferred = true` requiere `is_active = true` AND `status = verified`

### 8.3 Documentos de Facturación (`billing_documents`)

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| id | uuid | Auto | Identificador único del documento |
| user_id | uuid | Sí | ID del usuario (FK) |
| document_type | enum | Sí | `id_document`, `rut`, `bank_certificate` |
| document_name | string | Sí | Nombre descriptivo del documento |
| storage_bucket | string | Sí | Nombre del bucket (`billing-documents`) |
| storage_path | string | Sí | Ruta en Storage: `{user_id}/{document_type}/{archivo}` |
| created_at | timestamp | Auto | Fecha de creación |

---

## 9. Contratos funcionales (API REST)

> Endpoints disponibles para interactuar con el backend.

### 9.1 Perfil de Facturación

**Crear perfil:**
```
POST /rest/v1/billing_profiles
Headers: apikey, Authorization, Content-Profile, Prefer: return=representation
```

**Obtener perfil:**
```
GET /rest/v1/billing_profiles?user_id=eq.{user_id}
Headers: apikey, Authorization, Accept-Profile
```

**Actualizar perfil:**
```
PATCH /rest/v1/billing_profiles?user_id=eq.{user_id}
Headers: apikey, Authorization, Content-Profile, Prefer: return=representation
```

### 9.2 Cuentas Bancarias

**Crear cuenta:**
```
POST /rest/v1/bank_accounts
Headers: apikey, Authorization, Content-Profile, Prefer: return=representation
```

**Obtener cuentas:**
```
GET /rest/v1/bank_accounts?user_id=eq.{user_id}&order=created_at.desc
Headers: apikey, Authorization, Accept-Profile
```

**Obtener cuenta preferida:**
```
GET /rest/v1/bank_accounts?user_id=eq.{user_id}&is_preferred=eq.true
Headers: apikey, Authorization, Accept-Profile
```

**Obtener cuentas activas:**
```
GET /rest/v1/bank_accounts?user_id=eq.{user_id}&is_active=eq.true
Headers: apikey, Authorization, Accept-Profile
```

**Actualizar cuenta:**
```
PATCH /rest/v1/bank_accounts?id=eq.{id}
Headers: apikey, Authorization, Content-Profile, Prefer: return=representation
```

**Marcar cuenta como preferida:**
```
PATCH /rest/v1/bank_accounts?id=eq.{id}
Headers: apikey, Authorization, Content-Profile, Prefer: return=representation
Body: { "is_preferred": true }
```
> Nota: Requiere que la cuenta tenga `is_active = true` AND `status = verified`

**Activar/Reactivar cuenta:**
```
PATCH /rest/v1/bank_accounts?id=eq.{id}
Headers: apikey, Authorization, Content-Profile, Prefer: return=representation
Body: { "is_active": true }
```

**Inactivar cuenta:**
```
PATCH /rest/v1/bank_accounts?id=eq.{id}
Headers: apikey, Authorization, Content-Profile, Prefer: return=representation
Body: { "is_active": false }
```
> Nota: No se puede inactivar una cuenta con `is_preferred = true`

### 9.3 Documentos

**Crear referencia de documento:**
```
POST /rest/v1/billing_documents
Headers: apikey, Authorization, Content-Profile, Prefer: return=representation
```

**Obtener documentos:**
```
GET /rest/v1/billing_documents?user_id=eq.{user_id}&order=created_at.desc
Headers: apikey, Authorization, Accept-Profile
```

### 9.4 BFF - Guardar Configuración Completa (con documentos)

> **Nota:** Este endpoint del BFF (Backend for Frontend) recibe el formulario completo
> incluyendo los archivos. El BFF se encarga de subir los documentos al Storage
> y crear los registros en la base de datos de forma atómica.

**Guardar configuración con documentos:**
```
POST /api/settings/billing
Content-Type: multipart/form-data
```

**Campos del FormData:**

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| data | string (JSON) | Sí | Datos del formulario serializados como JSON |
| id_document_file | File | Solo natural | Archivo de documento de identidad (PDF, JPG, PNG) |
| rut_file | File | Solo legal | Archivo RUT (PDF) |
| bank_certificate_file | File | Sí | Archivo de certificación bancaria (PDF, JPG, PNG) |

**Estructura del campo `data` (JSON):**
```json
{
  "entityType": "natural" | "legal",
  "naturalPersonInfo": {
    "fullName": "string",
    "documentType": "CC" | "CE" | "PASSPORT",
    "documentNumber": "string",
    "fiscalAddress": "string"
  },
  "legalEntityInfo": {
    "businessName": "string",
    "nit": "string",
    "fiscalAddress": "string"
  },
  "contactInfo": {
    "email": "string",
    "phone": "string",
    "address": "string"
  },
  "bankInfo": {
    "bankOrProvider": "string",
    "accountType": "savings" | "checking" | "wallet",
    "accountNumber": "string"
  }
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": { /* BillingSettings */ },
  "message": "Configuración guardada exitosamente"
}
```

**Respuesta de error (400/500):**
```json
{
  "success": false,
  "error": "DOCUMENT_UPLOAD_FAILED",
  "message": "Error al subir el documento de identidad"
}
```

**Comportamiento:**
1. Valida sesión y permisos
2. Valida datos del formulario
3. Valida que los documentos obligatorios estén presentes
4. Sube documentos al Storage (con rollback si falla alguno)
5. Crea/actualiza perfil de facturación
6. Crea/actualiza cuenta bancaria
7. Crea referencias de documentos en BD
8. Retorna configuración actualizada

### 9.5 Storage (Archivos)

> **Nota:** Estos endpoints son utilizados internamente por el BFF.
> El frontend NO debe llamar directamente a Storage.

**Subir archivo:**
```
POST /storage/v1/object/billing-documents/{user_id}/{document_type}/{filename}
Headers: apikey, Authorization, Content-Type: application/pdf (o image/*)
Body: binary
```

**Descargar archivo:**
```
GET /storage/v1/object/billing-documents/{user_id}/{document_type}/{filename}
Headers: apikey, Authorization
```

**Listar archivos:**
```
POST /storage/v1/object/list/billing-documents
Headers: apikey, Authorization, Content-Type: application/json
Body: { "prefix": "{user_id}/" }
```

**Eliminar archivo (usado en rollback):**
```
DELETE /storage/v1/object/billing-documents/{path}
Headers: apikey, Authorization
```

### 9.6 Verificación de Elegibilidad

**Verificar elegibilidad:**
```
POST /rest/v1/rpc/check_organizer_payment_eligibility
Headers: apikey, Authorization, Content-Type: application/json
Body: { "p_user_id": "{user_id}" }
```

**Respuesta exitosa:**
```json
{ "eligible": true, "message": "Organizer is eligible to receive payments" }
```

**Respuesta con error:**
```json
{ "eligible": false, "message": "No verified active bank account found" }
```

---

## 10. Errores de negocio

| Código lógico | Condición |
|---------------|-----------|
| ENTITY_TYPE_LOCKED | Intento de cambiar tipo de entidad ya guardado |
| MISSING_REQUIRED_FIELD | Campo obligatorio no completado |
| INVALID_FILE_FORMAT | Archivo cargado en formato no permitido |
| MISSING_ID_DOCUMENT | Documento de identidad no cargado para Persona Natural |
| MISSING_RUT | RUT no cargado para Persona Jurídica |
| MISSING_BANK_CERTIFICATE | Certificación bancaria no cargada |
| MISSING_TAX_ID | NIT no proporcionado para Persona Jurídica |
| INVALID_EMAIL_FORMAT | Email con formato inválido |
| INVALID_DOCUMENT_NUMBER | Número de documento con formato inválido |
| INVALID_TAX_ID | NIT con formato inválido (debe ser 9-10 dígitos) |
| INVALID_ACCOUNT_NUMBER | Número de cuenta con formato inválido (debe ser 6-20 dígitos) |
| PAYMENT_BLOCKED_PENDING | Intento de pago con cuenta preferida en estado Pendiente |
| PAYMENT_BLOCKED_REJECTED | Intento de pago con cuenta preferida en estado Rechazada |
| PAYMENT_BLOCKED_NO_PREFERRED | Intento de pago sin cuenta preferida configurada |
| NOT_ELIGIBLE_FOR_PAYMENTS | Organizer no cumple requisitos para recibir pagos |
| DOCUMENT_UPLOAD_FAILED | Fallo en la subida de documento durante el guardado. Se hace rollback de documentos ya subidos |
| CANNOT_SET_PREFERRED_INACTIVE | Intento de marcar como preferida una cuenta inactiva |
| CANNOT_SET_PREFERRED_UNVERIFIED | Intento de marcar como preferida una cuenta no verificada |
| CANNOT_INACTIVATE_PREFERRED | Intento de inactivar la cuenta preferida |
| ACCOUNT_DELETE_NOT_ALLOWED | Intento de eliminar cuenta bancaria (solo se permite inactivar) |

---

## 11. Invariantes del sistema

> Condiciones que SIEMPRE deben cumplirse.

- Un Organizer solo puede tener un perfil de facturación (`billing_profiles`)
- Un Organizer puede tener múltiples cuentas bancarias, múltiples activas, pero solo una preferida
- Solo una cuenta bancaria puede tener `is_preferred = true` por usuario
- Una cuenta preferida debe cumplir: `is_active = true` AND `status = verified`
- Las cuentas bancarias NUNCA se marcan como preferidas automáticamente al crearlas
- Las cuentas bancarias no se pueden eliminar, solo inactivar
- No se puede inactivar una cuenta que está marcada como preferida
- El tipo de entidad no puede cambiar una vez guardado (sin intervención de Soporte)
- Siempre debe existir un estado de verificación para cuentas bancarias registradas
- Los pagos nunca se ejecutan si no hay cuenta preferida con estado "Verificada"
- Todo cambio en información bancaria debe quedar auditado con timestamps
- Los documentos se almacenan en el bucket `billing-documents` con estructura `{user_id}/{document_type}/{archivo}`

---

## 12. Casos límite y excepciones

- Organizer sin datos de registro previos y sin perfil de facturación: los campos aparecen vacíos, no hay autocompletado
- Documentos con tamaño excesivo: definir límite máximo de archivo (10MB recomendado)
- Múltiples intentos de carga de documentos: solo se conserva el último por tipo
- Cambio de banco que requiere nueva verificación: siempre vuelve a Pendiente
- Organizer con ventas pendientes y cuenta preferida rechazada: pagos quedan retenidos
- Usuario intenta marcar como preferida una cuenta no verificada: no se permite, radio deshabilitado
- Usuario intenta marcar como preferida una cuenta inactiva: no se permite, debe reactivar primero
- Usuario intenta inactivar cuenta preferida: no se permite, debe seleccionar otra preferida primero
- Usuario intenta eliminar cuenta: no se permite, solo puede inactivar
- Primera cuenta creada: se marca como activa (`is_active: true`) pero NO como preferida. El usuario debe seleccionarla manualmente después de verificación
- Única cuenta verificada+activa: NO se marca como preferida automáticamente. El usuario debe seleccionarla manualmente

---

## 13. Seguridad y permisos

| Actor | Acción permitida | Acción prohibida |
|-------|------------------|------------------|
| Organizer | Ver y editar su propia configuración de facturación | Ver configuración de otros Organizers |
| Organizer | Cargar y reemplazar sus documentos | Acceder a documentos de otros usuarios |
| Organizer | Gestionar sus cuentas bancarias | Modificar estado de verificación |
| Sistema | Cambiar estado de verificación | Modificar datos del Organizer sin su acción |
| Soporte | Cambiar tipo de entidad (fuera de este módulo) | Acceder a documentos sin autorización |

**Bucket de Storage:** El bucket `billing-documents` es **privado**. Solo el usuario propietario puede acceder a sus documentos mediante token de autenticación.

---

## 14. No-objetivos explícitos

> Para evitar suposiciones de la AI.

- Este módulo NO ejecuta transferencias ni pagos
- Este módulo NO implementa el proceso de verificación de cuentas (backoffice)
- Este módulo NO gestiona historial de pagos recibidos
- Este módulo NO incluye configuración de impuestos o retenciones
- Este módulo NO valida datos contra entidades externas (bancos, DIAN, etc.)
- Este módulo NO es parte del flujo de onboarding/registro inicial (ver `specs/register/spec.md`)

---

## 15. Especificaciones relacionadas

- **Registro de usuarios:** `specs/register/spec.md` - Flujo de onboarding inicial
- **Ejemplos de cURL:** `specs/settings/provider/billing/global-setting-curl.md` - Ejemplos de peticiones al backend de billing

---

## 16. Versionado

- Versión: v2.7
- Fecha: 2026-01-07
- Cambios:
  - v2.7: RN-38 actualizada - Después de guardar exitosamente la configuración de facturación, el sistema redirige automáticamente al dashboard (`/dashboard`). Simplifica UX eliminando manejo de estados complejos.
  - v2.6: Autocompletado automático sin opción manual. Si no existe perfil de facturación, se autocompletan datos desde perfil de registro. Si ya existe, se cargan datos del servicio. Eliminada opción "Usar los mismos datos de mi perfil de registro". Renumeradas reglas RN-26 a RN-38.
  - v2.5: Nueva regla RN-38 - Después de guardar exitosamente una cuenta bancaria (nueva o editada), la interfaz debe mostrar automáticamente el listado de cuentas, no permanecer en el formulario.
  - v2.4: Las cuentas ya NO se marcan como preferidas automáticamente al crearlas, ni siquiera la primera. El usuario debe seleccionar manualmente la cuenta preferida después de que sea verificada.
  - v2.3: Ajuste en creación de cuentas - todas se crean activas por defecto (`is_active: true`), primera cuenta queda como preferida (`is_preferred: true`) inmediatamente al crearla
  - v2.2: Nuevo modelo de cuentas bancarias con `is_active` + `is_preferred`. Eliminado campo `holder_name`. Lista de cuentas con radio buttons para selección de preferida. Restricciones: no eliminar cuentas (solo inactivar), no inactivar cuenta preferida. Tooltips de ayuda en restricciones. Formulario automático si no hay cuentas.
  - v2.1: Cambio de flujo de documentos - ahora se envían con el formulario al finalizar (RN-28, RN-29), endpoint BFF con multipart/form-data, rollback atómico, nuevo error DOCUMENT_UPLOAD_FAILED
  - v2.0: Integración con backend real (Supabase), modelo de datos con 3 tablas separadas, soporte para múltiples cuentas bancarias, endpoints REST documentados
  - v1.0: Versión inicial del spec (mocks)

---

## 17. Checklist de validación (AI + Humano)

Antes de aprobar este spec:
- [x] Todos los comportamientos están en Gherkin
- [x] No hay decisiones de implementación (solo contratos)
- [x] Las reglas de negocio están numeradas
- [x] No hay ambigüedades
- [x] El alcance está claro
- [x] No hay ejemplos de código fuente
- [x] Modelo de datos documentado
- [x] Endpoints REST documentados

---

## 18. Nota final para AI Agents

- ❌ No inferir comportamiento no especificado
- ❌ No modificar este archivo durante la implementación
- ✅ Usar este spec como base para `plan.md`, tests y validaciones
- ✅ Preguntar si algo no está explícitamente definido
- ✅ Consultar `specs/register/global-setting-curl.md` para ejemplos de peticiones
