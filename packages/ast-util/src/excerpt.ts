import type { Root, YastLiteral } from '@yozora/ast'
import { shallowMutateAstInPreorder } from './ast/replace-pre-order'

export function calcExcerptAst(
  immutableRoot: Readonly<Root>,
  pruneLength: number,
): Readonly<Root> {
  if (immutableRoot.children.length <= 0) return immutableRoot

  // Try to truncate excerpt.
  const totalExcerptLengthSoFar = 0
  const excerptAst = shallowMutateAstInPreorder(immutableRoot, null, node => {
    if (totalExcerptLengthSoFar >= pruneLength) return null

    const { value } = node as YastLiteral
    return value == null
      ? node
      : {
          ...node,
          value: value.slice(totalExcerptLengthSoFar - pruneLength),
        }
  })
  return excerptAst
}
