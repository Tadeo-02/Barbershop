import type { Request, Response } from "express";
import { z } from "zod";
import { DatabaseError } from "./Base";
import { sanitizeOutput } from "../middleware/zodValidation";
// manejo universal de los distintos datos que llegan del front
export abstract class BaseController<
  T,
  TCreateArgs extends unknown[] = unknown[],
  TUpdateArgs extends unknown[] = unknown[],
> {
  protected abstract model: {
    store: (...args: TCreateArgs) => Promise<T | T[]>;
    findAll: () => Promise<T[]>;
    findById: (id: string) => Promise<T | null>;
    update: (id: string, ...args: TUpdateArgs) => Promise<T>;
    destroy: (id: string) => Promise<T>;
  };
  protected responseSchema?: z.ZodTypeAny;
  // nombre del componente y el id que se utilizan para navegar
  protected abstract entityName: string;
  protected abstract idFieldName: string;
  // aplica schema de respuesta si existe
  protected shapeResponse(data: unknown) {
    if (!this.responseSchema) return data;
    return sanitizeOutput(this.responseSchema, data);
  }
  // los path son generados de acuerdo a los parametros que llegan (nombre del componente e id)
  create = (_req: Request, res: Response) => {
    res.render(
      `/src/FRONT/views/components/${this.entityName}/create${this.entityName}`,
    );
  };

  store = async (req: Request, res: Response) => {
    // manejo de errores generales en estructura generica
    try {
      const args = Object.values(req.body) as unknown as TCreateArgs;
      const result = await this.model.store(...args);
      const safeResult = this.shapeResponse(result);
      res.status(201).json({
        message: `${this.entityName} creado exitosamente`,
        [this.entityName]: safeResult,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  index = async (_req: Request, res: Response) => {
    try {
      const entities = await this.model.findAll();
      const safeEntities = this.shapeResponse(entities);
      res.status(200).json(safeEntities);
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
      const safeEntity = this.shapeResponse(entity);
      res.status(200).json(safeEntity);
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
      const safeEntity = this.shapeResponse(entity);
      res.json(safeEntity);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  update = async (req: Request, res: Response) => {
    const id = req.params[this.idFieldName];
    try {
      const args = Object.values(req.body) as unknown as TUpdateArgs;
      const result = await this.model.update(id, ...args);
      const safeResult = this.shapeResponse(result);
      res.status(200).json({
        message: `${this.entityName} actualizado exitosamente`,
        [this.entityName]: safeResult,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  destroy = async (req: Request, res: Response) => {
    const id = req.params[this.idFieldName];
    try {
      const result = await this.model.destroy(id);
      const safeResult = this.shapeResponse(result);
      res.status(200).json({
        message: `${this.entityName} eliminado correctamente`,
        [this.entityName]: safeResult,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  protected handleError(error: unknown, res: Response) {
    console.error(
      `Error in ${this.entityName}:`,
      error instanceof Error ? error.message : "Unknown error",
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
