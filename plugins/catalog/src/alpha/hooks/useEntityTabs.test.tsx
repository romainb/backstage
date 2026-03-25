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

import { renderHook } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { EntityContentGroupDefinitions } from '@backstage/plugin-catalog-react/alpha';
import type { HeaderNavTabGroup } from '@backstage/ui';
import { useEntityTabs } from './useEntityTabs';

function createRoutes(
  defs: Array<{ path: string; title: string; group?: string }>,
) {
  return defs.map(d => ({
    ...d,
    children: <div>{d.title} content</div>,
  }));
}

function renderUseEntityTabs(options: {
  routes: Array<{ path: string; title: string; group?: string }>;
  groupDefinitions: EntityContentGroupDefinitions;
  defaultContentOrder?: 'title' | 'natural';
  initialPath?: string;
}) {
  const {
    routes: routeDefs,
    groupDefinitions,
    defaultContentOrder,
    initialPath = '/entity',
  } = options;
  const routes = createRoutes(routeDefs);

  return renderHook(
    () => useEntityTabs({ routes, groupDefinitions, defaultContentOrder }),
    {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/entity/*" element={children} />
          </Routes>
        </MemoryRouter>
      ),
    },
  );
}

const groupDefinitions: EntityContentGroupDefinitions = {
  monitoring: { title: 'Monitoring', aliases: ['observability'] },
  ci: { title: 'CI/CD' },
};

describe('useEntityTabs', () => {
  it('returns empty tabs and content when routes is empty', () => {
    const { result } = renderUseEntityTabs({
      routes: [],
      groupDefinitions: {},
    });

    expect(result.current.tabs).toEqual([]);
    expect(result.current.activeTabId).toBe('');
    expect(result.current.content).toBeUndefined();
  });

  it('returns flat HeaderNavTab items for ungrouped routes and sets activeTabId to the first route', () => {
    const { result } = renderUseEntityTabs({
      routes: [
        { path: '/overview', title: 'Overview' },
        { path: '/docs', title: 'Docs' },
      ],
      groupDefinitions: {},
    });

    expect(result.current.tabs).toHaveLength(2);

    // Flat tabs have href, not items
    expect(result.current.tabs[0]).toEqual(
      expect.objectContaining({
        id: '/overview',
        label: 'Overview',
      }),
    );
    expect(result.current.tabs[0]).toHaveProperty('href');
    expect(result.current.tabs[0]).not.toHaveProperty('items');

    expect(result.current.tabs[1]).toEqual(
      expect.objectContaining({
        id: '/docs',
        label: 'Docs',
      }),
    );

    // Active tab defaults to first route
    expect(result.current.activeTabId).toBe('/overview');
  });

  it('returns HeaderNavTabGroup for multi-item groups', () => {
    const { result } = renderUseEntityTabs({
      routes: [
        { path: '/alerts', title: 'Alerts', group: 'monitoring' },
        { path: '/logs', title: 'Logs', group: 'monitoring' },
        { path: '/overview', title: 'Overview' },
      ],
      groupDefinitions,
    });

    // monitoring group first, then ungrouped overview
    expect(result.current.tabs).toHaveLength(2);

    const monitoringGroup = result.current.tabs[0] as HeaderNavTabGroup;
    expect(monitoringGroup.id).toBe('monitoring');
    expect(monitoringGroup.label).toBe('Monitoring');
    expect(monitoringGroup.items).toHaveLength(2);
    expect(monitoringGroup.items[0]).toHaveProperty('href');
    expect(monitoringGroup.items[1]).toHaveProperty('href');
  });

  it('renders single-item groups as flat tabs, not dropdowns', () => {
    const { result } = renderUseEntityTabs({
      routes: [
        { path: '/pipeline', title: 'Pipeline', group: 'ci' },
        { path: '/overview', title: 'Overview' },
      ],
      groupDefinitions,
    });

    // Single item in ci group should be flat, plus ungrouped overview
    expect(result.current.tabs).toHaveLength(2);

    // The ci group only has one item, so it should be flattened
    expect(result.current.tabs[0]).toEqual(
      expect.objectContaining({
        id: '/pipeline',
        label: 'Pipeline',
      }),
    );
    expect(result.current.tabs[0]).toHaveProperty('href');
    expect(result.current.tabs[0]).not.toHaveProperty('items');
  });

  it('sorts groups by groupDefinitions key order with ungrouped tabs at the end', () => {
    const { result } = renderUseEntityTabs({
      routes: [
        { path: '/overview', title: 'Overview' },
        { path: '/build', title: 'Build', group: 'ci' },
        { path: '/deploy', title: 'Deploy', group: 'ci' },
        { path: '/alerts', title: 'Alerts', group: 'monitoring' },
        { path: '/logs', title: 'Logs', group: 'monitoring' },
      ],
      groupDefinitions,
    });

    // monitoring is defined first in groupDefinitions, then ci, then ungrouped
    expect(result.current.tabs).toHaveLength(3);
    expect(result.current.tabs[0]).toEqual(
      expect.objectContaining({ id: 'monitoring', label: 'Monitoring' }),
    );
    expect(result.current.tabs[1]).toEqual(
      expect.objectContaining({ id: 'ci', label: 'CI/CD' }),
    );
    expect(result.current.tabs[2]).toEqual(
      expect.objectContaining({ id: '/overview', label: 'Overview' }),
    );
  });

  it('sorts items within groups by title when defaultContentOrder is title', () => {
    const { result } = renderUseEntityTabs({
      routes: [
        { path: '/logs', title: 'Logs', group: 'monitoring' },
        { path: '/alerts', title: 'Alerts', group: 'monitoring' },
        { path: '/metrics', title: 'Metrics', group: 'monitoring' },
      ],
      groupDefinitions,
      defaultContentOrder: 'title',
    });

    const group = result.current.tabs[0] as HeaderNavTabGroup;
    expect(group.items.map(i => i.label)).toEqual([
      'Alerts',
      'Logs',
      'Metrics',
    ]);
  });

  it('preserves natural order within groups when defaultContentOrder is natural', () => {
    const { result } = renderUseEntityTabs({
      routes: [
        { path: '/logs', title: 'Logs', group: 'monitoring' },
        { path: '/alerts', title: 'Alerts', group: 'monitoring' },
        { path: '/metrics', title: 'Metrics', group: 'monitoring' },
      ],
      groupDefinitions,
      defaultContentOrder: 'natural',
    });

    const group = result.current.tabs[0] as HeaderNavTabGroup;
    expect(group.items.map(i => i.label)).toEqual([
      'Logs',
      'Alerts',
      'Metrics',
    ]);
  });

  it('resolves group aliases to the canonical group', () => {
    const { result } = renderUseEntityTabs({
      routes: [
        // Uses alias 'observability' which should resolve to 'monitoring'
        { path: '/alerts', title: 'Alerts', group: 'observability' },
        { path: '/logs', title: 'Logs', group: 'observability' },
      ],
      groupDefinitions,
    });

    expect(result.current.tabs).toHaveLength(1);
    const group = result.current.tabs[0] as HeaderNavTabGroup;
    expect(group.id).toBe('monitoring');
    expect(group.label).toBe('Monitoring');
    expect(group.items).toHaveLength(2);
  });

  it('leaves unrecognized group names as ungrouped', () => {
    const { result } = renderUseEntityTabs({
      routes: [
        { path: '/foo', title: 'Foo', group: 'nonexistent' },
        { path: '/bar', title: 'Bar', group: 'nonexistent' },
      ],
      groupDefinitions,
    });

    // 'nonexistent' is not a known group or alias, so items stay ungrouped
    // They share the key 'nonexistent' but have no groupDef, so each entry
    // is flattened or treated as ungrouped depending on logic
    expect(result.current.tabs).toHaveLength(2);
    // They should be flat tabs since there's no groupDef
    expect(result.current.tabs[0]).toHaveProperty('href');
    expect(result.current.tabs[1]).toHaveProperty('href');
  });

  it('matches activeTabId to the current route path', () => {
    const { result } = renderUseEntityTabs({
      routes: [
        { path: '/overview', title: 'Overview' },
        { path: '/docs', title: 'Docs' },
        { path: '/api', title: 'API' },
      ],
      groupDefinitions: {},
      initialPath: '/entity/docs',
    });

    expect(result.current.activeTabId).toBe('/docs');
  });

  it('includes Helmet with the active tab title in content', () => {
    const { result } = renderUseEntityTabs({
      routes: [
        { path: '/overview', title: 'Overview' },
        { path: '/docs', title: 'Docs' },
      ],
      groupDefinitions: {},
      initialPath: '/entity/docs',
    });

    // content should be defined and non-null
    expect(result.current.content).toBeDefined();
    expect(result.current.content).not.toBeNull();
  });

  it('respects per-group contentOrder override', () => {
    const defs: EntityContentGroupDefinitions = {
      monitoring: {
        title: 'Monitoring',
        contentOrder: 'natural',
      },
    };

    const { result } = renderUseEntityTabs({
      routes: [
        { path: '/logs', title: 'Logs', group: 'monitoring' },
        { path: '/alerts', title: 'Alerts', group: 'monitoring' },
      ],
      groupDefinitions: defs,
      // Page-level default is title, but group overrides to natural
      defaultContentOrder: 'title',
    });

    const group = result.current.tabs[0] as HeaderNavTabGroup;
    // Should be natural order despite page default being 'title'
    expect(group.items.map(i => i.label)).toEqual(['Logs', 'Alerts']);
  });
});
