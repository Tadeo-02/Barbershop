/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import { DatabaseError } from "./Base";

export abstract class BaseController<T> {
  protected abstract model: {
    store: (...args: any[]) => Promise<T>;
    findAll: () => Promise<T[]>;
    findById: (id: string) => Promise<T | null>;
    update: (id: string, ...args: any[]) => Promise<T>;
    destroy: (id: string) => Promise<T>;
  };

  protected abstract entityName: string;
  protected abstract idFieldName: string;

  create = (_req: Request, res: Response) => {
    res.render(`/src/FRONT/views/components/${this.entityName}/create${this.entityName}`);
  };

  store = async (req: Request, res: Response) => {
    try {
      const result = await this.model.store(...Object.values(req.body));
      res.status(201).json({
        message: `${this.entityName} creado exitosamente`,
        [this.entityName]: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  index = async (_req: Request, res: Response) => {
    try {
      const entities = await this.model.findAll();
      res.status(200).json(entities);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  show = async (req: Request, res: Response) => {
    const id = req.params[this.idFieldName];
    try {
      const entity = await this.model.findById(id);
      if (!entity) {
        return res.status(404).json({
          message: `${this.entityName} no encontrado`,
          type: "not_found",
        });
      }
      res.status(200).json(entity);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  edit = async (req: Request, res: Response) => {
    const id = req.params[this.idFieldName];
    try {
      const entity = await this.model.findById(id);
      if (!entity) {
        return res.status(404).json({
          message: `${this.entityName} no encontrado`,
          type: "not_found",
        });
      }
      res.json(entity);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  update = async (req: Request, res: Response) => {
    const id = req.params[this.idFieldName];
    try {
      const result = await this.model.update(id, ...Object.values(req.body));
      res.status(200).json({
        message: `${this.entityName} actualizado exitosamente`,
        [this.entityName]: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  destroy = async (req: Request, res: Response) => {
    const id = req.params[this.idFieldName];
    try {
      const result = await this.model.destroy(id);
      res.status(200).json({
        message: `${this.entityName} eliminado correctamente`,
        [this.entityName]: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  protected handleError(error: unknown, res: Response) {
    console.error(
      `Error in ${this.entityName}:`,
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
}