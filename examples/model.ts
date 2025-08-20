import { Field, Ignore, Serializable } from "@dezer/core"

@Serializable()
export class User {
  @Field()
  name: string

  @Field({ name: "email_address" })
  email: string

  @Field({ required: false })
  age?: number

  @Ignore()
  password: string

  constructor(name: string, email: string, password: string = "") {
    this.name = name
    this.email = email
    this.password = password
  }
}

@Serializable()
export class Post {
  @Field()
  title: string

  @Field()
  content: string

  @Field()
  author: User

  @Field()
  createdAt: Date

  constructor(title: string, content: string, author: User) {
    this.title = title
    this.content = content
    this.author = author
    this.createdAt = new Date()
  }
}
