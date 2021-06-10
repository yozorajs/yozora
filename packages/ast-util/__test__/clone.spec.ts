import type { Root, YastLiteral, YastParent } from '@yozora/ast'
import { shallowCloneAst } from '../src'
import basic1 from './fixtures/basic1.ast.json'

function getExcerptAst(fullAst: Root, pruneLength: number): Root {
  if (fullAst.children.length <= 0) return fullAst

  // Try to truncate excerpt.
  let totalExcerptLengthSoFar = 0
  let parentOfLastLiteralNode: YastParent | null = null as YastParent | null
  let indexOfLastLiteralNode = 0
  const excerptAst = shallowCloneAst(fullAst, (node, parent, index) => {
    if (totalExcerptLengthSoFar >= pruneLength) return true
    const { value } = node as YastLiteral
    if (value != null) {
      parentOfLastLiteralNode = parent
      indexOfLastLiteralNode = index
      totalExcerptLengthSoFar += value.length
    }
    return false
  })

  if (
    parentOfLastLiteralNode != null &&
    parentOfLastLiteralNode!.type === 'text' &&
    totalExcerptLengthSoFar > pruneLength
  ) {
    // Try truncate last LiteralNode
    const parent = parentOfLastLiteralNode!
    parent.children = parent.children.map((node, i) => {
      if (i !== indexOfLastLiteralNode) return node
      return {
        ...node,
        value: (node as YastLiteral).value.slice(
          totalExcerptLengthSoFar - pruneLength,
        ),
      }
    })
  }
  return excerptAst
}

it('basic1', function () {
  const excerptAst = getExcerptAst(basic1 as Root, 140)
  expect(excerptAst).toMatchSnapshot()
})
