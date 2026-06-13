import { useState } from 'react';
import { Lock, Mail, Rocket } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function LoginScreen({ onLogin, isLoading, error }: LoginScreenProps) {
  const [email, setEmail] = useState('sarah.chen@company.com');
  const [password, setPassword] = useState('demo-password');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Agility</h1>
            <p className="text-sm text-gray-500">Sign in to your workspace</p>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onLogin(email, password);
          }}
        >
          <div>
            <label htmlFor="email" className="text-xs text-gray-400 uppercase tracking-wider">
              Email
            </label>
            <div className="mt-1 flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
              <Mail className="w-4 h-4 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="flex-1 outline-none text-sm"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="text-xs text-gray-400 uppercase tracking-wider">
              Password
            </label>
            <div className="mt-1 flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
              <Lock className="w-4 h-4 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="flex-1 outline-none text-sm"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-6">
          Demo mode accepts the prefilled account while the authentication service is being finalized.
        </p>
      </div>
    </div>
  );
}
