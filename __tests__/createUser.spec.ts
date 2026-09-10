import { test, expect } from "playwright/test";

test.describe("Flujo de Creación de Usuario", () => {
  test.beforeEach(async ({ page }) => {
    // Change the URL to the one for your local app.

    await page.goto("http://localhost:5173/signup");
  });

  test("debería crear un usuario exitosamente y redirigir al login", async ({
    page,
  }) => {
    // Interception of the backend call so the test does not depend on the real database.
    await page.route("**/usuarios", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ message: "Usuario creado exitosamente" }),
      });
    });

    // Fill out the form.
    await page.getByLabel("DNI:").fill("40300123");
    await page.getByLabel("Nombre:").fill("Tadeo");
    await page.getByLabel("Apellido:").fill("Rufine");
    await page.getByLabel("Teléfono:").fill("+54 341 1234567");
    await page.getByLabel("Correo electrónico:").fill("tadeo@ejemplo.com");

    // passwords (meeting validation constants)
    const pass = "Password123!";
    await page.getByLabel("Contraseña:", { exact: true }).fill(pass);
    await page.getByLabel("Confirmar contraseña:").fill(pass);

    // select security question and answer
    await page.getByRole("combobox").selectOption({ index: 1 });
    await page.getByPlaceholder("Tu respuesta").fill("Mi primera mascota");

    // Click send
    const submitBtn = page.getByRole("button", { name: "Crear Cuenta" });
    await submitBtn.click();

    // Verify that the button is disabled (isSubmitting)
    await expect(submitBtn).toBeDisabled();

    // Verify the success toast 
    await expect(page.getByText("Usuario creado exitosamente")).toBeVisible();

    // Verify redirect after the 2-second delay
    await page.waitForURL("**/login", { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("debería mostrar error de validación si las contraseñas no coinciden", async ({
    page,
  }) => {
    await page.getByLabel("Contraseña:", { exact: true }).fill("Password123!");
    await page.getByLabel("Confirmar contraseña:").fill("OtraPassword999");

    // Force the blur so Zod triggers the error (since you use mode: "onBlur").
    await page.getByLabel("Confirmar contraseña:").blur();

    // Verify the error message defined in your Zod schema.
    const errorMsg = page.locator("text=Las contraseñas no coinciden");
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveCSS("color", "rgb(255, 0, 0)"); // Rojo
  });
});
