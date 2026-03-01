import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const WORKSPACE_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const workspaceNames = ['packages', 'tokenizers', 'scaffolds']

for (const workspaceName of workspaceNames) {
  const workspaceDir = path.resolve(WORKSPACE_ROOT, workspaceName)
  if (!fs.existsSync(workspaceDir) || !fs.statSync(workspaceDir).isDirectory()) continue

  const packageNames = fs.readdirSync(workspaceDir)
  for (const packageName of packageNames) {
    const packageDir = path.resolve(workspaceDir, packageName)
    const packageJsonFilePath = path.resolve(packageDir, 'package.json')
    if (!fs.existsSync(packageJsonFilePath) || !fs.statSync(packageJsonFilePath).isFile()) continue

    const packageJson = JSON.parse(fs.readFileSync(packageJsonFilePath, 'utf8'))
    const dependencies = [
      ...new Set([
        ...Object.keys(packageJson.dependencies ?? {}),
        ...Object.keys(packageJson.devDependencies ?? {}),
      ]),
    ]
      .filter(x => x.startsWith('@yozora/'))
      .map(x => x.replace(/@yozora\/(tokenizer-)?/, ''))
      .sort()

    const projectJsonFilePath = path.resolve(packageDir, 'project.json')
    const current = fs.existsSync(projectJsonFilePath)
      ? JSON.parse(fs.readFileSync(projectJsonFilePath, 'utf8'))
      : {}
    const base = {
      $schema: '../../node_modules/nx/schemas/project-schema.json',
      name: packageName,
      sourceRoot: `${workspaceName}/${packageName}/src`,
      projectType: 'library',
      tags: [],
      implicitDependencies: dependencies,
    }
    const next = { ...base, ...current, implicitDependencies: dependencies }
    fs.writeFileSync(projectJsonFilePath, JSON.stringify(next, null, 2), 'utf8')
  }
}
