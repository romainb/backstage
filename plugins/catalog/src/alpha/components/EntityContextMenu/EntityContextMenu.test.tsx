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
import { EntityContextMenu } from './EntityContextMenu';
import { MenuItem } from '@backstage/ui';

function TestIcon() {
  return <svg data-testid="test-icon" />;
}

describe('EntityContextMenu', () => {
  it('renders the trigger button and opens menu with contextMenuItems', async () => {
    await renderInTestApp(
      <TestApiProvider apis={[]}>
        <EntityContextMenu
          contextMenuItems={[
            <MenuItem key="a">Item A</MenuItem>,
            <MenuItem key="b">Item B</MenuItem>,
          ]}
        />
      </TestApiProvider>,
    );

    const trigger = screen.getByRole('button', { name: 'More actions' });
    expect(trigger).toBeInTheDocument();

    await userEvent.click(trigger);

    expect(
      screen.getByRole('menuitem', { name: 'Item A' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Item B' }),
    ).toBeInTheDocument();
  });

  it('renders extra context menu items with separator', async () => {
    const onClick = jest.fn();

    await renderInTestApp(
      <TestApiProvider apis={[]}>
        <EntityContextMenu
          UNSTABLE_extraContextMenuItems={[
            { title: 'Extra Action', Icon: TestIcon, onClick },
          ]}
          contextMenuItems={[<MenuItem key="a">Regular Item</MenuItem>]}
        />
      </TestApiProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));

    expect(
      screen.getByRole('menuitem', { name: 'Extra Action' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Regular Item' }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Extra Action' }),
    );
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render separator when no extra items are provided', async () => {
    await renderInTestApp(
      <TestApiProvider apis={[]}>
        <EntityContextMenu
          contextMenuItems={[<MenuItem key="a">Only Item</MenuItem>]}
        />
      </TestApiProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));

    expect(
      screen.getByRole('menuitem', { name: 'Only Item' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });
});
