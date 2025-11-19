import { Codec } from './codecs'

interface StorageField<T> {
  codec: Codec<T>
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

function field<T>(codec: Codec<T>): StorageField<T> {
  return {
    codec,
  }
}

interface SyncStorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  deleteItem(key: string): void
  getAllKeys(): string[]
  addListener?(key: string, callback: (newValue: string | null) => void): void
  removeListener?(key: string, callback: (newValue: string | null) => void): void
}

interface TypedStorage<S extends StorageSchema> {
  get(key: keyof S): ValueOfSchema<S, keyof S> | null
  set(key: keyof S, value: ValueOfSchema<S, keyof S>): void
  remove(key: keyof S): void
  keys(): (keyof S)[]
  clearAll(): void
  addListener?(key: keyof S, callback: (newValue: ValueOfSchema<S, keyof S> | null) => void): void
  removeListener?(key: keyof S, callback: (newValue: ValueOfSchema<S, keyof S> | null) => void): void
}

export { type StorageSchema, type ValueOfSchema, type StorageField, type SyncStorageAdapter, type TypedStorage, defineStorageSchema, field }
