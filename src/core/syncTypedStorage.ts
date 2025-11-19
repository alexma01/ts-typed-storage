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

  // map: physicalKey -> (userCallback -> internalCallback)
  type UserListener = (value: ValueOfSchema<S, Keys> | null) => void
  const listenerMap = new Map<
    string,
    Map<UserListener, (raw: string | null) => void>
  >()

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
  ): void {
    if (!adapter.addListener) return

    const field = schema[key]
    if (!field) {
      throw new Error(`Unknown storage key: ${String(key)}`)
    }

    const physicalKey = makeKey(String(key))

    // internal callback that decodes the raw value and calls the user callback
    const internal = (raw: string | null) => {
      const decoded = field.codec.decode(raw) as ValueOfSchema<S, K> | null
      cb(decoded)
    }

    let keyMap = listenerMap.get(physicalKey)
    if (!keyMap) {
      keyMap = new Map()
      listenerMap.set(physicalKey, keyMap)
    }

    keyMap.set(cb, internal)
    adapter.addListener(physicalKey, internal)
  }

  function removeListener<K extends Keys>(
    key: K,
    cb: (value: ValueOfSchema<S, K> | null) => void,
  ): void {
    if (!adapter.removeListener) return

    const physicalKey = makeKey(String(key))
    const keyMap = listenerMap.get(physicalKey)
    if (!keyMap) return

    const internal = keyMap.get(cb)
    if (!internal) return

    keyMap.delete(cb)
    if (!keyMap.size) {
      listenerMap.delete(physicalKey)
    }

    adapter.removeListener(physicalKey, internal)
  }

  return {
    get,
    set,
    remove,
    keys,
    clearAll,
    addListener,
    removeListener,
  }
}

export { createSyncTypedStorage }
