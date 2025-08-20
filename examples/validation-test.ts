import "./dezer.ts"

import { fromString } from "@dezer/json"
import { User } from "./model.ts"

function testInvalidData() {
  console.log("🧪 Testing Dezer Validation with Invalid Data")

  const tests = [
    {
      name: "Invalid name (number instead of string)",
      json: '{"name": 123, "email_address": "test@example.com", "age": 30}',
      expectedError: "Field 'name' expected string, got number",
    },
    {
      name: "Invalid age (string instead of number)",
      json: '{"name": "John", "email_address": "test@example.com", "age": "thirty"}',
      expectedError: "Field 'age' expected number, got string",
    },
    {
      name: "Invalid email (number instead of string)",
      json: '{"name": "John", "email_address": 42, "age": 30}',
      expectedError: "Field 'email' expected string, got number",
    },
  ]

  let passedTests = 0
  let totalTests = tests.length

  for (const test of tests) {
    try {
      console.log(`\n🔍 Test: ${test.name}`)
      console.log(`   JSON: ${test.json}`)

      const result = fromString(test.json, User)
      console.log(`❌ FAILED: Expected validation error but got result:`, result)
    } catch (error) {
      if (error instanceof Error && error.message.includes(test.expectedError)) {
        console.log(`✅ PASSED: Caught expected error: ${error.message}`)
        passedTests++
      } else {
        console.log(`❌ FAILED: Got unexpected error: ${error instanceof Error ? error.message : String(error)}`)
        console.log(`   Expected: ${test.expectedError}`)
      }
    }
  }

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`)

  if (passedTests === totalTests) {
    console.log("✅ All validation tests passed!")
  } else {
    console.log("❌ Some validation tests failed!")
  }
}

if (import.meta.main) {
  testInvalidData()
}
