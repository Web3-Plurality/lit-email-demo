import Image from 'next/image';

interface AuthMethodsProps {
  handleGoogleLogin: () => Promise<void>;
  handleDiscordLogin: () => Promise<void>;
  setView: React.Dispatch<React.SetStateAction<string>>;
}

const AuthMethods = ({
  setView,
}: AuthMethodsProps) => {
  return (
    <>
      <div className="buttons-container">
        <div className="social-container">
        </div>
        <button
          type="button"
          className="btn btn--outline"
          onClick={() => setView('email')}
        >
          <div className="btn__icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <span className="btn__label">Continue with email</span>
        </button>
      </div>
    </>
  );
};

export default AuthMethods;
