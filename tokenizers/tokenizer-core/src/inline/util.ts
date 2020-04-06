import { DataNodeType } from '../_types/data-node'
import { comparePosition } from '../_util/position'
import { InlineDataNodeTokenPosition } from './types'


/**
 * 高优先级的边界被低优先级边界所包含时，需要将高优先级边界添加进低优先级的 children 中
 *
 * Merge two ordered (ordered by <start, end>) InlineDataNodeTokenPosition lists.
 * When an inclusion relation occurs (especially a case where low priority includes high priority),
 * add the internal InlineDataNodeTokenPosition to the external `InlineDataNodeTokenPosition.children`
 *
 * @param currentPositions
 * @param lowerPriorityPositions
 */
export function mergeLowerPriorityPositions<
  T extends DataNodeType,
  R extends InlineDataNodeTokenPosition<T>,
  >(currentPositions: R[], lowerPriorityPositions: R[]): R[] {
  const isIncluded: { [key: number]: boolean } = {}

  let i = 0, j = 0
  for (; i < lowerPriorityPositions.length; ++i) {
    const lp = lowerPriorityPositions[i]
    for (; j < currentPositions.length; ++j) {
      const cp = currentPositions[j]
      if (cp.left.start > lp.left.start) break
    }

    // no more intersections or inclusions between the remaining elements of the two lists
    if (j >= currentPositions.length) break

    // find all high-priority element of currentPositions which contained by lp
    for (let k = j; k < currentPositions.length; ++k) {
      const cp = currentPositions[k]
      if (cp.left.start >= lp.right.end) break
      if (cp.right.end < lp.right.end) {
        lp.children.push(cp)
        isIncluded[k] = true
      }
    }
  }

  // collect outer positions (not contained by other position)
  const result: R[] = []
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
 * merge two ordered (by <start, end>) InlineDataNodeTokenPosition list
 *  - sort by <start, end>
 *
 * @param firstPositions
 * @param secondPositions
 */
export function mergeTwoOrderedPositions<
  T extends DataNodeType,
  R extends InlineDataNodeTokenPosition<T>,
  >(firstPositions: R[], secondPositions: R[]): R[] {
  const result: R[] = []
  let i = 0, j = 0
  for (; i < firstPositions.length && j < secondPositions.length;) {
    const p1 = firstPositions[i]
    const p2 = secondPositions[j]
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

  for (; i < firstPositions.length; ++i) result.push(firstPositions[i])
  for (; j < secondPositions.length; ++j) result.push(secondPositions[j])
  return result
}


/**
 * 删除右侧相交的边，但需要注意的是，对于三条边 A < B < C 满足下列条件时，仅移除 B
 *    - A 和 B 左侧相交
 *    - B 和 C 左侧相交
 *    - A 和 C 不相交
 * @param orderedPositions
 */
export function removeIntersectPositions<
  T extends DataNodeType,
  R extends InlineDataNodeTokenPosition<T>,
  >(orderedPositions: R[]): R[] {
  if (orderedPositions.length <= 0) return []

  const result: R[] = []
  for (let i = 0, k; i < orderedPositions.length; ++i) {
    const y = orderedPositions[i]
    for (k = result.length - 1; k >= 0; --k) {
      const x = result[k]
      if (x.left.start < y.left.start) {
        if (x.right.end <= y.left.start) continue // 不相交
        if (x.right.end < y.right.end) break      // 右侧相交

        /**
         * x 包含 y
         * - 若 <x._unExcavatedContentPieces> 为 null/undefined，说明 x 中不允许包含内容
         * - 否则，遍历 <x._unExcavatedContentPieces>，若存在一个区间包含 y，则是合法的，
         *   且无需再比较 x 之前的边（因为 x 之前的边都不会和 x 相交，而 x 包含 y，故
         *   这些边也不会和 y 相交）
         */
        if (x._unExcavatedContentPieces != null) {
          for (const ucp of x._unExcavatedContentPieces) {
            if (ucp.start > y.left.start) break
            if (ucp.end >= y.left.end) {
              // 判断是否在黑名单中，若是，则杀死 x
              if (x._unAcceptableChildTypes != null && x._unAcceptableChildTypes.includes(y.type)) {
                result.splice(k, 1)
              }

              // 放入 y
              result.push(y)
              break
            }
          }
        }
        break
      }
      if (x.left.start === y.left.start) break    // 左侧相接
    }
    if (k < 0) {
      result.push(y)
    }
  }

  return result
}


/**
 * 假设给定的边界集合中不存在相交的情况（可以相互包含但不能相切/内接）；
 * 同时假设给定的边界集合已按照 <start, end> 的顺序排好序了
 *
 *  - 从左往右遍历边集，因为已按照 <start, end> 排序，所以其右侧不会右边包含它，
 *    故每条边 y 从其左侧往左寻找第一个包含它的边 x，且易知 x 必是最贴合 y 的包含边
 *  - 若存在这样的 x，则将 y 添加进 x 的 children；否则，将 y 添加进待返回的边集
 * @param orderedPositions
 */
export function foldContainedPositions<
  T extends DataNodeType,
  R extends InlineDataNodeTokenPosition<T>,
  >(orderedPositions: R[]): R[] {
  if (orderedPositions.length <= 0) return []

  const result: R[] = []
  for (let i = 0, k; i < orderedPositions.length; ++i) {
    const y = orderedPositions[i]
    for (k = i - 1; k >= 0; --k) {
      const x = orderedPositions[k]
      if (x.right.end >= y.right.end) {
        x.children = mergeTwoOrderedPositions(x.children, [y])
        break
      }
    }

    /**
     * 没有被其它的边界所包含
     */
    if (k < 0) {
      result.push(y)
    }
  }
  return result
}
