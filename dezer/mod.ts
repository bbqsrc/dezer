/**
 * @fileoverview Dezer - A serde-like serialization library for TypeScript/Deno
 *
 * Provides decorators for marking classes and properties as serializable,
 * with visitor pattern-based code generation for format-agnostic serialization.
 *
 * @example
 * ```typescript
 * import { Serializable, Field, Ignore, SERIALIZE, DESERIALIZE } from "@dezer/core"
 * import { toString, fromString } from "@dezer/json"
 *
 * @Serializable()
 * class User {
 *   @Field()
 *   name: string
 *
 *   @Field({ name: "email_address" })
 *   email: string
 *
 *   @Ignore()
 *   password: string
 * }
 *
 * // After running code generation:
 * const user = new User("John", "john@example.com", "secret")
 * const json = toString(user)  // Uses visitor pattern with JSON format
 * const restored = fromString(json, User)  // Uses visitor pattern for parsing
 * ```
 */

// Core traits and symbols
export { DESERIALIZE, deserialize, deserializeUnknown, SERIALIZE, serialize, serializeUnknown } from "./src/traits.ts"
export type { Deserialize, Serialize } from "./src/traits.ts"

// Serializer interfaces (for format implementations)
export type { MapSerializer, OptionSerializer, SeqSerializer, Serializer, StructSerializer } from "./src/serializer.ts"
export { SerializationError, serializePrimitive } from "./src/serializer.ts"

// Deserializer and visitor interfaces (for format implementations)
export type { Deserializer, EnumAccess, MapAccess, SeqAccess, Visitor } from "./src/deserializer.ts"
export { BaseVisitor, DeserializationError, PrimitiveVisitor } from "./src/deserializer.ts"

// Decorators for user code
export { Custom, Field, Ignore, Serializable } from "./src/decorators.ts"
export type { CustomDeserializer, CustomSerializer, FieldOptions, SerializableOptions } from "./src/types.ts"

// Compiler utilities for format implementations and advanced usage
export { parseSourceFile } from "./src/compiler/parser.ts"
export { generateAugmentationFile, generateCentralDezerFile } from "./src/compiler/generator.ts"
export { findSourceFiles, generateCentralDezer, processFile } from "./src/compiler/utils.ts"
