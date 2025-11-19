# @alema/typed-storage

Type-safe key–value storage on top of any **synchronous** storage engine  
(e.g. `localStorage`, MMKV, in-memory maps), powered by **TypeScript + codecs**.

- ✅ Strongly typed keys (editor autocomplete)
- ✅ Strongly typed values per key
- ✅ Simple API for defining schemas and using storage
- ✅ Optional listeners for reacting to storage changes
- ✅ Works with any sync storage backend via a tiny adapter

---

## Installation

```bash
# npm
npm install @alema/typed-storage

# yarn
yarn add @alema/typed-storage

# pnpm
pnpm add @alema/typed-storage
```

Requires **TypeScript 5+**.

---

## Quick start

### 1. Define your schema

Use `defineStorageSchema` and `field` with the provided codecs:

```ts
import {
  defineStorageSchema,
  field,
  stringCodec,
  numberCodec,
  booleanCodec,
  jsonCodec,
} from "@alema/typed-storage";

export const appStorageSchema = defineStorageSchema({
  userToken: field(stringCodec),
  count: field(numberCodec),
  userData: field(jsonCodec<{ name: string; age: number }>()),
  isAuthenticated: field(booleanCodec),
});

export type AppStorageSchema = typeof appStorageSchema;
```

- Keys are strongly typed (`"userToken" | "count" | "userData" | "isAuthenticated"`).
- Values are correctly inferred (string, number, object, boolean).

---

### 2. Implement a storage adapter (example: `localStorage`)

You just need to match the `SyncStorageAdapter` shape.

#### Basic adapter (without listeners)

```ts
import type { SyncStorageAdapter } from "@alema/typed-storage";

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

You can build adapters for:

- `localStorage` (web)
- MMKV (React Native)
- in-memory storage (for tests)
- any other sync key–value store

---

### 3. Optional: adapter with listeners

If your adapter implements `addListener` / `removeListener`,  
the typed storage will expose them as `storage.addListener` / `storage.removeListener`.

Example `localStorage` adapter with in-memory listeners:

```ts
import type { SyncStorageAdapter } from "@alema/typed-storage";

export function createLocalStorageAdapterWithListeners(): SyncStorageAdapter {
  const listeners = new Map<string, Set<(newValue: string | null) => void>>();

  const notify = (key: string, newValue: string | null) => {
    const cbs = listeners.get(key);
    if (!cbs) return;
    for (const cb of cbs) {
      cb(newValue);
    }
  };

  return {
    getItem(key) {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(key);
    },
    setItem(key, value) {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(key, value);
      notify(key, value);
    },
    deleteItem(key) {
      if (typeof localStorage === "undefined") return;
      localStorage.removeItem(key);
      notify(key, null);
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
    addListener(key, callback) {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(callback);
    },
    removeListener(key, callback) {
      const set = listeners.get(key);
      if (!set) return;
      set.delete(callback);
      if (set.size === 0) {
        listeners.delete(key);
      }
    },
  };
}
```

---

### 4. Create the typed storage instance

```ts
import { createSyncTypedStorage } from "@alema/typed-storage";
import { appStorageSchema } from "./schema";
import { createLocalStorageAdapter } from "./localStorageAdapter";

const adapter = createLocalStorageAdapter();

export const appStorage = createSyncTypedStorage({
  adapter,
  schema: appStorageSchema,
  namespace: "app", // optional prefix for physical keys
});
```

Se vuoi usare i listener:

```ts
import { createLocalStorageAdapterWithListeners } from "./localStorageAdapterWithListeners";

const adapter = createLocalStorageAdapterWithListeners();
// poi come sopra
```

---

### 5. Use it in your app

```ts
import { appStorage } from "./storage";

// Write
appStorage.set("userToken", "abc123");
appStorage.set("count", 42);
appStorage.set("userData", { name: "Alex", age: 30 });
appStorage.set("isAuthenticated", true);

// Read (fully typed)
const token = appStorage.get("userToken");         // string
const count = appStorage.get("count");             // number
const userData = appStorage.get("userData");       // { name: string; age: number }
const isAuth = appStorage.get("isAuthenticated");  // boolean

// List keys (typed union)
const keys = appStorage.keys();
// type: ("userToken" | "count" | "userData" | "isAuthenticated")[]
```

TypeScript will prevent invalid keys or wrong types:

```ts
// appStorage.set("unknownKey", "foo");      // ❌ compile error (unknown key)
// appStorage.set("count", "not a number");  // ❌ compile error (wrong type)
```

At runtime, unknown keys also throw an error.

---

### 6. Listen to storage changes (optional)

If your adapter implements listeners, you can react to changes on a specific key:

```ts
// Value type is inferred from the schema
const callback = (newValue: string | null) => {
  console.log("userToken changed:", newValue);
};

appStorage.addListener?.("userToken", callback);

appStorage.set("userToken", "new-token");
// callback called with "new-token"

appStorage.removeListener?.("userToken", callback);

appStorage.set("userToken", "another-token");
// callback is NOT called anymore
```

> `addListener` and `removeListener` are optional (`?.`),  
> because not all adapters must implement them.

---

## Public API

### `defineStorageSchema(schema)`

Defines a typed schema for your storage.

```ts
import {
  defineStorageSchema,
  field,
  stringCodec,
  booleanCodec,
} from "@alema/typed-storage";

const schema = defineStorageSchema({
  userToken: field(stringCodec),
  isAuthenticated: field(booleanCodec),
});

type Schema = typeof schema;
```

Use this to get typed keys and values across your app.

---

### `field(codec)`

Creates a field in your schema from a codec.

```ts
import { field, stringCodec, numberCodec } from "@alema/typed-storage";

const schema = defineStorageSchema({
  userToken: field(stringCodec),
  count: field(numberCodec),
});
```

---

### Built-in codecs

```ts
import {
  stringCodec,
  booleanCodec,
  numberCodec,
  jsonCodec,
} from "@alema/typed-storage";
```

- `stringCodec` – for strings
- `booleanCodec` – for booleans
- `numberCodec` – for numbers
- `jsonCodec<T>()` – for arbitrary JSON-serializable types

Example:

```ts
const schema = defineStorageSchema({
  userPreferences: field(
    jsonCodec<{ theme: "light" | "dark"; notifications: boolean }>(),
  ),
});
```

---

### `createSyncTypedStorage({ adapter, schema, namespace? })`

Creates the main storage client.

```ts
import { createSyncTypedStorage } from "@alema/typed-storage";

const storage = createSyncTypedStorage({
  adapter,       // your SyncStorageAdapter
  schema,        // created via defineStorageSchema
  namespace: "app", // optional
});
```

The returned object has:

```ts
storage.get(key);
storage.set(key, value);
storage.remove(key);
storage.keys();
storage.clearAll();
storage.addListener?(key, callback);
storage.removeListener?(key, callback);
```

All fully typed from the `schema`.

---

### `SyncStorageAdapter` (type)

If you want to build your own adapter:

```ts
import type { SyncStorageAdapter } from "@alema/typed-storage";

const myAdapter: SyncStorageAdapter = {
  getItem(key) { /* ... */ },
  setItem(key, value) { /* ... */ },
  deleteItem(key) { /* ... */ },
  getAllKeys() { /* ... */ },

  // optional:
  addListener?(key, callback) { /* ... */ },
  removeListener?(key, callback) { /* ... */ },
};
```

- `addListener` / `removeListener` are **optional**.
- If implemented, the typed storage layer will expose `storage.addListener` / `storage.removeListener`.

---

## Testing example (in-memory adapter)

Handy for unit tests:

```ts
import type { SyncStorageAdapter } from "@alema/typed-storage";

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

Usage in tests:

```ts
import { createSyncTypedStorage } from "@alema/typed-storage";
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
