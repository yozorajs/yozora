import { CodePoint, BlockDataNodeType, InlineDataNodeType } from '@yozora/core'
import { DataNodeTokenPosition, DataNodeTokenPointDetail } from '../types/position'


/**
 * calc array of DataNodeTokenPointDetail from string
 */
export function calcDataNodeTokenPointDetail(content: string): DataNodeTokenPointDetail[] {
  const codePoints: DataNodeTokenPointDetail[] = []
  let offset = 0, column = 1, line = 1
  for (const c of content) {
    const codePoint: number = c.codePointAt(0)!
    codePoints.push({
      codePoint,
      offset,
      column,
      line,
    })

    ++offset, ++column
    if (codePoint === CodePoint.LINE_FEED) {
      column = 1
      ++line
    }
  }
  return codePoints
}


/**
 * remove right intersects flanking
 * @param result
 * @param isIncludeOk
 */
export function removeIntersectFlanking<
  T extends InlineDataNodeType | BlockDataNodeType,
  R extends DataNodeTokenPosition<T>,
  >(result: R[], isIncludeOk: boolean): R[] {
  if (result.length <= 0) return []
  const resolvedResult: R[] = []
  for (let i = 0; i < result.length; ++i) {
    const y = result[i]
    let intersected = false
    for (let k = resolvedResult.length - 1; k >= 0; --k) {
      const x = resolvedResult[k]
      if (x.left.start < y.left.start) {
        if (x.right.end <= y.left.start) continue
        if (x.right.end < y.right.end || !isIncludeOk) {
          intersected = true
          break
        }
        continue
      }
      if (x.left.start === y.left.start) {
        if (x.type === y.type) {
          intersected = true
          break
        }
        continue
      }
    }
    if (intersected) continue
    resolvedResult.push(y)
  }

  return resolvedResult
}


/**
 * merge two DataNodeTokenPosition list (ordered by <start, end>)
 *  - sort by <start, end>
 *  - remove right intersects flanking
 *
 * @param firstPositions
 * @param secondPositions
 */
export function mergePositions<
  T extends InlineDataNodeType | BlockDataNodeType,
  R extends DataNodeTokenPosition<T>,
  >(firstPositions: R[], secondPositions: R[]): R[] {
  const position: R[] = []
  let i = 0, j = 0
  const compare = (x: R, y: R): number => {
    if (x.left.start === y.left.start) return x.right.end - y.right.end
    return x.left.start - y.left.start
  }
  for (; i < firstPositions.length && j < secondPositions.length;) {
    const first = firstPositions[i]
    const second = secondPositions[j]
    const result = compare(first, second)

    if (result < 0) {
      position.push(first)
      ++i
    } else if (result === 0) {
      position.push(first)
      ++i, ++j
    } else {
      position.push(second)
      ++j
    }
  }

  for (; i < firstPositions.length; ++i) position.push(firstPositions[i])
  for (; j < secondPositions.length; ++j) position.push(secondPositions[j])
  return position
}
