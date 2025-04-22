'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useEffect, useState } from 'react';
import { auth, db, storage } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function SettingsPage() {
  const [user] = useAuthState(auth);
  const [easypostApiKey, setKey] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      const loadSettings = async () => {
        try {
          console.log('🔍 Fetching Firestore doc for:', user.uid);
          const docRef = doc(db, 'users', user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            console.log('📄 Existing Firestore data:', data);
            setKey(data.easypostApiKey || '');
            setLogoUrl(data.logoUrl || '');
          } else {
            console.log('ℹ️ No settings found for user yet.');
          }
        } catch (err) {
          console.error('❌ Failed to load user settings:', err);
        }
      };
      loadSettings();
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;

    const file = e.target.files[0];

    if (file.type !== 'image/png') {
      alert('Please upload a PNG file');
      return;
    }

    setUploading(true);

    try {
      const fileRef = ref(storage, `logos/${user.uid}.png`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      console.log('✅ Upload complete. URL:', url);

      const payload = {
        easypostApiKey: easypostApiKey ?? '',
        logoUrl: url ?? '',
      };

      console.log('📤 Writing to Firestore:', payload);

      await setDoc(doc(db, 'users', user.uid), payload);
      setLogoUrl(url);

      alert('✔️ Logo uploaded and settings saved!');
    } catch (error) {
      console.error('❌ Upload or save failed:', error);
      alert('Upload failed. Check console.');
    } finally {
      setUploading(false);
    }
  };

  const handleManualSave = async () => {
    if (!user) return;
    const payload = {
      easypostApiKey,
      logoUrl,
    };
    console.log('💾 Manual save to Firestore:', payload);
    await setDoc(doc(db, 'users', user.uid), payload);
    alert('Settings saved!');
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>

      <input
        className="w-full p-2 border"
        value={easypostApiKey}
        onChange={(e) => setKey(e.target.value)}
        placeholder="EasyPost API Key"
      />

      <input
        type="file"
        accept="image/png"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {logoUrl && (
        <img
          src={logoUrl}
          alt="Uploaded Logo"
          className="max-h-24 mt-2 border"
        />
      )}

      <button
        className="bg-blue-600 text-white p-2 rounded"
        onClick={handleManualSave}
        disabled={uploading}
      >
        Save Settings
      </button>
    </div>
  );
}
