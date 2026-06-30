import Handlebars from 'handlebars'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SCRIPT_DIRPATH = path.dirname(fileURLToPath(import.meta.url))

/**
 * Convert a kebab-case identifier (e.g. 'inline-code') into PascalCase
 * (e.g. 'InlineCode'). Used by templates to render tokenizer class names.
 */
function toPascalCase(text: string): string {
  return text
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

Handlebars.registerHelper('toPascalCase', toPascalCase)

/**
 * Load template
 * @param templateName
 */
const templates: Record<string, HandlebarsTemplateDelegate> = {}
export function renderTemplate(templateName: string, data: unknown): string {
  const templatePath = path
    .join(SCRIPT_DIRPATH, 'boilerplate', templateName)
    .replace(/([.]hbs)?$/, '.hbs')

  if (templates[templatePath] == null) {
    const templateContent = fs.readFileSync(templatePath, 'utf-8')
    const template = Handlebars.compile(templateContent)
    templates[templatePath] = template
  }

  const render = templates[templatePath]
  return render(data)
}

/**
 * Render markdown with handlebar templates.
 * @param filepath
 * @param data
 */
export function renderMarkdown<D>(
  filepath: string,
  data: D,
  encoding: BufferEncoding = 'utf-8',
): void {
  if (!fs.existsSync(filepath)) {
    console.warn(`cannot find ${filepath}.`)
    return
  }

  const content = fs.readFileSync(filepath, encoding)
  const regex = /[\s\n]*<!--\s*:begin\s*use\s*([^>]*?)\s*-->([\s\S]*?)<!--\s*:end\s*-->[\s\n]*/g

  const resolvedContent =
    content
      .replace(regex, (_, templateName): string => {
        const result = renderTemplate(templateName, data)
        return `\n\n<!-- :begin use ${templateName} -->\n\n${result}\n\n<!-- :end -->\n\n`
      })
      .trim() + '\n'
  fs.writeFileSync(filepath, resolvedContent, encoding)
}
