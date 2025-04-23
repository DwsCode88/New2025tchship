import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const EASYPOST_API_KEY = process.env.EASYPOST_API_KEY || '';
const AUTH_HEADER = `Basic ${Buffer.from(EASYPOST_API_KEY + ':').toString('base64')}`;

export async function POST(req: NextRequest) {
  const orders = await req.json();
  const results: { labelUrl: string; trackingCode: string }[] = [];
  const createdBatchIds = new Set<string>();

  for (const order of orders) {
    try {
      const createRes = await fetch('https://api.easypost.com/v2/shipments', {
        method: 'POST',
        headers: {
          Authorization: AUTH_HEADER,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipment: {
            to_address: {
              name: order.name,
              street1: order.address1,
              street2: order.address2,
              city: order.city,
              state: order.state,
              zip: order.zip?.replace(/\D/g, ''),
              country: 'US',
            },
            from_address: {
              name: 'VaultTrove',
              street1: '123 Main St',
              city: 'Sterling',
              state: 'VA',
              zip: '20164',
              country: 'US',
            },
            parcel: {
              predefined_package: 'Letter',
              weight: Math.max(1, order.weight || 1),
            },
            options: {
              label_format: 'PDF',
              label_size: '4x6',
              machinable: !order.nonMachinable,
              print_custom_1: order.orderNumber || '',
            },
          },
        }),
      });

      const shipment = await createRes.json();

      const rate = shipment.rates.find(
        (r: any) => r.carrier === 'USPS' && r.service.includes('First')
      );

      if (!rate) {
        console.warn(`❌ No USPS First-Class rate for ${order.name}`);
        continue;
      }

      const buyRes = await fetch(`https://api.easypost.com/v2/shipments/${shipment.id}/buy`, {
        method: 'POST',
        headers: {
          Authorization: AUTH_HEADER,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rate }),
      });

      const bought = await buyRes.json();

      if (!bought?.postage_label?.label_url) {
        console.error(`❌ Label failed for ${order.name}`);
        console.log('Buy Response:', bought);
        continue;
      }

      const orderId = uuidv4();
      await setDoc(doc(db, 'orders', orderId), {
        userId: order.userId || 'unknown',
        batchId: order.batchId,
        batchName: order.batchName,
        orderNumber: order.orderNumber || '',
        trackingCode: bought.tracking_code,
        labelUrl: bought.postage_label.label_url,
        toName: order.name,
        createdAt: Date.now(),
      });

      if (!createdBatchIds.has(order.batchId)) {
        await setDoc(doc(db, 'batches', order.batchId), {
          userId: order.userId || 'unknown',
          batchName: order.batchName,
          createdAt: Date.now(),
        });
        createdBatchIds.add(order.batchId);
      }

      results.push({
        labelUrl: bought.postage_label.label_url,
        trackingCode: bought.tracking_code,
      });
    } catch (err) {
      console.error(`🔥 Error generating label for ${order.name}:`, err);
    }
  }

  return NextResponse.json(results);
}
