// middleware/authController.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma"; // ajustá el path a tu instancia

export async function loginController(req: Request, res: Response) {
  const { email, contraseña } = req.body; // <-- mismo nombre que manda el frontend

  const user = await prisma.usuario.findUnique({
    where: { email },
    select: {
      codUsuario: true,
      dni: true,
      cuil: true,
      codSucursal: true,
      nombre: true,
      apellido: true,
      telefono: true,
      email: true,
      claveUsuario: true, // el campo con el hash
    },
  });

  if (!user) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  const match = await bcrypt.compare(contraseña, user.claveUsuario);
  if (!match) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  // El rol se calcula UNA SOLA VEZ acá en el backend
  const rol: "admin" | "barber" | "client" =
    user.cuil === "1" ? "admin" : user.cuil ? "barber" : "client";

  const token = jwt.sign(
    {
      codUsuario: user.codUsuario,
      codSucursal: user.codSucursal,
      rol,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "8h" },
  );

  const { claveUsuario: _, ...userSinPassword } = user;

  // Misma forma de respuesta que hoy — solo se agrega `token`
  return res.json({
    message: "Login exitoso",
    token, // <-- NUEVO
    user: userSinPassword,
  });
}
