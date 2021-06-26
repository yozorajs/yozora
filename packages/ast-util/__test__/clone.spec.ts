import type { Root, YastLiteral, YastParent } from '@yozora/ast'
import { shallowCloneAst } from '../src'
import { loadJSONFixture } from './_util'

describe('basic1', function () {
  const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
  const ast: Root = loadJSONFixture('basic1.ast.json')

  test('full', function () {
    const bakAst = shallowCloneAst(ast, () => false)
    expect(bakAst).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })

  test('excerpt-140', function () {
    const excerptAst = getExcerptAst(ast, 140)
    expect(excerptAst).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})

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
