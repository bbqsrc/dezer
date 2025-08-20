/**
 * @fileoverview Code generator for visitor pattern serialization
 *
 * Generates [SERIALIZE] and [DESERIALIZE] methods that use the visitor pattern
 * instead of direct format-specific serialization.
 */

import type { ParsedClass, ParsedField } from "../types.ts"

export function generateSerializationCode(parsedClass: ParsedClass): string {
  const { name, fields } = parsedClass
  const moduleAugmentation = generateModuleAugmentation(name, parsedClass.filePath)
  const serializeMethod = generateSerializeMethod(name, fields)
  const deserializeMethod = generateDeserializeMethod(name, fields)

  return `${moduleAugmentation}

${serializeMethod}

${deserializeMethod}`
}

function generateModuleAugmentation(className: string, filePath: string): string {
  const relativePath = "./" + filePath.split("/").pop()

  return `declare module "${relativePath}" {
  interface ${className} extends Serialize, Deserialize {
  }
}`
}

function generateSerializeMethod(className: string, fields: ParsedField[]): string {
  const serializableFields = fields.filter((f) => !f.isIgnored)
  const fieldSerializations = serializableFields.map((field) => generateFieldSerialization(field))

  return `;(${className}.prototype as any)[SERIALIZE] = function(serializer: Serializer) {
  const struct = serializer.serializeStruct("${className}", ${serializableFields.length})
${fieldSerializations.map((fs) => `  ${fs}`).join("\n")}
  struct.end()
}`
}

function generateFieldSerialization(field: ParsedField): string {
  const { propertyName, options } = field
  const serializedName = options.name || propertyName

  if (options.transform?.serialize) {
    return `struct.serializeField("${serializedName}", (${options.transform.serialize.toString()})(this.${propertyName}))`
  }

  return `struct.serializeField("${serializedName}", ${generateValueSerialization(`this.${propertyName}`, field.type)})`
}

function generateValueSerialization(valueExpression: string, type: string): string {
  switch (type) {
    case "Date":
      return `${valueExpression}?.toISOString?.()`
    case "string":
    case "number":
    case "boolean":
      return valueExpression
    default:
      if (type.endsWith("[]")) {
        // For arrays, we need to serialize each element
        return `${valueExpression}`
      }
      // For complex objects, pass them as-is and let the serializer handle them
      return valueExpression
  }
}

function generateDeserializeMethod(className: string, fields: ParsedField[]): string {
  const serializableFields = fields.filter((f) => !f.isIgnored)
  const fieldNames = serializableFields.map((f) => `"${f.options.name || f.propertyName}"`)
  const fieldMappings = serializableFields.map((field) => generateFieldMapping(field))

  return `;(${className}.prototype as any)[DESERIALIZE] = function(deserializer: Deserializer) {
  return deserializer.deserializeStruct("${className}", [${fieldNames.join(", ")}], {
    expecting() {
      return "struct ${className}"
    },
    
    visitMap(map: MapAccess) {
      const instance = Object.create(${className}.prototype) as ${className}
      let entry
      while ((entry = map.nextEntry()) !== undefined) {
        const [key, value] = entry
        switch (key) {
${fieldMappings.map((fm) => `          ${fm}`).join("\n")}
        }
      }
      return instance
    },
    
    visitNull() {
      throw new Error("Expected struct ${className}, found null")
    },
    
    visitBool() {
      throw new Error("Expected struct ${className}, found boolean")
    },
    
    visitNumber() {
      throw new Error("Expected struct ${className}, found number")
    },
    
    visitString() {
      throw new Error("Expected struct ${className}, found string")
    },
    
    visitBytes() {
      throw new Error("Expected struct ${className}, found bytes")
    },
    
    visitSeq() {
      throw new Error("Expected struct ${className}, found sequence")
    },
    
    visitEnum() {
      throw new Error("Expected struct ${className}, found enum")
    }
  })
}`
}

function generateFieldMapping(field: ParsedField): string {
  const { propertyName, options, isOptional } = field
  const serializedName = options.name || propertyName
  const fieldPath = propertyName

  if (options.transform?.deserialize) {
    return `case "${serializedName}":
            instance.${propertyName} = (${options.transform.deserialize.toString()})(value)
            break`
  }

  const valueDeserialization = generateValueDeserialization("value", field.type, fieldPath)

  if (isOptional) {
    return `case "${serializedName}":
            if (value !== undefined) {
              instance.${propertyName} = ${valueDeserialization}
            }
            break`
  } else {
    return `case "${serializedName}":
            instance.${propertyName} = ${valueDeserialization}
            break`
  }
}

function generateValueDeserialization(valueExpression: string, type: string, fieldPath: string): string {
  // Import validation from our validation module
  const validationImport = "import { " + getValidationFunctionName(type) + ' } from "@dezer/core"'

  switch (type) {
    case "Date":
      return `validateDate(${valueExpression}, "${fieldPath}")`
    case "string":
      return `validateString(${valueExpression}, "${fieldPath}")`
    case "number":
      return `validateNumber(${valueExpression}, "${fieldPath}")`
    case "boolean":
      return `validateBoolean(${valueExpression}, "${fieldPath}")`
    default:
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
            // For arrays of user-defined objects, deserialize each element
            if (isUserDefinedType(elementType)) {
              return `deserializeObjectArray(${valueExpression}, ${elementType}, deserializer, "${fieldPath}")`
            }
            // For other complex object arrays, just validate array structure
            return `validateObjectArray(${valueExpression}, "${fieldPath}") as ${type}`
        }
      }
      // For complex objects, check if they might be user-defined classes that need deserialization
      if (isUserDefinedType(type)) {
        return `deserializeNestedObject(${valueExpression}, ${type}, deserializer, "${fieldPath}")`
      }
      // For other complex objects, validate it's an object
      return `validateObject(${valueExpression}, "${fieldPath}") as ${type}`
  }
}

function isUserDefinedType(type: string): boolean {
  // Check if this is a user-defined class (starts with uppercase and isn't a built-in type)
  const builtInTypes = new Set(["string", "number", "boolean", "Date", "any", "unknown", "void", "undefined", "null"])
  return type.length > 0 &&
    type[0] === type[0].toUpperCase() &&
    !builtInTypes.has(type)
}

function getValidationFunctionName(type: string): string {
  if (type.endsWith("[]")) {
    const elementType = type.slice(0, -2)
    switch (elementType) {
      case "string":
        return "validateStringArray"
      case "number":
        return "validateNumberArray"
      case "boolean":
        return "validateBooleanArray"
      default:
        return "validateObjectArray"
    }
  }

  switch (type) {
    case "string":
      return "validateString"
    case "number":
      return "validateNumber"
    case "boolean":
      return "validateBoolean"
    case "Date":
      return "validateDate"
    default:
      return "validateObject"
  }
}

export function generateAugmentationFile(parsedClasses: ParsedClass[], sourceFilePath: string): string {
  const imports = generateImports(parsedClasses, sourceFilePath)
  const augmentations = parsedClasses.map((cls) => generateSerializationCode(cls)).join("\n\n")

  return `${imports}

${augmentations}`
}

export function generateCentralDezerFile(dezerFilePaths: string[]): string {
  const dezerImports = dezerFilePaths
    .map((path) => `import "./${path}"`)
    .join("\n")

  return `// Auto-generated central dezer file
// This file imports all .dezer.ts files to set up serialization

${dezerImports}
`
}

function generateImports(parsedClasses: ParsedClass[], sourceFilePath: string): string {
  const classNames = parsedClasses.map((cls) => cls.name)
  const relativePath = "./" + sourceFilePath.split("/").pop()

  // Collect all validation functions needed
  const validationFunctions = new Set<string>()
  let needsNestedDeserialization = false
  let needsArrayDeserialization = false

  for (const cls of parsedClasses) {
    for (const field of cls.fields) {
      if (!field.isIgnored) {
        validationFunctions.add(getValidationFunctionName(field.type))

        // Check if we need nested object deserialization
        if (isUserDefinedType(field.type)) {
          needsNestedDeserialization = true
        }

        // Check if we need array object deserialization
        if (field.type.endsWith("[]")) {
          const elementType = field.type.slice(0, -2)
          if (isUserDefinedType(elementType)) {
            needsArrayDeserialization = true
          }
        }
      }
    }
  }

  if (needsNestedDeserialization) {
    validationFunctions.add("deserializeNestedObject")
  }

  if (needsArrayDeserialization) {
    validationFunctions.add("deserializeObjectArray")
  }

  const validationImports = Array.from(validationFunctions).join(", ")

  return `import { ${classNames.join(", ")} } from "${relativePath}"
import { SERIALIZE, DESERIALIZE, ${validationImports} } from "@dezer/core"
import type { Serialize, Deserialize, Serializer, Deserializer, MapAccess } from "@dezer/core"`
}
