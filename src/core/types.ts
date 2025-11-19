import { Codec } from './codecs'

interface StorageField<T> {
  codec: Codec<T>
  default?: T | undefined
};

type StorageSchema = Record<string, StorageField<unknown>>

function defineStorageSchema<
  const S extends Record<string, StorageField<unknown>>,
>(schema: S): S {
  return schema
}

type ValueOfSchema<
  S extends StorageSchema,
  K extends keyof S,
> = S[K] extends StorageField<infer T> ? T : never

function field<T>(codec: Codec<T>, defaultValue?: T): StorageField<T> {
  return {
    codec,
    default: defaultValue,
  }
}

interface SyncStorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  deleteItem(key: string): void
  getAllKeys(): string[]
}

interface TypedStorage<S extends StorageSchema> {
  get<K extends keyof S>(key: K): ValueOfSchema<S, K>
  set<K extends keyof S>(key: K, value: ValueOfSchema<S, K>): void
  remove<K extends keyof S>(key: K): void
  keys(): (keyof S)[]
  clearAll(): void
}

export { type StorageSchema, type ValueOfSchema, type StorageField, type SyncStorageAdapter, type TypedStorage, defineStorageSchema, field }
