import { booleanCodec, jsonCodec, numberCodec, stringCodec } from '../src/core/codecs'
import { createSyncTypedStorage } from '../src/core/syncTypedStorage'
import { defineStorageSchema, field, type SyncStorageAdapter } from '../src/core/types'

const appStorageSchema = defineStorageSchema({
  userToken: field(stringCodec),
  count: field(numberCodec),
  userData: field(jsonCodec<{ name: string, age: number }>()),
  testNestedObject: field(jsonCodec<{ a: number, b: { c: string, d: boolean } }>()),
  testArray: field(jsonCodec<{ id: number, value: string }[]>()),
  isAuthenticated: field(booleanCodec),
})

function localStorageAdapter(): SyncStorageAdapter {
  return {
    getItem: function (key: string): string | null {
      return localStorage.getItem(key)
    },
    setItem: function (key: string, value: string): void {
      localStorage.setItem(key, value)
    },
    deleteItem: function (key: string): void {
      localStorage.removeItem(key)
    },
    getAllKeys: function (): string[] {
      return Object.keys(localStorage)
    },
  }
}

const stor = createSyncTypedStorage({
  adapter: localStorageAdapter(),
  schema: appStorageSchema,
  namespace: 'app',
})

describe('test storage', () => {
  test('set and get item', () => {
    stor.set('userToken', 'my-secret-token')
    const token = stor.get('userToken')
    expect(token).toBe('my-secret-token')
  })
  test('remove item', () => {
    stor.set('userToken', 'another-token')
    stor.remove('userToken')
    const token = stor.get('userToken')
    expect(token).toBeNull()
  })
  test('set and get number item', () => {
    stor.set('count', 10)
    const count = stor.get('count')
    expect(count).toBe(10)
  })
  test('set and get json item', () => {
    const user = { name: 'Alice', age: 25 }
    stor.set('userData', user)
    const storedUser = stor.get('userData')
    expect(storedUser).toEqual(user)
  })
  test('set and get boolean item', () => {
    stor.set('isAuthenticated', true)
    const isAuth = stor.get('isAuthenticated')
    expect(isAuth).toBe(true)
  })
  test('clear all items', () => {
    stor.set('userToken', 'token-to-clear')
    stor.set('count', 5)
    stor.clearAll()
    const token = stor.get('userToken')
    const count = stor.get('count')
    expect(token).toBeNull()
    expect(count).toBeNull()
  })
  test('set and get nested json item', () => {
    const nestedObject = { a: 1, b: { c: 'test', d: true } }
    stor.set('testNestedObject', nestedObject)
    const storedObject = stor.get('testNestedObject')
    expect(storedObject).toEqual(nestedObject)
  })
  test('set and get array json item', () => {
    const arrayData = [
      { id: 1, value: 'first' },
      { id: 2, value: 'second' },
    ]
    stor.set('testArray', arrayData)
    const storedArray = stor.get('testArray')
    expect(storedArray).toEqual(arrayData)
  })
})
