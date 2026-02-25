import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import MyProfile from "../../src/FRONT/views/components/Client/profile/profile.tsx";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// We mock the AuthContext module so tests can control the returned user.
const mockUseAuth = vi.fn();
vi.mock("../../src/FRONT/views/components/login/AuthContext.tsx", () => ({
  useAuth: () => mockUseAuth(),
}));

// We mock the CSS module so it doesn't break the jsdom environment.
vi.mock(
  "../../src/FRONT/views/components/Client/profile/profile.module.css",
  () => ({ default: {} }),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const baseUser = {
  codUsuario: "USR-001",
  dni: "12345678",
  cuil: null,
  codSucursal: null,
  nombre: "Juan",
  apellido: "Pérez",
  telefono: "1122334455",
  email: "juan@example.com",
};

const renderProfile = () =>
  render(
    <MemoryRouter>
      <MyProfile />
    </MemoryRouter>,
  );

// ─── MyProfile ────────────────────────────────────────────────────────────────

describe("MyProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a message when there is no authenticated user", () => {
    mockUseAuth.mockReturnValue({ user: null });
    renderProfile();
    expect(screen.getByText(/no hay usuario autenticado/i)).toBeInTheDocument();
  });

  it("shows a loading indicator while fetching the profile", () => {
    mockUseAuth.mockReturnValue({ user: baseUser });

    // fetch never resolves → component stays in loading state
    global.fetch = vi.fn(
      () => new Promise(() => {}),
    ) as unknown as typeof fetch;

    renderProfile();
    expect(screen.getByText(/cargando perfil/i)).toBeInTheDocument();
  });

  it("displays profile data returned by the API", async () => {
    mockUseAuth.mockReturnValue({ user: baseUser });

    const profileData = {
      ...baseUser,
      categoriaActual: null,
      preguntaSeguridad: null,
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: profileData }),
    }) as unknown as typeof fetch;

    renderProfile();

    await waitFor(() =>
      expect(screen.getByText(/mi perfil/i)).toBeInTheDocument(),
    );

    expect(screen.getByText(/pérez, juan/i)).toBeInTheDocument();
    expect(screen.getByText("12345678")).toBeInTheDocument();
    expect(screen.getByText("juan@example.com")).toBeInTheDocument();
    expect(screen.getByText(/sin categoría asignada/i)).toBeInTheDocument();
  });

  it("shows the category name and a 'Ver Beneficios' link when a category is assigned", async () => {
    mockUseAuth.mockReturnValue({ user: baseUser });

    const profileData = {
      ...baseUser,
      categoriaActual: {
        codCategoria: "CAT-01",
        nombreCategoria: "Gold",
        descCategoria: "Categoria Gold",
        descuentoCorte: 10,
        descuentoProducto: 5,
        fechaInicio: "2024-01-01",
      },
      preguntaSeguridad: null,
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: profileData }),
    }) as unknown as typeof fetch;

    renderProfile();

    await waitFor(() => expect(screen.getByText("Gold")).toBeInTheDocument());

    const link = screen.getByRole("link", { name: /ver beneficios/i });
    expect(link).toHaveAttribute("href", "/categorias/CAT-01");
  });

  it("falls back to the auth user when the API returns a non-ok response", async () => {
    mockUseAuth.mockReturnValue({ user: baseUser });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    renderProfile();

    await waitFor(() =>
      expect(screen.getByText(/pérez, juan/i)).toBeInTheDocument(),
    );
  });

  it("falls back to the auth user when fetch throws", async () => {
    mockUseAuth.mockReturnValue({ user: baseUser });

    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(
        new Error("Network error"),
      ) as unknown as typeof fetch;

    renderProfile();

    await waitFor(() =>
      expect(screen.getByText(/pérez, juan/i)).toBeInTheDocument(),
    );
  });
});

// ─── SecurityQuestionForm ────────────────────────────────────────────────────

describe("SecurityQuestionForm (inside MyProfile)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: baseUser });
  });

  const setupWithProfile = async (initialQuestion: string | null = null) => {
    const profileData = {
      ...baseUser,
      categoriaActual: null,
      preguntaSeguridad: initialQuestion,
    };

    global.fetch = vi
      .fn()
      // First call: fetchProfile
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: profileData }),
      }) as unknown as typeof fetch;

    renderProfile();

    await waitFor(() =>
      expect(screen.getByText(/pregunta de seguridad/i)).toBeInTheDocument(),
    );
  };

  it("renders the security question form", async () => {
    await setupWithProfile();
    expect(screen.getByLabelText(/pregunta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/respuesta/i)).toBeInTheDocument();
  });

  it("shows 'Guardar' when there is no initial question", async () => {
    await setupWithProfile(null);
    expect(
      screen.getByRole("button", { name: /guardar/i }),
    ).toBeInTheDocument();
  });

  it("shows 'Actualizar' when an initial question is already set", async () => {
    await setupWithProfile("¿Cuál es el nombre de tu primera mascota?");
    expect(
      screen.getByRole("button", { name: /actualizar/i }),
    ).toBeInTheDocument();
  });

  it("calls the security-question endpoint on submit and shows success toast", async () => {
    const toast = await import("react-hot-toast");

    await setupWithProfile();

    // fetchProfile already consumed — mock the PATCH call
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Pregunta actualizada" }),
    }) as unknown as typeof fetch;

    const select = screen.getByLabelText(/pregunta/i);
    const input = screen.getByLabelText(/respuesta/i);
    const button = screen.getByRole("button", { name: /guardar/i });

    await userEvent.selectOptions(
      select,
      "¿Cuál es el nombre de tu primera mascota?",
    );
    await userEvent.type(input, "Firulais");
    await userEvent.click(button);

    await waitFor(() => {
      expect(toast.default.success).toHaveBeenCalledWith(
        "Pregunta actualizada",
      );
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `/usuarios/${baseUser.codUsuario}/security-question`,
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("shows an error toast when question or answer are empty", async () => {
    const toast = await import("react-hot-toast");

    await setupWithProfile();

    // Try to submit without filling in the form
    const form = document.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith(
        "Pregunta y respuesta son requeridas",
      );
    });
  });

  it("shows an error toast when the API returns an error", async () => {
    const toast = await import("react-hot-toast");

    await setupWithProfile();

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Error al actualizar" }),
    }) as unknown as typeof fetch;

    const select = screen.getByLabelText(/pregunta/i);
    const input = screen.getByLabelText(/respuesta/i);

    await userEvent.selectOptions(
      select,
      "¿Cuál es el nombre de tu primera mascota?",
    );
    await userEvent.type(input, "Firulais");
    await userEvent.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith("Error al actualizar");
    });
  });
});
