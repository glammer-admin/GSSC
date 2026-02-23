# GSSC Data Model

Documentación completa del modelo de datos de la aplicación GSSC (Glam Sports Sales Commerce).

## Índice

1. [Resumen General](#resumen-general)
2. [Esquema de Base de Datos](#esquema-de-base-de-datos)
3. [Tipos Enumerados (ENUMs)](#tipos-enumerados-enums)
4. [Tablas](#tablas)
5. [Vistas](#vistas)
6. [Relaciones](#relaciones)
7. [Storage Buckets](#storage-buckets)
8. [Diagrama ER](#diagrama-er)

---

## Resumen General

El modelo de datos está organizado en el esquema `gssc_db` y cubre los siguientes dominios funcionales:

| Dominio | Tablas | Descripción |
|---------|--------|-------------|
| **Usuarios** | `glam_users` | Gestión de usuarios de la plataforma |
| **Facturación** | `billing_profiles`, `bank_accounts`, `billing_documents` | Perfiles fiscales y cuentas bancarias de organizadores |
| **Proyectos** | `glam_projects`, `glam_project_config_changes` | Proyectos comerciales y auditoría de cambios |
| **Productos** | `product_categories`, `personalization_modules`, `product_attributes`, `product_attribute_options`, `glam_products`, `project_products`, `product_images` | Catálogos, atributos, productos por proyecto e imágenes |
| **Ventas** | `promotions`, `volume_discount_rules`, `sales`, `sale_items`, `sale_breakdowns`, `sale_promotions`, `sale_taxes`, `sale_billing_references` | Ledger de ventas, promociones y desglose monetario |
| **Vistas** | `project_sales_summary` | Resumen de ventas por proyecto para dashboard "Mis proyectos" |

---

## Esquema de Base de Datos

```
Schema: gssc_db
Descripción: Esquema principal del proyecto GSSC
```

---

## Tipos Enumerados (ENUMs)

### Facturación

#### `entity_type`
Tipo de entidad fiscal.

| Valor | Descripción |
|-------|-------------|
| `natural` | Persona natural |
| `legal` | Persona jurídica |

#### `document_type`
Tipo de documento de identificación.

| Valor | Descripción |
|-------|-------------|
| `CC` | Cédula de Ciudadanía |
| `CE` | Cédula de Extranjería |
| `PASSPORT` | Pasaporte |

#### `account_type`
Tipo de cuenta bancaria.

| Valor | Descripción |
|-------|-------------|
| `savings` | Cuenta de ahorros |
| `checking` | Cuenta corriente |
| `wallet` | Billetera digital |

#### `bank_account_status`
Estado de verificación de cuenta bancaria.

| Valor | Descripción |
|-------|-------------|
| `pending` | Pendiente de verificación |
| `verified` | Verificada |
| `rejected` | Rechazada |

#### `billing_document_type`
Tipo de documento de facturación almacenado.

| Valor | Descripción |
|-------|-------------|
| `id_document` | Documento de identificación |
| `rut` | RUT |
| `bank_certificate` | Certificado bancario |

### Proyectos

#### `project_status`
Estados posibles de un proyecto.

| Valor | Descripción |
|-------|-------------|
| `draft` | Borrador |
| `active` | Activo |
| `paused` | Pausado |
| `finished` | Finalizado |

#### `project_type`
Tipos de proyecto.

| Valor | Descripción |
|-------|-------------|
| `sports_team` | Equipo deportivo |
| `educational_institution` | Institución educativa |
| `company` | Empresa |
| `group` | Grupo |
| `other` | Otro |

#### `delivery_type`
Métodos de entrega.

| Valor | Descripción |
|-------|-------------|
| `organizer_location` | Ubicación del organizador |
| `customer_home` | Domicilio del cliente |
| `glam_urban_pickup` | Punto de retiro Glam Urban |

#### `delivery_periodicity`
Periodicidad de entregas.

| Valor | Descripción |
|-------|-------------|
| `weekly` | Semanal |
| `biweekly` | Quincenal |
| `monthly` | Mensual |
| `immediately` | Inmediata |

#### `delivery_fee_type`
Tipo de tarifa de envío.

| Valor | Descripción |
|-------|-------------|
| `charged_to_customer` | Cobrada al cliente |
| `included_in_price` | Incluida en el precio |

#### `config_change_field`
Campos de configuración que se auditan.

| Valor | Descripción |
|-------|-------------|
| `commission_percent` | Porcentaje de comisión |
| `packaging_custom` | Packaging personalizado |
| `delivery_type` | Tipo de entrega |
| `delivery_config` | Configuración de entrega |

### Productos

#### `product_status`
Estados posibles de un producto.

| Valor | Descripción |
|-------|-------------|
| `draft` | Borrador (en configuración) |
| `active` | Publicado |
| `inactive` | Desactivado |

#### `visual_mode`
Modos de representación visual.

| Valor | Descripción |
|-------|-------------|
| `upload_images` | Carga manual de imágenes |
| `online_editor` | Editor online |
| `designer_assisted` | Diseño asistido por Glam Urban |

#### `personalization_module_code`
Códigos de módulos de personalización.

| Valor | Descripción |
|-------|-------------|
| `sizes` | Selección de talla |
| `numbers` | Número deportivo |
| `names` | Nombre personalizado |
| `age_categories` | Categoría de edad |

#### `product_image_source`
Origen de las imágenes de producto.

| Valor | Descripción |
|-------|-------------|
| `upload` | Cargada manualmente |
| `online_editor` | Generada por editor |
| `designer_assisted` | Generada por diseñador |

### Ventas

#### `sale_status`
Estados posibles de una venta.

| Valor | Descripción |
|-------|-------------|
| `created` | Creada |
| `paid` | Pagada |
| `cancelled` | Cancelada |
| `refunded` | Reembolsada |

#### `sale_channel`
Canal de venta (restringido a web en esta iteración).

| Valor | Descripción |
|-------|-------------|
| `web` | Web |

#### `promotion_type`
Tipo de promoción.

| Valor | Descripción |
|-------|-------------|
| `percentage` | Porcentaje |
| `fixed_amount` | Monto fijo |
| `volume` | Por volumen/cantidad |
| `free_shipping` | Envío gratis |

#### `promotion_scope`
Alcance de la promoción.

| Valor | Descripción |
|-------|-------------|
| `global` | Global |
| `project` | Por proyecto |
| `product` | Por producto |

---

## Tablas

### 1. `glam_users` - Usuarios

Tabla de usuarios de la plataforma Glam.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único del usuario |
| `name` | TEXT | YES | - | Nombre del usuario |
| `email` | TEXT | NO | - | Email único del usuario |
| `role` | TEXT[] | YES | `ARRAY['buyer']` | Roles del usuario (array para múltiples roles) |
| `delivery_address` | JSONB | YES | - | Dirección de entrega en formato JSON |
| `phone_number` | TEXT | YES | - | Número de teléfono |
| `status` | TEXT | YES | `'Active'` | Estado: `Active`, `Suspended`, `Inactive` |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | Fecha de última actualización |

**Índices:**
- `idx_glam_users_email` - Búsquedas por email
- `idx_glam_users_status` - Filtros por estado

**Constraints:**
- `PRIMARY KEY (id)`
- `UNIQUE (email)`
- `CHECK (status IN ('Active','Suspended','Inactive'))`

---

### 2. `billing_profiles` - Perfiles de Facturación

Perfiles de facturación para usuarios con rol organizer.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único del perfil |
| `user_id` | UUID | NO | - | FK → `glam_users.id` |
| `entity_type` | `entity_type` | NO | - | Tipo de entidad: `natural` o `legal` |
| `full_name` | TEXT | NO | - | Nombre completo o razón social |
| `document_type` | `document_type` | NO | - | Tipo de documento: `CC`, `CE`, `PASSPORT` |
| `document_number` | TEXT | NO | - | Número de documento |
| `tax_id` | TEXT | YES | - | NIT (obligatorio para `entity_type = legal`) |
| `fiscal_address` | TEXT | NO | - | Dirección fiscal completa |
| `contact_email` | TEXT | NO | - | Email de contacto financiero |
| `contact_phone` | TEXT | NO | - | Teléfono de contacto |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | Fecha de última actualización |

**Índices:**
- `idx_billing_profiles_user_id` - JOINs con usuarios

**Constraints:**
- `PRIMARY KEY (id)`
- `UNIQUE (user_id)`
- `FOREIGN KEY (user_id) REFERENCES glam_users(id) ON DELETE CASCADE`
- `chk_tax_id_required_for_legal` - NIT obligatorio si `entity_type = 'legal'`
- `chk_document_number_format` - CC/CE: 6-10 dígitos; PASSPORT: mín 5 caracteres
- `chk_tax_id_format` - NIT: 9-10 dígitos
- `chk_contact_email_format` - Formato email válido
- `chk_contact_phone_format` - Teléfono: opcional +, 7-15 dígitos

---

### 3. `bank_accounts` - Cuentas Bancarias

Cuentas bancarias de usuarios organizer (versionadas).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único de la cuenta |
| `user_id` | UUID | NO | - | FK → `glam_users.id` |
| `bank_name` | TEXT | NO | - | Nombre del banco o billetera digital |
| `account_type` | `account_type` | NO | - | Tipo: `savings`, `checking`, `wallet` |
| `account_number` | TEXT | NO | - | Número de cuenta bancaria |
| `status` | `bank_account_status` | NO | `'pending'` | Estado: `pending`, `verified`, `rejected` |
| `rejection_reason` | TEXT | YES | - | Motivo de rechazo (obligatorio si rejected) |
| `verified_at` | TIMESTAMPTZ | YES | - | Fecha de verificación |
| `is_active` | BOOLEAN | NO | `false` | Indica si es la cuenta activa |
| `is_preferred` | BOOLEAN | NO | `false` | Indica si es la cuenta preferida |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | Fecha de última actualización |

**Índices:**
- `idx_bank_accounts_user_id` - Búsquedas por usuario
- `idx_bank_accounts_user_active` - Unique parcial: una cuenta activa por usuario
- `idx_bank_accounts_user_preferred` - Unique parcial: una cuenta preferida por usuario

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (user_id) REFERENCES glam_users(id) ON DELETE CASCADE`
- `chk_account_number_format` - Número de cuenta: 6-20 dígitos
- `chk_rejection_reason_required` - Razón obligatoria si `status = 'rejected'`
- `chk_verified_at_required` - `verified_at` obligatorio si `status = 'verified'`
- `chk_active_must_be_verified` - Solo cuentas verificadas pueden estar activas

**Triggers:**
- `trg_bank_accounts_reset_status` - Resetea status a pending al modificar datos sensibles
- `trg_bank_accounts_unset_preferred` - Desmarca otras cuentas preferidas
- `trg_bank_accounts_unset_preferred_insert` - Desmarca otras cuentas preferidas en INSERT

---

### 4. `billing_documents` - Documentos de Facturación

Referencias a documentos sensibles almacenados en Supabase Storage.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único del documento |
| `user_id` | UUID | NO | - | FK → `glam_users.id` |
| `document_type` | `billing_document_type` | NO | - | Tipo: `id_document`, `rut`, `bank_certificate` |
| `document_name` | TEXT | NO | - | Nombre lógico/descriptivo del documento |
| `storage_bucket` | TEXT | NO | - | Nombre del bucket en Storage |
| `storage_path` | TEXT | NO | - | Ruta interna del archivo |
| `created_at` | TIMESTAMPTZ | YES | `now()` | Fecha de carga |

**Índices:**
- `idx_billing_documents_user_id` - Búsquedas por usuario
- `idx_billing_documents_user_type` - Búsqueda por usuario y tipo

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (user_id) REFERENCES glam_users(id) ON DELETE CASCADE`

---

### 5. `glam_projects` - Proyectos

Proyectos comerciales creados por organizadores.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador interno único |
| `public_code` | TEXT | NO | - | Código visible (formato: `PRJ-XXXXX`) |
| `name` | TEXT | NO | - | Nombre del proyecto (único, no editable) |
| `description` | TEXT | YES | - | Descripción corta |
| `type` | `project_type` | NO | - | Tipo de proyecto |
| `status` | `project_status` | NO | `'draft'` | Estado del proyecto |
| `logo_url` | TEXT | YES | - | URL del logo en Storage |
| `logo_is_default` | BOOLEAN | NO | `true` | Si usa avatar por defecto |
| `organizer_id` | UUID | NO | - | FK → `glam_users.id` (propietario) |
| `created_by` | UUID | NO | - | FK → `glam_users.id` |
| `updated_by` | UUID | NO | - | FK → `glam_users.id` |
| `commission_percent` | DECIMAL(5,2) | NO | - | Porcentaje de comisión (0-100) |
| `packaging_custom` | BOOLEAN | NO | `false` | Si el packaging es personalizado |
| `delivery_type` | `delivery_type` | NO | - | Método de entrega |
| `delivery_config` | JSONB | YES | - | Configuración según `delivery_type` |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Fecha de última actualización |

**Índices:**
- `idx_glam_projects_organizer_id` - Búsquedas por organizador
- `idx_glam_projects_status` - Filtros por estado
- `idx_glam_projects_type` - Filtros por tipo
- `idx_glam_projects_public_code` - Búsquedas por código público
- `idx_glam_projects_created_at` - Ordenamiento por fecha

**Constraints:**
- `PRIMARY KEY (id)`
- `UNIQUE (public_code)`
- `UNIQUE (name)`
- `FOREIGN KEY (organizer_id) REFERENCES glam_users(id)`
- `FOREIGN KEY (created_by) REFERENCES glam_users(id)`
- `FOREIGN KEY (updated_by) REFERENCES glam_users(id)`
- `chk_commission_percent_range` - Comisión entre 0 y 100
- `chk_public_code_format` - Formato `PRJ-[A-Z0-9]{5}`
- `chk_name_not_empty` - Nombre no vacío
- `chk_logo_url_format` - URL válida (http/https)
- `chk_logo_consistency` - Consistencia entre `logo_url` y `logo_is_default`
- `chk_delivery_config_organizer_location` - Valida config para ubicación organizador
- `chk_delivery_config_customer_home` - Valida config para domicilio cliente
- `chk_delivery_config_glam_urban_pickup` - Valida config para retiro Glam Urban

**Estructura de `delivery_config`:**

Para `organizer_location`:
```json
{
  "address": "Dirección completa",
  "periodicity": "weekly|biweekly|monthly|immediately"
}
```

Para `customer_home`:
```json
{
  "delivery_fee_type": "charged_to_customer|included_in_price",
  "delivery_fee_value": 15000  // Opcional si delivery_fee_type = 'included_in_price'
}
```

Para `glam_urban_pickup`:
```json
null  // o {}
```

---

### 6. `glam_project_config_changes` - Historial de Cambios

Historial de cambios en la configuración de proyectos para auditoría.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único del registro |
| `project_id` | UUID | NO | - | FK → `glam_projects.id` |
| `field_name` | `config_change_field` | NO | - | Campo modificado |
| `old_value` | JSONB | YES | - | Valor anterior (null en creación) |
| `new_value` | JSONB | NO | - | Nuevo valor |
| `changed_by` | UUID | NO | - | FK → `glam_users.id` |
| `changed_at` | TIMESTAMPTZ | NO | `now()` | Fecha y hora del cambio |
| `reason` | TEXT | YES | - | Motivo del cambio |

**Índices:**
- `idx_project_config_changes_project_id` - Búsquedas por proyecto
- `idx_project_config_changes_changed_at` - Ordenamiento por fecha
- `idx_project_config_changes_field_name` - Búsqueda por proyecto y campo

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (project_id) REFERENCES glam_projects(id) ON DELETE CASCADE`
- `FOREIGN KEY (changed_by) REFERENCES glam_users(id)`

---

### 7. `product_categories` - Categorías de Producto

Catálogo maestro de categorías (gestionado por plataforma).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único |
| `code` | TEXT | NO | - | Código único e inmutable |
| `name` | TEXT | NO | - | Nombre legible |
| `description` | TEXT | YES | - | Descripción funcional |
| `allowed_modules` | `personalization_module_code[]` | NO | - | Módulos de personalización permitidos |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Fecha de última actualización |

**Índices:**
- `idx_product_categories_code` - Búsquedas por código

**Constraints:**
- `PRIMARY KEY (id)`
- `UNIQUE (code)`
- `chk_category_code_not_empty` - Código no vacío
- `chk_category_name_not_empty` - Nombre no vacío
- `chk_allowed_modules_not_empty` - Al menos un módulo

**Datos Semilla:**

| Código | Nombre | Módulos |
|--------|--------|---------|
| `jersey` | Camiseta/Jersey | sizes, numbers, names |
| `shorts` | Shorts/Pantalón corto | sizes |
| `tracksuit` | Conjunto deportivo | sizes, age_categories |
| `accessories` | Accesorios | sizes |
| `mugs` | Mugs | sizes |
| `termos` | Termos | sizes |

---

### 8. `personalization_modules` - Módulos de Personalización

Catálogo cerrado de módulos de personalización (definidos por plataforma).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único |
| `code` | `personalization_module_code` | NO | - | Código único (ENUM) |
| `name` | TEXT | NO | - | Nombre legible |
| `description` | TEXT | YES | - | Descripción funcional |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Fecha de última actualización |

**Constraints:**
- `PRIMARY KEY (id)`
- `UNIQUE (code)`

**Datos Semilla:**

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `sizes` | Selección de talla | Permite elegir talla (XS, S, M, L, XL, etc.) |
| `numbers` | Número deportivo | Permite agregar número en la espalda (1-99) |
| `names` | Nombre personalizado | Permite agregar nombre en la espalda |
| `age_categories` | Categoría de edad | Permite seleccionar categoría (infantil, juvenil, adulto) |

---

### 9. `product_attributes` - Catálogo de Atributos de Producto

Catálogo maestro de tipos de atributos de producto. Los atributos son propiedades del producto físico que el comprador selecciona (ej. calidad, color, material). Reutilizable entre múltiples productos mediante junction table M:N.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único |
| `code` | TEXT | NO | - | Código único (ej. `quality`, `color`, `material`) |
| `name` | TEXT | NO | - | Nombre legible (ej. Calidad, Color) |
| `description` | TEXT | YES | - | Descripción del atributo |
| `is_active` | BOOLEAN | NO | `true` | Si está disponible para asignación a productos |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Fecha de última actualización |

**Índices:**
- `idx_product_attributes_code` - Búsquedas por código
- `idx_product_attributes_is_active` - Filtros por activo

**Constraints:**
- `PRIMARY KEY (id)`
- `UNIQUE (code)`
- `chk_product_attributes_code_not_empty` - Código no vacío
- `chk_product_attributes_name_not_empty` - Nombre no vacío

**Datos Semilla:**

| code | name | description |
|------|------|-------------|
| `quality` | Calidad | Nivel de calidad del producto |
| `color` | Color | Color del producto |
| `material` | Material | Material de fabricación del producto |

---

### 10. `product_attribute_options` - Opciones de Atributos

Opciones disponibles por atributo de producto. Cada atributo tiene múltiples opciones (ej. para "calidad" → estándar, premium).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único |
| `attribute_id` | UUID | NO | - | FK → `product_attributes.id` |
| `code` | TEXT | NO | - | Código dentro del atributo (ej. `estandar`, `premium`) |
| `name` | TEXT | NO | - | Nombre legible (ej. Estándar, Premium) |
| `display_order` | INTEGER | NO | `1` | Orden de visualización |
| `is_active` | BOOLEAN | NO | `true` | Si la opción está disponible |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Fecha de última actualización |

**Índices:**
- `idx_product_attribute_options_attribute_id` - Búsquedas por atributo
- `idx_product_attribute_options_is_active` - Filtros por activo

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (attribute_id) REFERENCES product_attributes(id) ON DELETE CASCADE`
- `UNIQUE (attribute_id, code)` - No duplicar códigos por atributo
- `chk_attribute_option_code_not_empty` - Código no vacío
- `chk_attribute_option_name_not_empty` - Nombre no vacío
- `chk_attribute_option_display_order_positive` - display_order >= 1

**Datos Semilla:**

| Atributo | code | name | display_order |
|----------|------|------|---------------|
| quality | `estandar` | Estándar | 1 |
| quality | `premium` | Premium | 2 |
| color | `blanco` | Blanco | 1 |
| color | `negro` | Negro | 2 |
| color | `azul` | Azul | 3 |
| color | `rojo` | Rojo | 4 |
| material | `ceramica` | Cerámica | 1 |
| material | `acero_inoxidable` | Acero Inoxidable | 2 |
| material | `plastico_bpa_free` | Plástico BPA Free | 3 |

---

### 11. `glam_products` - Catálogo Maestro de Productos Glam Urban

Lista de productos que Glam Urban ofrece como proveedor (mugs, termos, etc.). El usuario selecciona primero una categoría y luego ve los productos de esa categoría. Los atributos disponibles y sus modificadores de precio se almacenan en `attributes_config` (JSONB).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único |
| `code` | TEXT | NO | - | Código único (ej. `mug-9oz`, `termo-600ml`) |
| `name` | TEXT | NO | - | Nombre legible |
| `description` | TEXT | YES | - | Descripción |
| `category_id` | UUID | NO | - | FK → `product_categories.id` |
| `base_price` | NUMERIC(12,2) | NO | - | Precio base |
| `attributes_config` | JSONB | NO | `'{}'` | Opciones de atributos disponibles con modificadores de precio |
| `image_url` | TEXT | YES | - | URL de imagen del producto en Storage (`product-images/glam_products/`) |
| `is_active` | BOOLEAN | NO | `true` | Si el producto está disponible en catálogo |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Fecha de última actualización |

**Índices:**
- `idx_glam_products_code` - Búsquedas por código
- `idx_glam_products_category_id` - Productos por categoría
- `idx_glam_products_is_active` - Filtros por activo

**Constraints:**
- `PRIMARY KEY (id)`
- `UNIQUE (code)`
- `FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE RESTRICT`
- `chk_glam_products_code_not_empty` - Código no vacío
- `chk_glam_products_name_not_empty` - Nombre no vacío
- `chk_glam_products_base_price_positive` - Precio > 0
- `chk_glam_products_attributes_config_object` - attributes_config debe ser objeto JSON

**Estructura de `attributes_config`:**
```json
{
  "quality": {
    "options": ["estándar", "premium"],
    "price_modifier": {"estándar": 0, "premium": 3000}
  }
}
```

**Datos semilla:** Mug 9 oz, Mug 15 oz, Termo 600 ml, Termo 1000 ml (categorías `mugs`, `termos`).

---

### 12. `project_products` - Productos de Proyecto

Productos configurados por organizadores dentro de proyectos. Siempre referencian un producto del catálogo maestro (`glam_product_id`, obligatorio). La categoría se hereda del `glam_product`. La personalización y los atributos seleccionados se almacenan como JSONB inmutable.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único |
| `project_id` | UUID | NO | - | FK → `glam_projects.id` |
| `glam_product_id` | UUID | NO | - | FK → `glam_products.id` (producto del catálogo del que deriva, obligatorio) |
| `name` | TEXT | NO | - | Nombre comercial del producto |
| `description` | TEXT | YES | - | Descripción comercial |
| `status` | `product_status` | NO | `'draft'` | Estado: `draft`, `active`, `inactive` |
| `price` | NUMERIC(12,2) | NO | - | Precio del producto |
| `personalization_config` | JSONB | NO | - | Configuración de módulos de personalización (inmutable) |
| `selected_attributes` | JSONB | NO | `'{}'` | Atributos seleccionados del producto (inmutable) |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Fecha de última actualización |

**Índices:**
- `idx_project_products_project_id` - Búsquedas por proyecto
- `idx_project_products_glam_product_id` - Búsquedas por producto catálogo
- `idx_project_products_status` - Filtros por estado
- `idx_project_products_created_at` - Ordenamiento por fecha

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (project_id) REFERENCES glam_projects(id) ON DELETE RESTRICT`
- `FOREIGN KEY (glam_product_id) REFERENCES glam_products(id) ON DELETE RESTRICT`
- `chk_product_name_not_empty` - Nombre no vacío
- `chk_price_positive` - Precio > 0
- `chk_personalization_config_is_object` - Config debe ser objeto JSON
- `chk_selected_attributes_is_object` - Atributos seleccionados debe ser objeto JSON

**Estructura de `personalization_config`:**
```json
{
  "sizes": {
    "enabled": true,
    "options": ["XS", "S", "M", "L", "XL", "XXL"],
    "price_adjustment": 0
  },
  "numbers": {
    "enabled": true,
    "min": 1,
    "max": 99,
    "price_adjustment": 5000
  },
  "names": {
    "enabled": true,
    "max_length": 15,
    "price_adjustment": 8000
  }
}
```

**Estructura de `selected_attributes`:**
```json
{
  "quality": {
    "selected_option": "premium",
    "price_modifier": 3000
  },
  "color": {
    "selected_option": "blanco",
    "price_modifier": 0
  }
}
```

---

### 13. `product_images` - Imágenes de Producto

Imágenes finales que se muestran al comprador (mínimo 3 por producto).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único |
| `product_id` | UUID | NO | - | FK → `project_products.id` |
| `url` | TEXT | NO | - | URL de la imagen en Storage |
| `position` | INTEGER | NO | - | Orden visual (1, 2, 3, ...) |
| `source` | `product_image_source` | NO | - | Origen: `upload`, `online_editor`, `designer_assisted` |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Fecha de última actualización |

**Índices:**
- `idx_product_images_product_id` - Búsquedas por producto
- `idx_product_images_position` - Ordenamiento por posición

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (product_id) REFERENCES project_products(id) ON DELETE CASCADE`
- `UNIQUE (product_id, position)` - No duplicar posiciones
- `chk_image_url_format` - URL http/https válida
- `chk_image_position_positive` - Posición >= 1

---

### 14. `promotions` - Promociones

Catálogo maestro de promociones (descuentos, envío gratis, etc.).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único de la promoción |
| `code` | TEXT | YES | - | Código opcional de la promoción (ej. cupón) |
| `name` | TEXT | NO | - | Nombre de la promoción |
| `description` | TEXT | YES | - | Descripción opcional |
| `promotion_type` | `promotion_type` | NO | - | Tipo: `percentage`, `fixed_amount`, `volume`, `free_shipping` |
| `scope` | `promotion_scope` | NO | - | Alcance: `global`, `project`, `product` |
| `rules` | JSONB | YES | - | Reglas flexibles por tipo |
| `is_active` | BOOLEAN | NO | `true` | Si la promoción está activa |
| `start_date` | TIMESTAMPTZ | NO | - | Fecha de inicio de vigencia |
| `end_date` | TIMESTAMPTZ | NO | - | Fecha de fin de vigencia |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Fecha de última actualización |

**Índices:**
- `idx_promotions_code` - Unique parcial por código (WHERE code IS NOT NULL)
- `idx_promotions_scope` - Filtros por alcance
- `idx_promotions_dates` - Búsqueda por rango de fechas
- `idx_promotions_is_active` - Filtros por activa

**Constraints:**
- `PRIMARY KEY (id)`
- `chk_promotions_end_after_start` - `end_date >= start_date`
- `chk_promotions_name_not_empty` - Nombre no vacío

**Triggers:**
- `trg_promotions_updated_at` - Actualiza `updated_at` en UPDATE

---

### 15. `volume_discount_rules` - Reglas de Descuento por Cantidad

Reglas de descuento por cantidad asociadas a promociones de tipo `volume`.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único |
| `promotion_id` | UUID | NO | - | FK → `promotions.id` |
| `min_quantity` | INTEGER | NO | - | Cantidad mínima para aplicar el descuento |
| `max_quantity` | INTEGER | YES | - | Cantidad máxima (null = sin tope) |
| `discount_value` | NUMERIC(12,2) | NO | - | Valor del descuento aplicado |

**Índices:**
- `idx_volume_discount_rules_promotion_id` - Búsquedas por promoción

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE`
- `chk_volume_discount_min_quantity_non_negative` - `min_quantity >= 0`
- `chk_volume_discount_max_quantity` - `max_quantity IS NULL OR max_quantity >= min_quantity`
- `chk_volume_discount_value_non_negative` - `discount_value >= 0`

---

### 16. `sales` - Ventas

Ledger financiero y comercial; ventas web GSSC (inmutables una vez creadas).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único |
| `public_code` | TEXT | NO | - | Código visible de la orden (único) |
| `project_id` | UUID | NO | - | FK → `glam_projects.id` |
| `organizer_id` | UUID | NO | - | FK → `glam_users.id` (organizador al momento de la venta) |
| `buyer_id` | UUID | NO | - | FK → `glam_users.id` (comprador) |
| `sale_status` | `sale_status` | NO | `'created'` | Estado: `created`, `paid`, `cancelled`, `refunded` |
| `sale_channel` | `sale_channel` | NO | `'web'` | Canal de venta |
| `currency` | TEXT | NO | - | Moneda |
| `country` | TEXT | YES | - | País |
| `buyer_snapshot` | JSONB | NO | - | Snapshot del comprador: nombre, email, teléfono |
| `delivery_address_snapshot` | JSONB | YES | - | Dirección de entrega al momento de la venta |
| `organizer_snapshot` | JSONB | YES | - | Snapshot del organizador: nombre, documento fiscal |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Fecha de creación |
| `paid_at` | TIMESTAMPTZ | YES | - | Fecha en que se confirmó el pago (null hasta paid) |

**Índices:**
- `idx_sales_public_code` - Búsquedas por código público
- `idx_sales_project_id` - Búsquedas por proyecto
- `idx_sales_organizer_id` - Búsquedas por organizador
- `idx_sales_buyer_id` - Búsquedas por comprador
- `idx_sales_status` - Filtros por estado
- `idx_sales_created_at` - Ordenamiento por fecha (DESC)
- `idx_sales_paid_at` - Filtros por fecha de pago

**Constraints:**
- `PRIMARY KEY (id)`
- `UNIQUE (public_code)`
- `FOREIGN KEY (project_id) REFERENCES glam_projects(id) ON DELETE RESTRICT`
- `FOREIGN KEY (organizer_id) REFERENCES glam_users(id)`
- `FOREIGN KEY (buyer_id) REFERENCES glam_users(id)`
- `chk_sales_public_code_not_empty` - Código no vacío
- `chk_sales_currency_not_empty` - Moneda no vacía
- `chk_sales_paid_at_implies_status` - `paid_at` solo si `sale_status = 'paid'`

---

### 17. `sale_items` - Ítems de Venta

Ítems de producto comprados en una venta; snapshot inmutable de precios y personalización.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único |
| `sale_id` | UUID | NO | - | FK → `sales.id` |
| `product_id` | UUID | NO | - | FK → `project_products.id` |
| `product_name` | TEXT | NO | - | Nombre del producto al momento de la venta |
| `base_unit_price` | NUMERIC(12,2) | NO | - | Precio base unitario al momento de la venta |
| `final_unit_price` | NUMERIC(12,2) | NO | - | Precio final unitario (tras descuentos) |
| `quantity` | INTEGER | NO | - | Cantidad |
| `subtotal` | NUMERIC(12,2) | NO | - | Subtotal del ítem |
| `personalization_snapshot` | JSONB | YES | - | Datos de personalización aplicados |
| `personalization_extra_cost` | NUMERIC(12,2) | NO | `0` | Costo adicional por personalización |

**Índices:**
- `idx_sale_items_sale_id` - Búsquedas por venta
- `idx_sale_items_product_id` - Búsquedas por producto

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE`
- `FOREIGN KEY (product_id) REFERENCES project_products(id) ON DELETE RESTRICT`
- `chk_sale_items_quantity_positive` - `quantity > 0`
- `chk_sale_items_prices_non_negative` - Precios y subtotal >= 0

---

### 18. `sale_breakdowns` - Desglose de Venta

Desglose monetario completo de una venta (relación 1:1 con `sales`).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `sale_id` | UUID | NO | - | PK/FK → `sales.id` |
| `products_subtotal` | NUMERIC(12,2) | NO | - | Subtotal de productos |
| `discount_total` | NUMERIC(12,2) | NO | `0` | Total de descuentos aplicados |
| `taxable_base` | NUMERIC(12,2) | NO | - | Base imponible |
| `tax_amount` | NUMERIC(12,2) | NO | `0` | Total de impuestos |
| `shipping_cost` | NUMERIC(12,2) | NO | `0` | Costo de envío |
| `total_paid` | NUMERIC(12,2) | NO | - | Total pagado por el comprador |
| `organizer_commission_amount` | NUMERIC(12,2) | NO | - | Comisión del organizador |
| `platform_commission_amount` | NUMERIC(12,2) | NO | - | Comisión de la plataforma |
| `net_to_organizer` | NUMERIC(12,2) | NO | - | Neto que recibe el organizador |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Fecha de creación |

**Constraints:**
- `PRIMARY KEY (sale_id)`
- `FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE`
- `chk_sale_breakdowns_totals_non_negative` - Todos los montos >= 0

---

### 19. `sale_promotions` - Promociones Aplicadas a Ventas

Registro de promociones aplicadas a una venta o a un ítem.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único |
| `sale_id` | UUID | NO | - | FK → `sales.id` |
| `sale_item_id` | UUID | YES | - | FK → `sale_items.id` (null = descuento a nivel venta) |
| `promotion_id` | UUID | NO | - | FK → `promotions.id` |
| `discount_amount` | NUMERIC(12,2) | NO | - | Monto del descuento aplicado |
| `applied_rule_snapshot` | JSONB | YES | - | Snapshot de la regla aplicada para auditoría |

**Índices:**
- `idx_sale_promotions_sale_id` - Búsquedas por venta
- `idx_sale_promotions_promotion_id` - Búsquedas por promoción

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE`
- `FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE`
- `FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE RESTRICT`
- `chk_sale_promotions_discount_non_negative` - `discount_amount >= 0`

---

### 20. `sale_taxes` - Impuestos por Venta

Impuestos aplicados a una venta (ej. IVA).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único |
| `sale_id` | UUID | NO | - | FK → `sales.id` |
| `tax_type` | TEXT | NO | - | Tipo de impuesto (ej. IVA) |
| `tax_rate` | NUMERIC(5,4) | NO | - | Tasa aplicada (ej. 0.19 para 19%) |
| `tax_amount` | NUMERIC(12,2) | NO | - | Monto del impuesto |

**Índices:**
- `idx_sale_taxes_sale_id` - Búsquedas por venta

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE`
- `chk_sale_taxes_amount_non_negative` - `tax_amount >= 0`
- `chk_sale_taxes_rate_range` - `tax_rate` entre 0 y 1

---

### 21. `sale_billing_references` - Referencias de Facturación por Venta

Referencias de facturación por venta; snapshot sin FK a `billing_profiles` para inmutabilidad.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Identificador único |
| `sale_id` | UUID | NO | - | FK → `sales.id` |
| `billing_profile_snapshot` | JSONB | YES | - | Snapshot del perfil fiscal usado |
| `invoice_number` | TEXT | YES | - | Número de factura emitida (si aplica) |
| `invoice_issued_at` | TIMESTAMPTZ | YES | - | Fecha de emisión de la factura |

**Índices:**
- `idx_sale_billing_references_sale_id` - Búsquedas por venta
- `idx_sale_billing_references_invoice_number` - Unique parcial por número de factura (WHERE invoice_number IS NOT NULL)

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE`

---

## Vistas

### 1. `project_sales_summary` – Resumen de ventas por proyecto

Vista de solo lectura que consolida ventas por proyecto para el dashboard **"Mis proyectos"**. Fuente del endpoint lógico `GET /api/dashboard/projects`. Solo expone proyectos del organizador autenticado (`organizer_id = auth.uid()`).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `project_id` | UUID | Identificador interno del proyecto |
| `project_public_code` | TEXT | Código público usado en rutas |
| `project_name` | TEXT | Nombre del proyecto |
| `project_status` | `project_status` | Estado actual del proyecto |
| `organizer_id` | UUID | Usuario organizador dueño del proyecto |
| `orders_count` | BIGINT | Número total de pedidos confirmados (ventas con `sale_status = 'paid'`) |
| `units_sold` | NUMERIC | Total de unidades vendidas (suma de `sale_items.quantity`) |
| `organizer_commission_total` | NUMERIC | Comisión acumulada del organizador (suma de `sale_breakdowns.organizer_commission_amount`) |
| `currency` | TEXT | Moneda de la última venta (null si el proyecto no tiene ventas) |
| `last_sale_at` | TIMESTAMPTZ | Fecha de la última venta registrada (null si sin ventas) |

**Origen:** `glam_projects` (LEFT JOIN a agregaciones de `sales`, `sale_items`, `sale_breakdowns`). Solo se incluyen ventas con `sale_status = 'paid'`. Proyectos sin ventas aparecen con `orders_count = 0`, `units_sold = 0`, `organizer_commission_total = 0`, `currency` y `last_sale_at` en null.

**Seguridad:** Vista con `security_invoker = true`. Filtro: `organizer_id = auth.uid()` para usuarios autenticados (el organizador solo ve sus propios proyectos). Los roles `postgres` y `service_role` ven todos los proyectos (útil para SQL Editor o BFF que filtra por `organizer_id` en la query). Roles con `SELECT`: `authenticated`, `service_role`, `anon` (anon devuelve lista vacía si no hay sesión).

**Uso:** Consumir con usuario autenticado (JWT) para listar resumen de proyectos en el dashboard. Orden sugerido: proyectos más recientes primero (p. ej. por `last_sale_at` DESC NULLS LAST).

---

## Relaciones

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              RELACIONES                                      │
└─────────────────────────────────────────────────────────────────────────────┘

glam_users (1) ──────┬──── (0..1) billing_profiles
                     │
                     ├──── (0..n) bank_accounts
                     │
                     ├──── (0..n) billing_documents
                     │
                     ├──── (0..n) glam_projects [como organizer_id]
                     │
                     ├──── (0..n) glam_project_config_changes [como changed_by]
                     │
                     ├──── (0..n) sales [como organizer_id]
                     │
                     └──── (0..n) sales [como buyer_id]

glam_projects (1) ───┬──── (0..n) glam_project_config_changes
                     │
                     ├──── (0..n) project_products
                     │
                     └──── (0..n) sales

product_categories (1) ──────── (0..n) glam_products

product_attributes (1) ──────── (0..n) product_attribute_options

glam_products (1) ──────── (1..n) project_products [como glam_product_id, obligatorio]

project_products (1) ───┬── (0..n) product_images
                        │
                        └── (0..n) sale_items

promotions (1) ───┬──── (0..n) volume_discount_rules
                  │
                  └──── (0..n) sale_promotions

sales (1) ────────┬──── (1..1) sale_breakdowns
                  │
                  ├──── (0..n) sale_items
                  │
                  ├──── (0..n) sale_promotions
                  │
                  ├──── (0..n) sale_taxes
                  │
                  └──── (0..n) sale_billing_references

sale_items (1) ──────── (0..n) sale_promotions [como sale_item_id]
```

### Detalle de Foreign Keys

| Tabla Origen | Columna | Tabla Destino | On Delete |
|--------------|---------|---------------|-----------|
| `billing_profiles` | `user_id` | `glam_users` | CASCADE |
| `bank_accounts` | `user_id` | `glam_users` | CASCADE |
| `billing_documents` | `user_id` | `glam_users` | CASCADE |
| `glam_projects` | `organizer_id` | `glam_users` | - |
| `glam_projects` | `created_by` | `glam_users` | - |
| `glam_projects` | `updated_by` | `glam_users` | - |
| `glam_project_config_changes` | `project_id` | `glam_projects` | CASCADE |
| `glam_project_config_changes` | `changed_by` | `glam_users` | - |
| `glam_products` | `category_id` | `product_categories` | RESTRICT |
| `product_attribute_options` | `attribute_id` | `product_attributes` | CASCADE |
| `project_products` | `project_id` | `glam_projects` | RESTRICT |
| `project_products` | `glam_product_id` | `glam_products` | RESTRICT |
| `product_images` | `product_id` | `project_products` | CASCADE |
| `volume_discount_rules` | `promotion_id` | `promotions` | CASCADE |
| `sales` | `project_id` | `glam_projects` | RESTRICT |
| `sales` | `organizer_id` | `glam_users` | - |
| `sales` | `buyer_id` | `glam_users` | - |
| `sale_items` | `sale_id` | `sales` | CASCADE |
| `sale_items` | `product_id` | `project_products` | RESTRICT |
| `sale_breakdowns` | `sale_id` | `sales` | CASCADE |
| `sale_promotions` | `sale_id` | `sales` | CASCADE |
| `sale_promotions` | `sale_item_id` | `sale_items` | CASCADE |
| `sale_promotions` | `promotion_id` | `promotions` | RESTRICT |
| `sale_taxes` | `sale_id` | `sales` | CASCADE |
| `sale_billing_references` | `sale_id` | `sales` | CASCADE |

---

## Storage Buckets

### 1. `billing-documents` (Privado)

Documentos sensibles de facturación.

| Propiedad | Valor |
|-----------|-------|
| **Visibilidad** | Privado |
| **Tamaño máximo** | 10 MB |
| **MIME Types** | `application/pdf`, `image/jpeg`, `image/png` |

**Estructura de paths:**
```
billing-documents/
  └── {user_id}/
      └── {document_type}/
          └── {hash_timestamp}.{extension}
```

**Ejemplo:** `billing-documents/550e8400-e29b-41d4-a716-446655440000/id_document/a1b2c3d4e5f6.pdf`

**Políticas:**
- Usuarios autenticados pueden subir/ver/eliminar sus propios documentos

---

### 2. `project-logos` (Público)

Logos de proyectos comerciales.

| Propiedad | Valor |
|-----------|-------|
| **Visibilidad** | Público |
| **Tamaño máximo** | 5 MB |
| **MIME Types** | `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml` |

**Estructura de paths:**
```
project-logos/
  └── {project_id}/
      └── logo.{extension}
```

**Ejemplo:** `project-logos/550e8400-e29b-41d4-a716-446655440000/logo.png`

**Políticas:**
- Cualquiera puede ver los logos
- Solo el organizador del proyecto puede subir/actualizar/eliminar

---

### 3. `product-images` (Público)

Imágenes de productos.

| Propiedad | Valor |
|-----------|-------|
| **Visibilidad** | Público |
| **Tamaño máximo** | 10 MB |
| **MIME Types** | `image/jpeg`, `image/png`, `image/webp` |

**Estructura de paths:**
```
product-images/
  └── {project_id}/
      └── {product_id}/
          ├── 1.{extension}
          ├── 2.{extension}
          └── 3.{extension}
```

**Ejemplo:** `product-images/550e8400.../a1b2c3d4.../1.png`

**Políticas:**
- Cualquiera puede ver las imágenes
- Usuarios autenticados pueden subir/actualizar/eliminar

---

## Diagrama ER

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           GSSC DATA MODEL                                                    │
│                                              Schema: gssc_db                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐
│       glam_users            │
├─────────────────────────────┤
│ PK id: UUID                 │
│    name: TEXT               │
│    email: TEXT (UNIQUE)     │
│    role: TEXT[]             │
│    delivery_address: JSONB  │
│    phone_number: TEXT       │
│    status: TEXT             │
│    created_at: TIMESTAMPTZ  │
│    updated_at: TIMESTAMPTZ  │
└─────────────────────────────┘
         │
         │ 1
         │
    ┌────┴────┬─────────────┬─────────────────────────┐
    │         │             │                         │
    │ 0..1    │ 0..n        │ 0..n                    │ 0..n
    ▼         ▼             ▼                         ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────────────────┐
│ billing_profiles  │  │  bank_accounts    │  │ billing_documents │  │     glam_projects       │
├───────────────────┤  ├───────────────────┤  ├───────────────────┤  ├─────────────────────────┤
│ PK id: UUID       │  │ PK id: UUID       │  │ PK id: UUID       │  │ PK id: UUID             │
│ FK user_id: UUID  │  │ FK user_id: UUID  │  │ FK user_id: UUID  │  │    public_code: TEXT    │
│    entity_type    │  │    bank_name      │  │    document_type  │  │    name: TEXT           │
│    full_name      │  │    account_type   │  │    document_name  │  │    description: TEXT    │
│    document_type  │  │    account_number │  │    storage_bucket │  │    type: project_type   │
│    document_number│  │    status         │  │    storage_path   │  │    status: project_status│
│    tax_id         │  │    rejection_reason│ │    created_at     │  │    logo_url: TEXT       │
│    fiscal_address │  │    verified_at    │  └───────────────────┘  │    logo_is_default      │
│    contact_email  │  │    is_active      │                         │ FK organizer_id: UUID   │
│    contact_phone  │  │    is_preferred   │                         │ FK created_by: UUID     │
│    created_at     │  │    created_at     │                         │ FK updated_by: UUID     │
│    updated_at     │  │    updated_at     │                         │    commission_percent   │
└───────────────────┘  └───────────────────┘                         │    packaging_custom     │
                                                                     │    delivery_type        │
                                                                     │    delivery_config: JSONB│
                                                                     │    created_at           │
                                                                     │    updated_at           │
                                                                     └─────────────────────────┘
                                                                              │
                                                                              │ 1
                                                                         ┌────┴────┐
                                                                         │         │
                                                                         │ 0..n    │ 0..n
                                                                         ▼         ▼
                                                      ┌────────────────────────────────┐  ┌───────────────────────────────┐
                                                      │ glam_project_config_changes    │  │      project_products         │
                                                      ├────────────────────────────────┤  ├───────────────────────────────┤
                                                      │ PK id: UUID                    │  │ PK id: UUID                   │
                                                      │ FK project_id: UUID            │  │ FK project_id: UUID           │
                                                      │    field_name: config_change_field│ FK glam_product_id: UUID (NOT NULL)│
                                                      │    old_value: JSONB            │  │    name: TEXT                 │
                                                      │    new_value: JSONB            │  │    description: TEXT          │
                                                      │ FK changed_by: UUID            │  │    status: product_status     │
                                                      │    changed_at: TIMESTAMPTZ     │  │    price: NUMERIC(12,2)       │
                                                      │    reason: TEXT                │  │    personalization_config: JSONB│
                                                      └────────────────────────────────┘  │    selected_attributes: JSONB  │
                                                                                          │    created_at                 │
                                                                                          │    updated_at                 │
                                                                                          └───────────────────────────────┘
                                                                                                   │
                                                                                                   │ 1
                                                                                                   │
                                                                                                   │ 0..n
                                                                                                   ▼
                                                                                          ┌───────────────────────────────┐
                                                                                          │      product_images           │
                                                                                          ├───────────────────────────────┤
                                                                                          │ PK id: UUID                   │
                                                                                          │ FK product_id: UUID           │
                                                                                          │    url: TEXT                  │
                                                                                          │    position: INTEGER          │
                                                                                          │    source: product_image_source│
                                                                                          │    created_at                 │
                                                                                          │    updated_at                 │
                                                                                          └───────────────────────────────┘
                                                                                                   │
                                                                                                   │ 0..n (sale_items)
                                                                                                   │
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       DOMINIO VENTAS                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

glam_projects (1) ─── 0..n ──► sales    glam_users (organizer_id, buyer_id) ───► sales

┌─────────────────────────────┐     ┌─────────────────────────────┐
│       promotions            │     │          sales               │
├─────────────────────────────┤     ├─────────────────────────────┤
│ PK id: UUID                 │     │ PK id: UUID                  │
│    code: TEXT               │     │    public_code: TEXT (UNIQUE)  │
│    name: TEXT               │     │ FK project_id: UUID          │
│    promotion_type           │     │ FK organizer_id: UUID        │
│    scope: promotion_scope   │     │ FK buyer_id: UUID             │
│    rules: JSONB             │     │    sale_status: sale_status   │
│    is_active                │     │    sale_channel: sale_channel │
│    start_date, end_date     │     │    currency, country          │
│    created_at, updated_at   │     │    buyer_snapshot: JSONB      │
└─────────────────────────────┘     │    delivery_address_snapshot  │
         │                          │    organizer_snapshot         │
         │ 1                         │    created_at, paid_at       │
         │ 0..n                      └─────────────────────────────┘
         ▼                                    │
┌─────────────────────────────┐                │ 1
│  volume_discount_rules     │                ├────┬─────────────┬──────────────┬─────────────────────┐
├─────────────────────────────┤                │    │             │              │                     │
│ PK id: UUID                 │                │ 1..1 0..n      0..n           0..n                  0..n
│ FK promotion_id: UUID       │                ▼    ▼             ▼              ▼                     ▼
│    min_quantity, max_quantity│         sale_breakdowns  sale_items  sale_promotions  sale_taxes  sale_billing_references
│    discount_value           │                │             │
└─────────────────────────────┘                │             │ FK product_id → project_products
                                              │             │ sale_promotions.sale_item_id → sale_items
                                              │             │ sale_promotions.promotion_id → promotions


┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CATÁLOGOS (Solo lectura)                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│      product_categories         │           │    personalization_modules      │
├─────────────────────────────────┤           ├─────────────────────────────────┤
│ PK id: UUID                     │           │ PK id: UUID                     │
│    code: TEXT (UNIQUE)          │           │    code: personalization_module_code│
│    name: TEXT                   │           │    name: TEXT                   │
│    description: TEXT            │           │    description: TEXT            │
│    allowed_modules: []          │           │    created_at                   │
│    created_at                   │           │    updated_at                   │
│    updated_at                   │           └─────────────────────────────────┘
└─────────────────────────────────┘
         │
         │ 1
         │ 0..n
         ▼
   glam_products ──── 1..n ──► project_products
   (code, name,               (glam_product_id obligatorio,
    base_price,                price, selected_attributes,
    attributes_config)         personalization_config)

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ATRIBUTOS DE PRODUCTO (Catálogo)                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────┐     ┌───────────────────────────┐
│  product_attributes   │     │ product_attribute_options  │
├───────────────────────┤     ├───────────────────────────┤
│ PK id: UUID           │ 1   │ PK id: UUID               │
│    code: TEXT (UNIQUE)│──>N │ FK attribute_id: UUID      │
│    name: TEXT         │     │    code: TEXT              │
│    description: TEXT  │     │    name: TEXT              │
│    is_active: BOOLEAN │     │    display_order: INTEGER  │
│    created_at         │     │    is_active: BOOLEAN      │
│    updated_at         │     │    created_at              │
└───────────────────────┘     │    updated_at              │
                              └───────────────────────────┘
                              UNIQUE(attribute_id, code)

Nota: glam_products.attributes_config (JSONB) almacena las opciones disponibles
      y modificadores de precio por producto.
      project_products.selected_attributes (JSONB) almacena las selecciones
      del organizador (inmutable, como personalization_config).
```

---

## Notas Adicionales

### Convenciones de Nomenclatura

- **Tablas**: `snake_case` en plural o descriptivo (`glam_users`, `billing_profiles`)
- **Columnas**: `snake_case` (`created_at`, `user_id`)
- **ENUMs**: `snake_case` para tipos, valores en `snake_case` o MAYÚSCULAS según contexto
- **Índices**: `idx_{tabla}_{columna(s)}`
- **Constraints**: `chk_{descripción}` para CHECK, `uq_{descripción}` para UNIQUE

### Auditoría

Todas las tablas principales incluyen:
- `created_at`: Timestamp de creación (automático)
- `updated_at`: Timestamp de última modificación (actualizado por triggers)

### Soft Delete vs Hard Delete

- **CASCADE**: `billing_profiles`, `bank_accounts`, `billing_documents`, `glam_project_config_changes`, `product_images`, `volume_discount_rules`, `sale_items`, `sale_breakdowns`, `sale_promotions`, `sale_taxes`, `sale_billing_references`
- **RESTRICT**: `project_products` (no se puede eliminar proyecto con productos ni glam_product con project_products), `sales` (proyecto), `sale_items` (producto), `sale_promotions` (promoción)

### Campos Inmutables

- `glam_projects.name`: No editable después de creación
- `project_products.personalization_config`: Inmutable después de creación
- `project_products.selected_attributes`: Inmutable después de creación
- Dominio ventas: `sales`, `sale_items`, `sale_breakdowns`, `sale_promotions`, `sale_taxes`, `sale_billing_references` son inmutables una vez creados (ledger)

---

*Última actualización: Febrero 2026*
