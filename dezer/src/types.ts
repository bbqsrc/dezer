export interface FieldOptions {
  name?: string
  required?: boolean
  default?: unknown
  skip?: boolean
  skipSerializing?: boolean
  skipDeserializing?: boolean
  customSerializer?: CustomSerializer
  customDeserializer?: CustomDeserializer
  transform?: {
    serialize: (value: unknown) => unknown
    deserialize: (value: unknown) => unknown
  }
}

export interface SerializableOptions {
  name?: string
}

export interface ParsedClass {
  name: string
  filePath: string
  options: SerializableOptions
  fields: ParsedField[]
}

export interface ParsedField {
  propertyName: string
  type: string
  options: FieldOptions
  isOptional: boolean
  isIgnored: boolean
}

export type CustomSerializer<T = unknown> = (value: T) => unknown
export type CustomDeserializer<T = unknown> = (value: unknown) => T

export interface GenerationContext {
  classes: ParsedClass[]
  outputDir: string
  format: string
}
