import { useCallback, useState } from 'react';
import { AuthCallbackParams, AuthMethod } from '@lit-protocol/types';
import { getSessionSigs, litNodeClient } from '../utils/lit';
import { LitAbility, LitActionResource, LitPKPResource } from '@lit-protocol/auth-helpers';
import { IRelayPKP } from '@lit-protocol/types';
import { SessionSigs } from '@lit-protocol/types';
import { ethers } from 'ethers';

export default function useSession() {
  const [sessionSigs, setSessionSigs] = useState<SessionSigs>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();
 
    
  /**
   * Generate session sigs and store new session data
   */
  const initSession = useCallback(
    async (authMethod: AuthMethod, pkp: IRelayPKP): Promise<void> => {
      setLoading(true);
      setError(undefined);
      try {

        const ownerPrivateKey = process.env.NEXT_DAPP_OWNER_WALLET_PRIVATE_KEY || ''; // not working
        console.log(ownerPrivateKey);
        // owner wallet which has the capacity NFT
        const DAPP_OWNER_WALLET = new ethers.Wallet(process.env.NEXT_PUBLIC_DAPP_OWNER_WALLET_PRIVATE_KEY);
        // create capacity nft delegation
        const { capacityDelegationAuthSig } =
        await litNodeClient.createCapacityDelegationAuthSig({
          uses: process.env.NEXT_PUBLIC_NUMBER_OF_DELEGATED_OPERATIONS,
          dAppOwnerWallet: DAPP_OWNER_WALLET,
          capacityTokenId: process.env.NEXT_PUBLIC_CAPACITY_TOKEN_ID,
          delegateeAddresses: [pkp.ethAddress],
          domain:window.location.host
        });

        console.log("Capacity NFT created");

        const sessionSigs = await litNodeClient.getPkpSessionSigs({
          pkpPublicKey: pkp.publicKey!,
          capabilityAuthSigs: [capacityDelegationAuthSig],
          authMethods: [authMethod],
          resourceAbilityRequests: [
            {
              resource: new LitPKPResource("*"),
              ability: LitAbility.PKPSigning,
            },
          ],
          expiration: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week
        });
        console.log("✅ Got PKP Session Sigs");

        setSessionSigs(sessionSigs);

      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    initSession,
    sessionSigs,
    loading,
    error,
  };
}
