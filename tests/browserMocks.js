var localStorageMock = (function () {
  const store = new Map()

  return {
    getItem: function (key) {
      return store.has(key) ? store.get(key) : null
    },
    setItem: function (key, value) {
      store.set(key, value.toString())
    },
    clear: function () {
      store.clear()
    },
    removeItem: function (key) {
      store.delete(key)
    },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
})
