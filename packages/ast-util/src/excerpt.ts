import type { Root, YastLiteral } from '@yozora/ast'
import { shallowMutateAstInPreorder } from './ast/replace-pre-order'

/**
 * Calc excerpt ast from the original ast.
 */
export function calcExcerptAst(
  immutableRoot: Readonly<Root>,
  pruneLength: number,
): Readonly<Root> {
  if (immutableRoot.children.length <= 0) return immutableRoot

  // Try to truncate excerpt.
  let totalExcerptLengthSoFar = 0
  const excerptAst = shallowMutateAstInPreorder(immutableRoot, null, node => {
    if (totalExcerptLengthSoFar >= pruneLength) return null

    const { value } = node as YastLiteral
    if (value == null) return node

    totalExcerptLengthSoFar += value.length
    if (totalExcerptLengthSoFar <= pruneLength) return node
    return {
      ...node,
      value: value.slice(totalExcerptLengthSoFar - pruneLength),
    }
  })
  return excerptAst
}
