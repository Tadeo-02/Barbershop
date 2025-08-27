import type { Request, Response } from "express";
import type { ResultSetHeader } from "mysql2";
import * as model from "../models/Barberos";
const create = (_req: Request, res: Response) => {
  res.render("barberos/createBarberos");
};

const store = async (req: Request, res: Response) => {
  const { cuil, nombre, apellido, telefono } = req.body;

  console.log("Received data:", { cuil, nombre, apellido, telefono });

  try {
    const result = await model.store(cuil, nombre, apellido, telefono);
    console.log("Store result:", result);
    console.log("Affected rows:", result.affectedRows);
    console.log("Insert ID:", result.insertId);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Barbero created successfully" });
    } else {
      res
        .status(400)
        .json({ message: "Failed to create barbero - no rows affected" });
    }
  } catch (error) {
    console.error("Error creating barbero:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: errorMessage });
  }
};

const index = async (_req: Request, res: Response) => {
  try {
    const barberos = await model.findAll();
    res.status(200).json(barberos);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const show = async (req: Request, res: Response) => {
  console.log(req.params);

  const { cuil } = req.params;

  try {
    const barbero = await model.findById(cuil);
    // console.log(barbero);
    if (!barbero) {
      return res.status(404).send("Barbero no encontrado");
    }
    res.status(200).json(barbero);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const edit = async (req: Request, res: Response) => {
  const { cuil } = req.params;

  try {
    const barbero = await model.findById(cuil);
    console.log(barbero);
    if (!barbero) {
      return res.status(404).json({ message: "Barbero no encontrado" });
    }
    res.json(barbero);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
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
    console.log(result);
    res.json({ message: "Barbero updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const destroy = async (req: Request, res: Response) => {
  const { cuil } = req.params;

  try {
    const result = (await model.destroy(cuil)) as ResultSetHeader;
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Barbero no encontrado" });
    }
    res.status(200).json({ message: "Barbero eliminado correctamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export { create, store, index, show, edit, update, destroy };
