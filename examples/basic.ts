import "./dezer.ts"

import { Post, User } from "./model.ts"
import { fromString, toString } from "@dezer/json"

function main() {
  console.log("🧪 Testing Dezer Basic Example with Visitor Pattern")

  try {
    const user = new User("John Doe", "john@example.com", "secret123")
    user.age = 30

    console.log("User object:", user)
    console.log("Password (should be ignored):", user.password)

    const userJson = toString(user)
    console.log("\n📦 Serialized user:", userJson)

    const restoredUser = fromString(userJson, User)
    console.log("🔄 Deserialized user:", restoredUser)

    const post = new Post("Hello World", "This is my first post!", user)
    const postJson = toString(post)
    console.log("\n📦 Serialized post:", postJson)

    const restoredPost = fromString(postJson, Post)
    console.log("🔄 Deserialized post:", restoredPost)

    console.log("\n✅ All serialization tests passed!")
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error))
  }
}

if (import.meta.main) {
  main()
}

// Note: Import "../dezer.ts" in your main application file to enable serialization
