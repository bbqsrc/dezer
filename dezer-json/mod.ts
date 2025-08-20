/**
 * @fileoverview Dezer JSON format implementation
 *
 * Provides JSON serialization and deserialization using the visitor pattern.
 * This implements the format-specific Serializer and Deserializer interfaces.
 */

import type {
  Deserialize,
  Deserializer,
  EnumAccess,
  MapAccess,
  MapSerializer,
  OptionSerializer,
  SeqAccess,
  SeqSerializer,
  Serialize,
  Serializer,
  StructSerializer,
  Visitor,
} from "@dezer/core"
import { DeserializationError, deserialize, SerializationError, SERIALIZE, serialize } from "@dezer/core"

/**
 * JSON-specific serializer that implements the visitor pattern
 */
export class JsonSerializer implements Serializer {
  private output: unknown[] = []

  serializeNull(): void {
    this.output.push(null)
  }

  serializeBool(v: boolean): void {
    this.output.push(v)
  }

  serializeNumber(v: number): void {
    this.output.push(v)
  }

  serializeString(v: string): void {
    this.output.push(v)
  }

  serializeBytes(v: Uint8Array): void {
    // Convert bytes to base64 string for JSON compatibility
    this.output.push(btoa(String.fromCharCode(...v)))
  }

  serializeSeq(len?: number): SeqSerializer {
    return new JsonSeqSerializer(this.output)
  }

  serializeMap(len?: number): MapSerializer {
    return new JsonMapSerializer(this.output)
  }

  serializeStruct(name: string, len: number): StructSerializer {
    return new JsonStructSerializer(this.output)
  }

  serializeOption<T>(value: T | null | undefined): OptionSerializer<T> {
    return new JsonOptionSerializer(this.output, value)
  }

  serializeNewtype<T>(name: string, value: T): void {
    // For JSON, newtype is just the wrapped value
    this.output.push(value)
  }

  serializeEnum(name: string, variant: string, data?: unknown): void {
    if (data === undefined) {
      // Simple enum variant as string
      this.output.push(variant)
    } else {
      // Enum with data as object
      this.output.push({ [variant]: data })
    }
  }

  getResult(): unknown {
    return this.output.length === 1 ? this.output[0] : this.output
  }
}

/**
 * JSON sequence serializer
 */
class JsonSeqSerializer implements SeqSerializer {
  private array: unknown[] = []

  constructor(private output: unknown[]) {}

  serializeElement<T>(value: T): void {
    if (typeof value === "object" && value !== null && SERIALIZE in value) {
      const serializer = new JsonSerializer()
      ;(value as any)[SERIALIZE](serializer)
      this.array.push(serializer.getResult())
    } else {
      this.array.push(value)
    }
  }

  end(): void {
    this.output.push(this.array)
  }
}

/**
 * JSON map serializer
 */
class JsonMapSerializer implements MapSerializer {
  private object: Record<string, unknown> = {}

  constructor(private output: unknown[]) {}

  serializeEntry<K, V>(key: K, value: V): void {
    const keyStr = String(key)
    if (typeof value === "object" && value !== null && SERIALIZE in value) {
      const serializer = new JsonSerializer()
      ;(value as any)[SERIALIZE](serializer)
      this.object[keyStr] = serializer.getResult()
    } else {
      this.object[keyStr] = value
    }
  }

  serializeKey<K>(key: K): void {
    // For simplicity, we'll use serializeEntry
    throw new SerializationError("Use serializeEntry for JSON maps")
  }

  serializeValue<V>(value: V): void {
    // For simplicity, we'll use serializeEntry
    throw new SerializationError("Use serializeEntry for JSON maps")
  }

  end(): void {
    this.output.push(this.object)
  }
}

/**
 * JSON struct serializer
 */
class JsonStructSerializer implements StructSerializer {
  private object: Record<string, unknown> = {}

  constructor(private output: unknown[]) {}

  serializeField<T>(name: string, value: T): void {
    if (typeof value === "object" && value !== null && SERIALIZE in value) {
      const serializer = new JsonSerializer()
      ;(value as any)[SERIALIZE](serializer)
      this.object[name] = serializer.getResult()
    } else {
      this.object[name] = value
    }
  }

  skipField(name: string): void {
    // Don't add the field to the object
  }

  end(): void {
    this.output.push(this.object)
  }
}

/**
 * JSON option serializer
 */
class JsonOptionSerializer<T> implements OptionSerializer<T> {
  constructor(
    private output: unknown[],
    private value: T | null | undefined,
  ) {}

  serializeSome(value: T): void {
    if (typeof value === "object" && value !== null && SERIALIZE in value) {
      const serializer = new JsonSerializer()
      ;(value as any)[SERIALIZE](serializer)
      this.output.push(serializer.getResult())
    } else {
      this.output.push(value)
    }
  }

  serializeNone(): void {
    this.output.push(null)
  }
}

/**
 * JSON-specific deserializer that implements the visitor pattern
 */
export class JsonDeserializer implements Deserializer {
  constructor(private data: unknown) {}

  deserializeAny<T>(visitor: Visitor<T>): T {
    if (this.data === null || this.data === undefined) {
      return visitor.visitNull()
    } else if (typeof this.data === "boolean") {
      return visitor.visitBool(this.data)
    } else if (typeof this.data === "number") {
      return visitor.visitNumber(this.data)
    } else if (typeof this.data === "string") {
      return visitor.visitString(this.data)
    } else if (Array.isArray(this.data)) {
      return visitor.visitSeq(new JsonSeqAccess(this.data))
    } else if (typeof this.data === "object") {
      return visitor.visitMap(new JsonMapAccess(this.data as Record<string, unknown>))
    } else {
      throw new DeserializationError(`Cannot deserialize unknown type: ${typeof this.data}`)
    }
  }

  deserializeBool<T>(visitor: Visitor<T>): T {
    if (typeof this.data === "boolean") {
      return visitor.visitBool(this.data)
    }
    throw new DeserializationError(`Expected boolean, found ${typeof this.data}`)
  }

  deserializeNumber<T>(visitor: Visitor<T>): T {
    if (typeof this.data === "number") {
      return visitor.visitNumber(this.data)
    }
    throw new DeserializationError(`Expected number, found ${typeof this.data}`)
  }

  deserializeString<T>(visitor: Visitor<T>): T {
    if (typeof this.data === "string") {
      return visitor.visitString(this.data)
    }
    throw new DeserializationError(`Expected string, found ${typeof this.data}`)
  }

  deserializeBytes<T>(visitor: Visitor<T>): T {
    if (typeof this.data === "string") {
      // Decode base64 string back to bytes
      const bytes = new Uint8Array(atob(this.data).split("").map((c) => c.charCodeAt(0)))
      return visitor.visitBytes(bytes)
    }
    throw new DeserializationError(`Expected base64 string for bytes, found ${typeof this.data}`)
  }

  deserializeSeq<T>(visitor: Visitor<T>): T {
    if (Array.isArray(this.data)) {
      return visitor.visitSeq(new JsonSeqAccess(this.data))
    }
    throw new DeserializationError(`Expected array, found ${typeof this.data}`)
  }

  deserializeMap<T>(visitor: Visitor<T>): T {
    if (typeof this.data === "object" && this.data !== null && !Array.isArray(this.data)) {
      return visitor.visitMap(new JsonMapAccess(this.data as Record<string, unknown>))
    }
    throw new DeserializationError(`Expected object, found ${typeof this.data}`)
  }

  deserializeStruct<T>(name: string, fields: string[], visitor: Visitor<T>): T {
    if (typeof this.data === "object" && this.data !== null && !Array.isArray(this.data)) {
      return visitor.visitMap(new JsonMapAccess(this.data as Record<string, unknown>))
    }
    throw new DeserializationError(`Expected object for struct ${name}, found ${typeof this.data}`)
  }

  deserializeOption<T>(visitor: Visitor<T>): T {
    if (this.data === null || this.data === undefined) {
      return visitor.visitNull()
    }
    return this.deserializeAny(visitor)
  }

  deserializeEnum<T>(name: string, variants: string[], visitor: Visitor<T>): T {
    return visitor.visitEnum(new JsonEnumAccess(this.data))
  }
}

/**
 * JSON sequence access implementation
 */
class JsonSeqAccess implements SeqAccess {
  private index = 0

  constructor(private array: unknown[]) {}

  nextElement<T>(): T | undefined {
    if (this.index >= this.array.length) {
      return undefined
    }
    return this.array[this.index++] as T
  }

  sizeHint(): number | undefined {
    return this.array.length - this.index
  }
}

/**
 * JSON map access implementation
 */
class JsonMapAccess implements MapAccess {
  private entries: [string, unknown][]
  private index = 0

  constructor(object: Record<string, unknown>) {
    this.entries = Object.entries(object)
  }

  nextEntry<K, V>(): [K, V] | undefined {
    if (this.index >= this.entries.length) {
      return undefined
    }
    const entry = this.entries[this.index++]
    return [entry[0] as K, entry[1] as V]
  }

  nextKey<K>(): K | undefined {
    if (this.index >= this.entries.length) {
      return undefined
    }
    return this.entries[this.index][0] as K
  }

  nextValue<V>(): V | undefined {
    if (this.index > 0 && this.index <= this.entries.length) {
      return this.entries[this.index - 1][1] as V
    }
    return undefined
  }

  sizeHint(): number | undefined {
    return this.entries.length - this.index
  }
}

/**
 * JSON enum access implementation
 */
class JsonEnumAccess implements EnumAccess {
  constructor(private data: unknown) {}

  variant<T>(): [string, T] {
    if (typeof this.data === "string") {
      // Simple enum variant
      return [this.data, undefined as T]
    } else if (typeof this.data === "object" && this.data !== null) {
      // Enum with data
      const entries = Object.entries(this.data)
      if (entries.length === 1) {
        const [variant, data] = entries[0]
        return [variant, data as T]
      }
    }
    throw new DeserializationError(`Invalid enum format: ${typeof this.data}`)
  }
}

/**
 * Serialize a value to JSON string
 *
 * @param value The value to serialize (must implement Serialize trait)
 * @returns JSON string representation
 */
export function toString<T extends Serialize>(value: T): string {
  const serializer = new JsonSerializer()
  serialize(value, serializer)
  return JSON.stringify(serializer.getResult())
}

/**
 * Deserialize a value from JSON string
 *
 * @param json The JSON string to parse
 * @param ctor Constructor that implements Deserialize trait
 * @returns The deserialized value
 */
export function fromString<T extends Deserialize>(json: string, ctor: new (...args: any[]) => T): T {
  const data = JSON.parse(json)
  const deserializer = new JsonDeserializer(data)
  return deserialize<T, JsonDeserializer>(ctor, deserializer)
}
