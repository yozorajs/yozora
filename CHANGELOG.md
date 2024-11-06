# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## <small>2.3.7 (2024-11-06)</small>

- :bug: fix(inline-math): the inline syntax wihtout backticks could be interruptted by
  emphasis/strong ([c347f97](https://github.com/yozorajs/yozora/commit/c347f97))
- :white_check_mark: test: fix tests ([dd9c762](https://github.com/yozorajs/yozora/commit/dd9c762))

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## <small>2.3.6 (2024-10-23)</small>

- :bug: fix(tokenizer-inline-math): the dollar syntax should meet the opener and closer conditions
  ([aef429b](https://github.com/yozorajs/yozora/commit/aef429b))
- :white_check_mark: test(tokenizer-inline-math): add tests
  ([078ba02](https://github.com/yozorajs/yozora/commit/078ba02))

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## <small>2.3.5 (2024-10-06)</small>

- :arrow_up: chore: upgrade devDependencies
  ([2c0d2bb](https://github.com/yozorajs/yozora/commit/2c0d2bb))
- :arrow_up: chore: upgrade devDependencies
  ([018efef](https://github.com/yozorajs/yozora/commit/018efef))
- :arrow_up: chore: upgrade devDependencies & update scripts
  ([b504f00](https://github.com/yozorajs/yozora/commit/b504f00))
- :bookmark: release: publish v2.3.3 ([be6d159](https://github.com/yozorajs/yozora/commit/be6d159))
- :bookmark: release: publish v2.3.4 ([ac66f62](https://github.com/yozorajs/yozora/commit/ac66f62))
- :fire: improve: remove @yozora/template-tokenizer
  ([c794fe8](https://github.com/yozorajs/yozora/commit/c794fe8))
- :wrench: chore: fix build error ([06f839d](https://github.com/yozorajs/yozora/commit/06f839d))
- :wrench: chore: fix lint ([224e248](https://github.com/yozorajs/yozora/commit/224e248))
- :wrench: chore: fix nx config ([139b132](https://github.com/yozorajs/yozora/commit/139b132))
- :wrench: chore: fix nx config ([b8c4d73](https://github.com/yozorajs/yozora/commit/b8c4d73))
- :wrench: chore: fix nx config ([38c2325](https://github.com/yozorajs/yozora/commit/38c2325))
- :wrench: chore: prefer @guanghechen/eslint-config
  ([67a7d37](https://github.com/yozorajs/yozora/commit/67a7d37))
- :wrench: chore: upgrade devDependencies
  ([e509173](https://github.com/yozorajs/yozora/commit/e509173))

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## <small>2.3.4 (2024-09-29)</small>

- :arrow_up: chore: upgrade devDependencies
  ([2c0d2bb](https://github.com/yozorajs/yozora/commit/2c0d2bb))

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## <small>2.3.3 (2024-09-20)</small>

- :arrow_up: chore: upgrade devDependencies
  ([018efef](https://github.com/yozorajs/yozora/commit/018efef))
- :fire: improve: remove @yozora/template-tokenizer
  ([c794fe8](https://github.com/yozorajs/yozora/commit/c794fe8))
- :wrench: chore: fix build error ([06f839d](https://github.com/yozorajs/yozora/commit/06f839d))
- :wrench: chore: fix lint ([224e248](https://github.com/yozorajs/yozora/commit/224e248))
- :wrench: chore: fix nx config ([b8c4d73](https://github.com/yozorajs/yozora/commit/b8c4d73))
- :wrench: chore: fix nx config ([38c2325](https://github.com/yozorajs/yozora/commit/38c2325))
- :wrench: chore: prefer @guanghechen/eslint-config
  ([67a7d37](https://github.com/yozorajs/yozora/commit/67a7d37))
- :wrench: chore: upgrade devDependencies
  ([e509173](https://github.com/yozorajs/yozora/commit/e509173))

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.3.2](https://github.com/yozorajs/yozora/compare/v2.3.1...v2.3.2) (2024-06-17)

### Bug Fixes

- 🐛 index out of boundary while try to find autolink
  ([ec77dce](https://github.com/yozorajs/yozora/commit/ec77dce2b39be745b8e8e5bf9b2706d9e226644d))

### Performance Improvements

- 🔧 update script
  ([1920b76](https://github.com/yozorajs/yozora/commit/1920b76814c45df2bc231d284f0892830d5af12d))
- ⬆️ upgrade devDependencies
  ([0561cfc](https://github.com/yozorajs/yozora/commit/0561cfcd110fe138321c0bd15ce18b234e907a1b))

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.3.1](https://github.com/yozorajs/yozora/compare/v2.3.0...v2.3.1) (2024-01-30)

### Bug Fixes

- don't incorrectly encode a url which has been encoded
  ([#26](https://github.com/yozorajs/yozora/issues/26))
  ([b9f6b2d](https://github.com/yozorajs/yozora/commit/b9f6b2dae4723af4cafe2368ea36cea3b1f3e24c)),
  closes [#23](https://github.com/yozorajs/yozora/issues/23)
  [#23](https://github.com/yozorajs/yozora/issues/23)

### Performance Improvements

- 🎨 support new parser option 'formatUrl' to resolve urls in the ast
  ([#24](https://github.com/yozorajs/yozora/issues/24))
  ([a2c5ac8](https://github.com/yozorajs/yozora/commit/a2c5ac836c0a93f20f86899ab4e4a038e812be4a))
- 🔧 fix npm script
  ([7072094](https://github.com/yozorajs/yozora/commit/70720947005ed31e9226b36206c65306906240a4))
- 🔧 use nx to simplify running commands on the monorepo
  ([#25](https://github.com/yozorajs/yozora/issues/25))
  ([377a126](https://github.com/yozorajs/yozora/commit/377a126f740e51cfd34bd8acc121e3e0424fc2aa))

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.3.0](https://github.com/yozorajs/yozora/compare/v2.2.0...v2.3.0) (2023-09-18)

### Features

- ✨ add method 'collectInlineNodes'
  ([4f80ba4](https://github.com/yozorajs/yozora/commit/4f80ba4be1e2926162bd33f79019236d32a04712))

### Performance Improvements

- :fire: remove 'tsconfig.json's in sub packages
  ([1e6a8b3](https://github.com/yozorajs/yozora/commit/1e6a8b39b1f4f4b84f01829b8956b1ef664e8743))
- ⬆️ upgrade devDependencies
  ([0097a04](https://github.com/yozorajs/yozora/commit/0097a0459a9bfb89ac7157f86373d3232ac298a5))

# [2.2.0](https://github.com/yozorajs/yozora/compare/v2.1.5...v2.2.0) (2023-08-21)

### Features

- ✨ export async methods for mutate ast
  ([b52e30e](https://github.com/yozorajs/yozora/commit/b52e30ed9492c07243abef8193451680c36af7ba))

### Performance Improvements

- 🔧 fix build configs
  ([cfe731c](https://github.com/yozorajs/yozora/commit/cfe731c95431c26943a48848d24d52d0a362890b))
- 📝 fix typos
  ([3deab05](https://github.com/yozorajs/yozora/commit/3deab0535c9e861a1e76de8c95ecc899e5ebde36))
- ⬆️ upgrade devDependencies
  ([bc46ce2](https://github.com/yozorajs/yozora/commit/bc46ce20cacb2eb46147d6129e42fe1390ee19fb))

## [2.1.5](https://github.com/yozorajs/yozora/compare/v2.1.4...v2.1.5) (2023-05-13)

### Performance Improvements

- 🔧 don't sourcemaps into tarball
  ([fc37aa8](https://github.com/yozorajs/yozora/commit/fc37aa8847ac4ad78ecb31f198e1cd6a85e91bcf))
- 🔧 fix npm script
  ([3e09973](https://github.com/yozorajs/yozora/commit/3e0997329a00d9459f5e6594c3db12120fffc8d3))
- 📝 update CHANGELOG
  ([ec2893f](https://github.com/yozorajs/yozora/commit/ec2893faed0b189541d643962d4668441f416f87))
- 📝 update CHANGELOGs
  ([c51b283](https://github.com/yozorajs/yozora/commit/c51b283874f8a562b6ed9fad46a0b7d578f6eb42))
- 🔧 update lerna config publish sub packages independent & remove gitmoji-changelog
  ([bdb8a70](https://github.com/yozorajs/yozora/commit/bdb8a70fb99c874a002e53344ce7467ba6f0dd1b))
- ⬆️ upgrade dependencies
  ([aa83988](https://github.com/yozorajs/yozora/commit/aa839886b4cf5be92466b318193f877d824932e6))
