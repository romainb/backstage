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

import { screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import {
  TestApiProvider,
  renderInTestApp,
  mockApis,
} from '@backstage/test-utils';
import { permissionApiRef } from '@backstage/plugin-permission-react';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { createComponentRouteRef } from '../../routes';
import { CreateButtonAction } from './CreateButtonAction';

describe('CreateButtonAction', () => {
  it('renders a link to the create component route when permission is allowed', async () => {
    await renderInTestApp(
      <SWRConfig value={{ provider: () => new Map() }}>
        <TestApiProvider apis={[[permissionApiRef, mockApis.permission()]]}>
          <CreateButtonAction />
        </TestApiProvider>
      </SWRConfig>,
      {
        mountedRoutes: {
          '/create': createComponentRouteRef,
        },
      },
    );

    const link = await screen.findByRole('link', { name: 'Create' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/create');
  });

  it('returns null when permission is not allowed', async () => {
    const { container } = await renderInTestApp(
      <SWRConfig value={{ provider: () => new Map() }}>
        <TestApiProvider
          apis={[
            [
              permissionApiRef,
              mockApis.permission({ authorize: AuthorizeResult.DENY }),
            ],
          ]}
        >
          <CreateButtonAction />
        </TestApiProvider>
      </SWRConfig>,
      {
        mountedRoutes: {
          '/create': createComponentRouteRef,
        },
      },
    );

    // Wait for permission check to resolve
    await waitFor(() => {
      expect(container.querySelector('a')).not.toBeInTheDocument();
    });
  });
});
