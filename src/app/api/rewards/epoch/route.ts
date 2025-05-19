import { fetchRewardsSheet, DeviceData } from '@/utils/sheet';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mac = searchParams.get('mac');
  const epoch = searchParams.get('epoch');

  if (!mac) return new Response('Missing MAC', { status: 400 });
  if (!epoch) return new Response('Missing epoch', { status: 400 });

  const data = await fetchRewardsSheet();
  const device = data.find((d) => d['MAC Address'] === mac);
  if (!device) return new Response('Device not found', { status: 404 });

  const key = `Epoch ${epoch}`;
  const rawValue = device[key] || '0';
  const numericValue = parseFloat(rawValue);

  return Response.json({
    mac,
    epoch,
    rewards: numericValue
  });
}

