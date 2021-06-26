import type { Root } from '@yozora/ast'
import { ListType, ParagraphType, TextType } from '@yozora/ast'
import fs from 'fs-extra'
import path from 'path'
import { collectNodes } from '../src'

const fixturesDir: string = path.join(__dirname, 'fixtures')
const locateFixture = (...p: string[]): string => path.join(fixturesDir, ...p)

describe('collectNodes', function () {
  test('basic1', function () {
    const ast = fs.readJSONSync(locateFixture('basic1.ast.json')) as Root
    expect(collectNodes(ast, [TextType])).toMatchSnapshot()
    expect(collectNodes(ast, [ParagraphType, ListType])).toMatchSnapshot()
  })
})
