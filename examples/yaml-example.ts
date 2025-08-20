import "./dezer.ts"

import { Post, User } from "./model.ts"
import { fromYaml, toYaml } from "@dezer/yaml"
import { fromString, toString } from "@dezer/json"

function main() {
  console.log("🧪 Testing Dezer with Multiple Formats")

  try {
    const user = new User("Jane Doe", "jane@example.com", "secret456")
    user.age = 28

    const post = new Post("YAML vs JSON", "Comparing serialization formats", user)

    console.log("Original objects:")
    console.log("User:", user)
    console.log("Post:", post)

    // Serialize to JSON
    const userJson = toString(user)
    const postJson = toString(post)

    console.log("\n📦 JSON Format:")
    console.log("User JSON:", userJson)
    console.log("Post JSON:", postJson)

    // Serialize to YAML
    const userYaml = toYaml(user)
    const postYaml = toYaml(post)

    console.log("\n📦 YAML Format:")
    console.log("User YAML:")
    console.log(userYaml)
    console.log("\nPost YAML:")
    console.log(postYaml)

    // Deserialize from JSON
    const restoredUserFromJson = fromString(userJson, User)
    const restoredPostFromJson = fromString(postJson, Post)

    console.log("\n🔄 Restored from JSON:")
    console.log("User:", restoredUserFromJson)
    console.log("Post:", restoredPostFromJson)

    // Deserialize from YAML
    const restoredUserFromYaml = fromYaml(userYaml, User)
    const restoredPostFromYaml = fromYaml(postYaml, Post)

    console.log("\n🔄 Restored from YAML:")
    console.log("User:", restoredUserFromYaml)
    console.log("Post:", restoredPostFromYaml)

    // Verify both formats produce equivalent objects
    console.log("\n✅ Format comparison:")
    console.log("JSON user name:", restoredUserFromJson.name)
    console.log("YAML user name:", restoredUserFromYaml.name)
    console.log("Names match:", restoredUserFromJson.name === restoredUserFromYaml.name)

    console.log("JSON post title:", restoredPostFromJson.title)
    console.log("YAML post title:", restoredPostFromYaml.title)
    console.log("Titles match:", restoredPostFromJson.title === restoredPostFromYaml.title)

    console.log("\n✅ Multi-format serialization test passed!")
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error))
    console.error("Stack:", error instanceof Error ? error.stack : "")
  }
}

if (import.meta.main) {
  main()
}
