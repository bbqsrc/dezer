/**
 * @fileoverview Serializer interfaces for the visitor pattern
 *
 * Defines the abstract interface that all format-specific serializers
 * must implement. This mirrors Rust serde's Serializer trait.
 */

/**
 * Core serializer interface that all format implementations must provide.
 *
 * This interface is format-agnostic and allows the same serialization
 * code to work with any output format (JSON, YAML, MessagePack, etc.).
 */
export interface Serializer {
  // Primitive types
  /**
   * Serialize a null value
   */
  serializeNull(): void

  /**
   * Serialize a boolean value
   */
  serializeBool(v: boolean): void

  /**
   * Serialize a numeric value
   */
  serializeNumber(v: number): void

  /**
   * Serialize a string value
   */
  serializeString(v: string): void

  /**
   * Serialize raw bytes
   */
  serializeBytes(v: Uint8Array): void

  // Compound types
  /**
   * Begin serializing a sequence (array/list)
   *
   * @param len Optional length hint for the sequence
   * @returns A sequence serializer for adding elements
   */
  serializeSeq(len?: number): SeqSerializer

  /**
   * Begin serializing a map (object with arbitrary keys)
   *
   * @param len Optional length hint for the map
   * @returns A map serializer for adding key-value pairs
   */
  serializeMap(len?: number): MapSerializer

  /**
   * Begin serializing a struct (object with known fields)
   *
   * @param name The struct name (for debugging/schema)
   * @param len The number of fields in the struct
   * @returns A struct serializer for adding fields
   */
  serializeStruct(name: string, len: number): StructSerializer

  // Advanced types
  /**
   * Serialize an optional value (like Rust's Option<T>)
   *
   * @param value The optional value to serialize
   * @returns An option serializer for handling Some/None
   */
  serializeOption<T>(value: T | null | undefined): OptionSerializer<T>

  /**
   * Serialize a newtype wrapper (single-field struct)
   *
   * @param name The newtype name
   * @param value The wrapped value
   */
  serializeNewtype<T>(name: string, value: T): void

  /**
   * Serialize an enum variant
   *
   * @param name The enum name
   * @param variant The variant name
   * @param data Optional data for the variant
   */
  serializeEnum(name: string, variant: string, data?: unknown): void
}

/**
 * Interface for serializing sequence elements
 */
export interface SeqSerializer {
  /**
   * Serialize the next element in the sequence
   *
   * @param value The element to serialize
   */
  serializeElement<T>(value: T): void

  /**
   * Finish serializing the sequence
   */
  end(): void
}

/**
 * Interface for serializing map entries
 */
export interface MapSerializer {
  /**
   * Serialize a complete key-value entry
   *
   * @param key The key to serialize
   * @param value The value to serialize
   */
  serializeEntry<K, V>(key: K, value: V): void

  /**
   * Serialize just the key part of an entry
   * (followed by serializeValue)
   *
   * @param key The key to serialize
   */
  serializeKey<K>(key: K): void

  /**
   * Serialize just the value part of an entry
   * (after serializeKey)
   *
   * @param value The value to serialize
   */
  serializeValue<V>(value: V): void

  /**
   * Finish serializing the map
   */
  end(): void
}

/**
 * Interface for serializing struct fields
 */
export interface StructSerializer {
  /**
   * Serialize a struct field
   *
   * @param name The field name
   * @param value The field value
   */
  serializeField<T>(name: string, value: T): void

  /**
   * Skip a field (for conditional serialization)
   *
   * @param name The field name to skip
   */
  skipField(name: string): void

  /**
   * Finish serializing the struct
   */
  end(): void
}

/**
 * Interface for serializing optional values
 */
export interface OptionSerializer<T> {
  /**
   * Serialize a Some(value) - the value is present
   *
   * @param value The present value
   */
  serializeSome(value: T): void

  /**
   * Serialize a None - the value is absent
   */
  serializeNone(): void
}

/**
 * Error thrown during serialization
 */
export class SerializationError extends Error {
  constructor(message: string, cause?: Error) {
    super(message)
    this.name = "SerializationError"
    this.cause = cause
  }
}

/**
 * Helper function to serialize any primitive value
 *
 * @param serializer The serializer to use
 * @param value The primitive value to serialize
 */
export function serializePrimitive(serializer: Serializer, value: unknown): void {
  if (value === null || value === undefined) {
    serializer.serializeNull()
  } else if (typeof value === "boolean") {
    serializer.serializeBool(value)
  } else if (typeof value === "number") {
    serializer.serializeNumber(value)
  } else if (typeof value === "string") {
    serializer.serializeString(value)
  } else if (value instanceof Uint8Array) {
    serializer.serializeBytes(value)
  } else {
    throw new SerializationError(`Cannot serialize primitive value: ${typeof value}`)
  }
}
