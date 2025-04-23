'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { auth } from '@/firebase';

export default function DashboardPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user]);

  if (!user) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome to your Dashboard</h1>
      <p className="text-gray-600">Start by uploading a CSV or editing your settings.</p>
    </div>
  );
}
