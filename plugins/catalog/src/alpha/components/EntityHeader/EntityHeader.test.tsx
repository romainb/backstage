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

import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import {
  renderInTestApp,
  TestApiProvider,
} from '@backstage/frontend-test-utils';
import {
  AsyncEntityProvider,
  MockStarredEntitiesApi,
  starredEntitiesApiRef,
} from '@backstage/plugin-catalog-react';
import { EntityHeader } from './EntityHeader';

const entityMock = {
  apiVersion: 'backstage.io/v1alpha1' as const,
  kind: 'Component',
  metadata: {
    name: 'artist-lookup',
    namespace: 'default',
    uid: 'some-uid',
  },
  spec: { type: 'service' },
};

function Wrapper(props: {
  entity?: typeof entityMock;
  loading?: boolean;
  tabs?: React.ComponentProps<typeof EntityHeader>['tabs'];
  activeTabId?: string;
  children?: React.ReactNode;
}) {
  const { entity, loading = false, tabs, activeTabId } = props;
  return (
    <TestApiProvider
      apis={[[starredEntitiesApiRef, new MockStarredEntitiesApi()]]}
    >
      <AsyncEntityProvider entity={entity} loading={loading}>
        <Routes>
          <Route
            path=":kind/:namespace/:name/*"
            element={<EntityHeader tabs={tabs} activeTabId={activeTabId} />}
          />
        </Routes>
      </AsyncEntityProvider>
    </TestApiProvider>
  );
}

describe('EntityHeader', () => {
  it('renders entity name as header title and shows favorite/context menu when entity is loaded', async () => {
    await renderInTestApp(<Wrapper entity={entityMock} />, {
      initialRouteEntries: ['/Component/default/artist-lookup'],
    });

    expect(
      await screen.findByRole('heading', { level: 2, name: 'artist-lookup' }),
    ).toBeInTheDocument();

    // Favorite button is shown
    expect(
      screen.getByRole('button', { name: 'Add to favorites' }),
    ).toBeInTheDocument();

    // Context menu trigger is shown
    expect(
      screen.getByRole('button', { name: 'More actions' }),
    ).toBeInTheDocument();
  });

  it('renders fallback title from route params when entity is not loaded and hides actions', async () => {
    await renderInTestApp(<Wrapper loading />, {
      initialRouteEntries: ['/Component/default/artist-lookup'],
    });

    // Falls back to "kind:namespace/name" formatted ref
    expect(
      await screen.findByRole('heading', { level: 2 }),
    ).toBeInTheDocument();

    // No favorite or context menu when entity is undefined
    expect(
      screen.queryByRole('button', { name: 'Add to favorites' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'More actions' }),
    ).not.toBeInTheDocument();
  });

  it('passes tabs to BUI Header and renders them as navigation links', async () => {
    const tabs = [
      { id: 'overview', label: 'Overview', href: '/overview' },
      { id: 'techdocs', label: 'TechDocs', href: '/techdocs' },
    ];

    await renderInTestApp(
      <Wrapper entity={entityMock} tabs={tabs} activeTabId="overview" />,
      {
        initialRouteEntries: ['/Component/default/artist-lookup'],
      },
    );

    const nav = await screen.findByRole('navigation', {
      name: /Content navigation/,
    });
    expect(nav).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Overview/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /TechDocs/ })).toBeInTheDocument();

    // The active tab should have aria-current="page"
    expect(screen.getByRole('link', { name: /Overview/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('opens InspectEntityDialog when ?inspect search param is present', async () => {
    await renderInTestApp(<Wrapper entity={entityMock} />, {
      initialRouteEntries: ['/Component/default/artist-lookup?inspect'],
    });

    // The dialog should be open — look for the dialog element
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
