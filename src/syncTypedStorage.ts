import type { StorageSchema, SyncStorageAdapter, TypedStorage, ValueOfSchema } from './types'

function createSyncTypedStorage<S extends StorageSchema>(params: {
  adapter: SyncStorageAdapter
  schema: S
  namespace?: string
}): TypedStorage<S> {
  const { getItem, setItem, deleteItem, getAllKeys } = params.adapter
  const { schema, namespace } = params

  type Keys = keyof S

  const makeKey = (key: string) => {
    return params.namespace ? `${params.namespace}-${key}` : key
  }

  function get<K extends Keys>(key: K): ValueOfSchema<S, K> {
    const field = schema[key]

    if (!field) {
      throw new Error(`Unknown storage key: ${String(key)}`)
    }
    const val = getItem(makeKey(String(key)))

    return field.codec.decode(val) as ValueOfSchema<S, K>
  }

  function set<K extends Keys>(key: K, value: ValueOfSchema<S, K>): void {
    const field = schema[key]
    if (!field) {
      throw new Error(`Unknown storage key: ${String(key)}`)
    }
    const encoded = field.codec.encode(value)
    setItem(makeKey(String(key)), encoded)
  }

  function remove<K extends Keys>(key: K): void {
    deleteItem(makeKey(String(key)))
  }

  function keys(): Keys[] {
    const all = getAllKeys()
    const prefix = namespace ? `${namespace}:` : ''
    return all
      .filter(k => (prefix ? k.startsWith(prefix) : true))
      .map(k => k.replace(prefix, '') as Keys)
  }

  function clearAll(): void {
    for (const k of Object.keys(schema) as Keys[]) {
      remove(k)
    }
  }

  return {
    keys,
    clearAll,
    get,
    set,
    remove,
  }
}

export { createSyncTypedStorage, SyncStorageAdapter, TypedStorage }
