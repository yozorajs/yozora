import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
updatePackages(path.resolve(__dirname, '../tokenizers'))
updatePackages(path.resolve(__dirname, '../packages'))
updatePackages(path.resolve(__dirname, '../scaffolds'))

function updatePackages(packagesDir) {
  const packageNames = fs.readdirSync(packagesDir)
  for (const packageName of packageNames) updatePackage(path.join(packagesDir, packageName))
}

function updatePackage(packageDir) {
  const projectPath = path.resolve(packageDir, 'project.json')
  if (!fs.existsSync(projectPath) || !fs.statSync(projectPath).isFile()) {
    return
  }

  const packageJsonPath = path.resolve(packageDir, 'package.json')
  if (!fs.existsSync(packageJsonPath) || !fs.statSync(packageJsonPath).isFile()) {
    return
  }

  const projectContent = fs.readFileSync(projectPath, 'utf8')
  const project = JSON.parse(projectContent)

  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8')
  const packageJson = JSON.parse(packageJsonContent)

  const dependencies = [
    ...new Set([
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ]),
  ]
    .filter(x => x.startsWith('@yozora/'))
    .map(x => x.replace(/@yozora\/(tokenizer-)?/, ''))
    .sort()
  project.implicitDependencies = dependencies

  const data = {
    $schema: project.$schema,
    name: project.name,
    implicitDependencies: project.implicitDependencies,
  }
  for (const key of Object.keys(project)) {
    if (data[key] === undefined) data[key] = project[key]
  }
  fs.writeFileSync(projectPath, JSON.stringify(data, null, 2), 'utf8')
}
