/**
 * Make value mutable
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

/**
 * Result of required content eater.
 */
export type ResultOfRequiredEater = {
  valid: boolean
  nextIndex: number
}

/**
 * Result of optional content eater.
 */
export type ResultOfOptionalEater = number
