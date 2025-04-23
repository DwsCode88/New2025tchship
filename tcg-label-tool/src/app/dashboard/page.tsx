'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
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
    if (user) {
      const fetchData = async () => {
        const batchQuery = query(
          collection(db, 'batches'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const batchSnap = await getDocs(batchQuery);
        const batchData = batchSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setBatches(batchData);

        const orderSnap = await getDocs(query(collection(db, 'orders'), where('userId', '==', user.uid)));
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
    }
  }, [user]);

  if (!user) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">📊 Dashboard Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded shadow p-4">
          <p className="text-sm text-gray-500">Total Batches</p>
          <p className="text-xl font-bold">{batches.length}</p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <p className="text-sm text-gray-500">Labels Generated</p>
          <p className="text-xl font-bold">{labelCount}</p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <p className="text-sm text-gray-500">Postage Spent</p>
          <p className="text-xl font-bold">${postageTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Recent Batches */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-2">📁 Recent Batches</h2>
        <ul className="space-y-2">
          {batches.length === 0 ? (
            <li className="text-gray-500">No recent batches.</li>
          ) : (
            batches.map((batch) => (
              <li key={batch.id}>
                <Link
                  href={`/dashboard/batch/${batch.id}`}
                  className="text-blue-600 hover:underline"
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
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + Upload CSV
        </Link>
        <Link
          href="/dashboard/history"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          📜 View History
        </Link>
        <Link
          href="/dashboard/settings"
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          ⚙️ Settings
        </Link>
      </div>
    </div>
  );
}
