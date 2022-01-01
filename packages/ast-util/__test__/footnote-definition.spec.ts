import type { IFootnoteDefinition, IRoot, IText } from '@yozora/ast'
import { loadJSONFixture } from 'jest.setup'
import { calcFootnoteDefinitionMap, collectFootnoteDefinitions } from '../src'

describe('collectFootnoteDefinitions', function () {
  test('basic1', function () {
    const originalAst: Readonly<IRoot> = loadJSONFixture('basic1.ast.json')
    const ast: IRoot = loadJSONFixture('basic1.ast.json')

    const result = collectFootnoteDefinitions(ast)
    expect(result).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})

describe('calcFootnoteDefinitionMap', function () {
  describe('basic1', function () {
    const originalAst: Readonly<IRoot> = loadJSONFixture('basic1.ast.json')
    const ast: IRoot = loadJSONFixture('basic1.ast.json')

    test('default', function () {
      const { root, footnoteDefinitionMap } = calcFootnoteDefinitionMap(ast)
      expect(root).toBe(ast)
      expect(footnoteDefinitionMap).toMatchSnapshot()
      expect(ast).toEqual(originalAst)
    })

    test('presetFootnoteDefinitions', function () {
      const presetFootnoteDefinition: IFootnoteDefinition[] = [
        {
          type: 'footnoteDefinition',
          identifier: 'bravo',
          label: 'Bravo',
          children: [
            {
              type: 'text',
              value: 'bravo and charlie.',
            } as IText,
          ],
        },
      ]
      const { root, footnoteDefinitionMap } = calcFootnoteDefinitionMap(
        ast,
        undefined,
        presetFootnoteDefinition,
      )

      expect(root).not.toBe(ast)
      expect(root).toEqual({
        ...ast,
        children: ast.children.concat(presetFootnoteDefinition),
      })
      expect(footnoteDefinitionMap).toMatchSnapshot()
      expect(ast).toEqual(originalAst)
    })

    test('preferReferences', function () {
      const { root, footnoteDefinitionMap } = calcFootnoteDefinitionMap(
        ast,
        undefined,
        undefined,
        true,
      )
      expect(root).not.toBe(ast)
      expect(footnoteDefinitionMap).toMatchSnapshot()
      expect(root).toMatchSnapshot()
      expect(ast).toEqual(originalAst)
    })
  })
})
