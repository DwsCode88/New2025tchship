'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Link from 'next/link';

export default function DashboardPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [labelCount, setLabelCount] = useState(0);
  const [postageTotal, setPostageTotal] = useState(0);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const batchSnap = await getDocs(
        query(collection(db, 'batches'), where('userId', '==', user.uid))
      );
      const batchData = batchSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const sorted = batchData.sort((a, b) => b.createdAt - a.createdAt);
      setBatches(sorted.slice(0, 3));

      const orderSnap = await getDocs(
        query(collection(db, 'orders'), where('userId', '==', user.uid))
      );
      let count = 0;
      let total = 0;
      orderSnap.forEach((doc) => {
        count++;
        total += doc.data().labelCost || 0;
      });

      setLabelCount(count);
      setPostageTotal(total);
    };

    fetchData();
  }, [user]);

  if (!user) return <p className="text-center mt-10 text-white">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-zinc-800 rounded shadow p-4 border border-zinc-700">
          <p className="text-sm text-zinc-400">Total Batches</p>
          <p className="text-2xl font-bold text-white">{batches.length}</p>
        </div>
        <div className="bg-zinc-800 rounded shadow p-4 border border-zinc-700">
          <p className="text-sm text-zinc-400">Labels Generated</p>
          <p className="text-2xl font-bold text-white">{labelCount}</p>
        </div>
        <div className="bg-zinc-800 rounded shadow p-4 border border-zinc-700">
          <p className="text-sm text-zinc-400">Postage Spent</p>
          <p className="text-2xl font-bold text-white">${postageTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Recent Batches */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-2">📁 Recent Batches</h2>
        <ul className="space-y-2">
          {batches.length === 0 ? (
            <li className="text-zinc-400">No recent batches found.</li>
          ) : (
            batches.map((batch) => (
              <li key={batch.id}>
                <Link
                  href={`/dashboard/batch/${batch.id}`}
                  className="text-blue-400 hover:underline"
                >
                  {batch.batchName} — {new Date(batch.createdAt).toLocaleString()}
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 flex-wrap">
        <Link
          href="/upload"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
        >
          + Upload CSV
        </Link>
        <Link
          href="/dashboard/history"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
        >
          📜 View History
        </Link>
        <Link
          href="/dashboard/settings"
          className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded text-sm"
        >
          ⚙️ Settings
        </Link>
      </div>
    </div>
  );
}
