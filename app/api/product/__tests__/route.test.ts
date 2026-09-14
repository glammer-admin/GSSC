// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "../route"
import { PATCH } from "../[id]/route"
import { GLAM_PRODUCT_UNAVAILABLE_ERROR } from "@/lib/types/product/types"

// vi.mock se eleva sobre los imports: los dobles tienen que existir antes.
const { productClient, projectClient } = vi.hoisted(() => ({
  productClient: {
    getGlamProductById: vi.fn(),
    getCategoryById: vi.fn(),
    createProduct: vi.fn(),
    getProductById: vi.fn(),
    updateProduct: vi.fn(),
    getCategories: vi.fn(),
    getProductImages: vi.fn(),
    getProductImageCount: vi.fn(),
  },
  projectClient: { getProjectById: vi.fn() },
}))

vi.mock("@/lib/auth/session-manager", () => ({
  getSession: vi.fn(async () => ({ role: "organizer", userId: "user-1", sub: "sub-1" })),
  isCompleteSession: vi.fn(() => true),
}))

vi.mock("@/lib/http/product", () => ({
  getProductClient: () => productClient,
  getProductStorageClient: () => ({ getPublicUrlFromPath: (p: string) => `https://cdn/${p}` }),
  HttpError: class HttpError extends Error {},
  NetworkError: class NetworkError extends Error {},
}))

vi.mock("@/lib/http/project", () => ({
  getProjectClient: () => projectClient,
}))

const CATEGORY = { id: "cat-1", code: "camisetas", name: "Camisetas", allowed_modules: [] }

function glamProduct(id: string, isActive: boolean) {
  return {
    id,
    code: id,
    name: `Producto ${id}`,
    category_id: CATEGORY.id,
    base_price: 30000,
    is_active: isActive,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  }
}

const DRAFT = {
  id: "pp-1",
  project_id: "proj-1",
  glam_product_id: "gp-viejo",
  name: "Camiseta local",
  description: "Camiseta del equipo",
  price: 30000,
  status: "draft",
  personalization_config: {},
  selected_attributes: {},
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
}

function jsonRequest(url: string, method: string, body: unknown) {
  return new NextRequest(url, { method, body: JSON.stringify(body) })
}

beforeEach(() => {
  vi.clearAllMocks()
  projectClient.getProjectById.mockResolvedValue({ id: "proj-1", organizer_id: "user-1" })
  productClient.getCategoryById.mockResolvedValue(CATEGORY)
  productClient.getCategories.mockResolvedValue([CATEGORY])
  productClient.getProductImages.mockResolvedValue([])
})

describe("POST /api/product — producto del catálogo inactivo", () => {
  const body = {
    projectId: "proj-1",
    glamProductId: "gp-1",
    name: "Camiseta local",
    description: "Camiseta del equipo",
    price: 30000,
  }

  it("rechaza crear un producto con un producto del catálogo desactivado", async () => {
    productClient.getGlamProductById.mockResolvedValue(glamProduct("gp-1", false))

    const res = await POST(jsonRequest("http://localhost/api/product", "POST", body))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ success: false, error: GLAM_PRODUCT_UNAVAILABLE_ERROR })
    expect(productClient.createProduct).not.toHaveBeenCalled()
  })

  it("con el producto activo sigue creando", async () => {
    productClient.getGlamProductById.mockResolvedValue(glamProduct("gp-1", true))
    productClient.createProduct.mockResolvedValue({ ...DRAFT, glam_product_id: "gp-1" })

    const res = await POST(jsonRequest("http://localhost/api/product", "POST", body))

    expect(res.status).toBe(200)
    expect(productClient.createProduct).toHaveBeenCalledTimes(1)
  })
})

describe("PATCH /api/product/[id] — producto del catálogo inactivo", () => {
  const context = { params: Promise.resolve({ id: DRAFT.id }) }

  beforeEach(() => {
    productClient.getProductById.mockResolvedValue(DRAFT)
    productClient.updateProduct.mockResolvedValue(DRAFT)
  })

  it("rechaza cambiar un borrador a un producto del catálogo desactivado", async () => {
    productClient.getGlamProductById.mockResolvedValue(glamProduct("gp-nuevo", false))

    const res = await PATCH(
      jsonRequest("http://localhost/api/product/pp-1", "PATCH", { glamProductId: "gp-nuevo" }),
      context,
    )

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ success: false, error: GLAM_PRODUCT_UNAVAILABLE_ERROR })
    expect(productClient.updateProduct).not.toHaveBeenCalled()
  })

  it("un borrador que ya usaba un producto desactivado se puede seguir guardando", async () => {
    productClient.getGlamProductById.mockResolvedValue(glamProduct("gp-viejo", false))

    const res = await PATCH(
      jsonRequest("http://localhost/api/product/pp-1", "PATCH", {
        glamProductId: "gp-viejo",
        name: "Camiseta visitante",
      }),
      context,
    )

    expect(res.status).toBe(200)
    expect(productClient.updateProduct).toHaveBeenCalledTimes(1)
  })
})
