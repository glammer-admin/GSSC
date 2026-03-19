import { test, expect } from "@playwright/test";

test.describe("Error Page", () => {
  test("shows generic error when no code is provided", async ({ page }) => {
    await page.goto("/error");

    await expect(page.locator("h1")).toContainText("Oops! Tenemos un error");
    await expect(page.getByText("ERR-GEN-000")).toBeVisible();
    await expect(page.getByRole("link", { name: "Volver al inicio" })).toBeVisible();
  });

  test("shows specific error message for auth errors", async ({ page }) => {
    await page.goto("/error?code=AUTH-NET-001");

    await expect(page.getByText("AUTH-NET-001")).toBeVisible();
    await expect(page.getByRole("link", { name: "Volver al inicio" })).toBeVisible();
  });

  test("navigate back to home from error page", async ({ page }) => {
    await page.goto("/error");
    await page.getByRole("link", { name: "Volver al inicio" }).click();

    await expect(page).toHaveURL("/");
  });
});

test.describe("Login Page", () => {
  test("shows SSO provider buttons", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Continuar con Google")).toBeVisible();
    await expect(page.getByText("Continuar con Microsoft")).toBeVisible();
    await expect(page.getByText("Continuar con Meta")).toBeVisible();
  });

  test("shows loading state when clicking a provider", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Continuar con Google").click();

    await expect(page.getByText("Autenticando...")).toBeVisible();
  });

  test("shows cancellation message when redirected from register", async ({ page }) => {
    await page.goto("/?cancelled=true");

    await expect(page.getByText("Registro cancelado")).toBeVisible();
  });
});
