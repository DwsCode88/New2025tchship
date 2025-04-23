'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Link from 'next/link';

export default function BatchPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const { batchId } = useParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [batch, setBatch] = useState<any>(null);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user]);

  useEffect(() => {
    const fetchBatchData = async () => {
      if (!user || !batchId) return;

      const batchSnap = await getDocs(
        query(collection(db, 'batches'), where('userId', '==', user.uid))
      );
      const batchDoc = batchSnap.docs.find((doc) => doc.id === batchId);
      if (batchDoc) setBatch({ id: batchDoc.id, ...batchDoc.data() });

      const orderSnap = await getDocs(
        query(collection(db, 'orders'), where('batchId', '==', batchId), where('userId', '==', user.uid))
      );
      const data = orderSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    };

    fetchBatchData();
  }, [user, batchId]);

  if (!user || !batch) return <p className="text-center mt-10 text-white">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-zinc-800 border-l-4 border-blue-500 p-4 rounded shadow mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
          📦 Batch Summary
        </h2>
        <p className="text-zinc-300">
          <span className="font-medium text-white">Batch:</span>{' '}
          <span className="text-blue-400">{batch.batchName}</span>
        </p>
        <p className="text-zinc-400 text-sm">
          🕒 Created: {new Date(batch.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="mb-4">
        <p className="text-sm text-zinc-400 mb-1">📝 Batch Notes</p>
      </div>

      {orders.length === 0 ? (
        <p className="text-zinc-400">No orders found for this batch.</p>
      ) : (
        <table className="w-full border border-zinc-700 text-sm text-white">
          <thead className="bg-zinc-800">
            <tr>
              <th className="border border-zinc-700 px-2 py-1">Order #</th>
              <th className="border border-zinc-700 px-2 py-1">To</th>
              <th className="border border-zinc-700 px-2 py-1">Tracking</th>
              <th className="border border-zinc-700 px-2 py-1">Label</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => {
              const orderNum =
                order.orderNumber || order.orderNum || order.order_number || '—';
              // console.log(order); // uncomment for live debugging
              return (
                <tr key={i} className="even:bg-zinc-900">
                  <td className="border border-zinc-700 px-2 py-1">{orderNum}</td>
                  <td className="border border-zinc-700 px-2 py-1">{order.toName}</td>
                  <td className="border border-zinc-700 px-2 py-1">{order.trackingCode}</td>
                  <td className="border border-zinc-700 px-2 py-1">
                    <a
                      href={order.labelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      View Label
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div className="mt-6">
        <Link href="/dashboard/history" className="text-sm text-blue-400 hover:underline">
          ← Back to History
        </Link>
      </div>
    </div>
  );
}
