import type { INodePoint } from '@yozora/character'
import { isLineEnding, isSpaceCharacter } from '@yozora/character'
import type { IPhrasingContentLine } from '@yozora/core-tokenizer'
import { calcIndentWidth } from '@yozora/core-tokenizer'

/**
 * Create a generator to produce PhrasingContentLines while consuming NodePoints.
 *
 * @param nodePointsList
 * @returns
 */
export function* createPhrasingLineGenerator(
  nodePointsList: Iterable<INodePoint[]>,
): Iterable<IPhrasingContentLine[]> & Iterator<IPhrasingContentLine[], INodePoint[]> {
  let allNodePoints: INodePoint[] | null = null
  let nodePointIndex = 0
  let startIndex = 0
  let firstNonWhitespaceIndex = 0
  let countOfPrecedeSpaces = 0

  for (const nodePoints of nodePointsList) {
    /**
     * Reuse the first scanner buffer instead of retaining a duplicate array of
     * references for the common single-string input. The scanner does not
     * mutate yielded buffers, so this generator becomes their single writer.
     */
    const shouldAppend = allNodePoints != null
    allNodePoints ??= nodePoints

    const lines: IPhrasingContentLine[] = []
    for (const p of nodePoints) {
      const c = p.codePoint

      // Check if it is still a space in the beginning of a line.
      if (firstNonWhitespaceIndex === nodePointIndex) {
        if (isSpaceCharacter(c)) {
          countOfPrecedeSpaces += 1
          firstNonWhitespaceIndex += 1
        }
      }

      if (shouldAppend) allNodePoints.push(p)
      nodePointIndex += 1
      if (isLineEnding(c)) {
        // Check if it is a blank line.
        if (firstNonWhitespaceIndex + 1 === nodePointIndex) {
          firstNonWhitespaceIndex += 1
        }

        const line: IPhrasingContentLine = {
          nodePoints: allNodePoints,
          startIndex,
          endIndex: nodePointIndex,
          firstNonWhitespaceIndex,
          indentWidth: calcIndentWidth(allNodePoints, startIndex, firstNonWhitespaceIndex),
          countOfPrecedeSpaces,
        }
        lines.push(line)
        startIndex = nodePointIndex
        firstNonWhitespaceIndex = nodePointIndex
        countOfPrecedeSpaces = 0
      }
    }
    yield lines
  }

  // After the iterable dried, there is still has some nodePoints.
  if (allNodePoints != null && startIndex < nodePointIndex) {
    const line: IPhrasingContentLine = {
      nodePoints: allNodePoints,
      startIndex,
      endIndex: nodePointIndex,
      firstNonWhitespaceIndex,
      indentWidth: calcIndentWidth(allNodePoints, startIndex, firstNonWhitespaceIndex),
      countOfPrecedeSpaces,
    }
    yield [line]
  }
  return allNodePoints ?? []
}
