// @ts-check

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Handlebars from 'handlebars'

const TEMPLATE_DIRPATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'templates')

/**
 * Convert a kebab-case identifier (e.g. 'inline-code') into PascalCase
 * (e.g. 'InlineCode'). Used by templates to render tokenizer class names.
 * @param {string} text
 * @returns {string}
 */
function toPascalCase(text) {
  return text
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

Handlebars.registerHelper('toPascalCase', toPascalCase)

/** @type {Record<string, HandlebarsTemplateDelegate>} */
const templates = {}

/**
 * Load template
 * @param {string} templateName
 * @param {unknown} data
 * @returns {string}
 */
export function renderTemplate(templateName, data) {
  const templatePath = path.join(TEMPLATE_DIRPATH, templateName).replace(/([.]hbs)?$/, '.hbs')

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
 * @template D
 * @param {string} filepath
 * @param {D} data
 * @param {BufferEncoding} [encoding]
 * @returns {void}
 */
export function renderMarkdown(filepath, data, encoding = 'utf-8') {
  if (!fs.existsSync(filepath)) {
    console.warn(`cannot find ${filepath}.`)
    return
  }

  const content = fs.readFileSync(filepath, encoding)
  const regex = /[\s\n]*<!--\s*:begin\s*use\s*([^>]*?)\s*-->([\s\S]*?)<!--\s*:end\s*-->[\s\n]*/g

  const resolvedContent =
    content
      .replace(regex, (_, templateName) => {
        const result = renderTemplate(templateName, data)
        return `\n\n<!-- :begin use ${templateName} -->\n\n${result}\n\n<!-- :end -->\n\n`
      })
      .trim() + '\n'
  fs.writeFileSync(filepath, resolvedContent, encoding)
}

/**
 * Mark a legacy leading HTML banner as a generated template region.
 * @param {string} filepath
 * @param {string} templateName
 * @param {BufferEncoding} [encoding]
 * @returns {void}
 */
export function ensureLeadingTemplateRegion(filepath, templateName, encoding = 'utf-8') {
  if (!fs.existsSync(filepath)) return

  const content = fs.readFileSync(filepath, encoding)
  const beginMarker = `<!-- :begin use ${templateName} -->`
  if (content.trimStart().startsWith(beginMarker)) return

  const bannerPattern = /^\s*<header>[\s\S]*?<\/header>\s*<br\s*\/?>/
  if (!bannerPattern.test(content)) {
    throw new Error(`cannot find a leading HTML banner in ${filepath}.`)
  }

  const resolvedContent = content.replace(bannerPattern, `${beginMarker}\n\n$&\n\n<!-- :end -->`)
  fs.writeFileSync(filepath, resolvedContent, encoding)
}
