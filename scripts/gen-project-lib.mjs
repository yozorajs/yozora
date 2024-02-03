import { chalk } from '@guanghechen/chalk/node'
import { Reporter, ReporterLevelEnum } from '@guanghechen/reporter'
import path from 'node:path'
import url from 'node:url'
import { detectTestDir, genAndWriteNxProjectJson } from './nx/project.mjs'

const reporter = new Reporter(chalk, {
  baseName: 'gen-project-lib',
  level: ReporterLevelEnum.INFO,
  flights: { inline: false, colorful: true },
})

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const workspaceRoot = path.dirname(__dirname)

/** @type {Promise<import('./nx/project.mjs').IGenNxProjectJsonParams>[]} */
const entries = [
  // tokenizers
  ...[
    'admonition',
    'autolink',
    'autolink-extension',
    'blockquote',
    'break',
    'definition',
    'delete',
    'ecma-import',
    'emphasis',
    'fenced-block',
    'fenced-code',
    'footnote',
    'footnote-definition',
    'footnote-reference',
    'heading',
    'html-block',
    'html-inline',
    'image',
    'image-reference',
    'indented-code',
    'inline-code',
    'inline-math',
    'link',
    'link-reference',
    'list',
    'math',
    'paragraph',
    'setext-heading',
    'table',
    'text',
    'thematic-break',
  ].map(projectName => ({
    projectName,
    projectDir: 'tokenizers/' + projectName,
    projectType: 'lib',
    tags: ['tokenizer'],
  })),
  // parsers
  ...['parser', 'parser-gfm', 'parser-gfm-ex'].map(projectName => ({
    projectName,
    projectDir: 'packages/' + projectName,
    projectType: 'lib',
    tags: ['parser'],
  })),
  // others
  ...[
    'ast',
    'ast-util',
    'character',
    'core-parser',
    'core-tokenizer',
    'invariant',
    'markup-weaver',
  ].map(projectName => ({
    projectName,
    projectDir: 'packages/' + projectName,
    projectType: 'lib',
    tags: ['other'],
  })),
  ...[
    //
    'jest-for-tokenizer',
  ].map(projectName => ({
    projectName,
    projectDir: 'scaffolds/' + projectName,
    projectType: 'lib',
    tags: ['other'],
  })),
].map(async entry => {
  const { projectDir } = entry
  const absolutePackageDir = path.resolve(workspaceRoot, projectDir)
  const absoluteTestDir = path.join(absolutePackageDir, '__test__')
  const hasTest = await detectTestDir(absoluteTestDir)
  return {
    ...entry,
    workspaceRoot,
    entries: entry.entries ?? [
      //
      'clean',
      'build',
      'watch',
      hasTest ? 'test' : '',
    ],
  }
})

for await (const entry of entries) {
  await genAndWriteNxProjectJson(entry, reporter)
}
