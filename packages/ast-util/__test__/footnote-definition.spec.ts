import type { FootnoteDefinition, Root, Text } from '@yozora/ast'
import { describe, expect, test } from 'vitest'
import { loadJSONFixture } from 'vitest.setup'
import { calcFootnoteDefinitionMap, collectFootnoteDefinitions } from '../src'

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
      const { root, footnoteDefinitionMap } = calcFootnoteDefinitionMap(ast)
      expect(root).toBe(ast)
      expect(footnoteDefinitionMap).toMatchSnapshot()
      expect(ast).toEqual(originalAst)
    })

    test('presetFootnoteDefinitions', function () {
      const presetFootnoteDefinition: FootnoteDefinition[] = [
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

    test('prototype-named identifiers', function () {
      const definition: FootnoteDefinition = {
        type: 'footnoteDefinition',
        identifier: 'constructor',
        label: 'constructor',
        children: [],
      }
      const preset: FootnoteDefinition = {
        type: 'footnoteDefinition',
        identifier: '__proto__',
        label: '__proto__',
        children: [],
      }
      const ast: Root = { type: 'root', children: [definition] }

      const { root, footnoteDefinitionMap } = calcFootnoteDefinitionMap(ast, undefined, [preset])

      expect(Object.getPrototypeOf(footnoteDefinitionMap)).toBeNull()
      expect(footnoteDefinitionMap[definition.identifier]).toBe(definition)
      expect(footnoteDefinitionMap[preset.identifier]).toBe(preset)
      expect(root.children).toEqual(ast.children.concat(preset))
    })
  })
})
