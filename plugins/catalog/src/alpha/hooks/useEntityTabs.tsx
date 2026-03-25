/*
 * Copyright 2026 The Backstage Authors
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

import { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import {
  matchRoutes,
  useParams,
  useRoutes,
  useResolvedPath,
} from 'react-router-dom';
import type {
  HeaderNavTab,
  HeaderNavTabGroup,
  HeaderNavTabItem,
} from '@backstage/ui';
import type { EntityContentGroupDefinitions } from '@backstage/plugin-catalog-react/alpha';

interface SubRoute {
  group?: string;
  path: string;
  title: string;
  children: JSX.Element;
}

interface UseEntityTabsResult {
  tabs: HeaderNavTabItem[];
  activeTabId: string;
  content: JSX.Element | undefined;
}

function resolveGroupId(
  tabGroup: string | undefined,
  groupDefinitions: EntityContentGroupDefinitions,
  aliasToGroup: Record<string, string>,
): string | undefined {
  if (!tabGroup) {
    return undefined;
  }
  if (groupDefinitions[tabGroup]) {
    return tabGroup;
  }
  return aliasToGroup[tabGroup];
}

export function useEntityTabs(options: {
  routes: SubRoute[];
  groupDefinitions: EntityContentGroupDefinitions;
  defaultContentOrder?: 'title' | 'natural';
}): UseEntityTabsResult {
  const { routes, groupDefinitions, defaultContentOrder = 'title' } = options;

  const params = useParams();
  const parentPath = useResolvedPath('.').pathname.replace(/\/$/, '');

  // Build route objects for react-router matching
  const routeObjects = useMemo(
    () =>
      routes.map(({ path, children }) => ({
        caseSensitive: false,
        path: `${path}/*`,
        element: children,
      })),
    [routes],
  );

  // TODO: remove once react-router updated
  // Sort by path specificity (longest first) for correct matching
  const sortedRoutes = useMemo(
    () =>
      [...routeObjects].sort((a, b) =>
        b.path.replace(/\/\*$/, '').localeCompare(a.path.replace(/\/\*$/, '')),
      ),
    [routeObjects],
  );

  const element = useRoutes(sortedRoutes) ?? routes[0]?.children;

  // Determine the active route index
  // TODO(Rugvip): Once we only support v6 stable we can always prefix
  // This avoids having a double / prefix for react-router v6 beta, which in turn breaks
  // the tab highlighting when using relative paths for the tabs.
  let currentRoute = params['*'] ?? '';
  if (!currentRoute.startsWith('/')) {
    currentRoute = `/${currentRoute}`;
  }

  const [matchedRoute] = matchRoutes(sortedRoutes, currentRoute) ?? [];
  const activeRouteIndex = matchedRoute
    ? (() => {
        const idx = routes.findIndex(
          t => `${t.path}/*` === matchedRoute.route.path,
        );
        return idx === -1 ? 0 : idx;
      })()
    : 0;

  const activeRoute = routes[activeRouteIndex] ?? routes[0];

  // Build alias-to-group map
  const aliasToGroup = useMemo(
    () =>
      Object.entries(groupDefinitions).reduce((map, [groupId, def]) => {
        for (const alias of def.aliases ?? []) {
          map[alias] = groupId;
        }
        return map;
      }, {} as Record<string, string>),
    [groupDefinitions],
  );

  const resolveHref = (path: string) => {
    const cleanPath = path.replace(/\/\*$/, '').replace(/^\//, '');
    return `${parentPath}/${cleanPath}`.replace(/\/{2,}/g, '/');
  };

  // Build flat tab items with hrefs
  const tabItems: Array<{
    id: string;
    label: string;
    href: string;
    group?: string;
  }> = useMemo(
    () =>
      routes.map(({ path, title, group }) => ({
        id: path,
        label: title,
        href: resolveHref(path),
        group,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routes, parentPath],
  );

  // Group and sort tabs into HeaderNavTabItem[]
  const tabs: HeaderNavTabItem[] = useMemo(() => {
    type TabGroup = {
      groupDef?: { title: string };
      items: HeaderNavTab[];
    };

    const byKey = tabItems.reduce((result, tab) => {
      const resolvedGroupId = resolveGroupId(
        tab.group,
        groupDefinitions,
        aliasToGroup,
      );
      const groupDef = resolvedGroupId
        ? groupDefinitions[resolvedGroupId]
        : undefined;
      const groupOrId = groupDef && resolvedGroupId ? resolvedGroupId : tab.id;
      result[groupOrId] = result[groupOrId] ?? {
        groupDef,
        items: [],
      };
      result[groupOrId].items.push({
        id: tab.id,
        label: tab.label,
        href: tab.href,
      });
      return result;
    }, {} as Record<string, TabGroup>);

    // Sort groups: defined groups first (in definition order), ungrouped at end
    const groupOrder = Object.keys(groupDefinitions);
    const sorted = Object.entries(byKey).sort(([a], [b]) => {
      const ai = groupOrder.indexOf(a);
      const bi = groupOrder.indexOf(b);
      if (ai !== -1 && bi !== -1) {
        return ai - bi;
      }
      if (ai !== -1) {
        return -1;
      }
      if (bi !== -1) {
        return 1;
      }
      return 0;
    });

    // Sort items within groups
    for (const [id, tabGroup] of sorted) {
      const groupDef = groupDefinitions[id];
      if (groupDef) {
        const order = groupDef.contentOrder ?? defaultContentOrder;
        if (order === 'title') {
          tabGroup.items.sort((a, b) =>
            a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
          );
        }
      }
    }

    // Map to HeaderNavTabItem[]
    return sorted.map(([id, tabGroup]): HeaderNavTabItem => {
      if (tabGroup.items.length === 1 || !tabGroup.groupDef) {
        // Single item or ungrouped: flat HeaderNavTab(s)
        // For ungrouped with multiple items, each is already keyed by its own id,
        // so we always have single items here.
        return tabGroup.items[0];
      }
      // Multi-item named group: HeaderNavTabGroup
      return {
        id,
        label: tabGroup.groupDef.title,
        items: tabGroup.items,
      } satisfies HeaderNavTabGroup;
    });
  }, [tabItems, groupDefinitions, aliasToGroup, defaultContentOrder]);

  const activeTabId = tabItems[activeRouteIndex]?.id ?? tabItems[0]?.id ?? '';

  const content = activeRoute ? (
    <>
      <Helmet title={activeRoute.title} />
      {element}
    </>
  ) : (
    element
  );

  return { tabs, activeTabId, content };
}
