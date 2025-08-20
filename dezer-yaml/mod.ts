/**
 * @fileoverview Dezer YAML format implementation
 *
 * Provides YAML serialization and deserialization using the visitor pattern.
 * This implements the format-specific Serializer and Deserializer interfaces.
 *
 * Note: This is a basic YAML implementation focusing on common use cases,
 * not full YAML 1.2 spec compliance.
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
 * YAML-specific serializer that implements the visitor pattern
 */
export class YamlSerializer implements Serializer {
  public lines: string[] = []
  public indentLevel = 0

  serializeNull(): void {
    this.lines.push("null")
  }

  serializeBool(v: boolean): void {
    this.lines.push(v ? "true" : "false")
  }

  serializeNumber(v: number): void {
    this.lines.push(v.toString())
  }

  serializeString(v: string): void {
    // Simple YAML string handling - quote if contains special chars
    if (v.includes("\n") || v.includes(":") || v.includes("-") || v.includes("'") || v.includes('"')) {
      this.lines.push(`"${v.replace(/"/g, '\\"')}"`)
    } else {
      this.lines.push(v)
    }
  }

  serializeBytes(v: Uint8Array): void {
    // Convert bytes to base64 string for YAML compatibility
    const base64 = btoa(String.fromCharCode(...v))
    this.lines.push(`!!binary "${base64}"`)
  }

  serializeSeq(len?: number): SeqSerializer {
    return new YamlSeqSerializer(this.lines, this.indentLevel)
  }

  serializeMap(len?: number): MapSerializer {
    return new YamlMapSerializer(this.lines, this.indentLevel)
  }

  serializeStruct(name: string, len: number): StructSerializer {
    return new YamlStructSerializer(this.lines, this.indentLevel)
  }

  serializeOption<T>(value: T | null | undefined): OptionSerializer<T> {
    return new YamlOptionSerializer(this.lines, this.indentLevel, value)
  }

  serializeNewtype<T>(name: string, value: T): void {
    // For YAML, newtype is just the wrapped value
    if (typeof value === "object" && value !== null && SERIALIZE in value) {
      const serializer = new YamlSerializer()
      ;(value as any)[SERIALIZE](serializer)
      this.lines.push(...serializer.lines)
    } else {
      this.lines.push(String(value))
    }
  }

  serializeEnum(name: string, variant: string, data?: unknown): void {
    if (data === undefined) {
      // Simple enum variant as string
      this.lines.push(variant)
    } else {
      // Enum with data as object
      this.lines.push(`${variant}:`)
      if (typeof data === "object" && data !== null && SERIALIZE in data) {
        const serializer = new YamlSerializer()
        serializer.indentLevel = this.indentLevel + 1
        ;(data as any)[SERIALIZE](serializer)
        this.lines.push(...serializer.lines.map((line) => `  ${line}`))
      } else {
        this.lines.push(`  ${data}`)
      }
    }
  }

  getResult(): string {
    return this.lines.join("\n")
  }
}

/**
 * YAML sequence serializer
 */
class YamlSeqSerializer implements SeqSerializer {
  private isFirstElement = true

  constructor(private lines: string[], private indentLevel: number) {}

  serializeElement<T>(value: T): void {
    const indent = "  ".repeat(this.indentLevel)

    if (typeof value === "object" && value !== null && SERIALIZE in value) {
      const serializer = new YamlSerializer()
      serializer.indentLevel = this.indentLevel + 1
      ;(value as any)[SERIALIZE](serializer)
      const result = serializer.getResult()

      if (result.includes("\n")) {
        // Multi-line value
        this.lines.push(`${indent}- |`)
        result.split("\n").forEach((line) => {
          this.lines.push(`${indent}  ${line}`)
        })
      } else {
        this.lines.push(`${indent}- ${result}`)
      }
    } else {
      const yamlValue = this.formatSimpleValue(value)
      this.lines.push(`${indent}- ${yamlValue}`)
    }
  }

  private formatSimpleValue(value: unknown): string {
    if (value === null) { return "null" }
    if (typeof value === "boolean") { return value ? "true" : "false" }
    if (typeof value === "number") { return value.toString() }
    if (typeof value === "string") {
      if (value.includes("\n") || value.includes(":") || value.includes("-")) {
        return `"${value.replace(/"/g, '\\"')}"`
      }
      return value
    }
    return String(value)
  }

  end(): void {
    // Nothing special needed for YAML sequences
  }
}

/**
 * YAML map serializer
 */
class YamlMapSerializer implements MapSerializer {
  constructor(private lines: string[], private indentLevel: number) {}

  serializeEntry<K, V>(key: K, value: V): void {
    const indent = "  ".repeat(this.indentLevel)
    const keyStr = String(key)

    if (typeof value === "object" && value !== null && SERIALIZE in value) {
      this.lines.push(`${indent}${keyStr}:`)
      const serializer = new YamlSerializer()
      serializer.indentLevel = this.indentLevel + 1
      ;(value as any)[SERIALIZE](serializer)
      const result = serializer.getResult()

      result.split("\n").forEach((line) => {
        this.lines.push(`${indent}  ${line}`)
      })
    } else {
      const yamlValue = this.formatSimpleValue(value)
      this.lines.push(`${indent}${keyStr}: ${yamlValue}`)
    }
  }

  serializeKey<K>(key: K): void {
    throw new SerializationError("Use serializeEntry for YAML maps")
  }

  serializeValue<V>(value: V): void {
    throw new SerializationError("Use serializeEntry for YAML maps")
  }

  private formatSimpleValue(value: unknown): string {
    if (value === null) { return "null" }
    if (typeof value === "boolean") { return value ? "true" : "false" }
    if (typeof value === "number") { return value.toString() }
    if (typeof value === "string") {
      if (value.includes("\n") || value.includes(":") || value.includes("-")) {
        return `"${value.replace(/"/g, '\\"')}"`
      }
      return value
    }
    return String(value)
  }

  end(): void {
    // Nothing special needed for YAML maps
  }
}

/**
 * YAML struct serializer
 */
class YamlStructSerializer implements StructSerializer {
  constructor(private lines: string[], private indentLevel: number) {}

  serializeField<T>(name: string, value: T): void {
    const indent = "  ".repeat(this.indentLevel)

    if (typeof value === "object" && value !== null && SERIALIZE in value) {
      this.lines.push(`${indent}${name}:`)
      const serializer = new YamlSerializer()
      serializer.indentLevel = this.indentLevel + 1
      ;(value as any)[SERIALIZE](serializer)
      const result = serializer.getResult()

      result.split("\n").forEach((line) => {
        this.lines.push(`${indent}  ${line}`)
      })
    } else {
      const yamlValue = this.formatSimpleValue(value)
      this.lines.push(`${indent}${name}: ${yamlValue}`)
    }
  }

  skipField(name: string): void {
    // Don't add the field to the output
  }

  private formatSimpleValue(value: unknown): string {
    if (value === null) { return "null" }
    if (typeof value === "boolean") { return value ? "true" : "false" }
    if (typeof value === "number") { return value.toString() }
    if (typeof value === "string") {
      if (value.includes("\n") || value.includes(":") || value.includes("-")) {
        return `"${value.replace(/"/g, '\\"')}"`
      }
      return value
    }
    return String(value)
  }

  end(): void {
    // Nothing special needed for YAML structs
  }
}

/**
 * YAML option serializer
 */
class YamlOptionSerializer<T> implements OptionSerializer<T> {
  constructor(
    private lines: string[],
    private indentLevel: number,
    private value: T | null | undefined,
  ) {}

  serializeSome(value: T): void {
    if (typeof value === "object" && value !== null && SERIALIZE in value) {
      const serializer = new YamlSerializer()
      serializer.indentLevel = this.indentLevel
      ;(value as any)[SERIALIZE](serializer)
      this.lines.push(...serializer.lines)
    } else {
      this.lines.push(String(value))
    }
  }

  serializeNone(): void {
    this.lines.push("null")
  }
}

/**
 * Basic YAML parser for deserialization
 */
class YamlParser {
  private lines: string[]
  private currentLine = 0

  constructor(yaml: string) {
    this.lines = yaml.split("\n").map((line) => line.trimEnd())
  }

  parse(): unknown {
    return this.parseValue(0)
  }

  private parseValue(minIndent: number): unknown {
    if (this.currentLine >= this.lines.length) {
      return null
    }

    const line = this.lines[this.currentLine]
    const indent = this.getIndent(line)
    const content = line.trim()

    if (!content || content.startsWith("#")) {
      this.currentLine++
      return this.parseValue(minIndent)
    }

    // Check for sequence
    if (content.startsWith("- ")) {
      return this.parseSequence(indent)
    }

    // Check for map
    if (content.includes(": ")) {
      return this.parseMap(indent)
    }

    // Scalar value
    this.currentLine++
    return this.parseScalar(content)
  }

  private parseSequence(indent: number): unknown[] {
    const sequence: unknown[] = []

    while (this.currentLine < this.lines.length) {
      const line = this.lines[this.currentLine]
      const lineIndent = this.getIndent(line)
      const content = line.trim()

      if (lineIndent < indent || (!content.startsWith("- ") && content !== "")) {
        break
      }

      if (content.startsWith("- ")) {
        this.currentLine++
        const value = content.substring(2).trim()
        if (value) {
          sequence.push(this.parseScalar(value))
        } else {
          // Multi-line or nested value
          sequence.push(this.parseValue(indent + 2))
        }
      } else {
        this.currentLine++
      }
    }

    return sequence
  }

  private parseMap(indent: number): Record<string, unknown> {
    const map: Record<string, unknown> = {}

    while (this.currentLine < this.lines.length) {
      const line = this.lines[this.currentLine]
      const lineIndent = this.getIndent(line)
      const content = line.trim()

      if (lineIndent < indent || !content) {
        break
      }

      if (lineIndent === indent && content.includes(": ")) {
        const colonIndex = content.indexOf(": ")
        const key = content.substring(0, colonIndex).trim()
        const value = content.substring(colonIndex + 2).trim()

        this.currentLine++

        if (value) {
          map[key] = this.parseScalar(value)
        } else {
          // Multi-line or nested value
          map[key] = this.parseValue(indent + 2)
        }
      } else {
        this.currentLine++
      }
    }

    return map
  }

  private parseScalar(value: string): unknown {
    if (value === "null" || value === "~") { return null }
    if (value === "true") { return true }
    if (value === "false") { return false }

    // Try to parse as number
    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10)
    }
    if (/^-?\d+\.\d+$/.test(value)) {
      return parseFloat(value)
    }

    // Handle quoted strings
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1).replace(/\\"/g, '"')
    }

    return value
  }

  private getIndent(line: string): number {
    let indent = 0
    for (let i = 0; i < line.length; i++) {
      if (line[i] === " ") {
        indent++
      } else {
        break
      }
    }
    return indent
  }
}

/**
 * YAML-specific deserializer that implements the visitor pattern
 */
export class YamlDeserializer implements Deserializer {
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
      return visitor.visitSeq(new YamlSeqAccess(this.data))
    } else if (typeof this.data === "object") {
      return visitor.visitMap(new YamlMapAccess(this.data as Record<string, unknown>))
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
    if (typeof this.data === "string" && this.data.startsWith("!!binary ")) {
      // Decode base64 string back to bytes
      const base64 = this.data.substring(10).replace(/"/g, "")
      const bytes = new Uint8Array(atob(base64).split("").map((c) => c.charCodeAt(0)))
      return visitor.visitBytes(bytes)
    }
    throw new DeserializationError(`Expected binary string for bytes, found ${typeof this.data}`)
  }

  deserializeSeq<T>(visitor: Visitor<T>): T {
    if (Array.isArray(this.data)) {
      return visitor.visitSeq(new YamlSeqAccess(this.data))
    }
    throw new DeserializationError(`Expected array, found ${typeof this.data}`)
  }

  deserializeMap<T>(visitor: Visitor<T>): T {
    if (typeof this.data === "object" && this.data !== null && !Array.isArray(this.data)) {
      return visitor.visitMap(new YamlMapAccess(this.data as Record<string, unknown>))
    }
    throw new DeserializationError(`Expected object, found ${typeof this.data}`)
  }

  deserializeStruct<T>(name: string, fields: string[], visitor: Visitor<T>): T {
    if (typeof this.data === "object" && this.data !== null && !Array.isArray(this.data)) {
      return visitor.visitMap(new YamlMapAccess(this.data as Record<string, unknown>))
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
    return visitor.visitEnum(new YamlEnumAccess(this.data))
  }
}

/**
 * YAML sequence access implementation
 */
class YamlSeqAccess implements SeqAccess {
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
 * YAML map access implementation
 */
class YamlMapAccess implements MapAccess {
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
 * YAML enum access implementation
 */
class YamlEnumAccess implements EnumAccess {
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
 * Serialize a value to YAML string
 *
 * @param value The value to serialize (must implement Serialize trait)
 * @returns YAML string representation
 */
export function toYaml(value: Serialize): string {
  const serializer = new YamlSerializer()
  serialize(value, serializer)
  return serializer.getResult()
}

/**
 * Deserialize a value from YAML string
 *
 * @param yaml The YAML string to parse
 * @param ctor Constructor that implements Deserialize trait
 * @returns The deserialized value
 */
export function fromYaml<T extends Deserialize>(yaml: string, ctor: new (...args: any[]) => T): T {
  const parser = new YamlParser(yaml)
  const data = parser.parse()
  const deserializer = new YamlDeserializer(data)
  return deserialize<T, YamlDeserializer>(ctor, deserializer)
}
