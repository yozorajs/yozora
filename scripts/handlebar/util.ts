import {
  composeTextTransformers,
  toCamelCase,
  toCapitalCase,
  toConstantCase,
  toDotCase,
  toKebabCase,
  toLowerCase,
  toPascalCase,
  toPathCase,
  toSentenceCase,
  toSnakeCase,
  toTitleCase,
  toTrim,
  toUpperCase,
} from '@guanghechen/helper-string'
import fs from 'fs-extra'
import Handlebars from 'handlebars'
import path from 'path'

const transformers = {
  toCamelCase,
  toCapitalCase,
  toConstantCase,
  toDotCase,
  toKebabCase,
  toLowerCase,
  toPascalCase,
  toPathCase,
  toSentenceCase,
  toSnakeCase,
  toTitleCase,
  toTrim,
  toUpperCase,
}

Handlebars.registerHelper('toCamelCase', toCamelCase)
Handlebars.registerHelper('toCapitalCase', toCapitalCase)
Handlebars.registerHelper('toConstantCase', toConstantCase)
Handlebars.registerHelper('toDotCase', toDotCase)
Handlebars.registerHelper('toKebabCase', toKebabCase)
Handlebars.registerHelper('toLowerCase', toLowerCase)
Handlebars.registerHelper('toPascalCase', toPascalCase)
Handlebars.registerHelper('toPathCase', toPathCase)
Handlebars.registerHelper('toSentenceCase', toSentenceCase)
Handlebars.registerHelper('toSnakeCase', toSnakeCase)
Handlebars.registerHelper('toTitleCase', toTitleCase)
Handlebars.registerHelper('toTrim', toTrim)
Handlebars.registerHelper('toUpperCase', toUpperCase)
Handlebars.registerHelper('transform', (...args: any[]): string => {
  const value = args[args.length - 1]
  const transformFns = args
    .slice(0, args.length - 2)
    .map(name => transformers[name])
    .filter(fn => fn != null)
  const transform = composeTextTransformers(...transformFns)
  return transform(value)
})

/**
 * Load template
 * @param templateName
 */
const templates: Record<string, HandlebarsTemplateDelegate> = {}
export function renderTemplate(templateName: string, data: unknown): string {
  const templatePath = path
    .join(__dirname, 'boilerplate', templateName)
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
      .replace(regex, (m, templateName): string => {
        const result = renderTemplate(templateName, data)
        return `\n\n<!-- :begin use ${templateName} -->\n\n${result}\n\n<!-- :end -->\n\n`
      })
      .trim() + '\n'
  fs.writeFileSync(filepath, resolvedContent, encoding)
}
