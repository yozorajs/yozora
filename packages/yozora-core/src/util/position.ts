import { CharCode } from '../constant/character'
import {
  DataNodeTokenPoint,
  DataNodeTokenPosition,
  DataNodeTokenFlankingGraph,
} from '../types/data-node/position'
import { InlineDataNodeType } from '../types/data-node/inline/_base'
import { BlockDataNodeType } from '../types/data-node/block/_base'


/**
 * Move forward one character and update the position of the point
 * @param content
 * @param point
 */
export function moveForward(content: string, point: DataNodeTokenPoint): void {
  // beyond the right border, return directly
  if (point.offset >= content.length) return

  // move one character forward
  ++point.offset
  ++point.column

  // If the previous position is a newline,
  // reset the column number and add one to the line number
  if (point.offset > 1 && content.charCodeAt(point.offset - 1) === CharCode.LINE_FEED) {
    point.column = 1
    ++point.line
  }
}

/**
 * Move backward one character and update the position of the point
 * @param content
 * @param point
 */
export function moveBackward(content: string, point: DataNodeTokenPoint): void {
  // beyond the left border, return directly
  if (point.offset <= 0) return

  // move one character backward
  --point.offset
  --point.column

  // If the current position is a newline (column <= 0),
  // recalculate the column number and decrement the line number by one
  if (point.column <= 0) {
    --point.line
    for (let offset = point.offset - 1; ; --offset) {
      if (content.charCodeAt(offset) === CharCode.LINE_FEED) {
        point.column = point.offset - offset
        break
      }
      if (offset <= 0) {
        point.column = point.offset
        break
      }
    }
  }
}


/**
 * 将所有 DataNodeTokenPosition 中的 DataNodeTokenPoint 放入在一个列表中，并执行排序、去重操作
 * Put all the points in DataNodeTokenPosition in a list,
 * and perform sorting and deduplication operations
 * @param flankingList
 */
export function calcUniquePoints(
  ...flankingList: Readonly<DataNodeTokenPosition>[][]
): DataNodeTokenPoint[] {
  const points: DataNodeTokenPoint[] = []
  for (const flanking of flankingList) {
    for (const position of flanking) {
      points.push(position.start, position.end)
    }
  }
  const result = points.sort((x, y) => x.offset - y.offset)
    .filter((p, i, self) => i === 0 || p.offset !== self[i - 1].offset)
  return result
}


/**
 * 计算 DataNodeTokenPoint 的 offset 和列表中的下标的映射关系
 * Calculate the mapping between the offset of DataNodeTokenPoint
 * and the index in the points list
 * @param points
 */
export function calcPointOffsetMap(points: Readonly<DataNodeTokenPoint>[]): { [key: number]: number } {
  const result: { [key: number]: number } = {}
  for (let i = 0; i < points.length; ++i) {
    const point = points[i]
    result[point.offset] = i
  }
  return result
}


/**
 * @param type
 * @param flanking
 */
export function buildGraphFromSingleFlanking<T extends InlineDataNodeType | BlockDataNodeType>(
  type: T,
  flanking: Readonly<DataNodeTokenPosition>[],
): DataNodeTokenFlankingGraph<T> {
  const points: DataNodeTokenPoint[] = calcUniquePoints(flanking)
  const edges: [number, number[]][] = []
  const idxMap: { [key: number]: number } = calcPointOffsetMap(points)

  for (const position of flanking) {
    const leftIdx = idxMap[position.start.offset]
    const rightIdx = idxMap[position.end.offset]
    const edge: [number, number[]] = [leftIdx, [rightIdx]]
    edges.push(edge)
  }
  return { type, points, edges }
}


/**
 * @param type
 * @param leftFlanking
 * @param rightFlanking
 * @param isMatched
 */
export function buildGraphFromTwoFlanking<T extends InlineDataNodeType | BlockDataNodeType>(
  type: T,
  leftFlanking: Readonly<DataNodeTokenPosition>[],
  rightFlanking: Readonly<DataNodeTokenPosition>[],
  isMatched?: (
    left: DataNodeTokenPosition,
    right: DataNodeTokenPosition,
    matchedCountPrevious: number,
  ) => boolean,
): DataNodeTokenFlankingGraph<T> {
  const points: DataNodeTokenPoint[] = calcUniquePoints(leftFlanking, rightFlanking)
  const edges: [number, number[]][] = []
  const idxMap: { [key: number]: number } = calcPointOffsetMap(points)

  for (const left of leftFlanking) {
    const rightIdxList: number[] = []
    for (const right of rightFlanking) {
      // The left flanking should appear before the right flanking
      if (left.end.offset > right.start.offset) continue
      if (isMatched == null || isMatched(left, right, rightIdxList.length)) {
        rightIdxList.push(idxMap[right.end.offset])
      }
    }
    if (rightIdxList.length > 0) {
      const leftIdx = idxMap[left.start.offset]
      const edge: [number, number[]] = [leftIdx, rightIdxList]
      edges.push(edge)
    }
  }
  return { type, points, edges }
}


/**
 *
 * @param type
 * @param leftFlanking
 * @param middleFlanking
 * @param rightFlanking
 */
export function buildGraphFromThreeFlanking<T extends InlineDataNodeType | BlockDataNodeType>(
  type: T,
  leftFlanking: Readonly<DataNodeTokenPosition>[],
  middleFlanking: Readonly<DataNodeTokenPosition>[],
  rightFlanking: Readonly<DataNodeTokenPosition>[],
  isMatched?: (
    left: DataNodeTokenPosition,
    middle: DataNodeTokenPosition,
    right: DataNodeTokenPosition,
    matchedCountPrevious: number,
  ) => boolean,
): DataNodeTokenFlankingGraph<T> {
  const points: DataNodeTokenPoint[] = calcUniquePoints(leftFlanking, middleFlanking, rightFlanking)
  const edges: [number, number[]][] = []
  const idxMap: { [key: number]: number } = calcPointOffsetMap(points)

  for (const left of leftFlanking) {
    const rightIdxList: number[] = []
    for (const middle of middleFlanking) {
      // The left flanking should appear before the middle flanking
      if (left.end.offset > middle.start.offset) continue
      for (const right of rightFlanking) {
        // The middle flanking should appear before the right flanking
        if (middle.end.offset > right.start.offset) continue
        if (isMatched == null || isMatched(left, middle, right, rightIdxList.length)) {
          rightIdxList.push(idxMap[right.end.offset])
        }
      }
    }
    if (rightIdxList.length > 0) {
      const leftIdx = idxMap[left.start.offset]
      const edge: [number, number[]] = [leftIdx, rightIdxList]
      edges.push(edge)
    }
  }
  return { type, points, edges }
}


/**
 * 去掉 DataNodeTokenFlankingGraph 中没有在边中出现的点，并更新边中的信息；
 * 但实际上这对于调解器的复杂度毫无贡献，因为图中的边数并没有改变；
 * 此工具函数应仅在需要做去冗余化的输出展示时使用
 *
 * Remove unused points in the DataNodeTokenFlankingGraph from edges
 * and update the information in the edges;
 * but in fact this does not contribute to reducing the complexity of the mediator,
 * because the number of edges in the graph has not changed;
 * this tool function should only be used when needed Use for de-redundant output display
 * @param g
 */
export function makeFlankingGraphPrettier<T extends InlineDataNodeType | BlockDataNodeType>(
  g: DataNodeTokenFlankingGraph<T>
): DataNodeTokenFlankingGraph<T> {
  const validPointIdxMap: { [key: number]: number } = {}
  const validPointIdx: number[] = []
  for (const edge of g.edges) {
    if (validPointIdxMap[edge[0]] === undefined) {
      validPointIdxMap[edge[0]] = 1
      validPointIdx.push(edge[0])
    }
    for (const idx of edge[1]) {
      if (validPointIdxMap[idx] === undefined) {
        validPointIdxMap[idx] = 1
        validPointIdx.push(idx)
      }
    }

    // If every point has already appeared, it means that this is already the most compact graph
    if (validPointIdx.length === g.points.length) return g
  }

  // If every point has already appeared, it means that this is already the most compact graph
  if (validPointIdx.length === g.points.length) return g

  validPointIdx.sort((x, y) => x - y)
  validPointIdx.forEach((v, i) => validPointIdxMap[v] = i)
  const points: DataNodeTokenPoint[] = validPointIdx.map(idx => g.points[idx])
  const edges: [number, number[]][] = g.edges.map(e => ([
    validPointIdxMap[e[0]],
    e[1].map(x => validPointIdxMap[x])
  ]))
  return { type: g.type, points, edges }
}
