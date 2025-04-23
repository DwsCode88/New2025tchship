'use client';

import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebase';
import { v4 as uuidv4 } from 'uuid';

type ParsedRow = {
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  weight: number;
  nonMachinable: boolean;
  orderNumber: string;
  userId?: string;
  batchId?: string;
  batchName?: string;
};

export default function UploadPage() {
  const [user] = useAuthState(auth);
  const [orders, setOrders] = useState<ParsedRow[]>([]);
  const [labels, setLabels] = useState<{ labelUrl: string; trackingCode: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCSVUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').filter(Boolean);
    const headers = lines[0].split(',');

    const getIndex = (key: string) =>
      headers.findIndex((h) => h.trim().toLowerCase().includes(key.toLowerCase()));

    const fn = getIndex('FirstName');
    const ln = getIndex('LastName');
    const a1 = getIndex('Address1');
    const a2 = getIndex('Address2');
    const city = getIndex('City');
    const state = getIndex('State');
    const zip = getIndex('PostalCode');
    const weight = getIndex('Product Weight');
    const orderNum = getIndex('Order #');

    const parsed: ParsedRow[] = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.replace(/^"|"$/g, '').trim());
      return {
        name: `${values[fn] ?? ''} ${values[ln] ?? ''}`.trim(),
        address1: values[a1],
        address2: values[a2],
        city: values[city],
        state: values[state],
        zip: values[zip],
        weight: parseFloat(values[weight]) || 1,
        orderNumber: values[orderNum],
        nonMachinable: false,
      };
    });

    setOrders(parsed);
    setLabels([]);
  };

  const handleToggle = (index: number) => {
    const updated = [...orders];
    updated[index].nonMachinable = !updated[index].nonMachinable;
    setOrders(updated);
  };

  const generateLabels = async () => {
    if (!user) {
      alert('You must be logged in to generate labels.');
      return;
    }

    setLoading(true);

    const batchId = uuidv4();
    const batchName = `Upload – ${new Date().toLocaleString()}`;

    const enriched = orders.map((o) => ({
      ...o,
      userId: user.uid,
      batchId,
      batchName,
    }));

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: JSON.stringify(enriched),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    setLabels(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white text-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Upload TCGplayer Shipping CSV</h1>

        <form onSubmit={handleCSVUpload} className="mb-8 flex flex-col items-center">
          <input
            type="file"
            name="file"
            accept=".csv"
            required
            className="mb-4 border p-2 rounded w-full max-w-md"
          />
          <button type="submit" className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">
            Preview Orders
          </button>
        </form>

        {orders.length > 0 && (
          <>
            <h2 className="text-2xl font-semibold mb-4">Order Details</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-black">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="border px-4 py-2">#</th>
                    <th className="border px-4 py-2">Order #</th>
                    <th className="border px-4 py-2">Name</th>
                    <th className="border px-4 py-2">Address 1</th>
                    <th className="border px-4 py-2">Address 2</th>
                    <th className="border px-4 py-2">City</th>
                    <th className="border px-4 py-2">State</th>
                    <th className="border px-4 py-2">Zip</th>
                    <th className="border px-4 py-2">Weight</th>
                    <th className="border px-4 py-2">Non-Machinable</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => (
                    <tr key={i} className="even:bg-gray-100">
                      <td className="border px-4 py-2">{i + 1}</td>
                      <td className="border px-4 py-2">{order.orderNumber}</td>
                      <td className="border px-4 py-2">{order.name}</td>
                      <td className="border px-4 py-2">{order.address1}</td>
                      <td className="border px-4 py-2">{order.address2}</td>
                      <td className="border px-4 py-2">{order.city}</td>
                      <td className="border px-4 py-2">{order.state}</td>
                      <td className="border px-4 py-2">{order.zip}</td>
                      <td className="border px-4 py-2">{order.weight}</td>
                      <td className="border px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={order.nonMachinable}
                          onChange={() => handleToggle(i)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-center mt-8">
              <button
                onClick={generateLabels}
                className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800"
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Labels'}
              </button>
            </div>
          </>
        )}

        {labels.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-2">Generated Labels</h2>

            <div className="flex justify-start mb-6">
              <button
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                onClick={async () => {
                  const res = await fetch('/api/labels/merge', {
                    method: 'POST',
                    body: JSON.stringify(labels.map((l) => l.labelUrl || l.url)),
                    headers: { 'Content-Type': 'application/json' },
                  });

                  if (!res.ok) {
                    alert('Failed to download merged PDF');
                    return;
                  }

                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'labels.pdf';
                  link.click();
                }}
              >
                Download All Labels (PDF)
              </button>
            </div>

            {labels.map((label, i) => (
              <div key={i} className="mb-4">
                <a
                  href={label.labelUrl || label.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Open Label {i + 1}
                </a>
                <p className="text-sm">Tracking: {label.trackingCode || label.tracking}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
