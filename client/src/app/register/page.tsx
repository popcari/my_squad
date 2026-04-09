'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/auth-context';
import { authService } from '@/services/auth.service';
import type { UserRole } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    displayName: '',
    role: 'player' as UserRole,
    jerseyNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authService.register({
        ...form,
        jerseyNumber: form.jerseyNumber ? Number(form.jerseyNumber) : undefined,
      });
      login(user);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <ThemeToggle />
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚽</span>
            </div>
            <h1 className="text-2xl font-bold">Join My Squad</h1>
            <p className="text-sm text-muted mt-1">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium mb-1"
              >
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                placeholder="Nguyen Van A"
                value={form.displayName}
                onChange={(e) =>
                  setForm({ ...form, displayName: e.target.value })
                }
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium mb-1"
                >
                  Role
                </label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as UserRole })
                  }
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="player">Player</option>
                  <option value="coach">Coach</option>
                  <option value="president">President</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="jersey"
                  className="block text-sm font-medium mb-1"
                >
                  Jersey #
                </label>
                <input
                  id="jersey"
                  type="number"
                  min={1}
                  max={99}
                  placeholder="10"
                  value={form.jerseyNumber}
                  onChange={(e) =>
                    setForm({ ...form, jerseyNumber: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-3 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>

            <p className="text-center text-sm text-muted">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
