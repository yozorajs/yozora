import type { ICodePoint } from '../types'

/**
 * Check whether a character code point exists in the give code points
 */
export type CodePointSearcher = (codePoint: ICodePoint) => boolean

/**
 * Create a searcher to determine whether a character code point exists
 * in the given list of character code point.
 *
 * @param codePoints   code points
 */
export function createCodePointSearcher(
  codePoints: ReadonlyArray<ICodePoint>,
): [CodePointSearcher, ICodePoint[]] {
  const orderedCodePoints = [...new Set(codePoints)].sort((x, y) => x - y)
  const size = orderedCodePoints.length

  /**
   * Optimization: When the number of array elements is too small,
   *               sequential matching is more efficient
   */
  if (size < 8) {
    return [
      (codePoint: ICodePoint): boolean => {
        for (let i = 0; i < orderedCodePoints.length; ++i) {
          if (codePoint === orderedCodePoints[i]) return true
        }
        return false
      },
      [...orderedCodePoints],
    ]
  }

  /**
   * Optimization: When the number of array elements is too large,
   *               range binary search may be more efficient
   */
  const orderedRangeCodePoints: ICodePoint[] = []
  for (let i = 0, j; i < size; i += j) {
    const c = orderedCodePoints[i]
    for (j = 1; i + j < size; ++j) {
      if (orderedCodePoints[i + j] > c + j) break
    }
    orderedRangeCodePoints.push(c, c + j)
  }

  /**
   * But only when orderedRangeCodePoints.length * 1.5 < orderedCodePoints.length,
   * the range binary search could work better (1.5 is just a hypothesis).
   *
   * The code point ranges are something like [left_1, right_1, left_2, ...left_n, right_n],
   *  - The good ranges: [left_1, right_0), ..., [left_i, right_i), ..., [left_n, right_n]
   *  - The bad ranges: [-Infinity, left_1), ..., [right_i, left_{i+1}), ..., [right_n, Infinity]
   */
  if (orderedRangeCodePoints.length * 1.5 < size) {
    const rangeSize = orderedRangeCodePoints.length
    if (rangeSize < 8) {
      return [
        (codePoint: ICodePoint): boolean => {
          for (let i = 0; i < rangeSize; i += 2) {
            const lft = orderedRangeCodePoints[i]
            const rht = orderedRangeCodePoints[i + 1]
            if (lft <= codePoint && codePoint < rht) return true
          }
          return false
        },
        orderedCodePoints,
      ]
    }

    return [
      (codePoint: ICodePoint): boolean => {
        let lft = 0,
          rht = rangeSize
        while (lft < rht) {
          const mid = (lft + rht) >>> 1
          if (codePoint < orderedRangeCodePoints[mid]) rht = mid
          else lft = mid + 1
        }

        /**
         * If rht is an even number, c is in the bad range
         * Otherwise, it's a valid punctuation character
         */
        return Boolean(rht & 1)
      },
      orderedCodePoints,
    ]
  }

  /**
   * Binary Search
   */
  return [
    (codePoint: ICodePoint): boolean => {
      let lft = 0,
        rht = size
      while (lft < rht) {
        const mid = (lft + rht) >>> 1
        if (codePoint < orderedCodePoints[mid]) rht = mid
        else lft = mid + 1
      }
      if (rht <= 0) return false
      return orderedCodePoints[rht - 1] === codePoint
    },
    [...orderedCodePoints],
  ]
}

/**
 * Collect code points from CodePoint enum.
 *
 * @param _enum
 */
export function collectCodePointsFromEnum(_enum: Record<string, string | number>): number[] {
  return Object.values(_enum).filter((v): v is number => typeof v === 'number')
}
