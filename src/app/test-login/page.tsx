"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestLoginPage() {
  const [email, setEmail] = useState("sergiowpf@me.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const supabaseClient = supabase;
  const missingSupabaseMessage =
    "Supabase client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to test login.";

  const handleLogin = async () => {
    setLoading(true);
    setResult(null);

    try {
      if (!supabaseClient) {
        console.warn("Skipping test login because the Supabase client is unavailable.");
        setResult({ error: missingSupabaseMessage });
        return;
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setResult({ error: error.message });
      } else if (data.user) {
        setResult({ success: true });
        console.log("✅ Login successful:", data.user.email);
        // Redirect to dashboard after successful login
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSession = async () => {
    setLoading(true);
    setResult(null);

    try {
      if (!supabaseClient) {
        console.warn("Skipping session check because the Supabase client is unavailable.");
        setResult({ error: missingSupabaseMessage });
        return;
      }

      const { error } = await supabaseClient.auth.getSession();
      if (error) {
        setResult({ error: error.message });
      } else {
        setResult({ success: true });
      }
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Teste de Login
          </h2>
        </div>

        {!supabaseClient && (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
            {missingSupabaseMessage}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <button
              onClick={handleLogin}
              disabled={loading || !supabaseClient}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Fazendo login..." : "Fazer Login"}
            </button>

            <button
              onClick={handleCheckSession}
              disabled={loading || !supabaseClient}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Verificar Sessão
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Resultado:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 