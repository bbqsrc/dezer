import type { CustomDeserializer, CustomSerializer, FieldOptions, SerializableOptions } from "./types.ts"

export function Serializable(options: SerializableOptions = {}): ClassDecorator {
  return function <T extends Function>(target: T): T & {
    new (...args: any[]): T extends new (...args: any[]) => infer R ? R & { serialize(): string } : never
    deserialize(data: string): T extends new (...args: any[]) => infer R ? R : never
  } {
    return target as any
  }
}

export function Field(options: FieldOptions = {}): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol): void {
    // Mark the property as serializable for type-checking
  }
}

export function Ignore(): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol): void {
    // Mark the property as ignored for type-checking
  }
}

export function Custom<T>(
  serializer: CustomSerializer<T>,
  deserializer: CustomDeserializer<T>,
): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol): void {
    // Mark the property as having custom serialization for type-checking
  }
}
