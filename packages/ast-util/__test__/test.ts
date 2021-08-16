import type { Root } from '@yozora/ast'
import { loadJSONFixture } from 'jest.setup'
import { calcExcerptAst } from '../src'

const ast: Root = loadJSONFixture('basic1.ast.json')
calcExcerptAst(ast, 40)
