import { useCallback, useEffect, useState } from 'react';
import { AuthMethod } from '@lit-protocol/types';
import {
  authenticateWithStytch,
} from '../utils/lit';
import { useConnect } from 'wagmi';

export default function useAuthenticate(redirectUri?: string) {
  const [authMethod, setAuthMethod] = useState<AuthMethod>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  // wagmi hook
  const { connectAsync } = useConnect({
    onError: (err: unknown) => {
      setError(err as Error);
    },
  });

  /**
   * Authenticate with Stytch
   */
  const authWithStytch = useCallback(
    async (accessToken: string, userId?: string, method?: string): Promise<void> => {
      setLoading(true);
      setError(undefined);
      setAuthMethod(undefined);

      try {
        const result: AuthMethod = (await authenticateWithStytch(
          accessToken,
          userId,
          method
        )) as any;
        setAuthMethod(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    authWithStytch,
    authMethod,
    loading,
    error,
  };
}
