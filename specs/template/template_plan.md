# Plan de Implementación (SDD + AI Agents)

> **Rol del documento**  
Este archivo es el **contrato operativo** entre el humano y la(s) AI Agent(s).  
La AI **NO debe escribir código** hasta que este plan esté completo, validado y aprobado.

---

## 1. Contexto

### 1.1 Referencias obligatorias
- Documento técnico principal: `./docs/ARCH_TECH.md`  
- Otras specs relevantes: _(listar)_

### 1.2 Objetivo del plan
Describir **qué se va a construir**, **cómo se va a construir** y **en qué orden**, respetando estrictamente las especificaciones existentes.

---

## 2. Alcance

### 2.1 Incluye
-
-

### 2.2 Excluye explícitamente
-
-

> ⚠️ Regla: todo lo no listado aquí se considera **fuera de alcance**.

---

## 3. Supuestos y restricciones

### 3.1 Supuestos
-
-

### 3.2 Restricciones técnicas
- Lenguajes / frameworks permitidos:
- Infraestructura:
- Base de datos:
- Autenticación / seguridad:

---

## 4. Preguntas obligatorias para la AI (Checklist)

> La AI **DEBE** responder estas preguntas antes de avanzar.  
Si alguna no tiene respuesta en la documentación, **DEBE preguntar al humano**.

- ¿Qué problema de negocio se resuelve exactamente?
- ¿Quiénes son los actores involucrados?
- ¿Cuáles son las reglas de negocio críticas?
- ¿Qué decisiones ya están tomadas y no deben cambiarse?
- ¿Qué partes son configurables vs fijas?
- ¿Qué escenarios de error deben contemplarse?
- ¿Qué no debe hacer el sistema bajo ningún caso?

---

## 5. Descomposición del trabajo

### 5.1 Fases

#### Fase 1 – Dominio
- Identificar entidades
- Definir invariantes
- Validar reglas de negocio

#### Fase 2 – Contratos
- APIs (OpenAPI)
- Schemas (DB / JSON)
- Eventos (si aplica)

#### Fase 3 – Implementación
- Servicios
- Repositorios
- Lógica de dominio

#### Fase 4 – Validación
- Unit tests
- Contract tests
- Casos límite

---

## 6. Archivos y estructura esperada

> La AI **NO puede crear archivos fuera de esta lista**.

- /src/
- /tests/
- /docs/

---

## 7. Reglas estrictas para la AI Agent

- ❌ No inventar requisitos
- ❌ No modificar la documentación técnica
- ❌ No optimizar sin justificación
- ❌ No asumir defaults
- ✅ Preguntar ante ambigüedad
- ✅ Mantener consistencia con la spec
- ✅ Explicar decisiones complejas

---

## 8. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|------|--------|-----------|
| | | |

---

## 9. Criterios de aceptación del plan

El plan se considera **aprobado** cuando:
- Todas las preguntas de la sección 4 están resueltas
- El alcance es claro y sin ambigüedad
- Las fases están completas
- Las restricciones están explícitas

---

## 10. Aprobación

- Estado: ⬜ Draft / ⬜ Aprobado  
- Fecha:  
- Aprobado por:

---

> 🧠 **Nota para la AI**  
Este plan es vinculante.  
Cualquier desviación requiere una actualización explícita del plan y nueva aprobación.

