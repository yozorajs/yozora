import type { Root, YastLiteral, YastParent } from '@yozora/ast'
import fs from 'fs-extra'
import path from 'path'
import { shallowCloneAst } from '../src'

const fixturesDir: string = path.join(__dirname, 'fixtures')
const locateFixture = (...p: string[]): string => path.join(fixturesDir, ...p)

describe('basic1', function () {
  const ast = fs.readJSONSync(locateFixture('basic1.ast.json')) as Root

  test('full', function () {
    const bakAst = shallowCloneAst(ast, () => false)
    expect(bakAst).toMatchSnapshot()
  })

  test('excerpt-140', function () {
    const excerptAst = getExcerptAst(ast, 140)
    expect(excerptAst).toMatchSnapshot()
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
