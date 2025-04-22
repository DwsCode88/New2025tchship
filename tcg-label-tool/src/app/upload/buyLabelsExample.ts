// Example buy-labels flow with order history saving

import { saveOrder } from '@/lib/saveOrder';
import { auth } from '@/firebase';
import { EasyPostClient } from '@easypost/api'; // or however you access EasyPost

export async function buyAndSaveLabel(client: any, shipment: any) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  const bought = await client.shipment.buy(shipment.id, { rate: shipment.lowestRate });

  await saveOrder({
    userId: user.uid,
    trackingCode: bought.tracking_code,
    labelUrl: bought.postage_label.label_url,
    toName: bought.to_address.name,
  });

  return bought;
}
