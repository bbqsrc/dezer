import { Blog, Post, User } from "./model.ts"
import * as $dezer from "@dezer/core"
import type { Deserialize, Deserializer, MapAccess, Serialize, Serializer } from "@dezer/core"

declare module "./model.ts" {
  interface User extends Serialize, Deserialize {
  }
}

Object.defineProperty(User.prototype, $dezer.SERIALIZE, {
  value: function (serializer: Serializer) {
    const struct = serializer.serializeStruct("User", 3)
    struct.serializeField("name", this.name)
    struct.serializeField("age", this.age)
    struct.serializeField("email_address", this.email)
    struct.end()
  },
  enumerable: false,
  configurable: false,
  writable: false,
})

Object.defineProperty(User.prototype, $dezer.DESERIALIZE, {
  value: function (deserializer: Deserializer) {
    return deserializer.deserializeStruct("User", ["name", "age", "email_address"], {
      expecting() {
        return "struct User"
      },

      visitMap(map: MapAccess) {
        const instance = Object.create(User.prototype) as User
        let entry
        while ((entry = map.nextEntry()) !== undefined) {
          const [key, value] = entry
          switch (key) {
            case "name":
              instance.name = $dezer.validateString(value, "name")
              break
            case "age":
              if (value !== undefined) {
                instance.age = $dezer.validateNumber(value, "age")
              }
              break
            case "email_address":
              instance.email = $dezer.validateString(value, "email")
              break
          }
        }
        return instance
      },

      visitNull() {
        throw new Error("Expected struct User, found null")
      },

      visitBool() {
        throw new Error("Expected struct User, found boolean")
      },

      visitNumber() {
        throw new Error("Expected struct User, found number")
      },

      visitString() {
        throw new Error("Expected struct User, found string")
      },

      visitBytes() {
        throw new Error("Expected struct User, found bytes")
      },

      visitSeq() {
        throw new Error("Expected struct User, found sequence")
      },

      visitEnum() {
        throw new Error("Expected struct User, found enum")
      },
    })
  },
  enumerable: false,
  configurable: false,
  writable: false,
})

declare module "./model.ts" {
  interface Post extends Serialize, Deserialize {
  }
}

Object.defineProperty(Post.prototype, $dezer.SERIALIZE, {
  value: function (serializer: Serializer) {
    const struct = serializer.serializeStruct("Post", 5)
    struct.serializeField("title", this.title)
    struct.serializeField("content", this.content)
    struct.serializeField("author", this.author)
    struct.serializeField("createdAt", this.createdAt?.toISOString?.())
    struct.serializeField("tags", this.tags)
    struct.end()
  },
  enumerable: false,
  configurable: false,
  writable: false,
})

Object.defineProperty(Post.prototype, $dezer.DESERIALIZE, {
  value: function (deserializer: Deserializer) {
    return deserializer.deserializeStruct("Post", ["title", "content", "author", "createdAt", "tags"], {
      expecting() {
        return "struct Post"
      },

      visitMap(map: MapAccess) {
        const instance = Object.create(Post.prototype) as Post
        let entry
        while ((entry = map.nextEntry()) !== undefined) {
          const [key, value] = entry
          switch (key) {
            case "title":
              instance.title = $dezer.validateString(value, "title")
              break
            case "content":
              instance.content = $dezer.validateString(value, "content")
              break
            case "author":
              instance.author = $dezer.deserializeNestedObject(value, User, deserializer, "author")
              break
            case "createdAt":
              instance.createdAt = $dezer.validateDate(value, "createdAt")
              break
            case "tags":
              instance.tags = $dezer.validateStringArray(value, "tags")
              break
          }
        }
        return instance
      },

      visitNull() {
        throw new Error("Expected struct Post, found null")
      },

      visitBool() {
        throw new Error("Expected struct Post, found boolean")
      },

      visitNumber() {
        throw new Error("Expected struct Post, found number")
      },

      visitString() {
        throw new Error("Expected struct Post, found string")
      },

      visitBytes() {
        throw new Error("Expected struct Post, found bytes")
      },

      visitSeq() {
        throw new Error("Expected struct Post, found sequence")
      },

      visitEnum() {
        throw new Error("Expected struct Post, found enum")
      },
    })
  },
  enumerable: false,
  configurable: false,
  writable: false,
})

declare module "./model.ts" {
  interface Blog extends Serialize, Deserialize {
  }
}

Object.defineProperty(Blog.prototype, $dezer.SERIALIZE, {
  value: function (serializer: Serializer) {
    const struct = serializer.serializeStruct("Blog", 4)
    struct.serializeField("name", this.name)
    struct.serializeField("description", this.description)
    struct.serializeField("posts", this.posts)
    struct.serializeField("authors", this.authors)
    struct.end()
  },
  enumerable: false,
  configurable: false,
  writable: false,
})

Object.defineProperty(Blog.prototype, $dezer.DESERIALIZE, {
  value: function (deserializer: Deserializer) {
    return deserializer.deserializeStruct("Blog", ["name", "description", "posts", "authors"], {
      expecting() {
        return "struct Blog"
      },

      visitMap(map: MapAccess) {
        const instance = Object.create(Blog.prototype) as Blog
        let entry
        while ((entry = map.nextEntry()) !== undefined) {
          const [key, value] = entry
          switch (key) {
            case "name":
              instance.name = $dezer.validateString(value, "name")
              break
            case "description":
              instance.description = $dezer.validateString(value, "description")
              break
            case "posts":
              instance.posts = $dezer.deserializeObjectArray(value, Post, deserializer, "posts")
              break
            case "authors":
              instance.authors = $dezer.deserializeObjectArray(value, User, deserializer, "authors")
              break
          }
        }
        return instance
      },

      visitNull() {
        throw new Error("Expected struct Blog, found null")
      },

      visitBool() {
        throw new Error("Expected struct Blog, found boolean")
      },

      visitNumber() {
        throw new Error("Expected struct Blog, found number")
      },

      visitString() {
        throw new Error("Expected struct Blog, found string")
      },

      visitBytes() {
        throw new Error("Expected struct Blog, found bytes")
      },

      visitSeq() {
        throw new Error("Expected struct Blog, found sequence")
      },

      visitEnum() {
        throw new Error("Expected struct Blog, found enum")
      },
    })
  },
  enumerable: false,
  configurable: false,
  writable: false,
})
