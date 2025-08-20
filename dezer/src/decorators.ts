import type { CustomDeserializer, CustomSerializer, FieldOptions, SerializableOptions } from "./types.ts"

// Standard TC39 Stage 3 decorators - these are no-op at runtime
// The actual processing happens during AST parsing by the code generator

export function Serializable<T extends abstract new (...args: any) => any>(
  target: T,
  context: ClassDecoratorContext,
): T {
  // No-op at runtime - processed by AST parser
  return target
}

export function Field(options: FieldOptions = {}): any {
  return function (target: any, context: ClassFieldDecoratorContext): any {
    // No-op at runtime - processed by AST parser
    return target
  }
}

export function Ignore(target: any, context: ClassFieldDecoratorContext): any {
  // No-op at runtime - processed by AST parser
  return target
}

export function Custom<T>(
  serializer: CustomSerializer<T>,
  deserializer: CustomDeserializer<T>,
): any {
  return function (target: any, context: ClassFieldDecoratorContext): any {
    // No-op at runtime - processed by AST parser
    return target
  }
}
