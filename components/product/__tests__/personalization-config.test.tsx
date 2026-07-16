import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PersonalizationConfig } from "../personalization-config";
import {
  buildDefaultPersonalizationConfig,
  createDefaultModuleConfig,
  validateModulesForCategory,
} from "@/lib/types/product/types";
import type {
  ProductCategory,
  PersonalizationModule,
  PersonalizationModuleCode,
} from "@/lib/types/product/types";

// Los códigos de módulo son texto libre en el backend (migración 20260625000001):
// gssc-managment puede registrar módulos que no existen en el mapa hardcodeado
// del frontend. Estos tests cubren ese caso.
const customCode = "hologramas" as PersonalizationModuleCode;

const category: ProductCategory = {
  id: "cat-1",
  code: "t-shirt",
  name: "Camisetas",
  description: "Camisetas deportivas",
  allowedVisualModes: ["upload_images"],
  allowedModules: ["numbers", customCode],
};

const modules: PersonalizationModule[] = [
  { id: "m-1", code: "numbers", name: "Número deportivo", description: "Número en la espalda" },
  { id: "m-2", code: customCode, name: "Hologramas", description: "Holograma personalizado" },
];

describe("PersonalizationConfig con módulos registrados desde gssc-managment", () => {
  it("no crashea y usa name/description del backend como fallback", () => {
    render(
      <PersonalizationConfig
        category={category}
        modules={modules}
        config={{}}
        onChange={vi.fn()}
      />
    );
    // Módulo conocido: usa el label hardcodeado
    expect(screen.getByText("Número deportivo")).toBeInTheDocument();
    // Módulo desconocido: cae al name/description del backend
    expect(screen.getByText("Hologramas")).toBeInTheDocument();
    expect(screen.getByText("Holograma personalizado")).toBeInTheDocument();
  });
});

describe("createDefaultModuleConfig con código desconocido", () => {
  it("devuelve configuración genérica habilitada", () => {
    expect(createDefaultModuleConfig(customCode)).toEqual({
      enabled: true,
      price_modifier: 0,
    });
  });
});

describe("buildDefaultPersonalizationConfig con código desconocido", () => {
  it("incluye el módulo deshabilitado por defecto", () => {
    const config = buildDefaultPersonalizationConfig(["numbers", customCode]);
    expect(config[customCode]).toEqual({ enabled: false, price_modifier: 0 });
    expect(config.numbers?.enabled).toBe(false);
  });
});

describe("validateModulesForCategory con código desconocido", () => {
  it("usa el código en el mensaje de error cuando no hay label", () => {
    const config = buildDefaultPersonalizationConfig([customCode]);
    config[customCode]!.enabled = true;
    const result = validateModulesForCategory(config, ["numbers"]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("hologramas");
  });
});
