import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Mail, Rocket, UserRound } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

function modeFromPath(pathname: string): AuthMode {
  if (pathname.includes('register')) return 'register';
  if (pathname.includes('forgot-password')) return 'forgot';
  if (pathname.includes('reset-password')) return 'reset';
  return 'login';
}

function pathForMode(mode: AuthMode) {
  return {
    login: '/login',
    register: '/register',
    forgot: '/forgot-password',
    reset: '/reset-password',
  }[mode];
}

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (input: {
    name: string;
    email: string;
    password: string;
    workspaceName?: string;
  }) => Promise<void>;
  onForgotPassword: (email: string) => Promise<{ resetToken?: string; message: string }>;
  onResetPassword: (token: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function LoginScreen({
  onLogin,
  onRegister,
  onForgotPassword,
  onResetPassword,
  isLoading,
  error,
}: LoginScreenProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(() => modeFromPath(location.pathname));
  const [name, setName] = useState('Sarah Chen');
  const [workspaceName, setWorkspaceName] = useState('WorkSpace');
  const [email, setEmail] = useState('sarah.chen@company.com');
  const [password, setPassword] = useState('demo-password');
  const [confirmPassword, setConfirmPassword] = useState('demo-password');
  const [resetToken, setResetToken] = useState('');
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    setMode(modeFromPath(location.pathname));
    setInfo(null);
  }, [location.pathname]);

  const goToMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setInfo(null);
    navigate(pathForMode(nextMode));
  };

  const title = {
    login: 'Sign in to your workspace',
    register: 'Create your workspace',
    forgot: 'Recover your account',
    reset: 'Choose a new password',
  }[mode];

  const submit = async () => {
    setInfo(null);
    if ((mode === 'register' || mode === 'reset') && password !== confirmPassword) {
      setInfo('Passwords do not match.');
      return;
    }

    if (mode === 'login') await onLogin(email, password);
    if (mode === 'register') await onRegister({ name, email, password, workspaceName });
    if (mode === 'forgot') {
      const response = await onForgotPassword(email);
      setInfo(
        response.resetToken
          ? `${response.message} Dev reset token: ${response.resetToken}`
          : response.message,
      );
      if (response.resetToken) {
        setResetToken(response.resetToken);
        goToMode('reset');
      }
    }
    if (mode === 'reset') await onResetPassword(resetToken, password);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Agility</h1>
            <p className="text-sm text-gray-500">{title}</p>
          </div>
        </div>

        {mode !== 'login' && (
          <button
            type="button"
            onClick={() => goToMode('login')}
            className="mb-4 flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to sign in
          </button>
        )}

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {mode === 'register' && (
            <>
              <TextField
                id="name"
                label="Name"
                icon={<UserRound className="w-4 h-4 text-gray-400" />}
                value={name}
                onChange={setName}
                autoComplete="name"
              />
              <TextField
                id="workspaceName"
                label="Workspace"
                icon={<Rocket className="w-4 h-4 text-gray-400" />}
                value={workspaceName}
                onChange={setWorkspaceName}
              />
            </>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <TextField
              id="email"
              label="Email"
              type="email"
              icon={<Mail className="w-4 h-4 text-gray-400" />}
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
          )}

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <TextField
              id="password"
              label={mode === 'reset' ? 'New password' : 'Password'}
              type="password"
              icon={<Lock className="w-4 h-4 text-gray-400" />}
              value={password}
              onChange={setPassword}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          )}

          {(mode === 'register' || mode === 'reset') && (
            <TextField
              id="confirmPassword"
              label="Confirm password"
              type="password"
              icon={<Lock className="w-4 h-4 text-gray-400" />}
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />
          )}

          {mode === 'reset' && (
            <TextField
              id="resetToken"
              label="Reset token"
              icon={<Lock className="w-4 h-4 text-gray-400" />}
              value={resetToken}
              onChange={setResetToken}
            />
          )}

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {info && <p className="text-sm font-medium text-blue-600 break-words">{info}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : mode === 'register'
                  ? 'Create account'
                  : mode === 'forgot'
                    ? 'Send reset instructions'
                    : 'Reset password'}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
          {mode !== 'register' && (
            <button className="text-blue-500 hover:text-blue-600" onClick={() => goToMode('register')}>
              Create account
            </button>
          )}
          {mode !== 'forgot' && (
            <button className="text-gray-500 hover:text-gray-700" onClick={() => goToMode('forgot')}>
              Forgot password?
            </button>
          )}
          {mode !== 'reset' && (
            <button className="text-gray-500 hover:text-gray-700" onClick={() => goToMode('reset')}>
              I have a reset token
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Demo account: sarah.chen@company.com / demo-password. In development, forgot password
          returns a reset token directly so the reset flow is testable without email delivery.
        </p>
      </div>
    </div>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  type?: string;
  autoComplete?: string;
}

function TextField({ id, label, value, onChange, icon, type = 'text', autoComplete }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-xs text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="mt-1 flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
        {icon}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 outline-none text-sm"
          autoComplete={autoComplete}
        />
      </div>
    </div>
  );
}
