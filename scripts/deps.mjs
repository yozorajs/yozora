import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const WORKSPACE_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const workspaceNames = ['packages', 'tokenizers', 'scaffolds']

const manifests = []
for (const workspaceName of workspaceNames) {
  const workspaceDir = path.resolve(WORKSPACE_ROOT, workspaceName)
  if (!fs.existsSync(workspaceDir) || !fs.statSync(workspaceDir).isDirectory()) continue

  const packageNames = fs.readdirSync(workspaceDir)
  for (const packageName of packageNames) {
    const packageJsonFilePath = path.resolve(workspaceDir, packageName, 'package.json')
    if (!fs.existsSync(packageJsonFilePath) || !fs.statSync(packageJsonFilePath).isFile()) continue

    const packageJson = JSON.parse(fs.readFileSync(packageJsonFilePath, 'utf8'))
    manifests.push(packageJson)
  }
}

const internals = new Set(manifests.map(x => x.name).filter(Boolean))
const dependencies = new Set()
const devDependencies = new Set()

for (const packageJson of manifests) {
  const rawDependencies = packageJson.dependencies ?? {}
  for (const [key, value] of Object.entries(rawDependencies)) {
    if (internals.has(key)) continue
    dependencies.add(`${key}@${value}`)
  }

  const rawDevDependencies = packageJson.devDependencies ?? {}
  for (const [key, value] of Object.entries(rawDevDependencies)) {
    if (internals.has(key)) continue
    devDependencies.add(`${key}@${value}`)
  }
}

console.log({
  dependencies: Array.from(dependencies).sort(),
  devDependencies: Array.from(devDependencies).sort(),
})
