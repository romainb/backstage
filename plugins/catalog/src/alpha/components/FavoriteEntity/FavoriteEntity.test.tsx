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
import userEvent from '@testing-library/user-event';
import {
  renderInTestApp,
  TestApiProvider,
} from '@backstage/frontend-test-utils';
import {
  MockStarredEntitiesApi,
  starredEntitiesApiRef,
} from '@backstage/plugin-catalog-react';
import { FavoriteEntity } from './FavoriteEntity';

const entity = {
  apiVersion: 'backstage.io/v1alpha1' as const,
  kind: 'Component',
  metadata: { name: 'test-entity', namespace: 'default' },
  spec: { type: 'service' },
};

describe('FavoriteEntity', () => {
  it('renders as not starred and toggles to starred on click', async () => {
    await renderInTestApp(
      <TestApiProvider
        apis={[[starredEntitiesApiRef, new MockStarredEntitiesApi()]]}
      >
        <FavoriteEntity entity={entity} />
      </TestApiProvider>,
    );

    const button = screen.getByRole('button', { name: 'Add to favorites' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Removed from favorites')).toBeInTheDocument();

    await userEvent.click(button);

    const starredButton = screen.getByRole('button', {
      name: 'Remove from favorites',
    });
    expect(starredButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Added to favorites')).toBeInTheDocument();
  });

  it('renders as starred when entity is already starred and toggles off', async () => {
    const starredEntities = new MockStarredEntitiesApi();
    await starredEntities.toggleStarred('component:default/test-entity');

    await renderInTestApp(
      <TestApiProvider apis={[[starredEntitiesApiRef, starredEntities]]}>
        <FavoriteEntity entity={entity} />
      </TestApiProvider>,
    );

    const button = await screen.findByRole('button', {
      name: 'Remove from favorites',
    });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Added to favorites')).toBeInTheDocument();

    await userEvent.click(button);

    const unstarredButton = screen.getByRole('button', {
      name: 'Add to favorites',
    });
    expect(unstarredButton).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Removed from favorites')).toBeInTheDocument();
  });
});
