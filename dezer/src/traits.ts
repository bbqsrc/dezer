/**
 * @fileoverview Core traits for serialization using symbol-based methods
 *
 * Mirrors Rust's serde trait system but using TypeScript symbols to avoid
 * prototype pollution and ensure consistency across dependencies.
 */

import type { Deserializer } from "./deserializer.ts"
import type { Serializer } from "./serializer.ts"

/**
 * Global symbols for serialization traits.
 * Using Symbol.for() ensures the same symbol across different module loads.
 */
export const SERIALIZE = Symbol.for("dezer.serialize")
export const DESERIALIZE = Symbol.for("dezer.deserialize")

/**
 * Trait for types that can be serialized.
 *
 * This trait is implemented by generated code and takes a Serializer
 * which handles the actual output format (JSON, YAML, etc.).
 */
export interface Serialize {
  /**
   * Serialize this value using the given serializer.
   *
   * @param serializer The format-specific serializer to use
   */
  [SERIALIZE]<S extends Serializer>(serializer: S): void
}

/**
 * Trait for types that can be deserialized.
 *
 * This trait is implemented as a method on prototypes
 * and uses a Deserializer with visitor pattern for type-safe parsing.
 */
export interface Deserialize {
  /**
   * Deserialize a value using the given deserializer.
   *
   * @param deserializer The format-specific deserializer to use
   * @returns The deserialized value of this type
   */
  [DESERIALIZE]<D extends Deserializer>(deserializer: D): this
}

/**
 * Type helper to check if a value implements Serialize trait
 */
export function isSerializable(value: unknown): value is Serialize {
  return typeof value === "object" && value !== null && SERIALIZE in value
}

/**
 * Type helper to check if a constructor's prototype implements Deserialize trait
 */
export function isDeserializable<T extends Deserialize>(ctor: unknown): ctor is new (...args: any[]) => T {
  return typeof ctor === "function" && typeof (ctor as any).prototype === "object" &&
    DESERIALIZE in (ctor as any).prototype
}

/**
 * Serialize a value that implements the Serialize trait
 *
 * @param value The value to serialize (must implement Serialize)
 * @param serializer The serializer to use
 */
export function serialize<S extends Serializer>(value: Serialize, serializer: S): void {
  value[SERIALIZE](serializer)
}

/**
 * Serialize a value if it implements the Serialize trait (runtime check)
 *
 * @param value The value to serialize
 * @param serializer The serializer to use
 * @throws Error if the value is not serializable
 */
export function serializeUnknown<S extends Serializer>(value: unknown, serializer: S): void {
  if (isSerializable(value)) {
    value[SERIALIZE](serializer)
  } else {
    throw new Error(`Value does not implement Serialize trait: ${typeof value}`)
  }
}

/**
 * Deserialize a value using a prototype that implements Deserialize trait
 *
 * @param ctor The constructor whose prototype can deserialize the type
 * @param deserializer The deserializer to use
 * @returns The deserialized value
 */
export function deserialize<T extends Deserialize, D extends Deserializer>(
  ctor: new (...args: any[]) => T,
  deserializer: D,
): T {
  return (ctor.prototype as T)[DESERIALIZE](deserializer)
}

/**
 * Deserialize a value using a constructor if it implements Deserialize trait (runtime check)
 *
 * @param ctor The constructor that can deserialize the type
 * @param deserializer The deserializer to use
 * @returns The deserialized value
 * @throws Error if the constructor is not deserializable
 */
export function deserializeUnknown<T extends Deserialize, D extends Deserializer>(
  ctor: unknown,
  deserializer: D,
): T {
  if (isDeserializable<T>(ctor)) {
    return (ctor.prototype as T)[DESERIALIZE](deserializer)
  } else {
    throw new Error(`Constructor does not implement Deserialize trait: ${ctor}`)
  }
}
