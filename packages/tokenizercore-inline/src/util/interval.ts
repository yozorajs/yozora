import type { YastNodeInterval } from '@yozora/tokenizercore'


/**
 * Interval node.
 */
export interface IntervalNode<T extends IntervalNode<T> = never> extends YastNodeInterval {
  /**
   * Parent interval
   */
  parent: T | null
  /**
   * Inner intervals
   */
  children: T[]
}


/**
 * Assemble the list of interval into trees.
 * These trees satisfies that:
 *  - For any node x on the tree, the interval corresponding to its parent node
 *    contains the interval corresponding to x.
 *  - Sibling nodes neither intersect nor contain each other
 *  - Sibling nodes are ordered according to <firstIndex, secondIndex>
 *
 * @param orderedIntervals  Immutable ordered IntervalNode list. There are no
 *                          intersecting edges in intervals (but inter-inclusive
 *                          is allowed). Both the order and value of elements in
 *                          the list may be modified. (required & mutable)
 *
 *                          Sorted is to ensure that for each interval, the
 *                          interval containing it is ranked on the left side of it.
 *
 * @param onStackPopup      Hook which called when the monotonic stack pops up
 *                          an element, and the element will be passed to the
 *                          hook as a parameter. (optional & immutable)
 *
 * @param shouldAcceptChild Whether to accept the given interval node, if not
 *                          specified, always accepted. (optional & immutable)
 */
export function assembleToIntervalTrees<T extends IntervalNode<T> = IntervalNode>(
  orderedIntervals: ReadonlyArray<T>,
  onStackPopup?: (o: T) => void,
  shouldAcceptChild?: (parent: T, child: T) => boolean,
): T[] {
  /**
   * Optimization: When there is at most one element, there must be no
   *               internal-inclusion, so no further operation needed.
   */
  if (orderedIntervals.length <= 1) {
    if (orderedIntervals.length === 1 && onStackPopup != null) {
      const o = orderedIntervals[0]
      onStackPopup(o)
    }
    return orderedIntervals.slice()
  }

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
   * When the algorithm is finished, the bottom elements of the stack that have
   * appeared in the entire execution lifecycle together form the top-level node
   * in the tree IntervalTree, and the interval nodes they contain have been
   * saved as their child nodes. What's even better is that these child nodes
   * neither intersect nor contain each other, and they are naturally ordered
   * according to <firstIndex, endIndex>.
   */
  let tot = 0
  const monotonicStack: T[] = new Array(orderedIntervals.length)
  const topLevelNodes: T[] = []
  for (const x of orderedIntervals) {
    // Step 2
    for (; tot > 0; --tot) {
      const topX = monotonicStack[tot - 1]
      if (topX.endIndex >= x.endIndex) break
      if (onStackPopup != null) {
        onStackPopup(topX)
      }
    }

    // Step 3
    if (tot > 0) {
      const topX: T = monotonicStack[tot - 1]
      if (shouldAcceptChild == null || shouldAcceptChild(topX, x)) {
        topX.children.push(x)
        x.parent = topX
      }
    }

    // Step 4
    // eslint-disable-next-line no-plusplus
    monotonicStack[tot++] = x
    if (tot === 1) {
      topLevelNodes.push(x)
    }
  }

  // trigger the onStackPopup on remain elements
  if (onStackPopup != null) {
    for (let i = tot - 1; i >= 0; --i) {
      const o = monotonicStack[i]
      onStackPopup(o)
    }
  }

  return topLevelNodes
}
