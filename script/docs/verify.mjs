import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { repositoryRoot } from '../internal/repository.mjs'
import { createDocumentationParser } from './parser.mjs'

const htmlLinkPattern = /\b(?:href|src)\s*=\s*["']([^"']+)["']/giu
const htmlIdPattern = /<[A-Za-z][^>]*\bid\s*=\s*["']([^"']+)["'][^>]*>/giu
const htmlAnchorNamePattern = /<a\b[^>]*\bname\s*=\s*["']([^"']+)["'][^>]*>/giu
const generatedMarkerPattern = /<!--\s*:(begin\s+use\s+[^>]+|end)\s*-->/giu
const versionLinkPattern = /https:\/\/github\.com\/yozorajs\/yozora\/(?:tree|blob)\/v([^/\s#]+)/u

const createIssue = (rule, line, message) => ({ rule, line, message })

const childNodes = node => {
  const children = []
  for (const value of Object.values(node)) {
    if (!Array.isArray(value)) continue
    for (const child of value) {
      if (child != null && typeof child === 'object' && typeof child.type === 'string') {
        children.push(child)
      }
    }
  }
  return children
}

const collectNodesInSourceOrder = root => {
  const nodes = []
  const stack = [root]
  while (stack.length > 0) {
    const node = stack.pop()
    nodes.push(node)
    const children = childNodes(node)
    for (let index = children.length - 1; index >= 0; --index) stack.push(children[index])
  }
  return nodes.sort(
    (left, right) => (left.position?.start.offset ?? -1) - (right.position?.start.offset ?? -1),
  )
}

const textOf = nodes => {
  let text = ''
  const stack = [...nodes].reverse()
  while (stack.length > 0) {
    const node = stack.pop()
    if (typeof node.value === 'string') text += node.value
    else if (typeof node.alt === 'string') text += node.alt
    else {
      const children = childNodes(node)
      for (let index = children.length - 1; index >= 0; --index) stack.push(children[index])
    }
  }
  return text
}

export function githubSlug(text) {
  let slug = ''
  for (const character of text.trim().toLowerCase()) {
    if (character === '-' || character === '_' || /[\p{L}\p{N}\s]/u.test(character)) {
      slug += character
    }
  }
  return slug.replace(/\s+/gu, '-')
}

export function scanSourcePolicy(content) {
  const issues = []
  const lineCount = content.split(/\r?\n/u).length
  if (content.charCodeAt(0) === 0xfeff) {
    issues.push(createIssue('bom', 1, 'UTF-8 BOM is not allowed'))
  }
  if (content.includes('\0')) issues.push(createIssue('nul', 1, 'NUL character is not allowed'))
  if (content.length > 0 && !content.endsWith('\n')) {
    issues.push(createIssue('final-newline', lineCount, 'file must end with a newline'))
  }
  return issues
}

export function analyzeMarkdownAst(ast) {
  const anchors = new Set()
  const anchorCounts = new Map()
  const definitions = new Map()
  const issues = []
  const links = []
  let generatedRegionDepth = 0

  const addHeading = text => {
    const base = githubSlug(text)
    const count = anchorCounts.get(base) ?? 0
    anchorCounts.set(base, count + 1)
    anchors.add(count === 0 ? base : `${base}-${count}`)
  }

  for (const node of collectNodesInSourceOrder(ast)) {
    const line = node.position?.start.line ?? 1
    if (node.type === 'heading') addHeading(textOf(node.children ?? []))

    if (typeof node.url === 'string') links.push({ line, url: node.url })

    if (node.type === 'definition') {
      const previous = definitions.get(node.identifier)
      if (previous != null) {
        const suffix =
          previous.url === node.url ? '' : ` with conflicting URL ${JSON.stringify(node.url)}`
        issues.push(
          createIssue(
            'duplicate-definition',
            line,
            `definition ${JSON.stringify(node.label)} duplicates line ${previous.line}${suffix}`,
          ),
        )
      } else {
        definitions.set(node.identifier, { line, url: node.url })
      }
    }

    if (node.type !== 'html' || typeof node.value !== 'string') continue

    for (const match of node.value.matchAll(htmlLinkPattern)) links.push({ line, url: match[1] })
    for (const match of node.value.matchAll(htmlIdPattern)) anchors.add(match[1])
    for (const match of node.value.matchAll(htmlAnchorNamePattern)) anchors.add(match[1])

    for (const match of node.value.matchAll(generatedMarkerPattern)) {
      const markerLine = line + node.value.slice(0, match.index).split('\n').length - 1
      if (match[1].startsWith('begin')) generatedRegionDepth += 1
      else {
        generatedRegionDepth -= 1
        if (generatedRegionDepth < 0) {
          issues.push(
            createIssue('generated-region', markerLine, 'generated region ends before it begins'),
          )
          generatedRegionDepth = 0
        }
      }
    }
  }

  if (generatedRegionDepth > 0) {
    issues.push(
      createIssue(
        'generated-region',
        ast.position?.end.line ?? 1,
        'generated region is not closed',
      ),
    )
  }

  return { anchors, issues, links }
}

const isExternalUrl = url => /^[A-Za-z][A-Za-z\d+.-]*:/u.test(url) || url.startsWith('//')

const decodeUrlComponent = value => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const isWithinRoot = (root, target) => {
  const relativePath = relative(root, target)
  return (
    relativePath === '' ||
    (!isAbsolute(relativePath) && relativePath !== '..' && !relativePath.startsWith(`..${sep}`))
  )
}

const resolveAnchorFile = target => {
  if (!existsSync(target)) return null
  if (statSync(target).isDirectory()) {
    const readme = join(target, 'README.md')
    return existsSync(readme) ? readme : null
  }
  return target.toLowerCase().endsWith('.md') ? target : null
}

const isFixture = file => /(?:^|\/)__test__\/fixtures\//u.test(file)

export function verifyMarkdownFiles(root, files, parseMarkdown) {
  if (typeof parseMarkdown !== 'function') throw new TypeError('parseMarkdown must be a function')

  const absoluteRoot = realpathSync(root)
  const scans = new Map()
  const issues = []

  for (const file of files) {
    const absoluteFile = resolve(absoluteRoot, file)
    const content = readFileSync(absoluteFile, 'utf8')
    for (const issue of scanSourcePolicy(content)) issues.push({ file, ...issue })

    try {
      const scan = analyzeMarkdownAst(parseMarkdown(content))
      scans.set(normalize(absoluteFile), scan)
      for (const issue of scan.issues) issues.push({ file, ...issue })
    } catch (error) {
      issues.push({
        file,
        line: 1,
        rule: 'parse',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  for (const file of files) {
    const absoluteFile = resolve(absoluteRoot, file)
    const scan = scans.get(normalize(absoluteFile))
    if (scan == null || isFixture(file)) continue

    for (const link of scan.links) {
      const url = link.url.trim()
      if (url.length === 0 || isExternalUrl(url) || url.startsWith('/')) continue

      const hashIndex = url.indexOf('#')
      const queryIndex = url.indexOf('?')
      let pathEnd = url.length
      if (hashIndex >= 0) pathEnd = Math.min(pathEnd, hashIndex)
      if (queryIndex >= 0) pathEnd = Math.min(pathEnd, queryIndex)

      const rawPath = url.slice(0, pathEnd)
      const fragment = hashIndex < 0 ? '' : decodeUrlComponent(url.slice(hashIndex + 1))
      const target =
        rawPath.length === 0
          ? absoluteFile
          : resolve(dirname(absoluteFile), decodeUrlComponent(rawPath))
      if (!isWithinRoot(absoluteRoot, target)) {
        issues.push({
          file,
          line: link.line,
          rule: 'local-link',
          message: `local target escapes the repository: ${JSON.stringify(url)}`,
        })
        continue
      }
      if (!existsSync(target)) {
        issues.push({
          file,
          line: link.line,
          rule: 'local-link',
          message: `local target does not exist: ${JSON.stringify(url)}`,
        })
        continue
      }

      const realTarget = realpathSync(target)
      if (!isWithinRoot(absoluteRoot, realTarget)) {
        issues.push({
          file,
          line: link.line,
          rule: 'local-link',
          message: `local target resolves outside the repository: ${JSON.stringify(url)}`,
        })
        continue
      }
      if (fragment.length === 0) continue

      const anchorFile = resolveAnchorFile(realTarget)
      const targetScan = anchorFile == null ? null : scans.get(normalize(anchorFile))
      if (anchorFile != null && targetScan == null) {
        issues.push({
          file,
          line: link.line,
          rule: 'local-link',
          message: `Markdown target is not tracked: ${JSON.stringify(url)}`,
        })
      } else if (targetScan != null && !targetScan.anchors.has(fragment)) {
        issues.push({
          file,
          line: link.line,
          rule: 'local-anchor',
          message: `anchor ${JSON.stringify(fragment)} does not exist in ${JSON.stringify(url)}`,
        })
      }
    }

    if (basename(file).startsWith('README')) {
      const manifestPath = join(dirname(absoluteFile), 'package.json')
      if (existsSync(manifestPath)) {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
        if (manifest.private !== true && typeof manifest.version === 'string') {
          for (const link of scan.links) {
            const match = versionLinkPattern.exec(link.url)
            if (match != null && match[1] !== manifest.version) {
              issues.push({
                file,
                line: link.line,
                rule: 'version-link',
                message: `expected v${manifest.version}, found v${match[1]}`,
              })
            }
          }
        }
      }
    }
  }

  return issues.sort(
    (left, right) =>
      left.file.localeCompare(right.file) ||
      left.line - right.line ||
      left.rule.localeCompare(right.rule),
  )
}

export function trackedMarkdownFiles(root = repositoryRoot) {
  const output = execFileSync('git', ['ls-files', '-z', '*.md'], { cwd: root })
  return output.toString('utf8').split('\0').filter(Boolean)
}

const isMain =
  process.argv[1] != null && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const parser = await createDocumentationParser()
  const files = trackedMarkdownFiles()
  const issues = verifyMarkdownFiles(repositoryRoot, files, source => parser.parse(source))
  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`${issue.file}:${issue.line} [${issue.rule}] ${issue.message}`)
    }
    process.exitCode = 1
  } else {
    console.log(`Validated ${files.length} documentation files.`)
  }
}
