import {
  DiscordProvider,
  GoogleProvider,
  EthWalletProvider,
  WebAuthnProvider,
  LitAuthClient,
  BaseProvider,
} from '@lit-protocol/lit-auth-client';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import {
  AuthMethodScope,
  AuthMethodType,
  ProviderType,
} from '@lit-protocol/constants';
import {
  AuthMethod,
  GetSessionSigsProps,
  IRelayPKP,
  SessionSigs,
  AuthCallbackParams,
} from '@lit-protocol/types';

export const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || 'localhost';
export const ORIGIN =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? `https://${DOMAIN}`
    : `http://${DOMAIN}:3000`;

export const litNodeClient: LitNodeClient = new LitNodeClient({
  litNetwork: 'habanero',
  checkNodeAttestation: true,
});

export const litAuthClient: LitAuthClient = new LitAuthClient({
  litRelayConfig: {
    relayApiKey: 'a018f989-fb99-4691-b107-bd50baa57bb6_hirasiddiqui95',
  },
  litNodeClient,
});

/**
 * Get auth method object by validating Stytch JWT
 */
export async function authenticateWithStytch(
  accessToken: string,
  userId?: string,
  method?: string
) {
  let provider: BaseProvider
  if (method === "email") {
    provider = litAuthClient.initProvider(ProviderType.StytchEmailFactorOtp, {
      appId: process.env.NEXT_PUBLIC_STYTCH_PROJECT_ID,
    });
  } else {
    provider = litAuthClient.initProvider(ProviderType.StytchSmsFactorOtp, {
      appId: process.env.NEXT_PUBLIC_STYTCH_PROJECT_ID
    });
  }

  // @ts-ignore
  const authMethod = await provider?.authenticate({ accessToken, userId });
  return authMethod;
}

/**
 * Generate session sigs for given params
 */
export async function getSessionSigs({
  pkpPublicKey,
  authMethod,
  sessionSigsParams,
}: {
  pkpPublicKey: string;
  authMethod: AuthMethod;
  sessionSigsParams: GetSessionSigsProps;
}): Promise<SessionSigs> {
  const provider = getProviderByAuthMethod(authMethod);
  if (provider) {
    const sessionSigs = await provider.getSessionSigs({
      pkpPublicKey,
      authMethod,
      sessionSigsParams,
    });
    return sessionSigs;
  } else {
    throw new Error(
      `Provider not found for auth method type ${authMethod.authMethodType}`
    );
  }
}

export async function updateSessionSigs(
  params: GetSessionSigsProps
): Promise<SessionSigs> {
  const sessionSigs = await litNodeClient.getSessionSigs(params);
  return sessionSigs;
}

/**
 * Fetch PKPs associated with given auth method
 */
export async function getPKPs(authMethod: AuthMethod): Promise<IRelayPKP[]> {
  const provider = getProviderByAuthMethod(authMethod);
  const allPKPs = await provider.fetchPKPsThroughRelayer(authMethod);
  return allPKPs;
}

/**
 * Mint a new PKP for current auth method
 */
export async function mintPKP(authMethod: AuthMethod): Promise<IRelayPKP> {
  const provider = getProviderByAuthMethod(authMethod);
  // Set scope of signing any data
  const options = {
    permittedAuthMethodScopes: [[AuthMethodScope.SignAnything]],
  };

  let txHash: string;

  if (authMethod.authMethodType === AuthMethodType.WebAuthn) {
    // Register new WebAuthn credential
    const webAuthnInfo = await (provider as WebAuthnProvider).register();

    // Verify registration and mint PKP through relay server
    txHash = await (
      provider as WebAuthnProvider
    ).verifyAndMintPKPThroughRelayer(webAuthnInfo, options);
  } else {
    // Mint PKP through relay server
    txHash = await provider.mintPKPThroughRelayer(authMethod, options);
  }

  const response = await provider.relay.pollRequestUntilTerminalState(txHash);
  if (response.status !== 'Succeeded') {
    throw new Error('Minting failed');
  }
  const newPKP: IRelayPKP = {
    tokenId: response.pkpTokenId,
    publicKey: response.pkpPublicKey,
    ethAddress: response.pkpEthAddress,
  };
  return newPKP;
}

/**
 * Get provider for given auth method
 */
function getProviderByAuthMethod(authMethod: AuthMethod) {
  switch (authMethod.authMethodType) {
    case AuthMethodType.GoogleJwt:
      return litAuthClient.getProvider(ProviderType.Google);
    case AuthMethodType.Discord:
      return litAuthClient.getProvider(ProviderType.Discord);
    case AuthMethodType.EthWallet:
      return litAuthClient.getProvider(ProviderType.EthWallet);
    case AuthMethodType.WebAuthn:
      return litAuthClient.getProvider(ProviderType.WebAuthn);
    case AuthMethodType.StytchEmailFactorOtp:
      return litAuthClient.getProvider(ProviderType.StytchEmailFactorOtp);
    case AuthMethodType.StytchSmsFactorOtp:
      return litAuthClient.getProvider(ProviderType.StytchSmsFactorOtp);
    default:
      return;
  }
}
