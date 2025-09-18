import { z } from "zod";

/**
 * Extract the shape type from a Zod object schema
 */
type ZodObjectShape<T> = T extends z.ZodObject<infer U> ? U : never;

/**
 * Get the keys of a Zod object schema shape
 */
type ZodObjectKeys<T> = keyof ZodObjectShape<T>;

/**
 * Transform a Zod object schema to make all properties nullable except those specified in `except`
 */
export function partial<
  T extends z.ZodObject<any>,
  TExcept extends Partial<Record<ZodObjectKeys<T>, boolean>>,
>(
  schema: T,
  except?: TExcept,
): z.ZodObject<{
  [K in keyof ZodObjectShape<T>]: K extends keyof TExcept
    ? TExcept[K] extends true
      ? ZodObjectShape<T>[K]
      : z.ZodDefault<z.ZodNullable<ZodObjectShape<T>[K]>>
    : z.ZodDefault<z.ZodNullable<ZodObjectShape<T>[K]>>;
}> {
  const shape = schema.shape;
  const newShape: Record<string, any> = {};

  for (const key in shape) {
    const field = shape[key];
    const shouldKeepRequired = except && except[key] === true;

    if (shouldKeepRequired) {
      newShape[key] = field;
    } else {
      newShape[key] = field.nullable().default(null);
    }
  }

  return z.object(newShape) as z.ZodObject<{
    [K in keyof ZodObjectShape<T>]: K extends keyof TExcept
      ? TExcept[K] extends true
        ? ZodObjectShape<T>[K]
        : z.ZodDefault<z.ZodNullable<ZodObjectShape<T>[K]>>
      : z.ZodDefault<z.ZodNullable<ZodObjectShape<T>[K]>>;
  }>;
}
