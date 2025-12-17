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

---

## 2. Alcance funcional

### 2.1 Incluye
- Selección de tipo de entidad (Persona Natural / Persona Jurídica)
- Registro de información legal según tipo de entidad
- Registro de datos de contacto financiero
- Registro de información bancaria
- Carga de documentos soporte (cédula, RUT, certificación bancaria)
- Visualización del estado de verificación de la cuenta bancaria
- Autocompletado de datos desde el perfil de registro (solo Persona Natural)

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
| Persona Natural | Individuo que actúa a título personal, identificado con cédula |
| Persona Jurídica | Empresa legalmente constituida, identificada con NIT y RUT |
| Verificación de cuenta | Proceso de validación de que la cuenta bancaria pertenece al Organizer |
| Certificación bancaria | Documento emitido por el banco que acredita titularidad de una cuenta |
| RUT | Registro Único Tributario, documento fiscal obligatorio para empresas en Colombia |
| Dirección fiscal | Dirección oficial registrada para efectos tributarios |

---

## 5. Reglas de negocio (OBLIGATORIAS)

Cada regla debe ser:
- Verificable
- Independiente de la implementación
- Clara y atómica

- **RN-01:** El tipo de entidad (Persona Natural o Persona Jurídica) solo puede seleccionarse una vez. Cambios posteriores requieren intervención de Soporte.
- **RN-02:** Todos los campos marcados como obligatorios deben completarse para guardar la configuración.
- **RN-03:** La Persona Natural debe cargar copia de la cédula como documento obligatorio.
- **RN-04:** La Persona Jurídica debe cargar el RUT como documento obligatorio.
- **RN-05:** La certificación bancaria es obligatoria para ambos tipos de entidad.
- **RN-06:** Al guardar o modificar datos bancarios, el estado de verificación vuelve a "Pendiente".
- **RN-07:** No se pueden realizar transferencias/pagos mientras el estado de la cuenta sea diferente a "Verificada".
- **RN-08:** Los cambios en la información bancaria deben quedar auditados.
- **RN-09:** Para Persona Natural, se puede optar por autocompletar datos desde el perfil de registro (nombre, teléfono, dirección).
- **RN-10:** Los datos autocompletados son editables manualmente después de cargarse.

---

## 6. Estados del dominio (si aplica)

| Estado | Descripción |
|--------|-------------|
| Pendiente | La cuenta bancaria está en proceso de verificación. No se pueden realizar transferencias. |
| Verificada | La cuenta bancaria ha sido validada. Se pueden recibir transferencias. |
| Rechazada | La verificación de la cuenta bancaria falló. Se requiere corrección de datos. |

### 6.1 Transiciones válidas

| Estado actual | Evento | Nuevo estado |
|---------------|--------|--------------|
| (ninguno) | Organizer guarda datos bancarios por primera vez | Pendiente |
| Pendiente | Verificación exitosa | Verificada |
| Pendiente | Verificación fallida | Rechazada |
| Verificada | Organizer modifica datos bancarios | Pendiente |
| Rechazada | Organizer modifica datos bancarios | Pendiente |

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
    And ingreso mi número de documento
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
    And ingreso el NIT
    And ingreso la dirección fiscal
    And cargo el RUT en formato PDF
    And guardo la información
    Then la información legal de la empresa queda registrada exitosamente

  Scenario: Intentar guardar sin RUT
    Given he completado todos los campos de texto
    But no he cargado el RUT
    When intento guardar la información
    Then el sistema muestra un error indicando que el RUT es obligatorio

  Scenario: Cargar RUT en formato inválido
    Given he completado todos los campos de texto
    When intento cargar el RUT en formato diferente a PDF
    Then el sistema rechaza el archivo
    And muestra un mensaje indicando que solo se acepta formato PDF
```

---

### 7.4 Caso de uso: Autocompletado de datos para Persona Natural

```gherkin
Feature: Autocompletado de datos desde perfil de registro
  Como Organizer de tipo Persona Natural
  Quiero usar los datos de mi perfil de registro
  Para agilizar el proceso de configuración

  Background:
    Given soy un Organizer autenticado
    And mi tipo de entidad es "Persona Natural"
    And tengo datos en mi perfil de registro (nombre, teléfono, dirección)

  Scenario: Activar autocompletado de datos
    Given estoy en la página de Facturación y Pagos
    And los campos de contacto están vacíos
    When activo la opción "Usar los mismos datos de mi perfil de registro"
    Then los campos se autocompletan con mis datos del perfil
    And los campos permanecen editables

  Scenario: Modificar datos después de autocompletar
    Given he activado el autocompletado de datos
    And los campos muestran mis datos del perfil
    When modifico manualmente alguno de los campos
    And guardo la información
    Then se guardan los valores modificados
    And no se afectan los datos originales del perfil de registro
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
    And ingreso la dirección completa
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

### 7.6 Caso de uso: Registro de información bancaria

```gherkin
Feature: Registro de información bancaria
  Como Organizer
  Quiero registrar mi cuenta bancaria
  Para recibir los pagos de mis ventas

  Background:
    Given soy un Organizer autenticado
    And estoy en la sección de Información Bancaria

  Scenario: Registrar cuenta bancaria por primera vez
    Given no tengo información bancaria registrada
    When ingreso el nombre del titular de la cuenta
    And selecciono el banco o proveedor
    And selecciono el tipo de cuenta "Ahorros"
    And ingreso el número de cuenta
    And cargo la certificación bancaria
    And guardo la información
    Then la información bancaria queda registrada
    And el estado de verificación es "Pendiente"
    And se muestra el mensaje de verificación en proceso

  Scenario: Registrar cuenta de billetera digital
    Given no tengo información bancaria registrada
    When ingreso el nombre del titular de la cuenta
    And selecciono el proveedor de billetera digital
    And selecciono el tipo de cuenta "Billetera digital"
    And ingreso el número de cuenta/celular
    And cargo el comprobante de la billetera digital
    And guardo la información
    Then la información bancaria queda registrada
    And el estado de verificación es "Pendiente"

  Scenario: Intentar guardar sin certificación bancaria
    Given he completado todos los campos de información bancaria
    But no he cargado la certificación bancaria
    When intento guardar la información
    Then el sistema muestra un error indicando que la certificación es obligatoria

  Scenario: Modificar cuenta bancaria verificada
    Given tengo una cuenta bancaria con estado "Verificada"
    When modifico algún dato de la información bancaria
    And guardo los cambios
    Then la información bancaria se actualiza
    And el estado de verificación cambia a "Pendiente"
    And se registra el cambio en el historial de auditoría
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
    Given el estado de mi cuenta bancaria es "Pendiente"
    When accedo a la sección de Información Bancaria
    Then veo el indicador de estado en color amarillo
    And veo el mensaje "La cuenta bancaria se encuentra en proceso de verificación. Mientras este proceso no finalice, no se podrán realizar transferencias."

  Scenario: Ver estado Verificada
    Given el estado de mi cuenta bancaria es "Verificada"
    When accedo a la sección de Información Bancaria
    Then veo el indicador de estado en color verde
    And el mensaje de bloqueo de transferencias no se muestra

  Scenario: Ver estado Rechazada
    Given el estado de mi cuenta bancaria es "Rechazada"
    When accedo a la sección de Información Bancaria
    Then veo el indicador de estado en color rojo
    And veo un mensaje indicando que debe corregir la información
```

---

### 7.8 Caso de uso: Bloqueo de pagos por verificación

```gherkin
Feature: Bloqueo de pagos por estado de verificación
  Como plataforma
  Quiero bloquear transferencias a cuentas no verificadas
  Para proteger contra fraudes y errores

  Scenario: Intentar transferencia con cuenta pendiente
    Given un Organizer tiene ventas pendientes de pago
    And su cuenta bancaria tiene estado "Pendiente"
    When el sistema intenta procesar una transferencia
    Then la transferencia no se ejecuta
    And queda en espera hasta que la cuenta sea verificada

  Scenario: Intentar transferencia con cuenta rechazada
    Given un Organizer tiene ventas pendientes de pago
    And su cuenta bancaria tiene estado "Rechazada"
    When el sistema intenta procesar una transferencia
    Then la transferencia no se ejecuta
    And el Organizer es notificado para corregir sus datos bancarios

  Scenario: Transferencia exitosa con cuenta verificada
    Given un Organizer tiene ventas pendientes de pago
    And su cuenta bancaria tiene estado "Verificada"
    When el sistema procesa una transferencia
    Then la transferencia se ejecuta normalmente
```

---

### 7.2 Reglas para escribir Gherkin

- Usar lenguaje de negocio, no técnico
- No mencionar endpoints, clases o tablas
- Cada `Then` debe ser verificable
- Evitar múltiples expectativas en un mismo `Then`
- Preferir escenarios pequeños y claros

---

## 8. Contratos funcionales (conceptuales)

> Describe QUÉ entra y QUÉ sale, sin definir formato técnico.

### 8.1 Entradas

**Tipo de entidad:**
- Selección única: "Persona Natural" o "Persona Jurídica"

**Información Legal - Persona Natural:**
- Nombre completo (obligatorio)
- Tipo de documento (obligatorio): Cédula de ciudadanía, Cédula extranjería
- Número de documento (obligatorio)
- Dirección fiscal (obligatorio)
- Copia de cédula (obligatorio): PDF, JPG o PNG

**Información Legal - Persona Jurídica:**
- Razón social (obligatorio)
- NIT (obligatorio)
- Dirección fiscal (obligatorio)
- RUT (obligatorio): PDF

**Datos de Contacto:**
- Email de contacto financiero (obligatorio)
- Teléfono principal (obligatorio)
- Dirección completa (obligatorio)

**Información Bancaria:**
- Titular de la cuenta (obligatorio)
- Banco o proveedor (obligatorio)
- Tipo de cuenta (obligatorio): Ahorros, Corriente, Billetera digital
- Número de cuenta (obligatorio)
- Certificación bancaria (obligatorio): PDF, JPG o PNG

### 8.2 Salidas

- Confirmación de guardado exitoso
- Estado de verificación de cuenta bancaria (Pendiente, Verificada, Rechazada)
- Mensajes informativos según estado

### 8.3 Errores de negocio

| Código lógico | Condición |
|---------------|-----------|
| ENTITY_TYPE_LOCKED | Intento de cambiar tipo de entidad ya guardado |
| MISSING_REQUIRED_FIELD | Campo obligatorio no completado |
| INVALID_FILE_FORMAT | Archivo cargado en formato no permitido |
| MISSING_ID_DOCUMENT | Cédula no cargada para Persona Natural |
| MISSING_RUT | RUT no cargado para Persona Jurídica |
| MISSING_BANK_CERTIFICATE | Certificación bancaria no cargada |
| INVALID_EMAIL_FORMAT | Email con formato inválido |
| PAYMENT_BLOCKED_PENDING | Intento de pago con cuenta en estado Pendiente |
| PAYMENT_BLOCKED_REJECTED | Intento de pago con cuenta en estado Rechazada |

---

## 9. Invariantes del sistema

> Condiciones que SIEMPRE deben cumplirse.

- Un Organizer solo puede tener una configuración de facturación activa
- El tipo de entidad no puede cambiar una vez guardado (sin intervención de Soporte)
- Siempre debe existir un estado de verificación para cuentas bancarias registradas
- Los pagos nunca se ejecutan a cuentas con estado diferente a "Verificada"
- Todo cambio en información bancaria debe quedar auditado

---

## 10. Casos límite y excepciones

- Organizer sin datos de registro previos: el autocompletado no tiene efecto
- Documentos con tamaño excesivo: definir límite máximo de archivo
- Múltiples intentos de carga de documentos: solo se conserva el último
- Cambio de banco que requiere nueva verificación: siempre vuelve a Pendiente
- Organizer con ventas pendientes y cuenta rechazada: pagos quedan retenidos

---

## 11. Seguridad y permisos

| Actor | Acción permitida | Acción prohibida |
|-------|------------------|------------------|
| Organizer | Ver y editar su propia configuración de facturación | Ver configuración de otros Organizers |
| Organizer | Cargar y reemplazar sus documentos | Eliminar documentos ya verificados |
| Sistema | Cambiar estado de verificación | Modificar datos del Organizer sin su acción |
| Soporte | Cambiar tipo de entidad (fuera de este módulo) | Acceder a documentos sin autorización |

---

## 12. No-objetivos explícitos

> Para evitar suposiciones de la AI.

- Este módulo NO ejecuta transferencias ni pagos
- Este módulo NO implementa el proceso de verificación de cuentas (backoffice)
- Este módulo NO permite múltiples cuentas bancarias
- Este módulo NO gestiona historial de pagos recibidos
- Este módulo NO incluye configuración de impuestos o retenciones
- Este módulo NO valida datos contra entidades externas (bancos, DIAN, etc.)

---

## 13. Versionado

- Versión: v1.0
- Fecha: 2025-12-17
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

## 15. Nota final para AI Agents

- ❌ No inferir comportamiento no especificado
- ❌ No modificar este archivo durante la implementación
- ✅ Usar este spec como base para `plan.md`, tests y validaciones
- ✅ Preguntar si algo no está explícitamente definido

