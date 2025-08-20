import type { Deserialize, Serialize } from "@dezer/core"
import { DESERIALIZE, SERIALIZE } from "@dezer/core"
import { Post, User } from "./model.ts"

declare module "./model.ts" {
  interface User extends Serialize {
  }
  interface User extends Deserialize<User> {
  }
}

;(User.prototype as any)[SERIALIZE] = function (serializer: import("@dezer/core").Serializer) {
  const struct = serializer.serializeStruct("User", 3)
  struct.serializeField("name", this.name)
  struct.serializeField("email_address", this.email)
  struct.serializeField("age", this.age)
  struct.end()
}
;(User as any)[DESERIALIZE] = function (deserializer: import("@dezer/core").Deserializer) {
  return deserializer.deserializeStruct("User", ["name", "email_address", "age"], {
    expecting() {
      return "struct User"
    },

    visitMap(map: import("@dezer/core").MapAccess) {
      const instance = Object.create(User.prototype) as User
      let entry
      while ((entry = map.nextEntry()) !== undefined) {
        const [key, value] = entry
        switch (key) {
          case "name":
            instance.name = value as string
            break
          case "email_address":
            instance.email = value as string
            break
          case "age":
            if (value !== undefined) {
              instance.age = value as number
            }
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
}

declare module "./model.ts" {
  interface Post extends Serialize {
  }
  interface Post extends Deserialize<Post> {
  }
}

;(Post.prototype as any)[SERIALIZE] = function (serializer: import("@dezer/core").Serializer) {
  const struct = serializer.serializeStruct("Post", 4)
  struct.serializeField("title", this.title)
  struct.serializeField("content", this.content)
  struct.serializeField("author", this.author)
  struct.serializeField("createdAt", this.createdAt?.toISOString?.())
  struct.end()
}
;(Post as any)[DESERIALIZE] = function (deserializer: import("@dezer/core").Deserializer) {
  return deserializer.deserializeStruct("Post", ["title", "content", "author", "createdAt"], {
    expecting() {
      return "struct Post"
    },

    visitMap(map: import("@dezer/core").MapAccess) {
      const instance = Object.create(Post.prototype) as Post
      let entry
      while ((entry = map.nextEntry()) !== undefined) {
        const [key, value] = entry
        switch (key) {
          case "title":
            instance.title = value as string
            break
          case "content":
            instance.content = value as string
            break
          case "author":
            instance.author = value as User
            break
          case "createdAt":
            instance.createdAt = new Date(value as string)
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
}
