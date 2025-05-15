import { fetchRewardsSheet } from '@/utils/sheet';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mac = searchParams.get('mac');
  const epoch = searchParams.get('epoch');

  if (!mac || !epoch) return new Response('Missing MAC or epoch', { status: 400 });

  const data = await fetchRewardsSheet();
  const device = data.find((d) => d['MAC Address'] === mac);
  if (!device) return new Response('Device not found', { status: 404 });

  const key = `Epoch ${epoch}`;
  const val = parseFloat(device[key] || '0');

  return Response.json({
    mac,
    epoch: key,
    rewards: isNaN(val) ? 0 : val,
  });
}

