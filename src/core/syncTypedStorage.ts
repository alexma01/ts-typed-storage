import { StorageSchema, SyncStorageAdapter, TypedStorage, ValueOfSchema } from './types'

function createSyncTypedStorage<S extends StorageSchema>(params: {
  adapter: SyncStorageAdapter
  schema: S
  namespace?: string
}): TypedStorage<S> {
  const { adapter, schema, namespace } = params
  type Keys = keyof S

  const makeKey = (key: string) =>
    namespace ? `${namespace}-${key}` : key

  function get<K extends Keys>(key: K): ValueOfSchema<S, K> {
    const field = schema[key]
    if (!field) {
      throw new Error(`Unknown storage key: ${String(key)}`)
    }
    const raw = adapter.getItem(makeKey(String(key)))
    return field.codec.decode(raw) as ValueOfSchema<S, K>
  }

  function set<K extends Keys>(key: K, value: ValueOfSchema<S, K>): void {
    const field = schema[key]
    if (!field) {
      throw new Error(`Unknown storage key: ${String(key)}`)
    }
    const encoded = field.codec.encode(value)
    adapter.setItem(makeKey(String(key)), encoded)
  }

  function remove<K extends Keys>(key: K): void {
    adapter.deleteItem(makeKey(String(key)))
  }

  function keys(): Keys[] {
    const all = adapter.getAllKeys()
    const prefix = namespace ? `${namespace}-` : ''
    return all
      .filter(k => (prefix ? k.startsWith(prefix) : true))
      .map(k => k.replace(prefix, '') as Keys)
  }

  function clearAll(): void {
    for (const k of Object.keys(schema) as Keys[]) {
      remove(k)
    }
  }

  function addListener<K extends Keys>(
    key: K,
    cb: (value: ValueOfSchema<S, K> | null) => void,
  ): () => void {
    if (!adapter.addListener) return () => {
      console.warn('addListener not supported by adapter')
    }
    const unsubscribe = adapter.addListener(makeKey(String(key)), (raw: string | null) => {
      const field = schema[key]
      if (!field) {
        throw new Error(`Unknown storage key: ${String(key)}`)
      }
      const decoded = field.codec.decode(raw) as ValueOfSchema<S, K> | null
      cb(decoded)
    })
    return unsubscribe
  }

  return {
    get,
    set,
    remove,
    keys,
    clearAll,
    addListener,
  }
}

export { createSyncTypedStorage }
