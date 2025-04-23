'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Link from 'next/link';

type Batch = {
  id: string;
  batchName: string;
  createdAt: number;
  archived?: boolean;
};

export default function HistoryPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user]);

  useEffect(() => {
    const fetchBatches = async () => {
      if (!user) return;

      const snap = await getDocs(
        query(collection(db, 'batches'), where('userId', '==', user.uid))
      );

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Batch, 'id'>),
      }));

      const sorted = data.sort((a, b) => b.createdAt - a.createdAt);
      setBatches(sorted);
    };

    fetchBatches();
  }, [user]);

  if (!user) return <p className="text-center mt-10 text-white">Loading...</p>;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">📁 Batch History</h1>

      {batches.length === 0 ? (
        <p className="text-zinc-400">No batches found.</p>
      ) : (
        <table className="w-full text-sm border border-zinc-700 text-white">
          <thead className="bg-zinc-800 text-zinc-300">
            <tr>
              <th className="border border-zinc-700 px-3 py-2 text-left">Batch</th>
              <th className="border border-zinc-700 px-3 py-2 text-left">Created</th>
              <th className="border border-zinc-700 px-3 py-2 text-left">Status</th>
              <th className="border border-zinc-700 px-3 py-2 text-left">View</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id} className="even:bg-zinc-900">
                <td className="border border-zinc-700 px-3 py-2">{batch.batchName}</td>
                <td className="border border-zinc-700 px-3 py-2">
                  {new Date(batch.createdAt).toLocaleString()}
                </td>
                <td className="border border-zinc-700 px-3 py-2">
                  {batch.archived ? (
                    <span className="bg-yellow-800 text-yellow-300 text-xs px-2 py-1 rounded">
                      Archived
                    </span>
                  ) : (
                    <span className="bg-green-800 text-green-300 text-xs px-2 py-1 rounded">
                      Active
                    </span>
                  )}
                </td>
                <td className="border border-zinc-700 px-3 py-2">
                  <Link
                    href={`/dashboard/batch/${batch.id}`}
                    className="text-blue-400 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
