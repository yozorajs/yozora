import type { IEscaper } from './types'

/**
 * Create character escaper.
 * @param characters
 * @returns
 */
export function createCharacterEscaper(characters: string[]): IEscaper {
  if (characters.length <= 0) return text => text

  // eslint-disable-next-line no-useless-escape
  const chars: string = characters.map(c => c.replace(/([\]\^\-\\])/g, '\\$1')).join('')
  const regex = new RegExp(`([\\\\]*)([${chars}])`, 'g')
  return text => text.replace(regex, (_m, p1, p2) => (p1.length & 1 ? p1 + p2 : p1 + '\\' + p2))
}

/**
 *
 * @param v
 * @param min
 * @param max
 * @returns
 */
export const minmax = (v: number, min: number, max: number): number => {
  let result: number = v
  if (result < min) result = min
  if (result > max) result = max
  return result
}
