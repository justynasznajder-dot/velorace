/**
 * `JSON.stringify` / `NextResponse.json` rzucają na wartościach `bigint`
 * (czasem zwracanych z sterowników PostgreSQL).
 */
export function jsonSafeClone<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => {
      if (typeof v === 'bigint') {
        const n = Number(v)
        return Number.isSafeInteger(n) ? n : v.toString()
      }
      return v
    }),
  ) as T
}
