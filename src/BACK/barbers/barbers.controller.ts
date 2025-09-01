import type { Request, Response } from "express";
import * as model from "./Barbers";
import { DatabaseError } from "./Barbers";

const create = (_req: Request, res: Response) => {
  res.render("/src/FRONT/views/components/barbers/createBarbers");
};

const store = async (req: Request, res: Response) => {
  const { dni, cuil, nombre, apellido, telefono, email, contraseña } = req.body;

  console.log("Store usuarios request received"); //console log seguro

  try {
    const result = await model.store(
      dni,
      cuil,
      nombre,
      apellido,
      telefono,
      email,
      contraseña
    );
    console.log("Usuarios created successfully");
//no es necesaria una validacion, prisma garantiza que si llega a esta instancia no hay errores
    res.status(201).json({
      message: "Usuarios creado exitosamente",
      usuarios: result,
    });
  } catch (error) {
    console.error(
      "Error creating usuarios:",
      error instanceof Error ? error.message : "Unknown error"
    );
//manejo de errores
    if (error instanceof DatabaseError) {
      return res.status(400).json({
        message: error.message,
        type: "validation_error",
      });
    }

    return res.status(500).json({
      message: "Error interno del servidor",
      type: "server_error",
    });
  }
};

const index = async (_req: Request, res: Response) => {
  try {
    const usuarios = await model.findAll();
    res.status(200).json(usuarios);
  } catch (error) {
    console.error(
      "Error fetching usuarios:",
      error instanceof Error ? error.message : "Unknown error" //error seguro
    );
//manejo de errores
    if (error instanceof DatabaseError) {
      return res.status(400).json({
        message: error.message,
        type: "validation_error",
      });
    }

    return res.status(500).json({
      message: "Error interno del servidor",
      type: "server_error",
    });
  }
};

const show = async (req: Request, res: Response) => {
  const { codUsuario } = req.params;

  try {
    const usuario = await model.findById(codUsuario);

    if (!usuario) {
      return res.status(404).json({
        message: "Usuario no encontrado",
        type: "not_found",
      });
    }

    res.status(200).json(usuario);
  } catch (error) {
    console.error(
      "Error finding usuario:",
      error instanceof Error ? error.message : "Unknown error"
    );

    if (error instanceof DatabaseError) {
      return res.status(400).json({
        message: error.message,
        type: "validation_error",
      });
    }

    return res.status(500).json({
      message: "Error interno del servidor",
      type: "server_error",
    });
  }
};

const edit = async (req: Request, res: Response) => {
  const { codUsuario } = req.params;

  try {
    const usuario = await model.findById(codUsuario);

    if (!usuario) {
      return res.status(404).json({
        message: "Usuario no encontrado",
        type: "not_found",
      });
    }

    res.json(usuario);
  } catch (error) {
    console.error(
      "Error finding usuario for edit:",
      error instanceof Error ? error.message : "Unknown error"
    );

    if (error instanceof DatabaseError) {
      return res.status(400).json({
        message: error.message,
        type: "validation_error",
      });
    }

    return res.status(500).json({
      message: "Error interno del servidor",
      type: "server_error",
    });
  }
};

const update = async (req: Request, res: Response) => {
  const codUsuario = req.params.codUsuario;
  const { dni, cuil, nombre, apellido, telefono, email, contraseña } = req.body;

  try {
    const result = await model.update(
      codUsuario,
      dni,
      cuil,
      nombre,
      apellido,
      telefono,
      email,
      contraseña
    );

    res.status(200).json({
      message: "Usuarios actualizado exitosamente",
      usuarios: result,
    });
  } catch (error) {
    console.error(
      "Error updating usuarios:",
      error instanceof Error ? error.message : "Unknown error"
    );

    if (error instanceof DatabaseError) {
      return res.status(400).json({
        message: error.message,
        type: "validation_error",
      });
    }

    return res.status(500).json({
      message: "Error interno del servidor",
      type: "server_error",
    });
  }
};

const destroy = async (req: Request, res: Response) => {
  const { codUsuario } = req.params;

  try {
    const result = await model.destroy(codUsuario);

    res.status(200).json({
      message: "Usuarios eliminado correctamente",
      usuarios: result,
    });
  } catch (error) {
    console.error(
      "Error deleting usuarios:",
      error instanceof Error ? error.message : "Unknown error"
    );

    if (error instanceof DatabaseError) {
      return res.status(400).json({
        message: error.message,
        type: "validation_error",
      });
    }

    return res.status(500).json({
      message: "Error interno del servidor",
      type: "server_error",
    });
  }
};

export { create, store, index, show, edit, update, destroy };