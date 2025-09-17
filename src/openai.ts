import { z } from "zod";

type ZodTypeAny = z.ZodTypeAny;
type SimplifiedZodType =
  | z.ZodString
  | z.ZodNumber
  | z.ZodBoolean
  | z.ZodEnum<any>
  | z.ZodArray<any>
  | z.ZodObject<any>
  | z.ZodUnion<any>
  | z.ZodNullable<any>;

/**
 * Converts a Zod schema to a simplified version compatible with OpenAI's JSON schema requirements
 */
export function forOpenAI<T extends ZodTypeAny>(schema: T): SimplifiedZodType {
  return handle(schema);
}

function handle(schema: ZodTypeAny): SimplifiedZodType {
  const typeName = schema._def.typeName;

  switch (typeName) {
    case z.ZodFirstPartyTypeKind.ZodString:
      return handleZodString(schema as z.ZodString);

    case z.ZodFirstPartyTypeKind.ZodNumber:
      return preserveDescription(z.number(), schema);

    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return preserveDescription(z.boolean(), schema);

    case z.ZodFirstPartyTypeKind.ZodDate:
      // Dates must be converted to strings for OpenAI
      return preserveDescription(z.string(), schema);

    case z.ZodFirstPartyTypeKind.ZodEnum:
      return handleZodEnum(schema as z.ZodEnum<any>);

    case z.ZodFirstPartyTypeKind.ZodArray:
      return handleZodArray(schema as z.ZodArray<any>);

    case z.ZodFirstPartyTypeKind.ZodObject:
      return handleZodObject(schema as z.ZodObject<any>);

    case z.ZodFirstPartyTypeKind.ZodUnion:
      return handleZodUnion(schema as z.ZodUnion<any>);

    case z.ZodFirstPartyTypeKind.ZodOptional:
      return handleZodOptional(schema as z.ZodOptional<any>);

    case z.ZodFirstPartyTypeKind.ZodNullable:
      return handleZodNullable(schema as z.ZodNullable<any>);

    case z.ZodFirstPartyTypeKind.ZodDefault:
      return handleZodDefault(schema as z.ZodDefault<any>);

    case z.ZodFirstPartyTypeKind.ZodEffects:
      return handleZodEffects(schema as z.ZodEffects<any>);

    case z.ZodFirstPartyTypeKind.ZodLiteral:
      return handleZodLiteral(schema as z.ZodLiteral<any>);

    case z.ZodFirstPartyTypeKind.ZodRecord:
      return handleZodRecord(schema as z.ZodRecord<any>);

    case z.ZodFirstPartyTypeKind.ZodTuple:
      return handleZodTuple(schema as z.ZodTuple<any>);

    default:
      // For unsupported types, try to fall back to string
      console.warn(`Unsupported Zod type: ${typeName}. Converting to string.`);
      return preserveDescription(z.string(), schema);
  }
}

/**
 * Helper function to preserve description from original schema to new schema
 */
function preserveDescription<T extends ZodTypeAny>(
  newSchema: T,
  originalSchema: ZodTypeAny,
): T {
  if (originalSchema.description) {
    return newSchema.describe(originalSchema.description) as T;
  }
  return newSchema;
}

function handleZodString(schema: z.ZodString): z.ZodString {
  // Remove all string validations (email, url, uuid, etc.) and return basic string
  let result = z.string();

  // Preserve description if it exists
  if (schema.description) {
    result = result.describe(schema.description);
  }

  return result;
}

function handleZodEnum(schema: z.ZodEnum<any>): z.ZodEnum<any> {
  // Enums are supported, but we need to remove any default values
  const values = schema._def.values;
  let result = z.enum(values);

  // Preserve description if it exists
  if (schema.description) {
    result = result.describe(schema.description);
  }

  return result;
}

function handleZodArray(schema: z.ZodArray<any>): z.ZodArray<any> {
  const elementType = handle(schema._def.type);
  let result = z.array(elementType);

  // Preserve description if it exists
  if (schema.description) {
    result = result.describe(schema.description);
  }

  return result;
}

function handleZodObject(schema: z.ZodObject<any>): z.ZodObject<any> {
  const shape = schema._def.shape();
  const simplifiedShape: Record<string, ZodTypeAny> = {};

  for (const [key, value] of Object.entries(shape)) {
    simplifiedShape[key] = handle(value as ZodTypeAny);
  }

  let result = z.object(simplifiedShape);

  // Preserve description if it exists
  if (schema.description) {
    result = result.describe(schema.description);
  }

  return result;
}

function handleZodUnion(schema: z.ZodUnion<any>): z.ZodUnion<any> {
  const options = schema._def.options.map((option: ZodTypeAny) =>
    handle(option),
  );
  let result = z.union(options as [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]);

  // Preserve description if it exists
  if (schema.description) {
    result = result.describe(schema.description);
  }

  return result;
}

function handleZodOptional(schema: z.ZodOptional<any>): z.ZodNullable<any> {
  // Convert optional to nullable as OpenAI doesn't support optional
  const innerType = handle(schema._def.innerType);
  let result = z.nullable(innerType);

  // Preserve description if it exists
  if (schema.description) {
    result = result.describe(schema.description);
  }

  return result;
}

function handleZodNullable(schema: z.ZodNullable<any>): z.ZodNullable<any> {
  const innerType = handle(schema._def.innerType);
  let result = z.nullable(innerType);

  // Preserve description if it exists
  if (schema.description) {
    result = result.describe(schema.description);
  }

  return result;
}

function handleZodDefault(schema: z.ZodDefault<any>): SimplifiedZodType {
  // Remove default values and return the underlying type, but preserve description
  const innerType = handle(schema._def.innerType);

  // Preserve description if it exists
  if (schema.description) {
    return (innerType as any).describe(schema.description);
  }

  return innerType;
}

function handleZodEffects(schema: z.ZodEffects<any>): SimplifiedZodType {
  // Remove effects/refinements and return the underlying type, but preserve description
  const innerType = handle(schema._def.schema);

  // Preserve description if it exists
  if (schema.description) {
    return (innerType as any).describe(schema.description);
  }

  return innerType;
}

function handleZodLiteral(schema: z.ZodLiteral<any>): z.ZodEnum<any> {
  // Convert literals to single-value enums
  const value = schema._def.value;
  let result = z.enum([value]);

  // Preserve description if it exists
  if (schema.description) {
    result = result.describe(schema.description);
  }

  return result;
}

function handleZodRecord(schema: z.ZodRecord<any>): z.ZodObject<any> {
  // Records are not well supported, convert to an empty object
  // In practice, you might want to handle this differently based on your use case
  console.warn(
    "ZodRecord converted to empty object. You may need to define specific properties.",
  );
  let result = z.object({});

  // Preserve description if it exists
  if (schema.description) {
    result = result.describe(schema.description);
  }

  return result;
}

function handleZodTuple(schema: z.ZodTuple<any>): z.ZodArray<any> {
  // Convert tuples to arrays of union types
  const items = schema._def.items;
  let result: z.ZodArray<any>;

  if (items.length === 0) {
    result = z.array(z.unknown());
  } else {
    const simplifiedItems = items.map((item: ZodTypeAny) => handle(item));

    if (simplifiedItems.length === 1) {
      result = z.array(simplifiedItems[0]);
    } else {
      // Create union of all tuple item types
      const unionType = z.union(
        simplifiedItems as [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]],
      );
      result = z.array(unionType);
    }
  }

  // Preserve description if it exists
  if (schema.description) {
    result = result.describe(schema.description);
  }

  return result;
}
