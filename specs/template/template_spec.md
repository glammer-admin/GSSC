# Specification (SDD) – Template con Casos de Uso en Gherkin

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

Describe claramente:
- El problema de negocio que se resuelve
- El valor que aporta
- Por qué este módulo/sistema existe

---

## 2. Alcance funcional

### 2.1 Incluye
-
-

### 2.2 Excluye (explícito)
> Todo lo no listado aquí se considera fuera de alcance.

-
-

---

## 3. Actores

| Actor | Descripción | Nivel de acceso |
|-----|------------|----------------|
| | | |

---

## 4. Glosario de dominio

> Definiciones precisas y no ambiguas.

| Término | Definición |
|-------|-----------|
| | |

---

## 5. Reglas de negocio (OBLIGATORIAS)

Cada regla debe ser:
- Verificable
- Independiente de la implementación
- Clara y atómica

- **RN-01:**
- **RN-02:**

---

## 6. Estados del dominio (si aplica)

| Estado | Descripción |
|------|------------|
| | |

### 6.1 Transiciones válidas

| Estado actual | Evento | Nuevo estado |
|--------------|--------|--------------|
| | | |

---

## 7. Casos de uso (Gherkin)

> ⚠️ Regla clave:  
> Todo comportamiento del sistema **DEBE** estar expresado aquí.  
> Si no existe un escenario Gherkin, el comportamiento **NO EXISTE**.

---

### 7.1 Caso de uso: <Nombre del caso>

```gherkin
Feature: <Nombre funcional del feature>
  Como <actor>
  Quiero <objetivo>
  Para <beneficio de negocio>

  Background:
    Given <precondición global>

  Scenario: Camino feliz
    Given <estado inicial>
    When <acción principal>
    Then <resultado esperado>

  Scenario: Regla de negocio violada
    Given <estado inicial>
    When <acción inválida>
    Then <error esperado>

  Scenario: Caso límite
    Given <condición extrema>
    When <acción>
    Then <comportamiento esperado>
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
- Campos obligatorios
- Restricciones

### 8.2 Salidas
- Resultados posibles
- Estados finales

### 8.3 Errores de negocio

| Código lógico | Condición |
|-------------|----------|
| | |

---

## 9. Invariantes del sistema

> Condiciones que SIEMPRE deben cumplirse.

-
-

---

## 10. Casos límite y excepciones

-
-

---

## 11. Seguridad y permisos

| Actor | Acción permitida | Acción prohibida |
|-----|-----------------|------------------|
| | | |

---

## 12. No-objetivos explícitos

> Para evitar suposiciones de la AI.

-
-

---

## 13. Versionado

- Versión: v1.0
- Fecha:
- Cambios:

---

## 14. Checklist de validación (AI + Humano)

Antes de aprobar este spec:
- [ ] Todos los comportamientos están en Gherkin
- [ ] No hay decisiones técnicas
- [ ] Las reglas de negocio están numeradas
- [ ] No hay ambigüedades
- [ ] El alcance está claro

---

## 15. Nota final para AI Agents

- ❌ No inferir comportamiento no especificado
- ❌ No modificar este archivo durante la implementación
- ✅ Usar este spec como base para `plan.md`, tests y validaciones
- ✅ Preguntar si algo no está explícitamente definido

