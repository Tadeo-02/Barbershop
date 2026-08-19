import { zodResolver } from "@hookform/resolvers/zod";
import { normalizeFormErrors } from "./formErrorUtils";

type ZodResolverSchema = Parameters<typeof zodResolver>[0];

/**
 * Crea un resolver de react-hook-form a partir de un schema de Zod,
 * normalizando automáticamente los mensajes de error (trim, descarte de
 * mensajes vacíos, etc.) antes de que lleguen al formulario.
 *
 * Reemplaza el patrón repetido de envolver `zodResolver(schema)` en una
 * función que llama a `normalizeFormErrors` sobre el resultado.
 *
 * @example
 * const {
 *   register,
 *   handleSubmit,
 *   formState: { errors },
 * } = useForm<CreateCategoryForm>({
 *   resolver: createResolver(CreateCategorySchema),
 * });
 */
export const createResolver = <TSchema extends ZodResolverSchema>(
  schema: TSchema,
) => {
  const resolve = zodResolver(schema);

  const resolver: typeof resolve = async (values, context, options) => {
    const result = await resolve(values, context, options);
    return normalizeFormErrors(result) ?? result;
  };

  return resolver;
};
