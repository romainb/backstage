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

import { ComponentProps, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header, type HeaderNavTabItem } from '@backstage/ui';
import { useRouteRefParams } from '@backstage/core-plugin-api';
import { type IconComponent } from '@backstage/frontend-plugin-api';
import { stringifyEntityRef } from '@backstage/catalog-model';
import {
  entityRouteRef,
  useAsyncEntity,
  useEntityPresentation,
  InspectEntityDialog,
} from '@backstage/plugin-catalog-react';
import { FavoriteEntity } from '../FavoriteEntity';
import { EntityContextMenu } from '../EntityContextMenu';

/** @alpha */
export function EntityHeader(props: {
  // NOTE(freben): Intentionally not exported at this point, since it's part of
  // the unstable extra context menu items concept below
  UNSTABLE_extraContextMenuItems?: {
    title: string;
    Icon: IconComponent;
    onClick: () => void;
  }[];
  // NOTE(blam): Intentionally not exported at this point, since it's part of
  // unstable context menu option, eg: disable the unregister entity menu
  UNSTABLE_contextMenuOptions?: {
    disableUnregister: boolean | 'visible' | 'hidden' | 'disable';
  };
  contextMenuItems?: React.JSX.Element[];
  tabs?: HeaderNavTabItem[];
  activeTabId?: string;
}) {
  const {
    UNSTABLE_extraContextMenuItems,
    UNSTABLE_contextMenuOptions,
    contextMenuItems,
    tabs,
    activeTabId,
  } = props;

  const { entity } = useAsyncEntity();
  const { kind, namespace, name } = useRouteRefParams(entityRouteRef);

  // Title: use entity presentation for display name, fall back to route params
  const entityOrRef =
    entity ??
    (kind && namespace && name
      ? stringifyEntityRef({ kind, namespace, name })
      : `${kind}:${namespace}/${name}`);
  const { primaryTitle } = useEntityPresentation(entityOrRef);

  // InspectEntityDialog state via search params
  const [searchParams, setSearchParams] = useSearchParams();
  const inspectDialogOpen = searchParams.has('inspect');
  const inspectDialogTab = searchParams.get('inspect') || undefined;

  const closeInspectDialog = useCallback(
    () => setSearchParams({}),
    [setSearchParams],
  );

  const selectInspectTab = useCallback(
    (tab: string) => setSearchParams({ inspect: tab }),
    [setSearchParams],
  );

  return (
    <>
      <Header
        title={primaryTitle}
        customActions={
          entity ? (
            <>
              <FavoriteEntity entity={entity} />
              <EntityContextMenu
                UNSTABLE_extraContextMenuItems={UNSTABLE_extraContextMenuItems}
                UNSTABLE_contextMenuOptions={UNSTABLE_contextMenuOptions}
                contextMenuItems={contextMenuItems}
              />
            </>
          ) : undefined
        }
        tabs={tabs}
        activeTabId={activeTabId}
      />
      {entity && inspectDialogOpen && (
        <InspectEntityDialog
          open
          entity={entity}
          initialTab={
            inspectDialogTab as ComponentProps<
              typeof InspectEntityDialog
            >['initialTab']
          }
          onClose={closeInspectDialog}
          onSelect={selectInspectTab}
        />
      )}
    </>
  );
}
