import { basename, resolve } from 'path';

import { sortImports } from 'import-sort';
import * as parser from 'import-sort-parser-typescript';
import { clearCache } from 'tsconfig-resolver';

import sortStyleModuleAlias, { AliasedModuleSettings } from '../';

const mockFileName = resolve(__dirname, '__fixtures__', basename(__filename));

afterEach(clearCache);

const unsortedImports = `
import Runner from 'run';
import {a} from './foo';
import {b, B, c, C} from '@z';
import {Splat} from '@splat/anything';
import {b} from '@alias';
import a from 'abc';
import first from '@first';
`;
test('sorts when a tsconfig has paths', () => {
  const settings: Partial<AliasedModuleSettings> = {};
  const sorted = sortImports(
    unsortedImports,
    parser,
    sortStyleModuleAlias,
    mockFileName,
    settings,
  );

  expect(sorted.code).toMatchInlineSnapshot(`
    "import first from '@first';
    import a from 'abc';

    import {b} from '@alias';
    import {Splat} from '@splat/anything';
    import {B, C, b, c} from '@z';
    import Runner from 'run';

    import {a} from './foo';
    "
  `);
});

test('ignores the tsconfig with setting', () => {
  const settings: Partial<AliasedModuleSettings> = { ignoreTsConfig: true };
  const sorted = sortImports(
    unsortedImports,
    parser,
    sortStyleModuleAlias,
    mockFileName,
    settings,
  );

  expect(sorted.code).toMatchInlineSnapshot(`
    "import {b} from '@alias';
    import first from '@first';
    import {Splat} from '@splat/anything';
    import {B, C, b, c} from '@z';
    import a from 'abc';
    import Runner from 'run';

    import {a} from './foo';
    "
  `);
});

test('accepts a custom tsconfig `fileName`', () => {
  const settings: Partial<AliasedModuleSettings> = {
    tsconfigFileName: 'tsconfig.custom.json',
  };
  const sorted = sortImports(
    unsortedImports,
    parser,
    sortStyleModuleAlias,
    mockFileName,
    settings,
  );

  expect(sorted.code).toMatchInlineSnapshot(`
    "import {b} from '@alias';
    import first from '@first';
    import {Splat} from '@splat/anything';
    import {B, C, b, c} from '@z';
    import a from 'abc';

    import Runner from 'run';

    import {a} from './foo';
    "
  `);
});

test('default module sort when no tsconfig is present', () => {
  const settings: Partial<AliasedModuleSettings> = {};
  const sorted = sortImports(
    unsortedImports,
    parser,
    sortStyleModuleAlias,
    '/',
    settings,
  );
  expect(sorted.code).toMatchInlineSnapshot(`
    "import {b} from '@alias';
    import first from '@first';
    import {Splat} from '@splat/anything';
    import {B, C, b, c} from '@z';
    import a from 'abc';
    import Runner from 'run';

    import {a} from './foo';
    "
  `);
});

test('sorts with extra aliases', () => {
  const settings: Partial<AliasedModuleSettings> = {
    extraAliases: ['@alias', 'abc'],
  };
  const sorted = sortImports(
    unsortedImports,
    parser,
    sortStyleModuleAlias,
    undefined,
    settings,
  );

  expect(sorted.code).toMatchInlineSnapshot(`
    "import first from '@first';
    import {Splat} from '@splat/anything';
    import {B, C, b, c} from '@z';
    import Runner from 'run';

    import {b} from '@alias';
    import a from 'abc';

    import {a} from './foo';
    "
  `);
});

test('supports alias splats', () => {
  const settings: Partial<AliasedModuleSettings> = { wildcardAtStart: true };
  const sorted = sortImports(
    `import {Awesome} from 'make/simple';\n${unsortedImports}`,
    parser,
    sortStyleModuleAlias,
    mockFileName,
    settings,
  );

  expect(sorted.code).toMatchInlineSnapshot(`
    "import first from '@first';
    import a from 'abc';

    import {b} from '@alias';
    import {Splat} from '@splat/anything';
    import {B, C, b, c} from '@z';
    import {Awesome} from 'make/simple';
    import Runner from 'run';

    import {a} from './foo';
    "
  `);
});

test('can ignore aliases', () => {
  const settings: Partial<AliasedModuleSettings> = { ignoredAliases: ['@*'] };
  const sorted = sortImports(
    unsortedImports,
    parser,
    sortStyleModuleAlias,
    mockFileName,
    settings,
  );

  expect(sorted.code).toMatchInlineSnapshot(`
    "import {b} from '@alias';
    import first from '@first';
    import {Splat} from '@splat/anything';
    import {B, C, b, c} from '@z';
    import a from 'abc';

    import Runner from 'run';

    import {a} from './foo';
    "
  `);
});

test('can push aliases to the bottom', () => {
  const settings: Partial<AliasedModuleSettings> = {
    bottomAliases: ['./f*', '@first'],
  };
  const sorted = sortImports(
    unsortedImports,
    parser,
    sortStyleModuleAlias,
    mockFileName,
    settings,
  );

  expect(sorted.code).toMatchInlineSnapshot(`
    "import a from 'abc';

    import {b} from '@alias';
    import {Splat} from '@splat/anything';
    import {B, C, b, c} from '@z';
    import Runner from 'run';

    import first from '@first';
    import {a} from './foo';
    "
  `);
});

test('default aliased relative imports in relative section', () => {
  // ;
  const settings: Partial<AliasedModuleSettings> = {
    extraAliases: ['./relative'],
  };
  const sorted = sortImports(
    `import { DeepRelative } from '../../deep/relative';\nimport Relative from './relative'${unsortedImports}`,
    parser,
    sortStyleModuleAlias,
    mockFileName,
    settings,
  );

  expect(sorted.code).toMatchInlineSnapshot(`
    "import first from '@first';
    import a from 'abc';

    import {b} from '@alias';
    import {Splat} from '@splat/anything';
    import {B, C, b, c} from '@z';
    import Runner from 'run';

    import { DeepRelative } from '../../deep/relative';
    import {a} from './foo';
    import Relative from './relative'
    "
  `);
});
