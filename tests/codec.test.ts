import { stringCodec, booleanCodec, numberCodec, jsonCodec } from '../src/core/codecs'

describe('codecs test', () => {
  test('string codec', () => {
    const val = 'hello'
    const valEncode = stringCodec.encode(val)
    expect(val).toBe(valEncode)

    const valDecode = stringCodec.decode(valEncode)
    expect(valDecode).toBe(val)
  })
  test('number codec', () => {
    const val = 42
    const valEncode = numberCodec.encode(val)
    expect(valEncode).toBe('42')

    const valDecode = numberCodec.decode(valEncode)
    expect(valDecode).toBe(val)
  })
  test('boolean codec', () => {
    const valTrue = true
    const valFalse = false

    const valTrueEncode = booleanCodec.encode(valTrue)
    expect(valTrueEncode).toBe('1')
    const valFalseEncode = booleanCodec.encode(valFalse)
    expect(valFalseEncode).toBe('0')

    const valTrueDecode = booleanCodec.decode(valTrueEncode)
    expect(valTrueDecode).toBe(valTrue)
    const valFalseDecode = booleanCodec.decode(valFalseEncode)
    expect(valFalseDecode).toBe(valFalse)
  })
  test('json codec', () => {
    const val = { name: 'Alice', age: 30 }
    const codec = jsonCodec<typeof val>()

    const valEncode = codec.encode(val)
    expect(valEncode).toBe(JSON.stringify(val))

    const valDecode = codec.decode(valEncode)
    expect(valDecode).toEqual(val)
  })
  test('array object json codec', () => {
    const val = [{ name: 'Bob' }, { name: 'Carol' }]
    const codec = jsonCodec<typeof val>()

    const valEncode = codec.encode(val)
    expect(valEncode).toBe(JSON.stringify(val))

    const valDecode = codec.decode(valEncode)
    expect(valDecode).toEqual(val)
  })
})
