/*
 * Copyright 2025 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ExtensionDefinition } from './createExtension';
import { ResolveExtensionId } from './resolveExtensionDefinition';

// This was added to stabilize API reports. Before this was added the extensions
// listed in API reports would be reordered fairly arbitrarily on changes in
// unrelated packages, which made for a confusing contribution experience. This
// also makes it slightly easier to find extensions that you're looking for in
// the API reports.
//
// Simplified from a type-level quicksort to a direct mapped type to avoid
// excessively deep type instantiation in TypeScript 6+.
/** @ignore */
export type MakeSortedExtensionsMap<
  UExtensions extends ExtensionDefinition,
  TId extends string,
> = {
  [K in UExtensions as ResolveExtensionId<K, TId>]: K;
} extends infer O
  ? { [K in keyof O]: O[K] }
  : never;
