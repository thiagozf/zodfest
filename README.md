# zodfest

[![npm version](https://badge.fury.io/js/zodfest.svg)](https://badge.fury.io/js/zodfest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why zodfest?

Zod provides utilities for converting Zod schemas. It is useful to generate compatible schemas for various platforms that don't some schema features. For example, OpenAI's SDK tools and structured outputs do not support:

- String formats (email, regex, uuid, etc.)
- Effects and refinements
- Optional properties
- Default values

**zodfest** bridges this gap by transforming your Zod schemas into compatible versions that work seamlessly with these platforms while preserving important metadata like descriptions.

## Installation

```bash
npm install zodfest
```

```bash
yarn add zodfest
```

```bash
bun add zodfest
```

## Usage

### OpenAI Compatibility

Convert your Zod schemas to be compatible with OpenAI's function calling and structured outputs:

```typescript
import { z } from "zod";
import { forOpenAI } from "zodfest";

const userSchema = z.object({
  name: z.string().min(1).describe("User's name"),
  email: z.string().email().describe("User's email address"),
  site: z.string().url().describe("User's website URL"),
  slug: z.string().transform(() => /* slugify */).describe("User slug"), // custom rule
  birth_date: z.date().describe("User's date of birth"),
  status: z.enum(['active', 'inactive']).default('active').describe("Account status"),
  comment: z.string().optional().describe("Optional comment about the user"),
});

// Use with OpenAI SDK
const tool = {
  type: "function",
  function: {
    name: "getUser",
    description: "Get user information",
    parameters: forOpenAI(userSchema),
  },
};

// Converted Zod schema looks like this:
z.object({
  name: z.string().describe("User's name"), // Plain string
  email: z.string().describe("User's email address"), // Plain string
  site: z.string().describe("User's website URL"), // Plain string
  slug: z.string().describe("User slug"), // Transforms/effects removed
  birth_date: z.string().describe("User's date of birth"), // Date becomes string
  status: z.enum(['active', 'inactive']).describe("Account status"), // Defaults are removed
  comment: z.string().nullable().describe("Optional comment about the user"), // Optional becomes nullable
});
```

## Features

### forOpenAI

The `forOpenAI` function transforms your Zod schemas to be compatible with OpenAI's JSON schema requirements:

| Zod Type                                          | Transformation                                |
| ------------------------------------------------- | --------------------------------------------- |
| `ZodString` with formats (email, url, uuid, etc.) | Basic `ZodString`                             |
| `ZodOptional`                                     | Converted to `ZodNullable`                    |
| `ZodDefault`                                      | Removed, underlying type preserved            |
| `ZodEffects`                                      | Removed, underlying type preserved            |
| `ZodDate`                                         | Converted to `ZodString`                      |
| `ZodLiteral`                                      | Converted to single-value `ZodEnum`           |
| `ZodRecord`                                       | Converted to empty `ZodObject` (with warning) |
| `ZodTuple`                                        | Converted to `ZodArray` of union types        |

Descriptions are preserved during transformation when possible.

## API Reference

### forOpenAI(schema)

Converts a Zod schema to an OpenAI-compatible version.

```typescript
import { forOpenAI } from "zodfest";

const openAISchema = forOpenAI(yourZodSchema);
```

**Parameters:**

- `schema`: Any Zod schema

**Returns:** A transformed Zod schema compatible with OpenAI

## TypeScript Support

zodfest is written in TypeScript and provides full type definitions. All transformations maintain type safety and provide accurate type inference.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [Zod](https://github.com/colinhacks/zod) - TypeScript-first schema declaration and validation
- [zod-to-json-schema](https://github.com/StefanTerdell/zod-to-json-schema) - Convert Zod schemas to JSON Schema

## Support

If you encounter any issues or have questions, please [file an issue](https://github.com/thiagozf/zodfest/issues) on GitHub.
