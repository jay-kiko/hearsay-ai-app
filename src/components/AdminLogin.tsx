import { useState } from 'react';
import kikologo from '../assets/kiko-logo.png';

interface AdminLoginProps {
  error: string | null;
  onSubmit: (username: string, password: string) => void;
}

export function AdminLogin({ error, onSubmit }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-6">
      <div className="w-full max-w-[380px] animate-fadeUp">
        <div className="flex justify-center mb-8">
          <img src={kikologo} alt="hearsay.ai" className="h-[45px] w-auto" />
        </div>

        <div className="bg-white border border-[#E6E6E6] rounded-[20px] p-8 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.12)]">
          <h1 className="text-[21px] font-bold text-center mb-2">Admin sign-in</h1>
          <p className="text-[13.5px] text-[#888] text-center mb-7 leading-relaxed">Staff only. Sign in to manage access codes.</p>

          <form onSubmit={e => { e.preventDefault(); onSubmit(username.trim(), password); }}>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              autoFocus
              className="w-full border border-[#E2E2E2] rounded-[11px] px-4 py-3 text-[14.5px] text-[#222] mb-2.5 focus:border-[#2D6AE0] focus:outline-none transition-colors"
            />
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="w-full border border-[#E2E2E2] rounded-[11px] px-4 py-3 text-[14.5px] text-[#222] mb-3 focus:border-[#2D6AE0] focus:outline-none transition-colors"
            />
            {error && <div className="text-[13px] text-[#C2543A] text-center mb-3">{error}</div>}
            <button
              type="submit"
              className="w-full bg-[#2D6AE0] text-white border-none rounded-[11px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#2560d0] transition-colors"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
