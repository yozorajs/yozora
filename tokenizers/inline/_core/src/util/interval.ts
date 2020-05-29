/**
 *
 */
export interface IntervalNode<T = any> {
  /**
   *
   */
  value: T
  /**
   *
   */
  startIndex: number
  /**
   *
   */
  endIndex: number
  /**
   * Inner intervals
   */
  children: IntervalNode<T>[]
}


/**
 * Assemble the list of interval into trees.
 * These trees satisfies that:
 *  - For any node x on the tree, the interval corresponding to its parent node
 *    contains the interval corresponding to x.
 *  - Sibling nodes neither intersect nor contain each other
 *  - Sibling nodes are ordered according to <firstIndex, secondIndex>
 *
 * @param intervals         IntervalNode list. There are no intersecting edges
 *                          in intervals (but inter-inclusive is allowed). Both
 *                          the order and value of elements in the list may be
 *                          modified. (required & mutable)
 *
 * @param onStackPopup      Hook which called when the monotonic stack pops up
 *                          an element, and the element will be passed to the
 *                          hook as a parameter. (optional & immutable)
 *
 * @param shouldAcceptEdge  Whether to accept the given edges, if not specified,
 *                          always accepted. (optional & immutable)
 */
export function assembleToIntervalTrees(
  intervals: IntervalNode[],
  onStackPopup?: (o: IntervalNode) => void,
  shouldAcceptEdge?: (parent: IntervalNode, child: IntervalNode) => boolean,
): IntervalNode[] {
  /**
   * Optimization: When there is at most one element, there must be no
   *               inter-inclusion, so no further operation needed.
   */
  if (intervals.length <= 1) {
    if (intervals.length === 1) {
      if (onStackPopup != null) {
        const o = intervals[0]
        onStackPopup(o)
      }
    }
    return intervals.slice()
  }

  /**
   * Sort intervals: When startIndex is different, the element with the smaller
   *                 startIndex value is arranged on the left, otherwise the
   *                 one with a greater endIndex value is arranged on the left.
   *
   * This sorting is to ensure that for each interval, the interval containing
   * it is ranked on the left side of it.
   */
  intervals.sort((x, y) => {
    if (x.startIndex === y.startIndex) {
      return y.endIndex - x.endIndex
    }
    return x.startIndex - y.startIndex
  })

  /**
   * Use the monotonic stack to maintain the interval inclusion relationship,
   * the elements in the monotonic stack satisfy:
   *  - Each element is contained by its previous element
   *
   * Therefore, the algorithm is described as follows:
   *  1. Traverse the ordered intervals from left to right, let's call the
   *     current element x
   *  2. Determine whether x is contained by the top element of the stack,
   *     if not, pop the top element of the stack, and re-execute step 2 until
   *     the top element contains x or the stack is empty
   *  3. If the stack is not empty, that is, x is contained by the top element
   *     of the stack, append x as a child node to the top element of the stack
   *  4. Push x onto the stack
   *
   * When the algorithm is finished, the remaining elements in the stack are
   * peers nodes of the IntervalTree, and the interval nodes they contain
   * have been saved as their child nodes. What's even better is that these
   * child nodes neither intersect nor contain each other, and they are
   * naturally ordered according to <firstIndex, endIndex>.
   */
  let tot = 0
  const monotonicStack: IntervalNode[] = new Array(intervals.length)
  for (const x of intervals) {
    // Step 2
    for (; tot > 0; --tot) {
      const topX = monotonicStack[tot - 1]
      if (topX.endIndex <= x.endIndex) break
      if (onStackPopup != null) {
        onStackPopup(topX)
      }
    }

    // Step 3
    if (tot > 0) {
      const topX = monotonicStack[tot - 1]
      if (!shouldAcceptEdge || shouldAcceptEdge(topX, x)) {
        topX.children.push(x)
      }
    }

    // Step 4
    monotonicStack[tot++] = x
  }

  if (onStackPopup != null) {
    for (let i = tot - 1; i >= 0; --i) {
      const o = monotonicStack[i]
      onStackPopup(o)
    }
  }

  // return remaining elements
  return monotonicStack.slice(0, tot)
}


/**
 * If the interval x and y intersect, and x is to the left of y,
 * then accept x and kill y
 *
 * @param intervals
 */
export function removeIntersectIntervals(
  intervals: IntervalNode[],
): IntervalNode[] {
  /**
   * Optimization: When there is at most one element, there must be no
   *               intersection, so no operation needed.
   */
  if (intervals.length <= 1) return intervals

  /**
   * Sort intervals: When startIndex is different, the element with the smaller
   *                 startIndex value is arranged on the left, otherwise the
   *                 one with a greater endIndex value is arranged on the left.
   *
   * This sorting is to ensure that for each interval, the interval containing
   * it is ranked on the left side of it. Therefore, when judging whether the
   * interval y intersects with the interval to the left (excluding the
   * inclusion), only need to judge whether there is an interval on the left
   * of it and the `endIndex` falls within the current interval.
   *
   */
  intervals.sort((x, y) => {
    if (x.startIndex === y.startIndex) {
      return y.endIndex - x.endIndex
    }
    return x.startIndex - y.startIndex
  })

  const result: IntervalNode[] = []
  for (const y of intervals) {
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
