import { fetchRewardsSheet } from '@/utils/sheet';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mac = searchParams.get('mac');
  if (!mac) return new Response('Missing MAC', { status: 400 });

  const data = await fetchRewardsSheet();
  const device = data.find((d) => d['MAC Address'] === mac);
  if (!device) return new Response('Device not found', { status: 404 });

  const history: Record<string, number> = {};

  for (const [key, value] of Object.entries(device)) {
    if (key.includes('Epoch')) {
      const val = parseFloat(value);
      history[key] = isNaN(val) ? 0 : val;
    }
  }

  return Response.json({ mac, history });
}

