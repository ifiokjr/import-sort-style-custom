import { basename, resolve } from 'path';

import { sortImports } from 'import-sort';
import * as parser from 'import-sort-parser-typescript';

import sortStyleCustom, { CustomSettings } from '../';

const mockFileName = resolve(__dirname, '__fixtures__', basename(__filename));

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
  const settings: Partial<CustomSettings> = {};
  const sorted = sortImports(
    unsortedImports,
    parser,
    sortStyleCustom,
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
  const settings: Partial<CustomSettings> = { ignoreTsConfig: true };
  const sorted = sortImports(
    unsortedImports,
    parser,
    sortStyleCustom,
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
  const settings: Partial<CustomSettings> = {
    tsconfigFileName: 'tsconfig.custom.json',
  };
  const sorted = sortImports(
    unsortedImports,
    parser,
    sortStyleCustom,
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
  const settings: Partial<CustomSettings> = {};
  const sorted = sortImports(
    unsortedImports,
    parser,
    sortStyleCustom,
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
  const settings: Partial<CustomSettings> = {
    extraAliases: ['@alias', 'abc'],
  };
  const sorted = sortImports(
    unsortedImports,
    parser,
    sortStyleCustom,
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
  const settings: Partial<CustomSettings> = { wildcardAtStart: true };
  const sorted = sortImports(
    `import {Awesome} from 'make/simple';\n${unsortedImports}`,
    parser,
    sortStyleCustom,
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
  const settings: Partial<CustomSettings> = { ignoredAliases: ['@*'] };
  const sorted = sortImports(
    unsortedImports,
    parser,
    sortStyleCustom,
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
  const settings: Partial<CustomSettings> = {
    bottomAliases: ['./f*', '@first'],
  };
  const sorted = sortImports(
    unsortedImports,
    parser,
    sortStyleCustom,
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
  const settings: Partial<CustomSettings> = {
    extraAliases: ['./relative'],
  };
  const sorted = sortImports(
    `import { DeepRelative } from '../../deep/relative';\nimport Relative from './relative'${unsortedImports}`,
    parser,
    sortStyleCustom,
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
