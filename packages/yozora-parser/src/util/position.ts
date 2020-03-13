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
 * compare two DataTokenPosition (by <start, end>)
 * @param p1
 * @param p2
 */
export function comparePosition (p1: DataNodeTokenPosition, p2: DataNodeTokenPosition): number {
  if (p1.left.start === p2.left.start) return p1.right.end - p2.right.end
  return p1.left.start - p2.left.start
}


/**
 * Merge two ordered (ordered by <start, end>) DataNodeTokenPosition lists.
 * When an include relationship occurs (especially a case where low priority includes high priority),
 * add the internal DataNodeTokenPosition to the external `DataNodeTokenPosition.children`
 *
 * @param currentPositions
 * @param lowerPriorityPositions
 */
export function mergeLowerPriorityPositions<
  T extends InlineDataNodeType | BlockDataNodeType,
  R extends DataNodeTokenPosition<T>,
  >(currentPositions: R[], lowerPriorityPositions: R[]): R[] {
  const result: R[] = []
  const isIncluded: { [key: number]: boolean } = {}

  let i = 0, j = 0
  for (; i < lowerPriorityPositions.length; ++i) {
    const hp = lowerPriorityPositions[i]
    for (; j < currentPositions.length; ++j) {
      const cp = currentPositions[j]
      if (cp.left.start > hp.left.start) break
    }
    if (j >= currentPositions.length) break
    for (let k = j; k < currentPositions.length; ++k) {
      const cp = currentPositions[k]
      if (cp.left.start >= hp.right.end) break
      if (cp.right.end < hp.right.end) {
        hp.children.push(cp)
        isIncluded[k] = true
      }
    }
  }

  for (i = 0, j = 0; i < lowerPriorityPositions.length && j < currentPositions.length;) {
    if (isIncluded[j]) {
      ++j
      continue
    }

    const p1 = lowerPriorityPositions[i]
    const p2 = currentPositions[j]
    const delta = comparePosition(p1, p2)
    if (delta < 0) {
      result.push(p1)
      ++i
    } else if (delta === 0) {
      result.push(p1)
      ++i, ++j
    } else {
      result.push(p2)
      ++j
    }
  }

  for (; i < lowerPriorityPositions.length; ++i) {
    result.push(lowerPriorityPositions[i])
  }
  for (; j < currentPositions.length; ++j) {
    if (isIncluded[j]) continue
    result.push(currentPositions[j])
  }
  return result
}


/**
 * merge two ordered (by <start, end>) DataNodeTokenPosition list
 *  - sort by <start, end>
 *
 * @param firstPositions
 * @param secondPositions
 */
export function mergeTwoOrderedPositions<
  T extends InlineDataNodeType | BlockDataNodeType,
  R extends DataNodeTokenPosition<T>,
  >(firstPositions: R[], secondPositions: R[]): R[] {
  const position: R[] = []
  let i = 0, j = 0
  for (; i < firstPositions.length && j < secondPositions.length;) {
    const p1 = firstPositions[i]
    const p2 = secondPositions[j]
    const result = comparePosition(p1, p2)

    if (result < 0) {
      position.push(p1)
      ++i
    } else if (result === 0) {
      position.push(p1)
      ++i, ++j
    } else {
      position.push(p2)
      ++j
    }
  }

  for (; i < firstPositions.length; ++i) position.push(firstPositions[i])
  for (; j < secondPositions.length; ++j) position.push(secondPositions[j])
  return position
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
