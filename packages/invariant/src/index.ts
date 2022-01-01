const isProduction: boolean = process.env.NODE_ENV === 'production'
const prefix = 'Invariant failed'

/**
 * Assert the condition is true
 *
 * @param condition
 * @param message
 * @returns
 */
export function invariant(
  condition: boolean,
  message?: string | (() => string),
): asserts condition {
  if (condition) return

  // Strip out errors messages in production environment.
  if (isProduction) throw new Error(prefix)

  // Throw an error when the condition fails.
  if (message == null) throw new Error(prefix + ': ')

  throw new Error(prefix + ': ' + (message instanceof Function ? message() : message))
}

export default invariant
