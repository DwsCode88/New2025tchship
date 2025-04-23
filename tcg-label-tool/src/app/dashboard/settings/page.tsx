'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchUserSettings, saveUserSettings } from '@/lib/userSettings';

export default function SettingsPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [easypostApiKey, setKey] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    if (!user) router.push('/login');
    else {
      fetchUserSettings(user.uid).then((settings) => {
        if (settings) {
          setKey(settings.easypostApiKey);
          setLogoUrl(settings.logoUrl);
        }
      });
    }
  }, [user]);

  if (!user) return <p className="text-center mt-10 text-white">Loading...</p>;

  const handleSave = async () => {
    if (user) {
      await saveUserSettings(user.uid, { easypostApiKey, logoUrl });
      alert('Settings saved!');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white mb-4">⚙️ User Settings</h1>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">EasyPost API Key</label>
        <input
          type="text"
          value={easypostApiKey}
          onChange={(e) => setKey(e.target.value)}
          className="w-full p-2 rounded border border-zinc-700 bg-zinc-800 text-white"
          placeholder="sk_xxx..."
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">Logo URL (optional)</label>
        <input
          type="text"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="w-full p-2 rounded border border-zinc-700 bg-zinc-800 text-white"
          placeholder="https://example.com/logo.png"
        />
      </div>

      <button
        onClick={handleSave}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
      >
        Save Settings
      </button>
    </div>
  );
}
