/**
 * @fileoverview Deserializer and Visitor pattern interfaces
 *
 * Defines the visitor pattern interfaces used for type-safe deserialization.
 * This mirrors Rust serde's Deserializer and Visitor traits.
 */

/**
 * Core deserializer interface that all format implementations must provide.
 *
 * Uses the visitor pattern to allow type-directed deserialization while
 * remaining format-agnostic.
 */
export interface Deserializer {
  /**
   * Deserialize any value by calling the appropriate visitor method
   * based on the input data type.
   *
   * @param visitor The visitor to handle the deserialized value
   * @returns The result from the visitor
   */
  deserializeAny<T>(visitor: Visitor<T>): T

  /**
   * Deserialize a boolean value
   *
   * @param visitor The visitor to handle the boolean
   * @returns The result from the visitor
   */
  deserializeBool<T>(visitor: Visitor<T>): T

  /**
   * Deserialize a numeric value
   *
   * @param visitor The visitor to handle the number
   * @returns The result from the visitor
   */
  deserializeNumber<T>(visitor: Visitor<T>): T

  /**
   * Deserialize a string value
   *
   * @param visitor The visitor to handle the string
   * @returns The result from the visitor
   */
  deserializeString<T>(visitor: Visitor<T>): T

  /**
   * Deserialize raw bytes
   *
   * @param visitor The visitor to handle the bytes
   * @returns The result from the visitor
   */
  deserializeBytes<T>(visitor: Visitor<T>): T

  /**
   * Deserialize a sequence (array/list)
   *
   * @param visitor The visitor to handle the sequence
   * @returns The result from the visitor
   */
  deserializeSeq<T>(visitor: Visitor<T>): T

  /**
   * Deserialize a map (object with arbitrary keys)
   *
   * @param visitor The visitor to handle the map
   * @returns The result from the visitor
   */
  deserializeMap<T>(visitor: Visitor<T>): T

  /**
   * Deserialize a struct (object with known fields)
   *
   * @param name The expected struct name
   * @param fields The expected field names
   * @param visitor The visitor to handle the struct
   * @returns The result from the visitor
   */
  deserializeStruct<T>(name: string, fields: string[], visitor: Visitor<T>): T

  /**
   * Deserialize an optional value
   *
   * @param visitor The visitor to handle the option
   * @returns The result from the visitor
   */
  deserializeOption<T>(visitor: Visitor<T>): T

  /**
   * Deserialize an enum variant
   *
   * @param name The expected enum name
   * @param variants The possible variant names
   * @param visitor The visitor to handle the enum
   * @returns The result from the visitor
   */
  deserializeEnum<T>(name: string, variants: string[], visitor: Visitor<T>): T
}

/**
 * Visitor interface for type-directed deserialization.
 *
 * Each visit method handles a specific type of input data and
 * returns a value of type T.
 */
export interface Visitor<T> {
  /**
   * Return a description of what this visitor expects to receive.
   * Used for error messages when the input doesn't match expectations.
   */
  expecting(): string

  /**
   * Visit a null value
   */
  visitNull(): T

  /**
   * Visit a boolean value
   */
  visitBool(v: boolean): T

  /**
   * Visit a numeric value
   */
  visitNumber(v: number): T

  /**
   * Visit a string value
   */
  visitString(v: string): T

  /**
   * Visit raw bytes
   */
  visitBytes(v: Uint8Array): T

  /**
   * Visit a sequence (array/list)
   *
   * @param seq Access interface for reading sequence elements
   */
  visitSeq(seq: SeqAccess): T

  /**
   * Visit a map (object with arbitrary keys)
   *
   * @param map Access interface for reading map entries
   */
  visitMap(map: MapAccess): T

  /**
   * Visit an enum variant
   *
   * @param data Access interface for reading enum data
   */
  visitEnum(data: EnumAccess): T
}

/**
 * Interface for accessing sequence elements during deserialization
 */
export interface SeqAccess {
  /**
   * Deserialize the next element in the sequence
   *
   * @returns The next element, or undefined if the sequence is complete
   */
  nextElement<T>(): T | undefined

  /**
   * Get a hint about the remaining number of elements
   *
   * @returns The number of remaining elements, or undefined if unknown
   */
  sizeHint(): number | undefined
}

/**
 * Interface for accessing map entries during deserialization
 */
export interface MapAccess {
  /**
   * Deserialize the next key-value pair
   *
   * @returns The next entry as [key, value], or undefined if complete
   */
  nextEntry<K, V>(): [K, V] | undefined

  /**
   * Deserialize the next key (must be followed by nextValue)
   *
   * @returns The next key, or undefined if the map is complete
   */
  nextKey<K>(): K | undefined

  /**
   * Deserialize the next value (after nextKey)
   *
   * @returns The value corresponding to the last key
   */
  nextValue<V>(): V | undefined

  /**
   * Get a hint about the remaining number of entries
   *
   * @returns The number of remaining entries, or undefined if unknown
   */
  sizeHint(): number | undefined
}

/**
 * Interface for accessing enum variant data during deserialization
 */
export interface EnumAccess {
  /**
   * Get the variant name and its associated data
   *
   * @returns A tuple of [variant_name, variant_data]
   */
  variant<T>(): [string, T]
}

/**
 * Error thrown during deserialization
 */
export class DeserializationError extends Error {
  constructor(message: string, cause?: Error) {
    super(message)
    this.name = "DeserializationError"
    this.cause = cause
  }
}

/**
 * Base visitor implementation that provides default error messages
 * for all visit methods. Concrete visitors can extend this and override
 * only the methods they need to handle.
 */
export abstract class BaseVisitor<T> implements Visitor<T> {
  abstract expecting(): string

  visitNull(): T {
    throw new DeserializationError(`Expected ${this.expecting()}, found null`)
  }

  visitBool(v: boolean): T {
    throw new DeserializationError(`Expected ${this.expecting()}, found boolean: ${v}`)
  }

  visitNumber(v: number): T {
    throw new DeserializationError(`Expected ${this.expecting()}, found number: ${v}`)
  }

  visitString(v: string): T {
    throw new DeserializationError(`Expected ${this.expecting()}, found string: "${v}"`)
  }

  visitBytes(v: Uint8Array): T {
    throw new DeserializationError(`Expected ${this.expecting()}, found bytes of length ${v.length}`)
  }

  visitSeq(seq: SeqAccess): T {
    throw new DeserializationError(`Expected ${this.expecting()}, found sequence`)
  }

  visitMap(map: MapAccess): T {
    throw new DeserializationError(`Expected ${this.expecting()}, found map`)
  }

  visitEnum(data: EnumAccess): T {
    throw new DeserializationError(`Expected ${this.expecting()}, found enum`)
  }
}

/**
 * Helper visitor for deserializing primitive values
 */
export class PrimitiveVisitor<T> extends BaseVisitor<T> {
  constructor(
    private expectedType: string,
    private handler: (value: any) => T,
  ) {
    super()
  }

  expecting(): string {
    return this.expectedType
  }

  override visitNull(): T {
    return this.handler(null)
  }

  override visitBool(v: boolean): T {
    return this.handler(v)
  }

  override visitNumber(v: number): T {
    return this.handler(v)
  }

  override visitString(v: string): T {
    return this.handler(v)
  }

  override visitBytes(v: Uint8Array): T {
    return this.handler(v)
  }
}
