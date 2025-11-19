# @alexma01/typed-storage

Type-safe key–value storage on top of any **synchronous** storage engine  
(e.g. `localStorage`, MMKV, in-memory maps), powered by **TypeScript + codecs**.

- ✅ Strongly typed keys (editor autocomplete)
- ✅ Strongly typed values per key
- ✅ Pluggable `Codec<T>` per field (string / number / boolean / JSON / custom)
- ✅ Works with any sync storage backend via a small adapter
- ✅ Zero runtime dependencies

---

## Installation

```bash
# npm
npm install @alexma01/typed-storage

# yarn
yarn add @alexma01/typed-storage

# pnpm
pnpm add @alexma01/typed-storage
```

Requires TypeScript 5+.

---

## Core ideas

The library is built around a few core building blocks:

- **`Codec<T>`** – how a value of type `T` is encoded/decoded to/from `string` for storage.
- **`field<T>(...)`** – creates a `StorageField<T>` from a codec (and optional default).
- **`defineStorageSchema(...)`** – defines a schema with literal keys and strong typing.
- **`SyncStorageAdapter`** – a tiny interface that abstracts the underlying storage engine.
- **`createSyncTypedStorage`** – given a schema + adapter, returns a strongly typed storage client.

From that, you get a type-safe API like:

```ts
const storage = createSyncTypedStorage({
  adapter,
  schema,
  namespace: "app",
});

storage.set("userToken", "abc123");      // ok
storage.set("isAuthenticated", true);   // ok
// storage.set("isAuthenticated", "yes"); // ❌ TypeScript error

const token = storage.get("userToken");        // string
const auth  = storage.get("isAuthenticated");  // boolean
```

---

## Quick start

### 1. Define your schema (with `defineStorageSchema` + `field`)

You describe the logical shape of your data using the built-in codecs and the helpers `field` and `defineStorageSchema`.

```ts
import {
  defineStorageSchema,
  field,
  stringCodec,
  numberCodec,
  booleanCodec,
  jsonCodec,
} from "@alexma01/typed-storage";

export const appStorageSchema = defineStorageSchema({
  userToken: field(stringCodec),
  count: field(numberCodec),
  userData: field(jsonCodec<{ name: string; age: number }>()),
  isAuthenticated: field(booleanCodec),
});

export type AppStorageSchema = typeof appStorageSchema;
```

This gives you:

- literal keys (`"userToken" | "count" | "userData" | "isAuthenticated"`)
- inferred value types for each key (string, number, object, boolean…)
- full type safety when calling `get`, `set`, `keys`, etc.

You **don’t** need to write `as const` or `satisfies StorageSchema` yourself:  
`defineStorageSchema` takes care of that.

---

### 2. Implement a `SyncStorageAdapter` (example: `localStorage`)

You only need to implement four methods.

```ts
import type { SyncStorageAdapter } from "@alexma01/typed-storage";

export function createLocalStorageAdapter(): SyncStorageAdapter {
  return {
    getItem(key) {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(key);
    },
    setItem(key, value) {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(key, value);
    },
    deleteItem(key) {
      if (typeof localStorage === "undefined") return;
      localStorage.removeItem(key);
    },
    getAllKeys() {
      if (typeof localStorage === "undefined") return [];
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k != null) keys.push(k);
      }
      return keys;
    },
  };
}
```

You can implement other adapters for:

- React Native MMKV
- React Native `AsyncStorage` (after wrapping it into a sync-like interface via caching, if you need)
- an in-memory `Map` for tests
- etc.

---

### 3. Create the typed storage instance

```ts
import { createSyncTypedStorage } from "@alexma01/typed-storage";
import { appStorageSchema } from "./schema";
import { createLocalStorageAdapter } from "./localStorageAdapter";

const adapter = createLocalStorageAdapter();

export const appStorage = createSyncTypedStorage({
  adapter,
  schema: appStorageSchema,
  namespace: "app", // optional, used as a prefix for physical keys
});
```

---

### 4. Use it in your app (with full type safety)

```ts
import { appStorage } from "./storage";

// Write
appStorage.set("userToken", "abc123");
appStorage.set("count", 42);
appStorage.set("userData", { name: "Alex", age: 30 });
appStorage.set("isAuthenticated", true);

// Read
const token = appStorage.get("userToken");         // string
const count = appStorage.get("count");            // number
const userData = appStorage.get("userData");      // { name: string; age: number }
const isAuth = appStorage.get("isAuthenticated"); // boolean

// Keys (typed)
const keys = appStorage.keys();
// type: ("userToken" | "count" | "userData" | "isAuthenticated")[]
```

If you pass a key that doesn't exist in the schema, TypeScript will complain:

```ts
// appStorage.set("unknownKey", "foo"); // ❌ Property '"unknownKey"' does not exist ...
```

At runtime, `createSyncTypedStorage` also throws if you try to use an unknown key:

```ts
throw new Error(`Unknown storage key: ${String(key)}`);
```

---

## API Reference

### `createSyncTypedStorage`

```ts
import type {
  StorageSchema,
  SyncStorageAdapter,
  TypedStorage,
  ValueOfSchema,
} from "@alexma01/typed-storage";

function createSyncTypedStorage<S extends StorageSchema>(params: {
  adapter: SyncStorageAdapter;
  schema: S;
  namespace?: string;
}): TypedStorage<S>;
```

**Parameters:**

- `adapter`: your implementation of `SyncStorageAdapter`.
- `schema`: a `StorageSchema` created via `defineStorageSchema(...)`.
- `namespace` (optional): string prefix used to namespace keys at the storage level.

**Returns:** a `TypedStorage<S>` object with methods:

- `get(key)`
- `set(key, value)`
- `remove(key)`
- `keys()`
- `clearAll()`

---

### `defineStorageSchema`

```ts
import type { StorageField, StorageSchema } from "@alexma01/typed-storage";

function defineStorageSchema<
  const S extends Record<string, StorageField<any>>
>(schema: S): S & StorageSchema;
```

Helper to define a schema with:

- literal keys preserved
- validation against `StorageSchema`

You typically use it like this:

```ts
import {
  defineStorageSchema,
  field,
  stringCodec,
  booleanCodec,
} from "@alexma01/typed-storage";

export const schema = defineStorageSchema({
  userToken: field(stringCodec),
  isAuthenticated: field(booleanCodec),
});

export type Schema = typeof schema;
```

---

### `field<T>(codec, default?)`

```ts
import type { Codec, StorageField } from "@alexma01/typed-storage";

function field<T>(codec: Codec<T>, defaultValue?: T): StorageField<T>;
```

Creates a `StorageField<T>` from a codec and an optional default value.

Example:

```ts
import { field, stringCodec, numberCodec } from "@alexma01/typed-storage";

const schema = defineStorageSchema({
  userToken: field(stringCodec),
  count: field(numberCodec, 0),
});
```

---

### `Codec<T>`

```ts
export interface Codec<T> {
  encode(value: T): string;
  decode(raw: string | null): T | null;
}
```

Built-in codecs:

```ts
export const stringCodec: Codec<string>;
export const booleanCodec: Codec<boolean>;
export const numberCodec: Codec<number>;
export const jsonCodec = <T>(): Codec<T>;
```

- `stringCodec` – stores strings as-is.
- `booleanCodec` – stores booleans as `"1"` / `"0"`.
- `numberCodec` – stores numbers using `String(value)`.
- `jsonCodec<T>()` – serializes arbitrary types via `JSON.stringify` / `JSON.parse`.

You can also create your own custom codecs, e.g. for dates:

```ts
export const dateCodec: Codec<Date> = {
  encode: d => d.toISOString(),
  decode: raw => (raw == null ? null : new Date(raw)),
};
```

---

### `StorageField<T>`

```ts
interface StorageField<T> {
  codec: Codec<T>;
  default?: T; // optional default, for your own helpers / wrappers
}
```

You usually don’t construct this directly; you use `field(...)` instead.

---

### `StorageSchema`

```ts
type StorageSchema = Record<string, StorageField<unknown>>;
```

Schemas are created via `defineStorageSchema(...)`.

---

### `ValueOfSchema<S, K>`

Utility type to map schema keys to their logical value types:

```ts
type ValueOfSchema<
  S extends StorageSchema,
  K extends keyof S,
> = S[K] extends StorageField<infer T> ? T : never;
```

Example:

```ts
type TokenType = ValueOfSchema<typeof appStorageSchema, "userToken">;         // string
type IsAuthenticatedType = ValueOfSchema<typeof appStorageSchema, "isAuthenticated">; // boolean
```

---

### `SyncStorageAdapter`

```ts
interface SyncStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  deleteItem(key: string): void;
  getAllKeys(): string[];
}
```

Implement this for your storage backend (localStorage, MMKV, in-memory, etc.).

---

### `TypedStorage<S>`

```ts
interface TypedStorage<S extends StorageSchema> {
  get<K extends keyof S>(key: K): ValueOfSchema<S, K>;
  set<K extends keyof S>(key: K, value: ValueOfSchema<S, K>): void;
  remove<K extends keyof S>(key: K): void;
  keys(): (keyof S)[];
  clearAll(): void;
}
```

All methods are fully type-safe based on the schema you pass to `createSyncTypedStorage`.

---

## Testing with an in-memory adapter

For unit tests you can use a simple in-memory adapter:

```ts
import type { SyncStorageAdapter } from "@alexma01/typed-storage";

export function createInMemoryAdapter(): SyncStorageAdapter {
  const store = new Map<string, string>();

  return {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    deleteItem(key) {
      store.delete(key);
    },
    getAllKeys() {
      return Array.from(store.keys());
    },
  };
}
```

Then:

```ts
import { createSyncTypedStorage } from "@alexma01/typed-storage";
import { createInMemoryAdapter } from "./inMemoryAdapter";
import { appStorageSchema } from "./schema";

const storage = createSyncTypedStorage({
  adapter: createInMemoryAdapter(),
  schema: appStorageSchema,
});

storage.set("userToken", "test");
expect(storage.get("userToken")).toBe("test");
```

---

## License

MIT – see `LICENSE` file for details.
