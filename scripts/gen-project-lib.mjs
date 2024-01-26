import { chalk } from '@guanghechen/chalk/node'
import { Reporter, ReporterLevelEnum } from '@guanghechen/reporter'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const reporter = new Reporter(chalk, {
  baseName: 'gen-project-lib',
  level: ReporterLevelEnum.INFO,
  flights: { inline: false, colorful: true },
})

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const WORKSPACE_ROOT = path.dirname(__dirname)

/**
 * @interface
 * @typedef {Object} IGenNxProjectJsonParams
 * @property {string} projectName - project name
 * @property {string} projectDir - project dir from the workspace root.
 * @property {string[]} tags
 * @property {"lib" | "cli" | undefined} projectType -- default lib
 */

/** @type {IGenNxProjectJsonParams[]} */
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
]

for (const entry of entries) writeNxProjectJson(entry)

/**
 * @param {IGenNxProjectJsonParams} params
 * @returns {void}
 */
function writeNxProjectJson(params) {
  const { projectDir } = params
  const absolutePackageDir = path.resolve(WORKSPACE_ROOT, projectDir)
  if (!fs.existsSync(absolutePackageDir)) {
    reporter.warn(`skipped. packageDirFromRoot is not found.`, projectDir)
    return
  }
  if (!fs.statSync(absolutePackageDir).isDirectory()) {
    reporter.warn(`skipped. packageDirFromRoot is not a folder.`, projectDir)
    return
  }
  const projectJsonPath = path.join(absolutePackageDir, 'project.json')
  const data = genNxProjectJson(params)
  const content = JSON.stringify(data, null, 2) + '\n'

  reporter.verbose('Writing', projectJsonPath)
  fs.writeFileSync(projectJsonPath, content, 'utf8')
  reporter.info('Wrote', projectJsonPath)
}

/**
 * @param {IGenNxProjectJsonParams} params
 * @returns
 */
function genNxProjectJson(params) {
  const { projectName, projectDir, projectType, tags } = params
  const absolutePackageDir = path.resolve(WORKSPACE_ROOT, projectDir)
  const absoluteTestDir = path.join(absolutePackageDir, '__test__')
  const hasTest =
    fs.existsSync(absoluteTestDir) &&
    fs.statSync(absoluteTestDir).isDirectory() &&
    fs.readdirSync(absoluteTestDir).length > 0

  const data = {
    $schema: '../../node_modules/nx/schemas/project-schema.json',
    name: projectName,
    sourceRoot: projectDir + '/src',
    projectType: 'library',
    tags,
    targets: {
      clean: {
        executor: 'nx:run-commands',
        options: {
          parallel: false,
          sourceMap: true,
          commands: ['rimraf lib'],
        },
      },
      build: {
        executor: 'nx:run-commands',
        dependsOn: ['clean', '^build'],
        options: {
          cwd: projectDir,
          parallel: false,
          sourceMap: true,
          commands: [
            `cross-env ROLLUP_CONFIG_TYPE=${projectType} rollup -c ../../rollup.config.mjs`,
          ],
        },
        configurations: {
          production: {
            sourceMap: false,
            env: {
              NODE_ENV: 'production',
            },
          },
        },
      },
      watch: {
        executor: 'nx:run-commands',
        options: {
          cwd: projectDir,
          parallel: false,
          sourceMap: true,
          commands: ['tsc -p tsconfig.lib.json -w --outDir lib/'],
        },
      },
      test: {
        executor: 'nx:run-commands',
        options: {
          cwd: projectDir,
          commands: [
            'cross-env NODE_OPTIONS=--experimental-vm-modules jest --config ../../jest.config.mjs --rootDir .',
          ],
        },
        configurations: {
          coverage: {
            commands: [
              'cross-env NODE_OPTIONS=--experimental-vm-modules jest --config ../../jest.config.mjs --rootDir . --coverage',
            ],
          },
          update: {
            commands: [
              'cross-env NODE_OPTIONS=--experimental-vm-modules jest --config ../../jest.config.mjs --rootDir . -u',
            ],
          },
        },
      },
    },
  }

  if (!hasTest) delete data.targets.test
  return data
}
