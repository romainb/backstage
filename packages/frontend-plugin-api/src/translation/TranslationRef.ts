/*
 * Copyright 2023 The Backstage Authors
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

import {
  createTranslationResource,
  TranslationResource,
} from './TranslationResource';

/** @public */
export interface TranslationRef<
  TId extends string = string,
  TMessages extends { [key in string]: string } = { [key in string]: string },
> {
  $$type: '@backstage/TranslationRef';

  id: TId;

  T: TMessages;
}

/** @internal */
type AnyMessages = { [key in string]: string };

/** @ignore */
type AnyNestedMessages = { [key in string]: AnyNestedMessages | string };

/**
 * Flattens a nested message declaration into a flat object with dot-separated keys.
 *
 * Guards against infinite recursion by short-circuiting when `TMessages` has an
 * index signature (i.e. `string extends keyof TMessages`), which indicates a
 * generic `AnyNestedMessages` type rather than a concrete message object.
 *
 * @ignore
 */
type FlattenedMessages<TMessages extends AnyNestedMessages> =
  string extends keyof TMessages
    ? { readonly [key in string]: string }
    : {
        [TKey in keyof TMessages]: (
          _: TMessages[TKey] extends infer TValue
            ? TValue extends AnyNestedMessages
              ? FlattenedMessages<TValue> extends infer TNested
                ? {
                    [TNestedKey in keyof TNested as `${TKey &
                      string}.${TNestedKey & string}`]: TNested[TNestedKey];
                  }
                : never
              : { [_ in TKey]: TValue }
            : never,
        ) => void;
      }[keyof TMessages] extends (_: infer TIntersection) => void
    ? {
        readonly [TExpandKey in keyof TIntersection]: TIntersection[TExpandKey];
      }
    : never;

/** @internal */
export interface InternalTranslationRef<
  TId extends string = string,
  TMessages extends { [key in string]: string } = { [key in string]: string },
> extends TranslationRef<TId, TMessages> {
  version: 'v1';

  getDefaultMessages(): AnyMessages;

  getDefaultResource(): TranslationResource | undefined;
}

/** @public */
export interface TranslationRefOptions<
  TId extends string,
  TNestedMessages extends AnyNestedMessages,
  TTranslations extends {
    [language in string]: () => Promise<{
      default: {
        [key in keyof FlattenedMessages<TNestedMessages>]: string | null;
      };
    }>;
  },
> {
  id: TId;
  messages: TNestedMessages;
  translations?: TTranslations;
}

function flattenMessages(nested: AnyNestedMessages): AnyMessages {
  const entries = new Array<[string, string]>();

  function visit(obj: AnyNestedMessages, prefix: string): void {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        entries.push([prefix + key, value]);
      } else {
        visit(value, `${prefix}${key}.`);
      }
    }
  }

  visit(nested, '');

  return Object.fromEntries(entries);
}

/** @internal */
class TranslationRefImpl<
  TId extends string,
  TNestedMessages extends AnyNestedMessages,
> implements InternalTranslationRef<TId, FlattenedMessages<TNestedMessages>>
{
  #id: TId;
  #messages: FlattenedMessages<TNestedMessages>;
  #resources: TranslationResource | undefined;

  constructor(options: TranslationRefOptions<TId, TNestedMessages, any>) {
    this.#id = options.id;
    this.#messages = flattenMessages(
      options.messages,
    ) as FlattenedMessages<TNestedMessages>;
  }

  $$type = '@backstage/TranslationRef' as const;

  version = 'v1' as const;

  get id(): TId {
    return this.#id;
  }

  get T(): never {
    throw new Error('Not implemented');
  }

  getDefaultMessages(): AnyMessages {
    return this.#messages;
  }

  setDefaultResource(resources: TranslationResource): void {
    this.#resources = resources;
  }

  getDefaultResource(): TranslationResource | undefined {
    return this.#resources;
  }

  toString() {
    return `TranslationRef{id=${this.id}}`;
  }
}

/** @public */
export function createTranslationRef<
  TId extends string,
  const TNestedMessages extends AnyNestedMessages,
  TTranslations extends {
    [language in string]: () => Promise<{
      default: {
        [key in keyof FlattenedMessages<TNestedMessages>]: string | null;
      };
    }>;
  },
>(
  config: TranslationRefOptions<TId, TNestedMessages, TTranslations>,
): TranslationRef<TId, FlattenedMessages<TNestedMessages>> {
  const ref = new TranslationRefImpl(config);
  if (config.translations) {
    ref.setDefaultResource(
      createTranslationResource({
        ref,
        translations: config.translations as any,
      }),
    );
  }
  return ref;
}

/** @internal */
export function toInternalTranslationRef<
  TId extends string,
  TMessages extends AnyMessages,
>(ref: TranslationRef<TId, TMessages>): InternalTranslationRef<TId, TMessages> {
  const r = ref as InternalTranslationRef<TId, TMessages>;
  if (r.$$type !== '@backstage/TranslationRef') {
    throw new Error(`Invalid translation ref, bad type '${r.$$type}'`);
  }
  if (r.version !== 'v1') {
    throw new Error(`Invalid translation ref, bad version '${r.version}'`);
  }
  return r;
}
