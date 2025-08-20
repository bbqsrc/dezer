import * as ts from "typescript"
import type { FieldOptions, ParsedClass, ParsedField, SerializableOptions } from "../types.ts"

export function parseSourceFile(filePath: string, sourceCode: string): ParsedClass[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
  )

  const classes: ParsedClass[] = []

  function visit(node: ts.Node): void {
    if (ts.isClassDeclaration(node) && node.name) {
      const parsedClass = parseClass(node, filePath)
      if (parsedClass) {
        classes.push(parsedClass)
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return classes
}

function parseClass(classNode: ts.ClassDeclaration, filePath: string): ParsedClass | null {
  const serializableDecorator = findSerializableDecorator(classNode)
  if (!serializableDecorator) {
    return null
  }

  const className = classNode.name?.text
  if (!className) {
    return null
  }

  const options = parseSerializableOptions(serializableDecorator)
  const fields = parseClassFields(classNode)

  return {
    name: className,
    filePath,
    options,
    fields,
  }
}

function findSerializableDecorator(classNode: ts.ClassDeclaration): ts.Decorator | null {
  if (!classNode.modifiers) { return null }

  for (const modifier of classNode.modifiers) {
    if (ts.isDecorator(modifier)) {
      const expression = modifier.expression
      if (ts.isCallExpression(expression) || ts.isIdentifier(expression)) {
        const identifier = ts.isCallExpression(expression) ? expression.expression : expression
        if (ts.isIdentifier(identifier) && identifier.text === "Serializable") {
          return modifier
        }
      }
    }
  }

  return null
}

function parseSerializableOptions(decorator: ts.Decorator): SerializableOptions {
  const expression = decorator.expression
  if (ts.isCallExpression(expression) && expression.arguments.length > 0) {
    const arg = expression.arguments[0]
    if (ts.isObjectLiteralExpression(arg)) {
      return parseObjectLiteral(arg) as SerializableOptions
    }
  }
  return {}
}

function parseClassFields(classNode: ts.ClassDeclaration): ParsedField[] {
  const fields: ParsedField[] = []

  for (const member of classNode.members) {
    if (ts.isPropertyDeclaration(member) && member.name && ts.isIdentifier(member.name)) {
      const field = parseField(member)
      if (field) {
        fields.push(field)
      }
    }
  }

  return fields
}

function parseField(propertyNode: ts.PropertyDeclaration): ParsedField | null {
  const name = propertyNode.name
  if (!name || !ts.isIdentifier(name)) {
    return null
  }

  const propertyName = name.text
  const isOptional = !!propertyNode.questionToken
  const type = getTypeString(propertyNode.type)

  const fieldDecorator = findFieldDecorator(propertyNode)
  const ignoreDecorator = findIgnoreDecorator(propertyNode)
  const customDecorator = findCustomDecorator(propertyNode)

  let options: FieldOptions = {}
  let isIgnored = false

  if (ignoreDecorator) {
    isIgnored = true
  } else if (fieldDecorator) {
    options = parseFieldOptions(fieldDecorator)
  } else if (customDecorator) {
    options = parseCustomOptions(customDecorator)
  }

  return {
    propertyName,
    type,
    options,
    isOptional,
    isIgnored,
  }
}

function findFieldDecorator(propertyNode: ts.PropertyDeclaration): ts.Decorator | null {
  return findDecoratorByName(propertyNode, "Field")
}

function findIgnoreDecorator(propertyNode: ts.PropertyDeclaration): ts.Decorator | null {
  return findDecoratorByName(propertyNode, "Ignore")
}

function findCustomDecorator(propertyNode: ts.PropertyDeclaration): ts.Decorator | null {
  return findDecoratorByName(propertyNode, "Custom")
}

function findDecoratorByName(propertyNode: ts.PropertyDeclaration, name: string): ts.Decorator | null {
  if (!propertyNode.modifiers) { return null }

  for (const modifier of propertyNode.modifiers) {
    if (ts.isDecorator(modifier)) {
      const expression = modifier.expression
      if (ts.isCallExpression(expression) || ts.isIdentifier(expression)) {
        const identifier = ts.isCallExpression(expression) ? expression.expression : expression
        if (ts.isIdentifier(identifier) && identifier.text === name) {
          return modifier
        }
      }
    }
  }

  return null
}

function parseFieldOptions(decorator: ts.Decorator): FieldOptions {
  const expression = decorator.expression
  if (ts.isCallExpression(expression) && expression.arguments.length > 0) {
    const arg = expression.arguments[0]
    if (ts.isObjectLiteralExpression(arg)) {
      return parseObjectLiteral(arg) as FieldOptions
    }
  }
  return {}
}

function parseCustomOptions(decorator: ts.Decorator): FieldOptions {
  return {
    transform: {
      serialize: (v: unknown) => v,
      deserialize: (v: unknown) => v,
    },
  }
}

function parseObjectLiteral(node: ts.ObjectLiteralExpression): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const property of node.properties) {
    if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
      const key = property.name.text
      const value = getLiteralValue(property.initializer)
      result[key] = value
    }
  }

  return result
}

function getLiteralValue(node: ts.Expression): unknown {
  if (ts.isStringLiteral(node)) {
    return node.text
  }
  if (ts.isNumericLiteral(node)) {
    return parseFloat(node.text)
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false
  }
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return null
  }
  return undefined
}

function getTypeString(typeNode: ts.TypeNode | undefined): string {
  if (!typeNode) {
    return "unknown"
  }

  if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
    return typeNode.typeName.text
  }

  switch (typeNode.kind) {
    case ts.SyntaxKind.StringKeyword:
      return "string"
    case ts.SyntaxKind.NumberKeyword:
      return "number"
    case ts.SyntaxKind.BooleanKeyword:
      return "boolean"
    case ts.SyntaxKind.AnyKeyword:
      return "any"
    default:
      return "unknown"
  }
}
