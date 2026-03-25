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

import { type Entity } from '@backstage/catalog-model';
import { useStarredEntity } from '@backstage/plugin-catalog-react';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';
import { ButtonIcon, VisuallyHidden } from '@backstage/ui';
import { RiStarLine, RiStarFill } from '@remixicon/react';
import { catalogTranslationRef } from '../../translation';

/** @alpha */
export function FavoriteEntity(props: { entity: Entity }) {
  const { entity } = props;
  const { toggleStarredEntity, isStarredEntity } = useStarredEntity(entity);
  const { t } = useTranslationRef(catalogTranslationRef);

  return (
    <>
      <VisuallyHidden aria-live="polite">
        {isStarredEntity
          ? t('favoriteEntity.addedStatus')
          : t('favoriteEntity.removedStatus')}
      </VisuallyHidden>
      <ButtonIcon
        variant="secondary"
        icon={isStarredEntity ? <RiStarFill /> : <RiStarLine />}
        aria-label={
          isStarredEntity
            ? t('favoriteEntity.removeLabel')
            : t('favoriteEntity.addLabel')
        }
        aria-pressed={isStarredEntity}
        onPress={toggleStarredEntity}
      />
    </>
  );
}
