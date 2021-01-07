/**
 * Make value mutable
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}
