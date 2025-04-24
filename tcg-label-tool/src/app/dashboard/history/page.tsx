'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebase';

export default function HistoryPage() {
  const [user] = useAuthState(auth);
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const q = query(collection(db, 'batches'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const sorted = data.sort((a, b) => b.createdAt - a.createdAt);
      setBatches(sorted);
    };
    fetchData();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📁 Batch History</h1>

      {batches.length === 0 ? (
        <p className="text-sm text-gray-600">No batches found.</p>
      ) : (
        <ul className="space-y-4">
          {batches.map((batch) => (
            <li key={batch.id} className="border p-4 rounded shadow-sm">
              <h2 className="font-semibold text-lg">{batch.batchName}</h2>
              <p className="text-sm text-gray-600 mb-1">
                Created: {new Date(batch.createdAt).toLocaleString()}
              </p>
              {batch.notes && (
                <p className="text-sm text-gray-800 italic mb-2">{batch.notes}</p>
              )}
              <Link
                href={`/dashboard/batch/${batch.id}`}
                className="inline-block bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm"
              >
                View Batch
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
