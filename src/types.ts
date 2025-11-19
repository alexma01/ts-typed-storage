import { Codec } from './codecs'

interface StorageField<T> {
  codec: Codec<T>
  default?: T
};

type StorageSchema = Record<string, StorageField<unknown>>

type ValueOfSchema<
  S extends StorageSchema,
  K extends keyof S,
> = S[K] extends StorageField<infer T> ? T : never

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

export { type StorageSchema, type ValueOfSchema, type StorageField, type SyncStorageAdapter, type TypedStorage }
