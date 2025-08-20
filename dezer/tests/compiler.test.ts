import { assertEquals } from "@std/assert"
import { parseSourceFile } from "../src/compiler/parser.ts"
import { generateSerializationCode } from "../src/compiler/generator.ts"

Deno.test("Parser - should find @Serializable classes", () => {
  const sourceCode = `
    import { Serializable, Field } from "../src/mod.ts"
    
    @Serializable()
    class User {
      @Field()
      name: string
      
      @Field({ name: "email_address" })
      email: string
    }
  `

  const result = parseSourceFile("test.ts", sourceCode)

  assertEquals(result.length, 1)
  assertEquals(result[0].name, "User")
  assertEquals(result[0].fields.length, 2)
  assertEquals(result[0].fields[0].propertyName, "name")
  assertEquals(result[0].fields[1].propertyName, "email")
  assertEquals(result[0].fields[1].options.name, "email_address")
})

Deno.test("Parser - should handle @Ignore decorator", () => {
  const sourceCode = `
    import { Serializable, Field, Ignore } from "../src/mod.ts"
    
    @Serializable()
    class User {
      @Field()
      name: string
      
      @Ignore()
      password: string
    }
  `

  const result = parseSourceFile("test.ts", sourceCode)

  assertEquals(result.length, 1)
  assertEquals(result[0].fields.length, 2)
  assertEquals(result[0].fields[0].isIgnored, false)
  assertEquals(result[0].fields[1].isIgnored, true)
})

Deno.test("Generator - should generate serialize method", () => {
  const parsedClass = {
    name: "User",
    filePath: "test.ts",
    options: {},
    fields: [
      {
        propertyName: "name",
        type: "string",
        options: {},
        isOptional: false,
        isIgnored: false,
      },
      {
        propertyName: "email",
        type: "string",
        options: { name: "email_address" },
        isOptional: false,
        isIgnored: false,
      },
    ],
  }

  const result = generateSerializationCode(parsedClass)

  assertEquals(typeof result, "string")
  assertEquals(result.includes("User.prototype[SERIALIZE]"), true)
  assertEquals(result.includes("email_address"), true)
  assertEquals(result.includes("User[DESERIALIZE]"), true)
  assertEquals(result.includes("serializeStruct"), true)
  assertEquals(result.includes("deserializeStruct"), true)
  assertEquals(result.includes("extends Serialize"), true)
  assertEquals(result.includes("extends Deserialize<User>"), true)
})
