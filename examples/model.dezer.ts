import { Blog, Post, User } from "./model.ts"
import { DESERIALIZE, SERIALIZE } from "@dezer/core"
import type { Deserialize, Deserializer, MapAccess, Serialize, Serializer } from "@dezer/core"

declare module "./model.ts" {
  interface User extends Serialize, Deserialize {
  }
}

;(User.prototype as any)[SERIALIZE] = function (serializer: Serializer) {
  const struct = serializer.serializeStruct("User", 3)
  struct.serializeField("name", this.name)
  struct.serializeField("email_address", this.email)
  struct.serializeField("age", this.age)
  struct.end()
}
;(User.prototype as any)[DESERIALIZE] = function (deserializer: Deserializer) {
  return deserializer.deserializeStruct("User", ["name", "email_address", "age"], {
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
  interface Post extends Serialize, Deserialize {
  }
}

;(Post.prototype as any)[SERIALIZE] = function (serializer: Serializer) {
  const struct = serializer.serializeStruct("Post", 5)
  struct.serializeField("title", this.title)
  struct.serializeField("content", this.content)
  struct.serializeField("author", this.author)
  struct.serializeField("createdAt", this.createdAt?.toISOString?.())
  struct.serializeField("tags", this.tags)
  struct.end()
}
;(Post.prototype as any)[DESERIALIZE] = function (deserializer: Deserializer) {
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
          case "tags":
            instance.tags = value as unknown
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

declare module "./model.ts" {
  interface Blog extends Serialize, Deserialize {
  }
}

;(Blog.prototype as any)[SERIALIZE] = function (serializer: Serializer) {
  const struct = serializer.serializeStruct("Blog", 4)
  struct.serializeField("name", this.name)
  struct.serializeField("description", this.description)
  struct.serializeField("posts", this.posts)
  struct.serializeField("authors", this.authors)
  struct.end()
}
;(Blog.prototype as any)[DESERIALIZE] = function (deserializer: Deserializer) {
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
            instance.name = value as string
            break
          case "description":
            instance.description = value as string
            break
          case "posts":
            instance.posts = value as unknown
            break
          case "authors":
            instance.authors = value as unknown
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
}
