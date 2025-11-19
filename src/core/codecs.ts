export interface Codec<T> {
  encode(value: T): string
  decode(raw: string | null): T | null
}

export const stringCodec: Codec<string> = {
  encode: v => v,
  decode: raw => (raw == null ? null : raw),
}

export const booleanCodec: Codec<boolean> = {
  encode: v => (v ? '1' : '0'),
  decode: raw =>
    raw === '1' ? true : raw === '0' ? false : null,
}

export const numberCodec: Codec<number> = {
  encode: v => String(v),
  decode: raw => (raw == null ? null : Number(raw)),
}

export const jsonCodec = <T>(): Codec<T> => ({
  encode: v => JSON.stringify(v),
  decode: raw =>
    raw == null ? null : (JSON.parse(raw) as T),
})
