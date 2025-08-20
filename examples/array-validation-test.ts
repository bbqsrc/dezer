import "./dezer.ts"

import { fromString } from "@dezer/json"
import { Post, User } from "./model.ts"

function testArrayValidation() {
  console.log("🧪 Testing Dezer Array Validation")

  const validUser = {
    name: "John Doe",
    email_address: "john@example.com",
    age: 30,
  }

  const tests = [
    {
      name: "Invalid tags (not an array)",
      json: JSON.stringify({
        title: "Test Post",
        content: "Content",
        author: validUser,
        createdAt: new Date().toISOString(),
        tags: "not-an-array",
      }),
      expectedError: "Field 'tags' expected array",
    },
    {
      name: "Invalid tags array element (number instead of string)",
      json: JSON.stringify({
        title: "Test Post",
        content: "Content",
        author: validUser,
        createdAt: new Date().toISOString(),
        tags: ["valid", 123, "also-valid"],
      }),
      expectedError: "Field 'tags[1]' expected string, got number",
    },
    {
      name: "Valid tags array",
      json: JSON.stringify({
        title: "Test Post",
        content: "Content",
        author: validUser,
        createdAt: new Date().toISOString(),
        tags: ["tag1", "tag2", "tag3"],
      }),
      expectedError: null, // Should succeed
    },
  ]

  let passedTests = 0
  let totalTests = tests.length

  for (const test of tests) {
    try {
      console.log(`\n🔍 Test: ${test.name}`)

      const result = fromString(test.json, Post)

      if (test.expectedError === null) {
        console.log(`✅ PASSED: Successfully parsed valid data`)
        console.log(`   Tags: ${JSON.stringify((result as any).tags)}`)
        passedTests++
      } else {
        console.log(`❌ FAILED: Expected validation error but got result`)
      }
    } catch (error) {
      if (test.expectedError && error instanceof Error && error.message.includes(test.expectedError)) {
        console.log(`✅ PASSED: Caught expected error: ${error.message}`)
        passedTests++
      } else {
        console.log(`❌ FAILED: Got unexpected error: ${error instanceof Error ? error.message : String(error)}`)
        if (test.expectedError) {
          console.log(`   Expected: ${test.expectedError}`)
        }
      }
    }
  }

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`)

  if (passedTests === totalTests) {
    console.log("✅ All array validation tests passed!")
  } else {
    console.log("❌ Some array validation tests failed!")
  }
}

if (import.meta.main) {
  testArrayValidation()
}
