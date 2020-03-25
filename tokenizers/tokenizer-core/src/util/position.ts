import { CodePoint } from '../constant/character'
import { DataNodeTokenPointDetail } from '../types/token'
import { isASCIIPunctuationCharacter, } from './character'


/**
 * calc string from codePoints
 * @param codePoints
 * @param start
 * @param end
 * @see https://github.github.com/gfm/#backslash-escapes
 */
export function calcStringFromCodePointsIgnoreEscapes(
  codePoints: DataNodeTokenPointDetail[],
  start: number,
  end: number,
): string {
  const points: DataNodeTokenPointDetail[] = []
  for (let i = start; i < end; ++i) {
    const c = codePoints[i]
    if (c.codePoint === CodePoint.BACK_SLASH) {
      const d = codePoints[i + 1]
      /**
       * Any ASCII punctuation character may be backslash-escaped
       * @see https://github.github.com/gfm/#example-308
       */
      if (d != null && isASCIIPunctuationCharacter(d.codePoint, true)) {
        ++i
        points.push(d)
        continue
      }
    }
    points.push(c)
  }
  const value: string = points
    .map(({ codePoint: c }) => String.fromCodePoint(c))
    .join('')
  return value
}
