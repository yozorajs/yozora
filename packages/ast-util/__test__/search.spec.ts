import type { Root, YastLiteral } from '@yozora/ast'
import fs from 'fs-extra'
import path from 'path'
import { searchNode } from '../src'

const fixturesDir: string = path.join(__dirname, 'fixtures')
const locateFixture = (...p: string[]): string => path.join(fixturesDir, ...p)

describe('basic1', function () {
  const ast = fs.readJSONSync(locateFixture('basic1.ast.json')) as Root

  test('first node', function () {
    expect(searchNode(ast, node => true)).toEqual([0])
  })

  test('special node', function () {
    expect(
      searchNode(ast, node => {
        const { type, value } = node as YastLiteral
        return type === 'text' && value === 'bar'
      }),
    ).toEqual([0, 1, 1, 0])
  })

  test('miss', function () {
    expect(
      searchNode(ast, node => {
        const { type, value } = node as YastLiteral
        return type === 'text' && value === '____bar_______bar___'
      }),
    ).toEqual(null)
  })
})
