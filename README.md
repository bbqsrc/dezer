# Dezer

> [!CAUTION]
> **DO NOT USE THIS LIBRARY UNDER ANY CIRCUMSTANCES ⚠️**
> 
> This is an experimental/educational project and should not be used in production code. I don't trust Claude and neither should you.

A serde-inspired serialization library for TypeScript/Deno featuring the visitor pattern and code generation.

## 🚀 Features

- **🎯 Visitor Pattern Architecture** - True serde-like design with format-agnostic serialization
- **🔧 Code Generation** - Minimal-runtime overhead with TypeScript AST-based generation
- **📦 Format Independence** - Core library knows nothing about specific formats
- **🛡️ Type Safety** - Full TypeScript support with compile-time guarantees
- **⚡ Symbol-based Traits** - No prototype pollution, dependency-safe
- **🔄 Multiple Formats** - JSON, YAML, and easily extensible to more
- **🎨 Decorator API** - Clean, ergonomic syntax with `@Serializable()` and `@Field()`
- **⚙️ CLI Integration** - Watch mode and development workflow support

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [CLI Usage](#cli-usage)
- [Supported Formats](#supported-formats)
- [Examples](#examples)
- [Architecture](#architecture)
- [Contributing](#contributing)

## 🔧 Installation

### Core Library

```typescript
import { Field, Serializable } from "jsr:@dezer/core"
```

### Format Libraries

```typescript
// JSON support
import { fromString, toString } from "jsr:@dezer/json"

// YAML support  
import { fromYaml, toYaml } from "jsr:@dezer/yaml"
```

### CLI Tool

Add to your `deno.json`:

```json
{
  "tasks": {
    "generate": "deno run --allow-read --allow-write jsr:@dezer/core/cli",
    "generate:watch": "deno run --allow-read --allow-write jsr:@dezer/core/cli --watch"
  }
}
```

## 🚀 Quick Start

### 1. Define Your Models

```typescript
// model.ts
import { Field, Serializable } from "@dezer/core"

@Serializable()
export class User {
  @Field()
  name: string

  @Field({ name: "email_address" })
  email: string

  @Field({ skip: true })
  password: string

  @Field()
  age?: number

  constructor(name: string, email: string, password: string) {
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
  createdAt: Date = new Date()

  constructor(title: string, content: string, author: User) {
    this.title = title
    this.content = content
    this.author = author
  }
}
```

### 2. Generate Serialization Code

```bash
deno task generate
```

This creates `model.dezer.ts` with generated visitor pattern implementations.

### 3. Import Generated Code & Use

```typescript
// main.ts
import "./model.dezer.ts"  // Import generated code
import { fromString, toString } from "@dezer/json"
import { User, Post } from "./model.ts"

const user = new User("John Doe", "john@example.com", "secret123")
user.age = 30

const post = new Post("Hello World", "My first post!", user)

// Serialize to JSON
const json = toString(post)
console.log(json)
// Output: {"title":"Hello World","content":"My first post!","author":{"name":"John Doe","email_address":"john@example.com","age":30},"createdAt":"2024-01-15T10:30:00.000Z"}

// Deserialize from JSON  
const restored = fromString(json, Post)
console.log(restored.author.name) // "John Doe"
```

## 🧠 Core Concepts

### Visitor Pattern

Dezer uses the visitor pattern (like Rust's serde) for format-agnostic serialization:

```typescript
// Your class implements this symbol-based trait
interface Serialize {
  [SERIALIZE]<S extends Serializer>(serializer: S): void
}

// Generated implementation
User.prototype[SERIALIZE] = function(serializer: Serializer) {
  const struct = serializer.serializeStruct("User", 3)
  struct.serializeField("name", this.name)
  struct.serializeField("email_address", this.email)
  struct.serializeField("age", this.age)
  struct.end()
}
```

### Symbol-based Traits

Uses global symbols to avoid prototype pollution:

```typescript
const SERIALIZE = Symbol.for("dezer.serialize")
const DESERIALIZE = Symbol.for("dezer.deserialize")
```

### Format Independence

The core library has zero knowledge of specific formats:

```typescript
// Core: defines the visitor interface
interface Serializer {
  serializeStruct(name: string, len: number): StructSerializer
  serializeString(value: string): void
  // ...
}

// Format library: implements the interface
class JsonSerializer implements Serializer {
  serializeStruct(name: string, len: number) {
    return new JsonStructSerializer(this.output)
  }
  // ...
}
```

## 📚 API Reference

### Decorators

#### `@Serializable()`

Marks a class for serialization code generation.

```typescript
@Serializable()
class MyClass {
  // ...
}
```

#### `@Field(options?)`

Configures field serialization:

```typescript
interface FieldOptions {
  name?: string              // Custom field name in output
  skip?: boolean            // Skip in both serialization/deserialization  
  skipSerializing?: boolean // Skip only during serialization
  skipDeserializing?: boolean // Skip only during deserialization
  required?: boolean        // Field is required during deserialization
  default?: unknown         // Default value if missing
}

@Field({ name: "custom_name", skip: false })
myProperty: string
```

#### `@Ignore`

Shorthand for `@Field({ skip: true })`:

```typescript
@Ignore
sensitiveData: string
```

### Core Functions

```typescript
// Type-safe serialization
function serialize<S extends Serializer>(value: Serialize, serializer: S): void

// Type-safe deserialization  
function deserialize<T extends Deserialize, D extends Deserializer>(
  ctor: new (...args: any[]) => T,
  deserializer: D
): T

// Runtime checks
function serializeUnknown<S extends Serializer>(value: unknown, serializer: S): void
function deserializeUnknown<T extends Deserialize, D extends Deserializer>(
  ctor: unknown,
  deserializer: D
): T
```

### Format Functions

#### JSON (`@dezer/json`)

```typescript
// String serialization
function toString<T extends Serialize>(value: T): string
function fromString<T extends Deserialize>(json: string, ctor: new (...args: any[]) => T): T

// Byte serialization
function toBytes<T extends Serialize>(value: T): Uint8Array
function fromBytes<T extends Deserialize>(bytes: Uint8Array, ctor: new (...args: any[]) => T): T
```

#### YAML (`@dezer/yaml`)

```typescript
function toYaml<T extends Serialize>(value: T): string
function fromYaml<T extends Deserialize>(yaml: string, ctor: new (...args: any[]) => T): T
```

## 🖥️ CLI Usage

### Basic Generation

```bash
# Generate serialization code for current directory
deno task generate

# Watch for changes and regenerate automatically  
deno task generate:watch

# Process specific directory with verbose output
deno run --allow-read --allow-write @dezer/core/cli --dir src --verbose

# Watch specific directory
deno run --allow-read --allow-write @dezer/core/cli --watch --dir examples
```

### CLI Options

```
USAGE:
    deno run --allow-read --allow-write @dezer/core/cli [OPTIONS]

OPTIONS:
    -h, --help      Show help message
    -w, --watch     Watch for file changes and regenerate automatically
    -d, --dir       Directory to process (default: current directory)
    -v, --verbose   Enable verbose output
```

### Integration with deno.json

```json
{
  "tasks": {
    "generate": "deno run --allow-read --allow-write @dezer/core/cli",
    "generate:watch": "deno run --allow-read --allow-write @dezer/core/cli --watch",
    "generate:verbose": "deno run --allow-read --allow-write @dezer/core/cli --verbose"
  }
}
```

## 📦 Supported Formats

### JSON (`@dezer/json`)

Full JSON support with UTF-8 byte arrays:

```typescript
import { fromString, toString, fromBytes, toBytes } from "@dezer/json"

const user = new User("Alice", "alice@example.com", "secret")

// String format
const json = toString(user)
const restored = fromString(json, User)

// Byte format (UTF-8 encoded JSON)
const bytes = toBytes(user)
const restoredFromBytes = fromBytes(bytes, User)
```

### YAML (`@dezer/yaml`)

Human-readable YAML serialization:

```typescript
import { fromYaml, toYaml } from "@dezer/yaml"

const config = new AppConfig()
const yaml = toYaml(config)
console.log(yaml)
/*
database:
  host: localhost
  port: 5432
server:
  host: 0.0.0.0  
  port: 8080
*/

const restored = fromYaml(yaml, AppConfig)
```

### Adding Custom Formats

Create a new format by implementing the serializer interfaces:

```typescript
// my-format/mod.ts
import type { Serializer, Deserializer } from "@dezer/core"

export class MyFormatSerializer implements Serializer {
  serializeStruct(name: string, len: number) {
    // Your implementation
  }
  // ... implement other methods
}

export class MyFormatDeserializer implements Deserializer {
  deserializeStruct<T>(name: string, fields: string[], visitor: Visitor<T>): T {
    // Your implementation
  }
  // ... implement other methods
}

export function toString<T extends Serialize>(value: T): string {
  const serializer = new MyFormatSerializer()
  serialize(value, serializer)
  return serializer.getResult()
}
```

## 💡 Examples

### Field Customization

```typescript
@Serializable()
class Product {
  @Field()
  id: number

  @Field({ name: "product_name" })
  name: string

  @Field({ skip: true })
  internalCode: string

  @Field({ skipSerializing: true })
  temporaryData: string

  @Field({ required: true, default: 0 })
  price: number

  constructor(id: number, name: string, internalCode: string) {
    this.id = id
    this.name = name
    this.internalCode = internalCode
    this.temporaryData = "temp"
    this.price = 0
  }
}
```

### Nested Objects

```typescript
@Serializable()
class Address {
  @Field()
  street: string

  @Field()
  city: string

  @Field()
  zipCode: string

  constructor(street: string, city: string, zipCode: string) {
    this.street = street
    this.city = city
    this.zipCode = zipCode
  }
}

@Serializable()
class Customer {
  @Field()
  name: string

  @Field()
  address: Address

  @Field()
  orders: Order[]

  constructor(name: string, address: Address) {
    this.name = name
    this.address = address
    this.orders = []
  }
}
```

### Multiple Format Usage

```typescript
import { toString as toJson, fromString as fromJson } from "@dezer/json"
import { toYaml, fromYaml } from "@dezer/yaml"

const customer = new Customer(
  "John Doe",
  new Address("123 Main St", "Anytown", "12345")
)

// Same object, different formats
const json = toJson(customer)
const yaml = toYaml(customer)

// Cross-format compatibility
const fromJsonData = fromJson(json, Customer)
const fromYamlData = fromYaml(yaml, Customer)

console.log(fromJsonData.name === fromYamlData.name) // true
```

### Collections and Arrays

```typescript
@Serializable()
class BlogPost {
  @Field()
  title: string

  @Field()
  tags: string[]

  @Field()
  comments: Comment[]

  @Field()
  metadata: Map<string, string> = new Map()

  constructor(title: string) {
    this.title = title
    this.tags = []
    this.comments = []
  }
}
```

## 🏗️ Architecture

### Workspace Structure

```
dezer-workspace/
├── deno.json                   # Workspace configuration
├── README.md                   # This file
├── dezer/                      # Core library (@dezer/core)
│   ├── src/
│   │   ├── traits.ts           # SERIALIZE/DESERIALIZE symbols
│   │   ├── serializer.ts       # Serializer interfaces
│   │   ├── deserializer.ts     # Deserializer & Visitor interfaces  
│   │   ├── decorators.ts       # @Serializable, @Field decorators
│   │   ├── compiler/
│   │   │   ├── parser.ts       # TypeScript AST parsing
│   │   │   ├── generator.ts    # Code generation
│   │   │   └── utils.ts        # Utilities
│   │   └── mod.ts              # Main exports
│   ├── cli.ts                  # CLI tool
│   └── deno.json
├── dezer-json/                 # JSON format (@dezer/json)
│   ├── mod.ts                  # JSON serializer/deserializer
│   └── deno.json
├── dezer-yaml/                 # YAML format (@dezer/yaml)  
│   ├── mod.ts                  # YAML serializer/deserializer
│   └── deno.json
└── examples/                   # Usage examples
    ├── basic.ts
    ├── yaml-example.ts
    └── deno.json
```

### Generated Code Example

From this input:

```typescript
@Serializable()
class User {
  @Field()
  name: string
  
  @Field({ name: "email_address" })
  email: string
}
```

Dezer generates:

```typescript
// model.dezer.ts
import { User } from "./model.ts"
import { SERIALIZE, DESERIALIZE } from "@dezer/core"
import type { Serialize, Deserialize, Serializer, Deserializer, MapAccess } from "@dezer/core"

declare module "./model.ts" {
  interface User extends Serialize, Deserialize {
  }
}

;(User.prototype as any)[SERIALIZE] = function(serializer: Serializer) {
  const struct = serializer.serializeStruct("User", 2)
  struct.serializeField("name", this.name)
  struct.serializeField("email_address", this.email)
  struct.end()
}

;(User.prototype as any)[DESERIALIZE] = function(deserializer: Deserializer) {
  return deserializer.deserializeStruct("User", ["name", "email_address"], {
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
        }
      }
      return instance
    },
    
    visitNull() {
      throw new Error("Expected struct User, found null")
    },
    
    // ... other visitor methods with error messages
  })
}
```

## 🧪 Testing

Run the test suite:

```bash
# All tests
deno task test

# Core library tests
deno task test:dezer

# Specific test file
deno test dezer/tests/visitor.test.ts
```

## 🤝 Contributing

1. **Adding New Formats**
   - Create a new workspace package (e.g., `dezer-msgpack/`)
   - Implement `Serializer` and `Deserializer` interfaces
   - Add format-specific helper functions
   - Include comprehensive tests

2. **Core Development**
   - Follow the visitor pattern architecture
   - Maintain format independence in core library
   - Add tests for new decorators or features
   - Update generated code to match new patterns

3. **Development Workflow**
   ```bash
   # Install dependencies
   deno cache dezer/mod.ts
   
   # Run tests in watch mode
   deno task test --watch
   
   # Generate code for examples
   cd examples && deno task generate:watch
   
   # Run examples
   deno task example
   ```

## 📜 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

Inspired by Rust's [serde](https://serde.rs/) library, bringing the same powerful visitor pattern architecture to TypeScript/Deno with modern tooling and type safety.