# import-sort-style-custom

[![GitHub Actions Build Status](https://github.com/ifiokjr/import-sort-style-custom/workflows/Node%20CI/badge.svg)](https://github.com/ifiokjr/import-sort-style-custom/actions?query=workflow%3A%22Node+CI%22)
[![Version][version]][npm]
[![Weekly Downloads][downloads-badge]][npm]
[![Typed Codebase][typescript]](./src/index.ts)
![MIT License][license]
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

<br />

> Sort your imports taking into account your aliased tsconfig paths and other custom options. These paths are treated as internal imports.

<br />

## Table of Contents

- [import-sort-style-custom](#import-sort-style-custom)
  - [Table of Contents](#table-of-contents)
  - [Usage](#usage)
    - [Setup](#setup)
    - [Options](#options)
    - [Prettier](#prettier)
  - [Demo](#demo)
  - [Versioning](#versioning)
  - [License](#license)
  - [Contributors](#contributors)

## Usage

`import-sort-style-custom` is designed to be used with [`import-sort`](https://github.com/renke/import-sort) and provide a customisable way for ordering imports when aliases are also used for internal imports.

Sort the modules in the following order.

- Imports with no members are left unsorted at the top of the file. These tend to have side effects and their order is important. `import 'tolu';`
- Node module imports. `import { join } from 'path';`
- Absolute module imports (but not aliased). `import main from 'main';`
- Aliased imports taken from the `tsconfig.json` and `extraAliases` setting, but excluding `ignoredAliases`.
- Relative module imports.
- Bottom imports, which are set in the settings object as `bottomAliases`. These group together absolute paths with relative, placing the absolute paths above the relative.

An example is available below.

```ts
// Imports with no members are left unsorted since they may have side effects.
import 'dotenv';
import './my-side-effect';
import 'firebase/auth';

// Built in node module imports come next
import { join } from 'path';

// Absolute imports
import Awesome from 'awesome-package';
import { B, C } from 'bcde';

// Aliased imports
import MyAlias from '@my-alias';
import { Simple } from 'simple';

// Relative imports
import { DeepRelative } from '../../deep/relative';
import Relative from './relative';

// Bottom imports
import Bottom from '@bottom';
import { relativeBottom } from './relative/bottom';
```

<br />

### Setup

First, install the plugin and the required parser:

```bash
npm install --save-dev import-sort-style-custom import-sort-parser-typescript
```

or

```bash
yarn add -D import-sort-style-custom import-sort-parser-typescript
```

Add the following to your `package.json` file.

```json5
"importSort": {
  ".js, .ts, .tsx": {
    "parser": "typescript",
    "style": "custom",
    "options": {
      "cacheStrategy": "directory",
      "wildcardAtStart": false,
      "extraAliases": [],
      "ignoredAliases": [],
      "bottomAliases": []
    }
  }
}
```

<br />

### Options

| Property            | Type                                     | Default           | Description                                                                                                                                                                                                                                      |
| ------------------- | ---------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ignoreTsConfig`    | `boolean`                                | `false`           | When `true` will not search for any tsconfig.json. This might provide a slight performance boost. This options takes precedence over the other tsconfig options.                                                                                 |
| `tsconfigName`      | `string`                                 | `'tsconfig.json'` | The name to use when searching for a TsConfig.                                                                                                                                                                                                   |
| `tsconfigFilePath`  | `string`                                 | `undefined`       | A direct path to the tsconfig file relative to the `cwd`.                                                                                                                                                                                        |
| `cacheStrategy`     | `'directory'` or `'never'` or `'always'` | `'directory'`     | Determines how often to check for a new parent tsconfig file. By default it will check every time the directory changes. If you only have one tsconfig.json file for the whole project with consistent it makes sense to update this to 'never'. |
| `wildcardAtStart`   | `boolean`                                | `false`           | When `true` will allow patterns which start with a `*` character.                                                                                                                                                                                |
| `spaceAfterAliases` | `boolean`                                | `true`            | When `true` this will insert a space after the alias section causing the relative imports to appear as a separate block.                                                                                                                         |
| `extraAliases`      | `string[]`                               | `[]`              | Extra patterns that should be recognised as internal aliases. The pattern is the same as `tsconfig` files support supporting `*` as the wildcard character.                                                                                      |
| `ignoredAliases`    | `string[]`                               | `[]`              | Ignore all paths that match this pattern. This takes preference over any matching aliases. If a module path matches the alias but doesn't The pattern is the same as `tsconfig` files support supporting `*` as the wildcard character.          |
| `bottomAliases`     | `string[]`                               | `[]`              | Files matching this pattern will be moved to a special group at the end of the imports. The pattern is the same as `tsconfig` files support supporting `*` as the wildcard character.                                                            |

<br />

### Prettier

This package is included by default in the [`prettier-plugin-sorted`](https://github.com/ifiokjr/prettier-plugin-sorted) package. It's two steps to get setup.

```bash
npm install --save-dev prettier prettier-plugin-sorted
```

or

```bash
yarn add -D prettier prettier-plugin-sorted
```

Add the plugin to your `prettier` configuration.

`.prettierrc`

```json
{
  "plugins": ["prettier-plugin-sorted"]
}
```

The following is optional, for the times when you want to customise your setup.

Add the following configuration to your `package.json`, with any options you'd also like to add.

```json5
"importSort": {
  ".js,.jsx,.ts,.tsx": {
    "options": {
      "tsconfigFilePath": "./tsconfig.json"
    }
  }
}
```

<br />

## Demo

The following animated flow shows what it's like when this is setup with prettier in your editor.

![Demo Screen flow](https://raw.githubusercontent.com/ifiokjr/import-sort-style-custom/master/assets/demo.gif 'Demonstration with prettier')

<br />

## Versioning

This project uses [SemVer](http://semver.org/) for versioning. For the versions available, see the
[tags on this repository](https://github.com/ifiokjr/import-sort-style-custom/tags).

<br />

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://ifiokjr.com"><img src="https://avatars2.githubusercontent.com/u/1160934?v=4" width="100px;" alt=""/><br /><sub><b>Ifiok Jr.</b></sub></a><br /><a href="https://github.com/ifiokjr/import-sort-style-custom/commits?author=ifiokjr" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

[version]: https://flat.badgen.net/npm/v/import-sort-style-custom
[npm]: https://npmjs.com/package/import-sort-style-custom
[license]: https://flat.badgen.net/badge/license/MIT/purple
[size]: https://bundlephobia.com/result?p=#import-sort-style-custom
[size-badge]: https://flat.badgen.net/bundlephobia/minzip/import-sort-style-custom
[typescript]: https://flat.badgen.net/badge/icon/TypeScript/?icon=typescript&label&labelColor=blue&color=555555
[downloads-badge]: https://badgen.net/npm/dw/import-sort-style-custom/red?icon=npm
