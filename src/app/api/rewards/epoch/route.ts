import { fetchRewardsSheet } from '@/utils/sheet';

interface DeviceData {
  'MAC Address': string;
  [key: string]: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mac = searchParams.get('mac');
  const epoch = searchParams.get('epoch');

  if (!mac) return new Response('Missing MAC', { status: 400 });
  if (!epoch) return new Response('Missing epoch', { status: 400 });

  const data = await fetchRewardsSheet();
  const device = data.find((d: DeviceData) => d['MAC Address'] === mac);
  if (!device) return new Response('Device not found', { status: 404 });

  const key = `Epoch ${epoch}`;
  const value = device[key] || '0';

  return Response.json({
    mac,
    epoch,
    rewards: value,
  });
}

