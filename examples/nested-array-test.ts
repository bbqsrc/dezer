import "./dezer.ts"

import { fromString } from "@dezer/json"
import { Blog, Post, User } from "./model.ts"

function testNestedArrayDeserialization() {
  console.log("🧪 Testing Nested Array Deserialization")

  const jsonData = JSON.stringify({
    name: "Tech Blog",
    description: "A blog about technology",
    posts: [
      {
        title: "First Post",
        content: "This is the first post content",
        author: {
          name: "Alice",
          email_address: "alice@example.com",
          age: 30,
        },
        createdAt: new Date().toISOString(),
        tags: ["tech", "programming"],
      },
      {
        title: "Second Post",
        content: "This is the second post content",
        author: {
          name: "Bob",
          email_address: "bob@example.com",
          age: 25,
        },
        createdAt: new Date().toISOString(),
        tags: ["web", "javascript"],
      },
    ],
    authors: [
      {
        name: "Alice",
        email_address: "alice@example.com",
        age: 30,
      },
      {
        name: "Bob",
        email_address: "bob@example.com",
        age: 25,
      },
    ],
  })

  try {
    console.log("🔄 Deserializing blog with nested arrays...")
    const blog = fromString(jsonData, Blog)

    console.log("✅ Successfully deserialized blog!")
    console.log(`📝 Blog: ${blog.name} - ${blog.description}`)
    console.log(`📚 Posts: ${blog.posts.length}`)
    console.log(`👥 Authors: ${blog.authors.length}`)

    // Test that posts are proper Post instances
    for (let i = 0; i < blog.posts.length; i++) {
      const post = blog.posts[i]
      console.log(`  Post ${i + 1}: ${post.title} by ${post.author.name}`)
      console.log(`    instanceof Post: ${post instanceof Post}`)
      console.log(`    instanceof User: ${post.author instanceof User}`)
      console.log(`    tags: ${post.tags.join(", ")}`)
    }

    // Test that authors are proper User instances
    for (let i = 0; i < blog.authors.length; i++) {
      const author = blog.authors[i]
      console.log(`  Author ${i + 1}: ${author.name} (${author.email})`)
      console.log(`    instanceof User: ${author instanceof User}`)
    }

    console.log("✅ All nested array deserialization tests passed!")
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error))
    console.error("Stack:", error instanceof Error ? error.stack : "")
  }
}

if (import.meta.main) {
  testNestedArrayDeserialization()
}
