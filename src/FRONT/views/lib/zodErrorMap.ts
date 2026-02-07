import { z, type ZodErrorMap } from "zod";

const zodErrorMap: ZodErrorMap = (issue) => {
  switch (issue.code) {
    case "invalid_type": {
      if (issue.input === undefined || issue.input === null) {
        return { message: "Campo requerido" };
      }
      if (issue.expected === "number") return { message: "Debe ser un numero" };
      if (issue.expected === "string") return { message: "Debe ser un texto" };
      if (issue.expected === "boolean") return { message: "Debe ser verdadero o falso" };
      if (issue.expected === "date") return { message: "Fecha invalida" };
      return { message: "Tipo invalido" };
    }
    case "too_small": {
      if (issue.origin === "string") {
        if (issue.minimum === 1) return { message: "Campo requerido" };
        return { message: `Debe tener al menos ${issue.minimum} caracteres` };
      }
      if (issue.origin === "number" || issue.origin === "int" || issue.origin === "bigint") {
        const cmp = issue.inclusive ? "mayor o igual" : "mayor";
        return { message: `Debe ser ${cmp} a ${issue.minimum}` };
      }
      if (issue.origin === "array" || issue.origin === "set") {
        return { message: `Debe tener al menos ${issue.minimum} elementos` };
      }
      return { message: "Valor demasiado pequeno" };
    }
    case "too_big": {
      if (issue.origin === "string") return { message: `Debe tener como maximo ${issue.maximum} caracteres` };
      if (issue.origin === "number" || issue.origin === "int" || issue.origin === "bigint") {
        const cmp = issue.inclusive ? "menor o igual" : "menor";
        return { message: `Debe ser ${cmp} a ${issue.maximum}` };
      }
      if (issue.origin === "array" || issue.origin === "set") {
        return { message: `Debe tener como maximo ${issue.maximum} elementos` };
      }
      return { message: "Valor demasiado grande" };
    }
    case "invalid_format": {
      if (issue.format === "email") return { message: "Correo invalido" };
      if (issue.format === "regex") return { message: "Formato invalido" };
      if (issue.format === "uuid") return { message: "UUID invalido" };
      if (issue.format === "url") return { message: "URL invalida" };
      return { message: "Texto invalido" };
    }
    case "invalid_value":
      return { message: "Valor invalido" };
    case "invalid_union":
      return { message: "Valor invalido" };
    case "invalid_key":
      return { message: "Clave invalida" };
    case "invalid_element":
      return { message: "Elemento invalido" };
    case "not_multiple_of":
      return { message: `Debe ser multiplo de ${issue.divisor}` };
    case "unrecognized_keys":
      return { message: "Campos no permitidos" };
    case "custom":
      return { message: "Error de validacion" };
    default:
      return { message: "Error de validacion" };
  }
};

export const applyZodErrorMap = () => {
  z.setErrorMap(zodErrorMap);
};
