import type { IEscaper } from './types'

export const lineRegex = /\r\n|\n|\r/g

/**
 * Create character escaper.
 * @param characters
 * @returns
 */
export function createCharacterEscaper(characters: string[]): IEscaper {
  if (characters.length <= 0) return text => text

  const charsRegexSource: string = characters.map(c => c.replace(/([\]\\-^$])/g, '\\$1')).join('')
  const regex = new RegExp(`([\\\\]*)([${charsRegexSource}])`, 'g')
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

export const findMaxContinuousSymbol = (value: string, symbolRegex: RegExp): number => {
  let symbolCnt = 0
  for (let match: RegExpExecArray | null = null; ; ) {
    match = symbolRegex.exec(value)
    if (match == null) break

    const len: number = match[1].length ?? 0
    if (symbolCnt < len) symbolCnt = len
  }
  return symbolCnt
}
