import { workspacePackages } from '../internal/workspace.mjs'

const manifests = workspacePackages().map(pkg => pkg.manifest)
const internalPackageNames = new Set(manifests.map(manifest => manifest.name))
const dependencies = new Set()
const devDependencies = new Set()

for (const manifest of manifests) {
  for (const [name, version] of Object.entries(manifest.dependencies ?? {})) {
    if (!internalPackageNames.has(name)) dependencies.add(`${name}@${version}`)
  }
  for (const [name, version] of Object.entries(manifest.devDependencies ?? {})) {
    if (!internalPackageNames.has(name)) devDependencies.add(`${name}@${version}`)
  }
}

console.log({
  dependencies: Array.from(dependencies).sort(),
  devDependencies: Array.from(devDependencies).sort(),
})
