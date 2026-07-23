import type {
  Admonition,
  Emphasis,
  Footnote,
  FootnoteDefinition,
  FootnoteReference,
  Paragraph,
  Root,
  Text,
} from '@yozora/ast'
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

    test('preferReferences in an admonition title', function () {
      const footnote: Footnote = {
        type: 'footnote',
        children: [{ type: 'text', value: 'alpha' } as Text],
      }
      const admonition: Admonition = {
        type: 'admonition',
        keyword: 'note',
        title: [footnote],
        children: [],
      }
      const ast: Root = { type: 'root', children: [admonition] }

      const { root, footnoteDefinitionMap } = calcFootnoteDefinitionMap(
        ast,
        undefined,
        undefined,
        true,
      )

      const resultAdmonition = root.children[0] as Admonition
      expect(resultAdmonition.title).toEqual([
        { type: 'footnoteReference', label: '1', identifier: 'footnote-1' },
      ])
      expect(root.children[1]).toEqual({
        type: 'footnoteDefinition',
        label: '1',
        identifier: 'footnote-1',
        children: [{ type: 'paragraph', children: footnote.children }],
      })
      expect(footnoteDefinitionMap['footnote-1']).toBe(root.children[1])
      expect(ast).toEqual({ type: 'root', children: [admonition] })
      expect(admonition.title).toEqual([footnote])
    })

    test('preserves existing post-order outside admonitions', function () {
      const directFootnote: Footnote = {
        type: 'footnote',
        children: [{ type: 'text', value: 'alpha' } as Text],
      }
      const nestedFootnote: Footnote = {
        type: 'footnote',
        children: [{ type: 'text', value: 'bravo' } as Text],
      }
      const ast: Root = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              directFootnote,
              { type: 'emphasis', children: [nestedFootnote] } as Emphasis,
            ],
          } as Paragraph,
        ],
      }

      const { root } = calcFootnoteDefinitionMap(ast, undefined, undefined, true)
      const paragraph = root.children[0] as Paragraph
      const emphasis = paragraph.children[1] as Emphasis
      expect(
        [paragraph.children[0], emphasis.children[0]].map(
          node => (node as FootnoteReference).identifier,
        ),
      ).toEqual(['footnote-2', 'footnote-1'])
    })

    test('preserves source order across nested admonition titles and bodies', function () {
      const outerTitleFootnote: Footnote = {
        type: 'footnote',
        children: [{ type: 'text', value: 'alpha' } as Text],
      }
      const innerTitleFootnote: Footnote = {
        type: 'footnote',
        children: [{ type: 'text', value: 'bravo' } as Text],
      }
      const innerBodyFootnote: Footnote = {
        type: 'footnote',
        children: [{ type: 'text', value: 'charlie' } as Text],
      }
      const innerAdmonition: Admonition = {
        type: 'admonition',
        keyword: 'tip',
        title: [innerTitleFootnote],
        children: [{ type: 'paragraph', children: [innerBodyFootnote] } as Paragraph],
      }
      const outerAdmonition: Admonition = {
        type: 'admonition',
        keyword: 'note',
        title: [outerTitleFootnote],
        children: [innerAdmonition],
      }
      const ast: Root = { type: 'root', children: [outerAdmonition] }
      const originalAst = structuredClone(ast)

      const { root, footnoteDefinitionMap } = calcFootnoteDefinitionMap(
        ast,
        undefined,
        undefined,
        true,
      )

      const resultOuter = root.children[0] as Admonition
      const resultInner = resultOuter.children[0] as Admonition
      const resultParagraph = resultInner.children[0] as Paragraph
      const references = [
        resultOuter.title[0],
        resultInner.title[0],
        resultParagraph.children[0],
      ] as FootnoteReference[]
      expect(references.map(node => node.identifier)).toEqual([
        'footnote-1',
        'footnote-2',
        'footnote-3',
      ])

      const definitions = root.children.slice(1) as FootnoteDefinition[]
      expect(definitions.map(node => node.identifier)).toEqual([
        'footnote-1',
        'footnote-2',
        'footnote-3',
      ])
      expect(definitions.map(node => (node.children[0] as Paragraph).children[0])).toEqual([
        { type: 'text', value: 'alpha' },
        { type: 'text', value: 'bravo' },
        { type: 'text', value: 'charlie' },
      ])
      expect(Object.values(footnoteDefinitionMap)).toEqual(definitions)
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
