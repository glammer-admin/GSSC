

# 📄 Configuración de Facturación y Pagos

En el menu esta una sub seccion de settings/configuracion
**(Settings › Facturación y Pagos)**


👉 Recomiendo **“Facturación y Pagos”** porque cubre identidad + cuenta bancaria + transferencias.

---

## 🧭 Ubicación en la plataforma

**Ruta:**
`/settings/billing`

**Menú Settings (futuro):**

* Perfil (futuro – fuera de alcance)
* Facturación y Pagos ✅ (este documento)
* Página Pública / Tienda (futuro – fuera de alcance)
* Seguridad (futuro – fuera de alcance)
* Notificaciones (futuro – fuera de alcance)

---

## 1️⃣ Selector de Tipo de Organizer

**Campo obligatorio (solo una vez):**

* 🔘 Persona Natural
* 🔘 Persona Jurídica (Empresa)

⚠️ Una vez guardado **no se puede cambiar** sin soporte.

---

## 2️⃣ Optimización para Persona Natural

### 🔁 Usar datos del registro

Si el tipo es **Persona Natural**, mostrar al inicio:

☑️ **Usar los mismos datos de mi perfil de registro**

**Origen de datos:**

* `glam_users.name`
* `glam_users.phone_number`
* `glam_users.delivery_address`

**Comportamiento:**

* Al marcarlo → autocompleta campos
* Editable manualmente después
* No bloquea edición

👉 Esto reduce fricción y acelera el proceso.

---

## 3️⃣ Estructura del Formulario (Actualizada)

### Secciones finales:

1. Información Legal
2. Datos de Contacto
3. Información Bancaria
4. Documentos Soporte
5. Estado de Verificación

---

## 🟦 1. Información Legal

### 🔹 Persona Natural

* Nombre completo *
* Tipo de documento *

  * Cédula de ciudadanía
  * Cédula extranjería
* Número de documento *
* Dirección fiscal *

📎 **Documento obligatorio**

* 📤 **Cargar copia de la cédula** (PDF / JPG / PNG)

---

### 🔹 Persona Jurídica (Empresa)

**Datos de la Empresa**

* Razón social *
* NIT *
* Dirección fiscal *

📎 **Documento obligatorio**

* 📤 **Cargar RUT** (PDF)

❌ **Campos eliminados (según tu decisión):**

* País de constitución
* Fecha de constitución
* Actividad económica (CIIU)
* Tipo de empresa

✔️ Esto simplifica sin afectar pagos.

---

## 🟦 2. Datos de Contacto

* Email de contacto financiero *
* Teléfono principal *
* Dirección completa *

*(Si es persona natural y usó “usar datos del registro”, vienen precargados)*

---

## 🟦 3. Información Bancaria

*(Simplificada y alineada a tu alcance)*

### Datos requeridos

* Titular de la cuenta *
* Banco o proveedor *
* Tipo de cuenta *

  * Ahorros
  * Corriente
  * Billetera digital
* Número de cuenta *

❌ **Campos eliminados**

* País del banco
* Moneda
* ¿Cuenta propia?
* IBAN / SWIFT

---

## 🟦 4. Documentos Soporte

### Certificación de cuenta (obligatoria)

📤 **Cargar certificación bancaria o prueba de propiedad de cuenta**

**Acepta:**

* Certificación bancaria
* Comprobante de billetera digital
* Pantallazo oficial con nombre + número de cuenta

**Usos:**

* Bancos tradicionales
* Billeteras digitales de bajo monto

### ⚠️ Comportamiento de carga de documentos (Importante)

Los documentos **NO se suben inmediatamente** al seleccionarlos. El flujo es:

1. Usuario selecciona archivo → se almacena en memoria (preview visible)
2. Usuario completa todo el formulario
3. Usuario hace clic en "Guardar"
4. **Todos los documentos se envían junto con el formulario**
5. El servidor sube los documentos y guarda los datos de forma atómica

**Si falla la subida de algún documento:**
* Se eliminan los documentos ya subidos (rollback)
* No se guarda ningún dato en la base de datos
* Se muestra error al usuario
* El usuario puede reintentar

👉 Esto garantiza consistencia: o se guarda todo, o no se guarda nada.

---

## 🟦 5. Estado de Verificación (Muy importante)

### Indicador visible en la sección bancaria

**Estado de la cuenta:**

* 🟡 **Pendiente de verificación**
* 🟢 **Verificada**
* 🔴 **Rechazada**

📌 **Texto informativo obligatorio:**

> *“La cuenta bancaria se encuentra en proceso de verificación.
> Mientras este proceso no finalice, no se podrán realizar transferencias.”*

### Comportamiento

* Al guardar o modificar datos bancarios → estado vuelve a **Pendiente**
* Cambios quedan auditados
* Pagos bloqueados hasta **Verificada**

---

## 6️⃣ Validaciones Clave (Actualizadas)

### Frontend

* Documento obligatorio según tipo
* Certificación bancaria obligatoria
* Campos precargados editables
* Mensajes claros de estado
* **Validación de documentos antes de enviar** (formato, tamaño)

### Backend (BFF)

* Subida atómica de documentos con rollback
* No liberar pagos si:

  * `bank_account.status !== verified`
* Historial de cambios de cuenta
* Validación manual o automática futura
* Error `DOCUMENT_UPLOAD_FAILED` si falla subida

---

## 7️⃣ Modelo de Datos Ajustado

```ts
BillingSettings {
  organizer_id: uuid
  entity_type: "natural" | "legal"

  legal_info: {
    name: string
    document_type?: string
    document_number?: string
    tax_id?: string
    fiscal_address: Address
  }

  contact_info: {
    email: string
    phone: string
    address: Address
  }

  bank_account: {
    holder_name: string
    bank_name: string
    account_type: "savings" | "checking" | "wallet"
    account_number: string
    status: "pending" | "verified" | "rejected"
  }

  documents: {
    id_document?: FileRef
    rut?: FileRef
    bank_certificate: FileRef
  }

}
```

---

## 8️⃣ Claridad de Alcance (Importante)

✔️ **Incluido**

* Configuración legal y bancaria
* Validación para pagos
* Indicador de verificación

❌ **Excluido**

* Página pública / microsite
* Configuración de tienda
* Catálogo de productos

👉 Esto permite que el menú **Settings** crezca sin mezclar responsabilidades.

---
.
