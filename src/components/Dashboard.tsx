import { AccessControlConditions, IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { ethers } from 'ethers';
import { useState } from 'react';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { useRouter } from 'next/router';
import { useDisconnect } from 'wagmi';
import { litNodeClient } from '../utils/lit';
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { useBalance } from 'wagmi'



interface DashboardProps {
  currentAccount: IRelayPKP;
  sessionSigs: SessionSigs;
}

export default function Dashboard({
  currentAccount,
  sessionSigs,
}: DashboardProps) {
  const [message, setMessage] = useState<string>('Free the web!');
  const [encMessage, setEncMessage] = useState<string>('');
  const [decMessage, setDecMessage] = useState<string>('');

  const [dataToEncHash, setDataToEncHash] = useState<string>('');

  const [signature, setSignature] = useState<string>();
  const [recoveredAddress, setRecoveredAddress] = useState<string>();
  const [verified, setVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  const { disconnectAsync } = useDisconnect();
  const router = useRouter();

  const { data: balance, isError, isLoading } = useBalance({
    address: `0x${currentAccount.ethAddress.slice(2)}`,
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID)
  });

  const accessControlConditions: AccessControlConditions = [
    {
      contractAddress: "",
      standardContractType: "",
      chain: "ethereum", // todo: this needs to be ethereum otherwise throws an error! Need to see
      method: "eth_getBalance",
      parameters: [":userAddress", "latest"],
      returnValueTest: {
        comparator: ">=",
        value: "0", // 0 ETH
      },
    },
  ];

  /**
   * Sign a message with current PKP
   */
  async function signMessageWithPKP() {
    setLoading(true);

    try {
      const pkpWallet = new PKPEthersWallet({
        controllerSessionSigs: sessionSigs,
        pkpPubKey: currentAccount.publicKey,
        litNetwork: 'habanero',
        debug: true
      });
      await pkpWallet.init();

      const signature = await pkpWallet.signMessage(message);
      setSignature(signature);

      // Get the address associated with the signature created by signing the message
      const recoveredAddr = ethers.utils.verifyMessage(message, signature);
      setRecoveredAddress(recoveredAddr);

      // Check if the address associated with the signature is the same as the current PKP
      const verified =
        currentAccount.ethAddress.toLowerCase() === recoveredAddr.toLowerCase();
      setVerified(verified);
    } catch (err) {
      console.error(err);
      setError(err);
    }

    setLoading(false);
  }

  /**
   * Sign a message with current PKP
   */
  async function encryptMessageWithPKP() {
    setLoading(true);
    
    
    try {
      // Encrypt the message
      const { ciphertext, dataToEncryptHash } = await LitJsSdk.encryptString(
        {
          accessControlConditions,
          dataToEncrypt: message,
          chain: process.env.NEXT_PUBLIC_CHAIN_NAME,
          sessionSigs: sessionSigs
        },
        litNodeClient,
      );
      setEncMessage(ciphertext);
      setDataToEncHash(dataToEncryptHash);
      setLoading(false);

      // Return the ciphertext and dataToEncryptHash
      return {
        ciphertext,
        dataToEncryptHash,
      };
    } catch (err) {
      console.error(err);
      setError(err);
    }

    setLoading(false);
  }

  
  /**
   * Sign a message with current PKP
   */
  async function decryptMessageWithPKP() {
    setLoading(true);
    
    
    try {
      console.log("Enc string: ", encMessage);
      console.log("Data to encrypt hash: ", dataToEncHash);
      // Encrypt the message
      const decryptedMessage  = await LitJsSdk.decryptToString(
        {
          accessControlConditions,
          ciphertext: encMessage,
          dataToEncryptHash: dataToEncHash,
          chain: process.env.NEXT_PUBLIC_CHAIN_NAME,
          sessionSigs: sessionSigs
        },
        litNodeClient,
      );
      setDecMessage(decryptedMessage);
      setLoading(false);

      // Return the ciphertext and dataToEncryptHash
      return {
        decryptedMessage
      };
    } catch (err) {
      console.error(err);
      setError(err);
    }

    setLoading(false);
  }

  async function sendTokens() {
    try {

      const pkpWallet = new PKPEthersWallet({
        controllerSessionSigs: sessionSigs,
        pkpPubKey: currentAccount.publicKey,
        litNetwork: 'habanero',
        debug: true,
        rpc: process.env.NEXT_PUBLIC_CHAIN_RPC
      });
      await pkpWallet.init();

      const tx: ethers.providers.TransactionRequest = {
        to: "0xD2a203D54845dcF9EBcBF1620dfCd567b323EBf1",
        value: ethers.utils.parseEther("0.0000001"),
      }
      // -- Sign Transaction
      const signedTx = await pkpWallet.signTransaction(tx);
      console.log("signedTx:", signedTx);

      const tx_response = await pkpWallet.sendTransaction(signedTx);
      console.log(tx_response);
    }
    catch(e) {
      console.log(e);
    }
  }

  async function handleLogout() {
    try {
      await disconnectAsync();
    } catch (err) {}
    localStorage.removeItem('lit-wallet-sig');
    router.reload();
  }

  return (
    <div className="container">
      <div className="logout-container">
        <button className="btn btn--link" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <h1>Ready for the open web</h1>
      <div className="details-card">
        <p>My address: {currentAccount.ethAddress.toLowerCase()}</p>
      </div>
      <div className="divider"></div>
      <div className="message-card">
        <p>Test out your wallet by signing this message:</p>
        <p className="message-card__prompt">{message}</p>
        <button
          onClick={signMessageWithPKP}
          disabled={loading}
          className={`btn ${
            signature ? (verified ? 'btn--success' : 'btn--error') : ''
          } ${loading && 'btn--loading'}`}
        >
          {signature ? (
            verified ? (
              <span>Verified ✓</span>
            ) : (
              <span>Failed x</span>
            )
          ) : (
            <span>Sign message</span>
          )}
        </button>



        <p>Encrypted message</p>
        <p className="message-card__prompt">{encMessage}</p>
        <button
          onClick={encryptMessageWithPKP}
          disabled={loading}
        >
          <span>Encrypt message</span>
        </button>

        <p>Decrypted message</p>
        <p className="message-card__prompt">{decMessage}</p>
        <button
          onClick={decryptMessageWithPKP}
          disabled={loading}
        >
          <span>Decrypt message</span>
        </button>


        <p>Balance on {process.env.NEXT_PUBLIC_CHAIN_NAME} chain</p>
        <p className="message-card__prompt">{balance?.formatted}</p>
        <button
          onClick={sendTokens}
          disabled={loading}
        >
          <span>Send 0.001 token</span>
        </button>


      </div>
    </div>
  );
}
