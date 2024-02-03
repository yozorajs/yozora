import fs from 'node:fs'
import path from 'node:path'

/**
 * @interface
 * @typedef {Object} IReporter
 * @property {function(string | unknown, ...unknown[]): void} debug - Logs a debug message.
 * @property {function(string | unknown, ...unknown[]): void} verbose - Logs a verbose message.
 * @property {function(string | unknown, ...unknown[]): void} info - Logs an info message.
 * @property {function(string | unknown, ...unknown[]): void} warn - Logs a warning message.
 * @property {function(string | unknown, ...unknown[]): void} error - Logs an error message.
 * @property {function(string | unknown, ...unknown[]): void} fatal - Logs a fatal error message.
 */

/**
 * @interface
 * @typedef {Object} IGenNxProjectParams
 * @property {string} workspaceRoot - the workspace root path of the monorepo. (absolute)
 * @property {string} projectName - the nx project name.
 * @property {string} projectDir - the nx project dir. (relative to the workspaceRoot)
 * @property {string} [sourceDir] - the source dir. (relative to the projectDir, default 'src')
 * @property {string} [targetDir] - the target dir. (relative to the projectDir, default 'lib')
 * @property {("cli" | "lib" | "vsc")} projectType - the nx project type.
 * @property {("clean" | "build" | "watch" | "test")[]} [entries] -
 * @property {string[]} [tags] - the nx tags to retrieve the projects.
 */

/**
 * Generate and write project.json for the given project.
 *
 * @param {IGenNxProjectParams} params
 * @param {IReporter} [reporter]
 * @returns {Promise<unknown>}
 */
export async function genAndWriteNxProjectJson(params, reporter) {
  const { workspaceRoot, projectDir } = params
  const absolutePackageDir = path.resolve(workspaceRoot, projectDir)
  if (!fs.existsSync(absolutePackageDir)) {
    reporter?.warn(`skipped. packageDirFromRoot is not found.`, projectDir)
    return
  }
  if (!fs.statSync(absolutePackageDir).isDirectory()) {
    reporter?.warn(`skipped. packageDirFromRoot is not a folder.`, projectDir)
    return
  }
  const projectJsonPath = path.join(absolutePackageDir, 'project.json')
  const data = await genNxProjectJson(params)
  const content = JSON.stringify(data, null, 2) + '\n'

  reporter?.verbose('Writing', projectJsonPath)
  fs.writeFileSync(projectJsonPath, content, 'utf8')
  reporter?.info('Wrote', projectJsonPath)
}

/**
 * Generate project.json for the given project.
 *
 * @param {IGenNxProjectParams} params
 * @returns {Promise<unknown>}
 */
export async function genNxProjectJson(params) {
  const {
    workspaceRoot,
    projectDir,
    projectName,
    projectType,
    sourceDir = 'src',
    targetDir = 'lib',
    entries = [],
    tags = [],
  } = params
  const relativeToWorkspaceRoot = path
    .relative(projectDir, workspaceRoot)
    .replace(/[/\\]+/g, '/')
    .replace(/\/$/, '')

  const data = {
    $schema: `${relativeToWorkspaceRoot}/node_modules/nx/schemas/project-schema.json`,
    name: projectName,
    sourceRoot: projectDir + '/' + sourceDir,
    projectType: 'library',
    tags,
    targets: {},
  }

  // Set 'clean' entry.
  if (entries.includes('clean')) {
    data.targets.clean = {
      executor: 'nx:run-commands',
      options: {
        cwd: projectDir,
        parallel: false,
        sourceMap: true,
        commands: [`rimraf ${targetDir}`],
      },
    }
  }

  // Set 'build' entry.
  if (entries.includes('build')) {
    data.targets.build = {
      executor: 'nx:run-commands',
      dependsOn: ['clean', '^build'],
      options: {
        cwd: projectDir,
        parallel: false,
        sourceMap: true,
        commands: [
          `cross-env ROLLUP_CONFIG_TYPE=${projectType} rollup -c ${relativeToWorkspaceRoot}/rollup.config.mjs`,
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
    }
  }

  // Set 'watch' entry.
  if (entries.includes('watch')) {
    data.targets.watch = {
      executor: 'nx:run-commands',
      options: {
        cwd: projectDir,
        parallel: false,
        sourceMap: true,
        commands: [
          `cross-env ROLLUP_CONFIG_TYPE=${projectType} rollup -c ${relativeToWorkspaceRoot}/rollup.config.mjs -w`,
        ],
      },
    }
  }

  // Set 'test' entry.
  if (entries.includes('test')) {
    data.targets.test = {
      executor: 'nx:run-commands',
      options: {
        cwd: projectDir,
        commands: [
          `node --experimental-vm-modules ${relativeToWorkspaceRoot}/node_modules/.bin/jest --config ${relativeToWorkspaceRoot}/jest.config.mjs --rootDir .`,
        ],
      },
      configurations: {
        coverage: {
          commands: [
            `node --experimental-vm-modules ${relativeToWorkspaceRoot}/node_modules/.bin/jest --config ${relativeToWorkspaceRoot}/jest.config.mjs --rootDir . --coverage`,
          ],
        },
        update: {
          commands: [
            `node --experimental-vm-modules ${relativeToWorkspaceRoot}/node_modules/.bin/jest --config ${relativeToWorkspaceRoot}/jest.config.mjs --rootDir . -u`,
          ],
        },
      },
    }
  }

  return data
}

/**
 * Check if there is a test dir.
 *
 * @param {string} absoluteTestDir
 * @returns {Promise<boolean>}
 */
export async function detectTestDir(absoluteTestDir) {
  const hasTest =
    fs.existsSync(absoluteTestDir) &&
    fs.statSync(absoluteTestDir).isDirectory() &&
    fs.readdirSync(absoluteTestDir).length > 0
  return hasTest
}
