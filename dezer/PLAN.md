# Dezer Implementation Plan

A true serde-like serialization library for Deno using decorators with build-time code generation and visitor pattern.

## Core Concept

Create a library that functions exactly like Rust's serde but in TypeScript, using:

- **Visitor pattern** for format-agnostic serialization/deserialization
- **Symbol-based traits** to avoid prototype pollution
- **Decorators** for ergonomic API
- **Code generation** for optimal performance
- **Complete format separation** - core library has no format knowledge

## Architecture: Visitor Pattern with Traits (Like Rust's Serde)

### 1. Core Traits (`src/traits.ts`)

#### Symbol-based Traits (No Prototype Pollution)

```typescript
// Global symbols ensure consistency across dependencies
const SERIALIZE = Symbol.for("dezer.serialize")
const DESERIALIZE = Symbol.for("dezer.deserialize")

interface Serialize {
  [SERIALIZE]<S extends Serializer>(serializer: S): void
}

interface Deserialize<T> {
  [DESERIALIZE]<D extends Deserializer>(deserializer: D): T
}
```

### 2. Serializer Interface (`src/serializer.ts`)

```typescript
interface Serializer {
  // Primitive types
  serializeNull(): void
  serializeBool(v: boolean): void
  serializeNumber(v: number): void
  serializeString(v: string): void
  serializeBytes(v: Uint8Array): void

  // Compound types
  serializeSeq(len?: number): SeqSerializer
  serializeMap(len?: number): MapSerializer
  serializeStruct(name: string, len: number): StructSerializer

  // Advanced types
  serializeOption<T>(value: T | null | undefined): OptionSerializer<T>
  serializeNewtype<T>(name: string, value: T): void
  serializeEnum(name: string, variant: string, data?: unknown): void
}

interface SeqSerializer {
  serializeElement<T>(value: T): void
  end(): void
}

interface MapSerializer {
  serializeEntry<K, V>(key: K, value: V): void
  serializeKey<K>(key: K): void
  serializeValue<V>(value: V): void
  end(): void
}

interface StructSerializer {
  serializeField<T>(name: string, value: T): void
  skipField(name: string): void
  end(): void
}

interface OptionSerializer<T> {
  serializeSome(value: T): void
  serializeNone(): void
}
```

### 3. Deserializer & Visitor Pattern (`src/deserializer.ts`)

```typescript
interface Deserializer {
  deserializeAny<V>(visitor: Visitor<V>): V
  deserializeBool<V>(visitor: Visitor<V>): V
  deserializeNumber<V>(visitor: Visitor<V>): V
  deserializeString<V>(visitor: Visitor<V>): V
  deserializeBytes<V>(visitor: Visitor<V>): V
  deserializeSeq<V>(visitor: Visitor<V>): V
  deserializeMap<V>(visitor: Visitor<V>): V
  deserializeStruct<V>(name: string, fields: string[], visitor: Visitor<V>): V
  deserializeOption<V>(visitor: Visitor<V>): V
  deserializeEnum<V>(name: string, variants: string[], visitor: Visitor<V>): V
}

interface Visitor<T> {
  expecting(): string // Error message helper

  visitNull(): T
  visitBool(v: boolean): T
  visitNumber(v: number): T
  visitString(v: string): T
  visitBytes(v: Uint8Array): T
  visitSeq<A>(seq: SeqAccess<A>): T
  visitMap<A>(map: MapAccess<A>): T
  visitEnum<A>(data: EnumAccess<A>): T
}

interface SeqAccess<T> {
  nextElement<E>(): E | undefined
  sizeHint(): number | undefined
}

interface MapAccess<T> {
  nextEntry<K, V>(): [K, V] | undefined
  nextKey<K>(): K | undefined
  nextValue<V>(): V | undefined
  sizeHint(): number | undefined
}

interface EnumAccess<T> {
  variant<V>(): [string, V]
}
```

### 4. Base Decorators (`src/decorators.ts`)

- `@Serializable()` - Class decorator marking types as serializable
- `@Field(options?)` - Property decorator with configuration:
  - `name?: string` - Custom field name in serialized form
  - `required?: boolean` - Whether field is required during deserialization
  - `default?: unknown` - Default value if missing
  - `skip?: boolean` - Skip field during serialization/deserialization
  - `skipSerializing?: boolean` - Skip only during serialization
  - `skipDeserializing?: boolean` - Skip only during deserialization
- `@Ignore` - Skip field during serialization/deserialization (alias for `@Field({ skip: true })`)
- `@Custom(serializer, deserializer)` - Custom serialization functions

### 5. Code Generator (`src/compiler/generator.ts`)

#### Generated Serialize Implementation

```typescript
// User writes:
@Serializable()
class User {
  @Field()
  name: string
  @Field({ name: "email_address" })
  email: string
  @Field({ skip: true })
  password: string
}

// Generator produces:
User.prototype[SERIALIZE] = function <S extends Serializer>(serializer: S): void {
  const struct = serializer.serializeStruct("User", 2)
  struct.serializeField("name", this.name)
  struct.serializeField("email_address", this.email)
  // password field skipped
  struct.end()
}
```

#### Generated Deserialize Implementation

```typescript
User[DESERIALIZE] = function<D extends Deserializer>(deserializer: D): User {
  return deserializer.deserializeStruct("User", ["name", "email_address"], {
    expecting(): string { return "struct User" }
    
    visitMap(map: MapAccess<unknown>): User {
      const user = new User()
      let entry
      while ((entry = map.nextEntry()) !== undefined) {
        const [key, value] = entry
        switch (key) {
          case "name": user.name = value as string; break
          case "email_address": user.email = value as string; break
          // password field not deserialized (skip: true)
        }
      }
      return user
    }
    
    // Other visitor methods throw errors with expecting() message
    visitNull(): User { throw new Error("Expected struct User, found null") }
    visitBool(): User { throw new Error("Expected struct User, found boolean") }
    // ... etc
  })
}
```

### 6. TypeScript AST Parser (`src/compiler/parser.ts`)

- Use TypeScript Compiler API to analyze source files
- Extract decorator information and type data
- Build metadata about classes, properties, and their types
- Support for:
  - Generic types
  - Union types
  - Optional properties
  - Nested class references

### 7. CLI Tool (`cli.ts`)

- Deno CLI tool for running code generation
- Watch mode for development workflow
- Integration with deno.json tasks
- Configuration support

## Workspace Structure

```
dezer-workspace/
├── deno.json                   # Workspace configuration
├── dezer/                      # Core library (@dezer/core)
│   ├── src/
│   │   ├── traits.ts           # SERIALIZE/DESERIALIZE symbols and interfaces
│   │   ├── serializer.ts       # Serializer interface definitions
│   │   ├── deserializer.ts     # Deserializer & Visitor interfaces
│   │   ├── decorators.ts       # Core decorator definitions
│   │   ├── types.ts            # Core type definitions
│   │   ├── compiler/
│   │   │   ├── parser.ts       # TypeScript AST parsing
│   │   │   ├── generator.ts    # Visitor pattern code generation
│   │   │   └── utils.ts        # Compiler utilities
│   │   └── mod.ts              # Main library exports
│   ├── cli.ts                  # CLI tool entry point
│   ├── tests/
│   │   ├── traits.test.ts      # Symbol/trait tests
│   │   ├── compiler.test.ts    # Code generation tests
│   │   └── integration.test.ts # End-to-end tests
│   ├── PLAN.md                 # This file
│   └── deno.json               # Dezer library configuration
├── dezer-json/                 # JSON format implementation (@dezer/json)
│   ├── src/
│   │   ├── serializer.ts       # JSON Serializer implementation
│   │   ├── deserializer.ts     # JSON Deserializer implementation
│   │   └── mod.ts              # JSON format exports
│   ├── tests/
│   │   └── json.test.ts        # JSON format tests
│   └── deno.json               # JSON format configuration
├── dezer-yaml/                 # YAML format implementation (@dezer/yaml)
│   ├── src/
│   │   ├── serializer.ts       # YAML Serializer implementation
│   │   ├── deserializer.ts     # YAML Deserializer implementation
│   │   └── mod.ts              # YAML format exports
│   ├── tests/
│   │   └── yaml.test.ts        # YAML format tests
│   └── deno.json               # YAML format configuration
└── examples/                   # Usage examples
    ├── basic.ts                # Basic visitor pattern usage
    ├── json-format.ts          # JSON serialization examples
    ├── yaml-format.ts          # YAML serialization examples
    ├── custom-visitor.ts       # Custom visitor implementations
    └── deno.json               # Examples configuration
```

## Example Usage (Visitor Pattern API)

### Core Library Usage (@dezer/core)

```typescript
import { DESERIALIZE, Field, Ignore, Serializable, SERIALIZE } from "@dezer/core"

@Serializable()
class User {
  @Field()
  name: string

  @Field({ name: "email_address" })
  email: string

  @Field({ skip: true })
  password: string

  constructor(name: string, email: string, password: string) {
    this.name = name
    this.email = email
    this.password = password
  }
}

// After running: deno task generate
// Core library only provides visitor interfaces - no format-specific methods
const user = new User("John", "john@example.com", "secret")

// This would be available but doesn't do format conversion:
// user[SERIALIZE](someSerializer) // Returns void, serializer handles output
// User[DESERIALIZE](someDeserializer) // Requires visitor pattern
```

### JSON Format Usage (@dezer/json)

```typescript
import { Field, Ignore, Serializable } from "@dezer/core"
import { fromBytes, fromString, toBytes, toString } from "@dezer/json"

@Serializable()
class User {
  @Field()
  name: string
  @Field({ name: "email_address" })
  email: string
  @Ignore()
  password: string
}

// After generation + importing dezer.ts:
const user = new User("John", "john@example.com", "secret")

// Format-specific serialization
const json = toString(user) // Uses JSON serializer with visitor pattern
const bytes = toBytes(user) // UTF-8 encoded JSON bytes
const restored = fromString(json, User) // Uses JSON deserializer with visitor
const restored2 = fromBytes(bytes, User) // From UTF-8 JSON bytes

console.log(json) // {"name":"John","email_address":"john@example.com"}
```

### YAML Format Usage (@dezer/yaml)

```typescript
import { Field, Serializable } from "@dezer/core"
import { fromString, toString } from "@dezer/yaml"

@Serializable()
class Config {
  @Field()
  database: DatabaseConfig
  @Field()
  server: ServerConfig
}

// Same User class, different format
const config = new Config(dbConfig, serverConfig)
const yaml = toString(config) // Uses YAML serializer with visitor pattern
const restored = fromString(yaml, Config) // Uses YAML deserializer

console.log(yaml)
// database:
//   host: localhost
//   port: 5432
// server:
//   host: 0.0.0.0
//   port: 8080
```

### Multiple Formats

```typescript
import { toString as toJson } from "@dezer/json"
import { toString as toYaml } from "@dezer/yaml"

const user = new User("John", "john@example.com", "secret")

const json = toJson(user) // JSON string
const yaml = toYaml(user) // YAML string

// Both use the same [SERIALIZE] method via visitor pattern
// Format modules provide the concrete serializer implementations
```

## Implementation Steps

### Phase 1: Core Visitor Pattern Infrastructure

1. **Define trait symbols and interfaces** (`src/traits.ts`)
   - Create global `SERIALIZE` and `DESERIALIZE` symbols
   - Define `Serialize` and `Deserialize` interfaces

2. **Implement serializer interfaces** (`src/serializer.ts`)
   - Define `Serializer`, `SeqSerializer`, `MapSerializer`, `StructSerializer`
   - Create interfaces for all primitive and compound types

3. **Implement deserializer & visitor pattern** (`src/deserializer.ts`)
   - Define `Deserializer`, `Visitor`, `SeqAccess`, `MapAccess` interfaces
   - Create error handling with `expecting()` messages

### Phase 2: Code Generation for Visitor Pattern

4. **Update AST parser** (`src/compiler/parser.ts`)
   - Parse decorator metadata for visitor pattern generation
   - Extract field skip options and custom names

5. **Generate visitor pattern code** (`src/compiler/generator.ts`)
   - Generate `[SERIALIZE]` methods that use serializer interfaces
   - Generate `[DESERIALIZE]` methods with visitor pattern
   - Handle field skipping, renaming, and type conversion

6. **Update CLI tool** (`cli.ts`)
   - Generate code using symbols instead of prototype methods
   - Maintain watch mode and workspace support

### Phase 3: Format Implementations

7. **Implement JSON format** (`../dezer-json/`)
   - Create `JsonSerializer` and `JsonDeserializer` classes
   - Implement `toString`, `fromString`, `toBytes`, `fromBytes` functions
   - Handle all visitor pattern methods

8. **Implement YAML format** (`../dezer-yaml/`)
   - Create `YamlSerializer` and `YamlDeserializer` classes
   - Same API as JSON but with YAML output
   - Add YAML parsing dependency

### Phase 4: Testing & Examples

9. **Create comprehensive tests**
   - Test visitor pattern interfaces
   - Test JSON and YAML format implementations
   - Test generated code with complex nested objects

10. **Update examples**
    - Show visitor pattern usage
    - Demonstrate multiple format support
    - Include custom visitor implementations

## Success Criteria

- ✅ **True serde-like architecture** - Visitor pattern with format separation
- ✅ **No prototype pollution** - Symbol-based traits ensure safety
- ✅ **Format independence** - Core library has zero format knowledge
- ✅ **Extensible** - Easy to add new formats (MessagePack, CBOR, etc.)
- ✅ **Type-safe** - Visitor pattern provides compile-time guarantees
- ✅ **Zero-copy potential** - Visitors can stream without intermediate objects
- ✅ **Custom serialization** - Full control via visitor implementations
- ✅ **Performance** - Generated code with direct property access
- ✅ **Development workflow** - Watch mode, workspace support, IDE integration

## Future Extensions

- **MessagePack format** (@dezer/msgpack) - Binary format with visitor pattern
- **CBOR format** (@dezer/cbor) - Concise binary format
- **Schema validation** - JSON Schema/YAML Schema integration
- **Streaming support** - Large data set serialization with visitors
- **Custom visitors** - User-defined serialization strategies
- **Performance optimization** - Specialized visitors for specific use cases
- **Derive macros** - More sophisticated code generation patterns
