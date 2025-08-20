import { Field, Ignore, Serializable } from "@dezer/core"

@Serializable
export class User {
  name: string
  age?: number

  @Field({ name: "email_address" })
  email: string

  @Ignore
  password: string

  constructor(name: string, email: string, password: string = "") {
    this.name = name
    this.email = email
    this.password = password
  }
}

@Serializable
export class Post {
  title: string
  content: string
  author: User
  createdAt: Date
  tags: string[]

  constructor(title: string, content: string, author: User, tags: string[] = []) {
    this.title = title
    this.content = content
    this.author = author
    this.createdAt = new Date()
    this.tags = tags
  }
}

@Serializable
export class Blog {
  name: string
  description: string
  posts: Post[]
  authors: User[]

  constructor(name: string, description: string) {
    this.name = name
    this.description = description
    this.posts = []
    this.authors = []
  }

  addPost(post: Post) {
    this.posts.push(post)
    if (!this.authors.find((a) => a.email === post.author.email)) {
      this.authors.push(post.author)
    }
  }
}
