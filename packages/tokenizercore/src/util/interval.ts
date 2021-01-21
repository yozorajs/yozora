import type { YastNodeInterval } from '../types/node'


/**
 * Compare two intervals.
 *
 * When startIndex is different, the element with the smaller startIndex value
 * is arranged on the left, otherwise the one with a greater endIndex value is
 * arranged on the left.
 */
export function compareInterval<T extends YastNodeInterval = YastNodeInterval>(
  x: Readonly<T>,
  y: Readonly<T>,
): number {
  if (x.startIndex === y.startIndex) return y.endIndex - x.endIndex
  return x.startIndex - y.startIndex
}


/**
 * If the interval x and y intersect, and x is to the left of y,
 * then accept x and kill y
 *
 * @param orderedIntervals   Immutable ordered array of IntervalNode
 */
export function removeIntersectIntervals<T extends YastNodeInterval = YastNodeInterval>(
  orderedIntervals: ReadonlyArray<T>,
): T[] {
  /**
   * Optimization: When there is at most one element, there must be no
   *               intersection, so no operation needed.
   */
  if (orderedIntervals.length <= 1) return orderedIntervals.slice()

  /**
   * Sorting is to ensure that for each interval, the interval containing it is
   * ranked on the left side of it. Therefore, when judging whether the
   * interval y intersects with the interval to the left (excluding the
   * inclusion), only need to judge whether there is an interval on the left
   * of it and the `endIndex` falls within the current interval.
   */

  const result: T[] = []
  for (const y of orderedIntervals) {
    let flag = true
    for (const x of result) {
      if (x.endIndex > y.startIndex && x.endIndex < y.endIndex) {
        flag = false
        break
      }
    }
    if (flag) {
      result.push(y)
    }
  }
  return result
}
