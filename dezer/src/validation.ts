/**
 * @fileoverview Runtime type validation utilities
 *
 * Provides validation functions for ensuring type safety during deserialization.
 * Used by generated code to validate field types at runtime.
 */

import { DESERIALIZE } from "./traits.ts"

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

/**
 * Validate that a value is a string
 */
export function validateString(value: unknown, fieldPath: string): string {
  if (typeof value !== "string") {
    throw new ValidationError(`Field '${fieldPath}' expected string, got ${typeof value}`)
  }
  return value
}

/**
 * Validate that a value is a number
 */
export function validateNumber(value: unknown, fieldPath: string): number {
  if (typeof value !== "number") {
    throw new ValidationError(`Field '${fieldPath}' expected number, got ${typeof value}`)
  }
  if (isNaN(value)) {
    throw new ValidationError(`Field '${fieldPath}' expected valid number, got NaN`)
  }
  return value
}

/**
 * Validate that a value is a boolean
 */
export function validateBoolean(value: unknown, fieldPath: string): boolean {
  if (typeof value !== "boolean") {
    throw new ValidationError(`Field '${fieldPath}' expected boolean, got ${typeof value}`)
  }
  return value
}

/**
 * Validate that a value is a Date object or can be converted to one
 */
export function validateDate(value: unknown, fieldPath: string): Date {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      throw new ValidationError(`Field '${fieldPath}' expected valid Date, got invalid Date`)
    }
    return value
  }

  if (typeof value === "string") {
    const date = new Date(value)
    if (isNaN(date.getTime())) {
      throw new ValidationError(`Field '${fieldPath}' expected valid date string, got invalid date: ${value}`)
    }
    return date
  }

  throw new ValidationError(`Field '${fieldPath}' expected Date or date string, got ${typeof value}`)
}

/**
 * Validate that a value is an array
 */
export function validateArray(value: unknown, fieldPath: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`Field '${fieldPath}' expected array, got ${typeof value}`)
  }
  return value
}

/**
 * Validate that a value is an object (not null, not array)
 */
export function validateObject(value: unknown, fieldPath: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ValidationError(`Field '${fieldPath}' expected object, got ${typeof value}`)
  }
  return value as Record<string, unknown>
}

/**
 * Validate an array of strings
 */
export function validateStringArray(value: unknown, fieldPath: string): string[] {
  const array = validateArray(value, fieldPath)
  for (let i = 0; i < array.length; i++) {
    if (typeof array[i] !== "string") {
      throw new ValidationError(`Field '${fieldPath}[${i}]' expected string, got ${typeof array[i]}`)
    }
  }
  return array as string[]
}

/**
 * Validate an array of numbers
 */
export function validateNumberArray(value: unknown, fieldPath: string): number[] {
  const array = validateArray(value, fieldPath)
  for (let i = 0; i < array.length; i++) {
    if (typeof array[i] !== "number") {
      throw new ValidationError(`Field '${fieldPath}[${i}]' expected number, got ${typeof array[i]}`)
    }
    if (isNaN(array[i] as number)) {
      throw new ValidationError(`Field '${fieldPath}[${i}]' expected valid number, got NaN`)
    }
  }
  return array as number[]
}

/**
 * Validate an array of booleans
 */
export function validateBooleanArray(value: unknown, fieldPath: string): boolean[] {
  const array = validateArray(value, fieldPath)
  for (let i = 0; i < array.length; i++) {
    if (typeof array[i] !== "boolean") {
      throw new ValidationError(`Field '${fieldPath}[${i}]' expected boolean, got ${typeof array[i]}`)
    }
  }
  return array as boolean[]
}

/**
 * Validate an array of objects (for complex types)
 */
export function validateObjectArray(value: unknown, fieldPath: string): Record<string, unknown>[] {
  const array = validateArray(value, fieldPath)
  for (let i = 0; i < array.length; i++) {
    if (typeof array[i] !== "object" || array[i] === null || Array.isArray(array[i])) {
      throw new ValidationError(`Field '${fieldPath}[${i}]' expected object, got ${typeof array[i]}`)
    }
  }
  return array as Record<string, unknown>[]
}

/**
 * Deserialize a nested object using the current deserializer
 */
export function deserializeNestedObject(value: unknown, ctor: any, deserializer: any, fieldPath: string): any {
  validateObject(value, fieldPath)

  // Check if the constructor has a DESERIALIZE method
  if (ctor.prototype && (ctor.prototype as any)[DESERIALIZE]) {
    // Create a new deserializer for the nested object value
    // We need to reconstruct the deserializer with the nested value
    const nestedDeserializer = new (deserializer.constructor)(value)
    return (ctor.prototype as any)[DESERIALIZE].call({}, nestedDeserializer)
  }

  // Fallback: create an instance and copy properties
  const instance = Object.create(ctor.prototype)
  Object.assign(instance, value)

  return instance
}

/**
 * Deserialize an array of objects by validating and deserializing each element
 */
export function deserializeObjectArray(value: unknown, ctor: any, deserializer: any, fieldPath: string): any[] {
  const array = validateArray(value, fieldPath)
  const result: any[] = []

  for (let i = 0; i < array.length; i++) {
    const elementFieldPath = `${fieldPath}[${i}]`
    result.push(deserializeNestedObject(array[i], ctor, deserializer, elementFieldPath))
  }

  return result
}

/**
 * Generate validation code for a given type
 */
export function generateValidationCode(type: string, valueExpression: string, fieldPath: string): string {
  // Handle array types
  if (type.endsWith("[]")) {
    const elementType = type.slice(0, -2)

    switch (elementType) {
      case "string":
        return `validateStringArray(${valueExpression}, "${fieldPath}")`
      case "number":
        return `validateNumberArray(${valueExpression}, "${fieldPath}")`
      case "boolean":
        return `validateBooleanArray(${valueExpression}, "${fieldPath}")`
      default:
        // For complex object arrays, validate the array structure
        // The actual object validation happens during deserialization
        return `validateObjectArray(${valueExpression}, "${fieldPath}")`
    }
  }

  // Handle primitive types
  switch (type) {
    case "string":
      return `validateString(${valueExpression}, "${fieldPath}")`
    case "number":
      return `validateNumber(${valueExpression}, "${fieldPath}")`
    case "boolean":
      return `validateBoolean(${valueExpression}, "${fieldPath}")`
    case "Date":
      return `validateDate(${valueExpression}, "${fieldPath}")`
    default:
      // For complex objects, just validate it's an object
      // The actual type validation happens during deserialization
      return `validateObject(${valueExpression}, "${fieldPath}")`
  }
}
