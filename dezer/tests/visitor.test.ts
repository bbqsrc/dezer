import { assertEquals } from "@std/assert"
import { JsonDeserializer, JsonSerializer } from "../../dezer-json/mod.ts"
import { DESERIALIZE, deserializeUnknown, SERIALIZE, serializeUnknown } from "../mod.ts"
import type { Deserializer, MapAccess, Serializer } from "../mod.ts"

class TestClass {
  name: string
  age: number

  constructor(name: string = "", age: number = 0) {
    this.name = name
    this.age = age
  }
} // Manually implement the serialization for testing

;(TestClass.prototype as any)[SERIALIZE] = function (serializer: Serializer) {
  const struct = serializer.serializeStruct("TestClass", 2)
  struct.serializeField("name", this.name)
  struct.serializeField("age", this.age)
  struct.end()
}
;(TestClass as any)[DESERIALIZE] = function (deserializer: Deserializer) {
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

Deno.test("JsonSerializer - should serialize objects with visitor pattern", () => {
  const obj = new TestClass("John", 30)
  const serializer = new JsonSerializer()
  ;(obj as any)[SERIALIZE](serializer)
  const result = serializer.getResult()

  assertEquals(result, { name: "John", age: 30 })
})

Deno.test("JsonDeserializer - should deserialize objects with visitor pattern", () => {
  const data = { name: "Jane", age: 25 }
  const deserializer = new JsonDeserializer(data)

  const result = (TestClass as any)[DESERIALIZE](deserializer)

  assertEquals(result.name, "Jane")
  assertEquals(result.age, 25)
  assertEquals(result instanceof TestClass, true)
})

Deno.test("serializeUnknown/deserializeUnknown - should work end-to-end", () => {
  const original = new TestClass("Alice", 35)

  const serializer = new JsonSerializer()
  serializeUnknown(original, serializer)
  const json = JSON.stringify(serializer.getResult())
  assertEquals(json, '{"name":"Alice","age":35}')

  const data = JSON.parse(json)
  const deserializer = new JsonDeserializer(data)
  const restored = deserializeUnknown<TestClass, JsonDeserializer>(TestClass, deserializer)
  assertEquals(restored.name, "Alice")
  assertEquals(restored.age, 35)
  assertEquals(restored instanceof TestClass, true)
})

Deno.test("JsonSerializer - should handle primitives", () => {
  const serializer = new JsonSerializer()

  serializer.serializeString("hello")
  assertEquals(serializer.getResult(), "hello")

  const serializer2 = new JsonSerializer()
  serializer2.serializeNumber(42)
  assertEquals(serializer2.getResult(), 42)

  const serializer3 = new JsonSerializer()
  serializer3.serializeBool(true)
  assertEquals(serializer3.getResult(), true)

  const serializer4 = new JsonSerializer()
  serializer4.serializeNull()
  assertEquals(serializer4.getResult(), null)
})
