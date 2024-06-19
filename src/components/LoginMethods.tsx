import { useState } from 'react';
import AuthMethods from './AuthMethods';
import StytchOTP from './StytchOTP';

interface LoginProps {
  handleGoogleLogin: () => Promise<void>;
  handleDiscordLogin: () => Promise<void>;
  authWithEthWallet: any;
  authWithWebAuthn: any;
  authWithStytch: any;
  signUp: any;
  error?: Error;
}

type AuthView = 'default' | 'email' ;

export default function LoginMethods({
  authWithStytch,
  signUp,
  error,
}: LoginProps) {
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
            <h1>Welcome back</h1>
            <p>Access your Lit wallet.</p>
            <AuthMethods
              setView={setView}
            />
            <div className="buttons-container">
              <button type="button" className="btn btn--link" onClick={signUp}>
                Need an account? Sign up
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
