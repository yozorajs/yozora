import type { Root, Text } from '@yozora/ast'
import { calcFootnoteDefinitionMap, collectFootnoteDefinitions } from '../src'
import { loadJSONFixture } from './_util'

describe('collectFootnoteDefinitions', function () {
  test('basic1', function () {
    const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
    const ast: Root = loadJSONFixture('basic1.ast.json')

    const result = collectFootnoteDefinitions(ast)
    expect(result).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})

describe('calcFootnoteDefinitionMap', function () {
  describe('basic1', function () {
    const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
    const ast: Root = loadJSONFixture('basic1.ast.json')

    test('default', function () {
      const result = calcFootnoteDefinitionMap(ast)
      expect(result).toMatchSnapshot()
      expect(ast).toEqual(originalAst)
    })

    test('presetFootnoteDefinitions', function () {
      const result = calcFootnoteDefinitionMap(ast, undefined, [
        {
          type: 'footnoteDefinition',
          identifier: 'bravo',
          label: 'Bravo',
          children: [
            {
              type: 'text',
              value: 'bravo and charlie.',
            } as Text,
          ],
        },
      ])
      expect(result).toMatchSnapshot()
      expect(ast).not.toEqual(originalAst)
    })

    test('preferReferences', function () {
      const result = calcFootnoteDefinitionMap(ast, undefined, undefined, true)
      expect(result).toMatchSnapshot()
      expect(ast).not.toEqual(originalAst)
    })
  })
})
