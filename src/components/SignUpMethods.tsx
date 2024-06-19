import { useState } from 'react';
import StytchOTP from './StytchOTP';
import AuthMethods from './AuthMethods';

interface SignUpProps {
  handleGoogleLogin: () => Promise<void>;
  handleDiscordLogin: () => Promise<void>;
  authWithEthWallet: any;
  registerWithWebAuthn: any;
  authWithWebAuthn: any;
  authWithStytch: any;
  goToLogin: any;
  error?: Error;
}

type AuthView = 'default' | 'email' ;

export default function SignUpMethods({
  authWithStytch,
  goToLogin,
  error,
}: SignUpProps) {
  const [view, setView] = useState<AuthView>('default');

  return (
    <div className="container">
      <div className="wrapper">
        {error && (
          <div className="alert alert--error">
            <p>{error.message}</p>
          </div>
        )}
        {view === 'default' && (
          <>
            <h1>Get started</h1>
            <p>
              Create a wallet that is secured by accounts you already have. With
              Lit-powered programmable MPC wallets, you won&apos;t have to worry
              about seed phrases.
            </p>
            <AuthMethods
              setView={setView}
            />
            <div className="buttons-container">
              <button
                type="button"
                className="btn btn--link"
                onClick={goToLogin}
              >
                Have an account? Log in
              </button>
            </div>
          </>
        )}
        {view === 'email' && (
          <StytchOTP
            method={'email'}
            authWithStytch={authWithStytch}
            setView={setView}
          />
        )}
      </div>
    </div>
  );
}
