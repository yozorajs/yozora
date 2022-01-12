import type { IYastLiteral, IYastParent, Root } from '@yozora/ast'
import { TextType } from '@yozora/ast'
import { shallowCloneAst } from './ast/clone'

/**
 * Calc excerpt ast from the original ast.
 */
export function calcExcerptAst(immutableRoot: Readonly<Root>, pruneLength: number): Readonly<Root> {
  if (immutableRoot.children.length <= 0) return immutableRoot

  let totalExcerptLengthSoFar = 0
  let parentOfLastLiteralNode: IYastParent | null = null as any
  let indexOfLastLiteralNode = 0
  const excerptAst = shallowCloneAst(immutableRoot, (node, parent, index) => {
    if (totalExcerptLengthSoFar >= pruneLength) return true
    const { value } = node as IYastLiteral
    if (value != null) {
      parentOfLastLiteralNode = parent
      indexOfLastLiteralNode = index
      totalExcerptLengthSoFar += value.length
    }
    return false
  })

  if (
    parentOfLastLiteralNode !== null &&
    parentOfLastLiteralNode.type === TextType &&
    totalExcerptLengthSoFar > pruneLength
  ) {
    // Try truncate last LiteralNode
    const parent = parentOfLastLiteralNode!
    parent.children = parent.children.map((node, i) => {
      if (i !== indexOfLastLiteralNode) return node
      return {
        ...node,
        value: (node as IYastLiteral).value.slice(totalExcerptLengthSoFar - pruneLength),
      }
    })
  }
  return excerptAst
}
