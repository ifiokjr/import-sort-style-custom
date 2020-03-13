import { dirname } from 'path';

import escapeStringRegexp from 'escape-string-regexp';
import { IImport } from 'import-sort-parser';
import { IStyle } from 'import-sort-style';
import {
  CacheStrategy,
  CacheStrategyType,
  TsConfigResult,
  tsconfigResolver,
} from 'tsconfig-resolver';

const defaultSettings: CustomSettings = {
  ignoreTsConfig: false,
  tsconfigFileName: 'tsconfig.json',
  cacheStrategy: CacheStrategy.Directory,
  wildcardAtStart: false,
  ignoredAliases: [],
  extraAliases: [],
  bottomAliases: [],
};

/**
 * The aliased module configuration object.
 */
export interface CustomSettings {
  /**
   * When `true` will not search for any tsconfig.json. This might provide a slight performance boost.
   *
   * This options takes precedence over the other tsconfig options.
   */
  ignoreTsConfig: boolean;

  /**
   * The name to use when searching for a TsConfig.
   *
   * @default 'tsconfig.json'
   */
  tsconfigFileName: string;
  /**
   * Determines how often to check for a new parent tsconfig file. By default it
   * will check every time the directory changes. If you only have one
   * tsconfig.json file for the whole project with consistent it makes sense to
   * update this to 'never'.
   *
   * @default 'directory'
   */
  cacheStrategy: CacheStrategyType;

  /**
   * When true will allow patterns which start with a `*` character.
   *
   * @default false
   */
  wildcardAtStart: boolean;

  /**
   * Extra patterns that should be recognised as internal aliases.
   *
   * The pattern is the same as `tsconfig` files support supporting `*` as the
   * wildcard character.
   */
  extraAliases: string[];

  /**
   * Ignore all paths that match this pattern. This takes preference over any
   * matching aliases. If a module path matches the alias but doesn't
   *
   * The pattern is the same as `tsconfig` files support supporting `*` as the
   * wildcard character.
   */
  ignoredAliases: string[];

  /**
   * Files matching this pattern will be moved to a special group at the end of
   * the imports.
   *
   * The pattern is the same as `tsconfig` files support supporting `*` as the
   * wildcard character.
   */
  bottomAliases: string[];
}

const getSettings = (rawSettings: object = {}): CustomSettings => {
  return { ...defaultSettings, ...rawSettings };
};

/**
 * Converts a tsconfig pattern to a RegExp.
 */
const patternToRegExp = (pattern: string) =>
  new RegExp(escapeStringRegexp(pattern).replace(/\\\*/g, '.+'));

/**
 * Creates an isAliasedModule method which is used to check when the import is
 * an alias.
 */
const isAliasedModuleCreator = (
  { extraAliases, wildcardAtStart, ignoredAliases }: CustomSettings,
  config: TsConfigResult['config'],
) => {
  const regExps: RegExp[] = [];
  const ignoredRegExps: RegExp[] = [];
  const paths = config?.compilerOptions?.paths ?? {};

  // Populate the array of aliases
  for (const alias of [...Object.keys(paths), ...extraAliases]) {
    if (!wildcardAtStart && alias.startsWith('*')) {
      continue;
    }

    regExps.push(patternToRegExp(alias));
  }

  // Populate the array of ignored patterns.
  for (const alias of ignoredAliases) {
    ignoredRegExps.push(patternToRegExp(alias));
  }

  return (imported: IImport) => {
    // No alias patterns to check. Return false for a negative match.
    if (!regExps.length) {
      return false;
    }

    // Check to see if the pattern matches the ignored patterns. If this is the
    // case return a negative match.
    for (const regExp of ignoredRegExps) {
      if (regExp.test(imported.moduleName)) {
        return false;
      }
    }

    // Check if any alias patterns match the module name then return a positive
    // match.
    for (const regExp of regExps) {
      if (regExp.test(imported.moduleName)) {
        return true;
      }
    }

    // Nothing matched so return a negative match.
    return false;
  };
};

/**
 * Creates a function that checks if the imported module should be placed at the
 * bottom.
 */
const isBottomModuleCreator = (bottomModules: string[]) => {
  const regExps: RegExp[] = [];

  // Populate the array of pattern matchers for bottom modules
  for (const alias of bottomModules) {
    regExps.push(patternToRegExp(alias));
  }

  return (imported: IImport) => {
    // No patterns to check. Return false to show this is import should not be
    // placed at the bottom.
    if (!regExps.length) {
      return false;
    }

    // Check if any alias patterns match the module name then return a positive
    // match.
    for (const regExp of regExps) {
      if (regExp.test(imported.moduleName)) {
        return true;
      }
    }

    // Nothing matched so return a negative match.
    return false;
  };
};

/**
 * Sort the modules in the following order.
 *
 * - Imports with no members are left unsorted at the top of the file. These
 *   tend to have side effects and their order is important. `import 'tolu';`
 * - Node module imports. `import { join } from 'path';`
 * - Absolute module imports (but not aliased). `import main from 'main';`
 * - Aliased imports taken from the `tsconfig.json`
 * - Relative module imports
 * - Bottom imports, which are set in the settings object as `bottomAliases`
 */
const sortStyleCustom: IStyle = (styleApi, fileName, rawSettings) => {
  // console.log({ fileName, settings });
  const settings = getSettings(rawSettings);
  const config = settings.ignoreTsConfig
    ? undefined
    : tsconfigResolver({
        cacheStrategy: settings.cacheStrategy,
        cwd: fileName ? dirname(fileName) : undefined,
        fileName: settings.tsconfigFileName,
      }).config;

  const isAliasedModule = isAliasedModuleCreator(settings, config);
  const isBottomModule = isBottomModuleCreator(settings.bottomAliases);

  const {
    alias,
    and,
    dotSegmentCount,
    hasNoMember,
    isAbsoluteModule,
    isNodeModule,
    isRelativeModule,
    moduleName,
    naturally,
    unicode,
    not,
  } = styleApi;

  return [
    // No member - `import "foo"; import "./foo"; import "$aliased";`
    { match: and(hasNoMember, not(isBottomModule)) }, // No sorting here since these can have side effects.
    { separator: true },

    // Builtin - `import … from "fs";`
    {
      match: and(isNodeModule, not(isBottomModule)),
      sort: moduleName(naturally),
      sortNamedMembers: alias(unicode),
    },
    { separator: true },

    // Absolute - `import … from "foo";`
    {
      match: and(isAbsoluteModule, not(isBottomModule), not(isAliasedModule)),
      sort: moduleName(naturally),
      sortNamedMembers: alias(unicode),
    },
    { separator: true },

    // Aliased - `import … from "$aliased";`
    {
      match: and(not(isRelativeModule), not(isBottomModule), isAliasedModule),
      sort: moduleName(naturally),
      sortNamedMembers: alias(unicode),
    },
    { separator: true },

    // Relative - `import … from "./foo"; import … from "../foo";`
    {
      match: and(isRelativeModule, not(isBottomModule)),
      sort: [dotSegmentCount, moduleName(naturally)],
      sortNamedMembers: alias(unicode),
    },
    { separator: true },

    // Bottom
    {
      match: and(isBottomModule, not(isRelativeModule)),
      sort: [dotSegmentCount, moduleName(naturally)],
      sortNamedMembers: alias(unicode),
    },

    // Relative bottom
    {
      match: isBottomModule,
      sort: [dotSegmentCount, moduleName(naturally)],
      sortNamedMembers: alias(unicode),
    },
    { separator: true },
  ];
};

export default sortStyleCustom;
