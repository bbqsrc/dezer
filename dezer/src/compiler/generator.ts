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

  if (options.transform?.deserialize) {
    return `case "${serializedName}":
            instance.${propertyName} = (${options.transform.deserialize.toString()})(value)
            break`
  }

  const valueDeserialization = generateValueDeserialization("value", field.type)

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

function generateValueDeserialization(valueExpression: string, type: string): string {
  switch (type) {
    case "Date":
      return `new Date(${valueExpression} as string)`
    case "string":
      return `${valueExpression} as string`
    case "number":
      return `${valueExpression} as number`
    case "boolean":
      return `${valueExpression} as boolean`
    default:
      if (type.endsWith("[]")) {
        // For arrays, assume they're already properly deserialized
        return `${valueExpression} as ${type}`
      }
      // For complex objects, assume they need further deserialization
      // This would need to be handled by the format-specific deserializer
      return `${valueExpression} as ${type}`
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

  return `import { ${classNames.join(", ")} } from "${relativePath}"
import { SERIALIZE, DESERIALIZE } from "@dezer/core"
import type { Serialize, Deserialize, Serializer, Deserializer, MapAccess } from "@dezer/core"`
}
