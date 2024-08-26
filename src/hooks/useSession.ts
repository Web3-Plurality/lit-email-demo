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

        /*const pkpAuthNeededCallback = async (params:AuthCallbackParams) => {
          console.log(params.expiration);
          console.log(params.resources);
          console.log(params.resourceAbilityRequests);
          console.log(params.statement);
          // -- validate
          if (!params.expiration) {
            throw new Error('expiration is required');
          }
  
          if (!params.resources) {
            throw new Error('resources is required');
          }

          if (!params.resourceAbilityRequests) {
            throw new Error('resource abilities required');
          }
  
          try {
          const response = await litNodeClient.signSessionKey({
            statement: params.statement,
            authMethods: [authMethod],  // authMethods for signing the sessionSigs
            pkpPublicKey: pkp.publicKey,  // public key of the wallet which is delegated
            expiration: params.expiration,
            resources: params.resources,
            //domain: window.location.host,
            //chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID),
            //resourceAbilityRequests: params.resourceAbilityRequests,

          });
          console.log(response);
          return response.authSig;
          }
          catch (error)
          {
            throw error;
          }
        };
        
        // Prepare session sigs params
        const chain = process.env.NEXT_PUBLIC_CHAIN_NAME;
        const resourceAbilities = [
          {
            resource: new LitActionResource('*'),
            ability: LitAbility.PKPSigning,
          }
        ];
        const expiration = new Date(
          Date.now() + 1000 * 60 * 60 * 24 * 7
        ).toISOString(); // 1 week


        console.log("Calling getsessionsigs");
        // Generate session sigs
        const sessionSigs = await getSessionSigs({
          pkpPublicKey: pkp.publicKey,
          authMethod,
          //@ts-ignore
          sessionSigsParams: {
            chain,
            expiration,
            resourceAbilityRequests: resourceAbilities,
            authNeededCallback: pkpAuthNeededCallback,
            capacityDelegationAuthSig,
          },
        });

        console.log("Calling getsessionsigs DONE");*/

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
          expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
        });
        console.log("✅ Got PKP Session Sigs");

        setSessionSigs(sessionSigs);


        // try signing via lit action --> works
        /*const res = await litNodeClient.executeJs({
          sessionSigs: sessionSigs,
          code: `(async () => {
              const sigShare = await LitActions.signEcdsa({
                toSign: dataToSign,
                publicKey,
                sigName: "sig",
              });
            })();`,
          authMethods: [],
          jsParams: {     // parameters to js function above
            dataToSign: ethers.utils.arrayify(
              ethers.utils.keccak256([1, 2, 3, 4, 5])
            ),
            publicKey: pkp.publicKey,
          },
        });
      
        console.log("signature result ", res); // ----> This works

        const pkpWallet = new PKPEthersWallet({
          controllerSessionSigs: sessionSigs,
          pkpPubKey: pkp.publicKey,
          litNetwork: 'habanero',
          debug: true
        });
        await pkpWallet.init();
  
        const signature = await pkpWallet.signMessage('Free the web!');  // -----> this returns timeout
        console.log(signature);*/

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
