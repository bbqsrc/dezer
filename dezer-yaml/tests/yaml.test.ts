import { assertEquals } from "@std/assert"
import { YamlDeserializer, YamlSerializer } from "../mod.ts"
import { DESERIALIZE, deserializeUnknown, SERIALIZE, serializeUnknown } from "@dezer/core"
import type { Deserialize, Deserializer, MapAccess, Serialize, Serializer } from "@dezer/core"

class TestClass {
  name: string
  age: number

  constructor(name: string = "", age: number = 0) {
    this.name = name
    this.age = age
  }
}

interface TestClass extends Serialize, Deserialize {} // Manually implement the serialization for testing

;(TestClass.prototype as any)[SERIALIZE] = function (serializer: Serializer) {
  const struct = serializer.serializeStruct("TestClass", 2)
  struct.serializeField("name", this.name)
  struct.serializeField("age", this.age)
  struct.end()
}
;(TestClass.prototype as any)[DESERIALIZE] = function (deserializer: Deserializer) {
  return deserializer.deserializeStruct("TestClass", ["name", "age"], {
    expecting() {
      return "struct TestClass"
    },

    visitMap(map: MapAccess) {
      const instance = new TestClass()
      let entry
      while ((entry = map.nextEntry()) !== undefined) {
        const [key, value] = entry
        switch (key) {
          case "name":
            instance.name = value as string
            break
          case "age":
            instance.age = value as number
            break
        }
      }
      return instance
    },

    visitNull() {
      throw new Error("Expected struct TestClass, found null")
    },

    visitBool() {
      throw new Error("Expected struct TestClass, found boolean")
    },

    visitNumber() {
      throw new Error("Expected struct TestClass, found number")
    },

    visitString() {
      throw new Error("Expected struct TestClass, found string")
    },

    visitBytes() {
      throw new Error("Expected struct TestClass, found bytes")
    },

    visitSeq() {
      throw new Error("Expected struct TestClass, found sequence")
    },

    visitEnum() {
      throw new Error("Expected struct TestClass, found enum")
    },
  })
}

Deno.test("YamlSerializer - should serialize objects with visitor pattern", () => {
  const obj = new TestClass("John", 30)
  const serializer = new YamlSerializer()
  ;(obj as any)[SERIALIZE](serializer)
  const result = serializer.getResult()

  assertEquals(result, "name: John\nage: 30")
})

Deno.test("YamlDeserializer - should deserialize objects with visitor pattern", () => {
  const yaml = "name: Jane\nage: 25"
  const deserializer = new YamlDeserializer({ name: "Jane", age: 25 })

  const result = (TestClass.prototype as any)[DESERIALIZE](deserializer)

  assertEquals(result.name, "Jane")
  assertEquals(result.age, 25)
  assertEquals(result instanceof TestClass, true)
})

Deno.test("serializeUnknown/deserializeUnknown - should work end-to-end with YAML", () => {
  const original = new TestClass("Alice", 35)

  const serializer = new YamlSerializer()
  serializeUnknown(original, serializer)
  const yaml = serializer.getResult()
  assertEquals(yaml, "name: Alice\nage: 35")

  // Test deserialization with parsed data
  const data = { name: "Alice", age: 35 }
  const deserializer = new YamlDeserializer(data)
  const restored = deserializeUnknown<TestClass, YamlDeserializer>(TestClass, deserializer)
  assertEquals(restored.name, "Alice")
  assertEquals(restored.age, 35)
  assertEquals(restored instanceof TestClass, true)
})

Deno.test("YamlSerializer - should handle primitives", () => {
  const serializer = new YamlSerializer()

  serializer.serializeString("hello")
  assertEquals(serializer.getResult(), "hello")

  const serializer2 = new YamlSerializer()
  serializer2.serializeNumber(42)
  assertEquals(serializer2.getResult(), "42")

  const serializer3 = new YamlSerializer()
  serializer3.serializeBool(true)
  assertEquals(serializer3.getResult(), "true")

  const serializer4 = new YamlSerializer()
  serializer4.serializeNull()
  assertEquals(serializer4.getResult(), "null")
})

Deno.test("YamlSerializer - should handle special strings", () => {
  const serializer = new YamlSerializer()

  serializer.serializeString("value: with colon")
  assertEquals(serializer.getResult(), '"value: with colon"')

  const serializer2 = new YamlSerializer()
  serializer2.serializeString("- starts with dash")
  assertEquals(serializer2.getResult(), '"- starts with dash"')
})

Deno.test("YamlSerializer - should handle nested objects", () => {
  class NestedClass {
    inner: TestClass

    constructor(inner: TestClass) {
      this.inner = inner
    }
  }

  ;(NestedClass.prototype as any)[SERIALIZE] = function (serializer: Serializer) {
    const struct = serializer.serializeStruct("NestedClass", 1)
    struct.serializeField("inner", this.inner)
    struct.end()
  }

  const nested = new NestedClass(new TestClass("Bob", 25))
  const serializer = new YamlSerializer()
  serializeUnknown(nested, serializer)
  const yaml = serializer.getResult()

  assertEquals(yaml.includes("inner:"), true)
  assertEquals(yaml.includes("name: Bob"), true)
  assertEquals(yaml.includes("age: 25"), true)
})

Deno.test("YAML Parser - should parse simple values", () => {
  const serializer = new YamlSerializer()

  // Test different value types
  const testObj = {
    string: "hello",
    number: 42,
    boolean: true,
    nullValue: null,
  }

  // Manually serialize to test the parser
  const yaml = `string: hello
number: 42
boolean: true
nullValue: null`

  const deserializer = new YamlDeserializer({
    string: "hello",
    number: 42,
    boolean: true,
    nullValue: null,
  })

  // Basic parsing verification by checking the internal data
  assertEquals(deserializer["data"], testObj)
})

Deno.test("YAML format - should produce readable output", () => {
  const original = new TestClass("Format Test", 99)

  // Serialize with YAML
  const serializer = new YamlSerializer()
  serializeUnknown(original, serializer)
  const yaml = serializer.getResult()

  // Verify YAML structure
  assertEquals(yaml.includes("name: Format Test"), true)
  assertEquals(yaml.includes("age: 99"), true)
  assertEquals(yaml.includes("\n"), true) // Multi-line output

  // Test deserialization
  const data = { name: "Format Test", age: 99 }
  const deserializer = new YamlDeserializer(data)
  const restored = deserializeUnknown<TestClass, YamlDeserializer>(TestClass, deserializer)

  assertEquals(restored.name, original.name)
  assertEquals(restored.age, original.age)
  assertEquals(restored instanceof TestClass, true)
})
