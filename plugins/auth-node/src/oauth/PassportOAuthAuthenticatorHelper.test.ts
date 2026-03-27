/*
 * Copyright 2020 The Backstage Authors
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

import { generateKeyPair, SignJWT } from 'jose';
import { Strategy } from 'passport';
import { PassportHelpers, PassportProfile } from '../passport';
import { PassportOAuthAuthenticatorHelper } from './PassportOAuthAuthenticatorHelper';

class FailureStrategy extends Strategy {
  public override authenticate(_: any, __: any) {
    this.error(new Error('failure'));
  }
}

class NoopStrategy extends Strategy {
  public override authenticate() {}
}

describe('PassportOAuthAuthenticatorHelper', () => {
  describe('start', () => {
    it('should gracefully handle errors if unable to start', async () => {
      const helper = PassportOAuthAuthenticatorHelper.from(
        new FailureStrategy(),
      );
      await expect(helper.start({} as any, {})).rejects.toThrow(
        'Authentication failed, failure',
      );
    });
  });

  describe('authenticate', () => {
    it('should gracefully handle errors if unable to authenticate', async () => {
      const helper = PassportOAuthAuthenticatorHelper.from(
        new FailureStrategy(),
      );
      await expect(helper.authenticate({} as any, {})).rejects.toThrow(
        'Authentication failed, failure',
      );
    });
  });

  async function createIdToken(
    claims: Record<string, unknown>,
  ): Promise<string> {
    const { privateKey } = await generateKeyPair('ES256');
    return new SignJWT(claims)
      .setProtectedHeader({ alg: 'ES256' })
      .sign(privateKey);
  }

  describe('refresh', () => {
    const mockRefreshResult = {
      accessToken: 'access-token',
      refreshToken: 'new-refresh-token',
      params: {
        token_type: 'bearer',
        scope: 'openid email profile',
        expires_in: 3600,
        id_token: undefined as string | undefined,
      },
    };

    const mockFetchedProfile: PassportProfile = {
      provider: 'auth0',
      id: 'userinfo-sub',
      displayName: 'Userinfo Name',
      emails: [{ value: 'userinfo@example.com' }],
      photos: [{ value: 'https://example.com/userinfo-photo.jpg' }],
    };

    let executeRefreshSpy: jest.SpyInstance;
    let fetchProfileSpy: jest.SpyInstance;

    beforeEach(() => {
      executeRefreshSpy = jest
        .spyOn(PassportHelpers, 'executeRefreshTokenStrategy')
        .mockResolvedValue({
          ...mockRefreshResult,
          params: { ...mockRefreshResult.params },
        });
      fetchProfileSpy = jest
        .spyOn(PassportHelpers, 'executeFetchUserProfileStrategy')
        .mockResolvedValue(mockFetchedProfile);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should skip /userinfo when ID token has sufficient claims', async () => {
      const idToken = await createIdToken({
        sub: 'auth0|123',
        email: 'jane@example.com',
        name: 'Jane Doe',
        nickname: 'janedoe',
        picture: 'https://example.com/jane.jpg',
      });
      executeRefreshSpy.mockResolvedValue({
        ...mockRefreshResult,
        params: { ...mockRefreshResult.params, id_token: idToken },
      });

      const helper = PassportOAuthAuthenticatorHelper.from(new NoopStrategy());
      const result = await helper.refresh({
        refreshToken: 'refresh-token',
        scope: 'openid email profile',
        req: {} as any,
      });

      expect(fetchProfileSpy).not.toHaveBeenCalled();
      expect(result.fullProfile).toEqual(
        expect.objectContaining({
          provider: 'oauth2',
          id: 'auth0|123',
          displayName: 'Jane Doe',
          username: 'janedoe',
          emails: [{ value: 'jane@example.com' }],
          photos: [{ value: 'https://example.com/jane.jpg' }],
        }),
      );
      expect(result.session.idToken).toBe(idToken);
    });

    it('should fall back to /userinfo when ID token is missing', async () => {
      executeRefreshSpy.mockResolvedValue({
        ...mockRefreshResult,
        params: { ...mockRefreshResult.params, id_token: undefined },
      });

      const helper = PassportOAuthAuthenticatorHelper.from(new NoopStrategy());
      const result = await helper.refresh({
        refreshToken: 'refresh-token',
        scope: 'openid email profile',
        req: {} as any,
      });

      expect(fetchProfileSpy).toHaveBeenCalled();
      expect(result.fullProfile).toBe(mockFetchedProfile);
    });

    it('should fall back to /userinfo when ID token lacks email and name', async () => {
      const idToken = await createIdToken({ sub: 'auth0|123' });
      executeRefreshSpy.mockResolvedValue({
        ...mockRefreshResult,
        params: { ...mockRefreshResult.params, id_token: idToken },
      });

      const helper = PassportOAuthAuthenticatorHelper.from(new NoopStrategy());
      const result = await helper.refresh({
        refreshToken: 'refresh-token',
        scope: 'openid email profile',
        req: {} as any,
      });

      expect(fetchProfileSpy).toHaveBeenCalled();
      expect(result.fullProfile).toBe(mockFetchedProfile);
    });

    it('should fall back to /userinfo when ID token is malformed', async () => {
      executeRefreshSpy.mockResolvedValue({
        ...mockRefreshResult,
        params: { ...mockRefreshResult.params, id_token: 'not-a-jwt' },
      });

      const helper = PassportOAuthAuthenticatorHelper.from(new NoopStrategy());
      const result = await helper.refresh({
        refreshToken: 'refresh-token',
        scope: 'openid email profile',
        req: {} as any,
      });

      expect(fetchProfileSpy).toHaveBeenCalled();
      expect(result.fullProfile).toBe(mockFetchedProfile);
    });

    it('should include picture and username from ID token', async () => {
      const idToken = await createIdToken({
        sub: 'auth0|456',
        email: 'bob@example.com',
        name: 'Bob Smith',
        nickname: 'bobsmith',
        picture: 'https://example.com/bob.jpg',
      });
      executeRefreshSpy.mockResolvedValue({
        ...mockRefreshResult,
        params: { ...mockRefreshResult.params, id_token: idToken },
      });

      const helper = PassportOAuthAuthenticatorHelper.from(new NoopStrategy());
      const result = await helper.refresh({
        refreshToken: 'refresh-token',
        scope: 'openid email profile',
        req: {} as any,
      });

      expect(result.fullProfile.username).toBe('bobsmith');
      expect(result.fullProfile.photos).toEqual([
        { value: 'https://example.com/bob.jpg' },
      ]);
    });

    it('should use fallback chain for displayName when name is missing', async () => {
      const idToken = await createIdToken({
        sub: 'auth0|789',
        email: 'fallback@example.com',
      });
      executeRefreshSpy.mockResolvedValue({
        ...mockRefreshResult,
        params: { ...mockRefreshResult.params, id_token: idToken },
      });

      const helper = PassportOAuthAuthenticatorHelper.from(new NoopStrategy());
      const result = await helper.refresh({
        refreshToken: 'refresh-token',
        scope: 'openid email profile',
        req: {} as any,
      });

      expect(fetchProfileSpy).not.toHaveBeenCalled();
      expect(result.fullProfile.displayName).toBe('fallback@example.com');
    });
  });
});
