import type { Request, Response } from "express";
import * as model from "./Barberos";
import { DatabaseError } from "./Barberos";

const create = (_req: Request, res: Response) => {
  res.render("/src/FRONT/views/components/barberos/createBarbero");
};

const store = async (req: Request, res: Response) => {
  const { cuil, nombre, apellido, telefono } = req.body;

  console.log("Store barbero request received"); //console log seguro

  try {
    const result = await model.store(cuil, nombre, apellido, telefono);
    console.log("Barbero created successfully");
//no es necesaria una validacion, prisma garantiza que si llega a esta instancia no hay errores
    res.status(201).json({
      message: "Barbero creado exitosamente",
      barbero: result,
    });
  } catch (error) {
    console.error(
      "Error creating barbero:",
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
    const barberos = await model.findAll();
    res.status(200).json(barberos);
  } catch (error) {
    console.error(
      "Error fetching barberos:",
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
  const { cuil } = req.params;

  try {
    const barbero = await model.findById(cuil);

    if (!barbero) {
      return res.status(404).json({
        message: "Barbero no encontrado",
        type: "not_found",
      });
    }

    res.status(200).json(barbero);
  } catch (error) {
    console.error(
      "Error finding barbero:",
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
  const { cuil } = req.params;

  try {
    const barbero = await model.findById(cuil);

    if (!barbero) {
      return res.status(404).json({
        message: "Barbero no encontrado",
        type: "not_found",
      });
    }

    res.json(barbero);
  } catch (error) {
    console.error(
      "Error finding barbero for edit:",
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
  const cuilViejo = req.params.cuil;
  const { nuevoCuil, nombre, apellido, telefono } = req.body;

  try {
    const result = await model.update(
      cuilViejo,
      nuevoCuil,
      nombre,
      apellido,
      telefono
    );

    res.status(200).json({
      message: "Barbero actualizado exitosamente",
      barbero: result,
    });
  } catch (error) {
    console.error(
      "Error updating barbero:",
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
  const { cuil } = req.params;

  try {
    const result = await model.destroy(cuil);

    res.status(200).json({
      message: "Barbero eliminado correctamente",
      barbero: result,
    });
  } catch (error) {
    console.error(
      "Error deleting barbero:",
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
