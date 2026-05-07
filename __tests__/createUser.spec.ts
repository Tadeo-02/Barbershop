import { test, expect } from "@playwright/test";

test.describe("Flujo de Creación de Usuario", () => {
  test.beforeEach(async ({ page }) => {
    // Cambia la URL por la de tu app local
    await page.goto("http://localhost:5173/signup");
  });

  test("debería crear un usuario exitosamente y redirigir al login", async ({
    page,
  }) => {
    // Interceptamos la llamada al backend para que el test no dependa de la DB real
    await page.route("**/usuarios", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ message: "Usuario creado exitosamente" }),
      });
    });

    // Llenar el formulario
    await page.getByLabel("DNI:").fill("40300123");
    await page.getByLabel("Nombre:").fill("Tadeo");
    await page.getByLabel("Apellido:").fill("Rufine");
    await page.getByLabel("Teléfono:").fill("+54 341 1234567");
    await page.getByLabel("Correo electrónico:").fill("tadeo@ejemplo.com");

    // Contraseñas (cumpliendo con tus constantes de validación)
    const pass = "Password123!";
    await page.getByLabel("Contraseña:", { exact: true }).fill(pass);
    await page.getByLabel("Confirmar contraseña:").fill(pass);

    // Seleccionar pregunta de seguridad
    await page.getByRole("combobox").selectOption({ index: 1 });
    await page.getByPlaceholder("Tu respuesta").fill("Mi primera mascota");

    // Click en enviar
    const submitBtn = page.getByRole("button", { name: "Crear Cuenta" });
    await submitBtn.click();

    // Verificamos que el botón se deshabilite (isSubmitting)
    await expect(submitBtn).toBeDisabled();

    // Verificar que aparezca el toast de éxito (si usas react-hot-toast)
    await expect(page.getByText("Usuario creado exitosamente")).toBeVisible();

    // Verificar redirección tras el delay de 2 segundos
    await page.waitForURL("**/login", { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("debería mostrar error de validación si las contraseñas no coinciden", async ({
    page,
  }) => {
    await page.getByLabel("Contraseña:", { exact: true }).fill("Password123!");
    await page.getByLabel("Confirmar contraseña:").fill("OtraPassword999");

    // Forzamos el blur para que Zod dispare el error (ya que usas mode: "onBlur")
    await page.getByLabel("Confirmar contraseña:").blur();

    // Verificamos el mensaje de error definido en tu esquema Zod
    const errorMsg = page.locator("text=Las contraseñas no coinciden");
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveCSS("color", "rgb(255, 0, 0)"); // Rojo
  });
});
