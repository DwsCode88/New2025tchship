'use client';

import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebase';
import { generateTCGCSV } from '@/lib/generateTCGCSV';
import { v4 as uuidv4 } from 'uuid';

type ParsedRow = {
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  weight: number;
  orderNumber: string;
  nonMachinable: boolean;
  shippingShield: boolean;
  notes: string;
  userId?: string;
  batchId?: string;
  batchName?: string;
};

type LabelResult = {
  url: string;
  tracking: string;
};

export default function UploadPage() {
  const [user] = useAuthState(auth);
  const [orders, setOrders] = useState<ParsedRow[]>([]);
  const [labels, setLabels] = useState<LabelResult[]>([]);
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
        shippingShield: false,
        notes: '',
      };
    });

    setOrders(parsed);
    setLabels([]);
  };

  const updateOrder = <K extends keyof ParsedRow>(
    index: number,
    field: K,
    value: ParsedRow[K]
  ) => {
    const updated = [...orders];
    updated[index][field] = value;
    setOrders(updated);
  };

  const toggleAll = (field: 'nonMachinable' | 'shippingShield', value: boolean) => {
    setOrders((prev) => prev.map((o) => ({ ...o, [field]: value })));
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
            <div className="flex gap-4 flex-wrap mb-2">
              <button onClick={() => toggleAll('nonMachinable', true)} className="text-sm border px-3 py-1 rounded">📨 All Non-Mach</button>
              <button onClick={() => toggleAll('nonMachinable', false)} className="text-sm border px-3 py-1 rounded">📨 None Non-Mach</button>
              <button onClick={() => toggleAll('shippingShield', true)} className="text-sm border px-3 py-1 rounded">🛡 All Shield</button>
              <button onClick={() => toggleAll('shippingShield', false)} className="text-sm border px-3 py-1 rounded">🛡 No Shield</button>
            </div>

            <table className="w-full border mb-6 text-sm">
              <thead className="bg-black text-white">
                <tr>
                  <th className="border px-2 py-1">#</th>
                  <th className="border px-2 py-1">Order #</th>
                  <th className="border px-2 py-1">Name</th>
                  <th className="border px-2 py-1">📨</th>
                  <th className="border px-2 py-1">🛡</th>
                  <th className="border px-2 py-1">📝 Notes</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={i} className="even:bg-gray-100">
                    <td className="border px-2 py-1">{i + 1}</td>
                    <td className="border px-2 py-1">{o.orderNumber}</td>
                    <td className="border px-2 py-1">{o.name}</td>
                    <td className="border px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={o.nonMachinable}
                        onChange={() => updateOrder(i, 'nonMachinable', !o.nonMachinable)}
                      />
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={o.shippingShield}
                        onChange={() => updateOrder(i, 'shippingShield', !o.shippingShield)}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="text"
                        value={o.notes}
                        placeholder="optional"
                        onChange={(e) => updateOrder(i, 'notes', e.target.value)}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-center mt-4 mb-10">
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
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Generated Labels</h2>
            <ul className="space-y-2">
              {labels.map((label, i) => (
                <li key={i}>
                  <a
                    href={label.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Open Label {i + 1}
                  </a>
                  <p className="text-sm text-gray-600">Tracking: {label.tracking}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
