import { SetMetadata } from '@nestjs/common';
import { AccessLevel, ModuleKey } from '@praja/types';

export const MODULE_KEY = 'requiredModule';

export interface RequiredModule {
  module: ModuleKey;
  level: AccessLevel;
}

export const RequireModule = (module: ModuleKey, level: AccessLevel = AccessLevel.view) =>
  SetMetadata(MODULE_KEY, { module, level } satisfies RequiredModule);
