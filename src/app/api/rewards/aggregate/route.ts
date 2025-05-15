import { fetchRewardsSheet } from '@/utils/sheet';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mac = searchParams.get('mac');
  const epochs = parseInt(searchParams.get('epochs') || '1');

  if (!mac) return new Response('Missing MAC', { status: 400 });

  const data = await fetchRewardsSheet();

  const device = data.find((d) => d['MAC Address'] === mac);
  if (!device) return new Response('Device not found', { status: 404 });

  const epochKeys = Object.keys(device)
    .filter((k) => k.includes('Epoch'))
    .sort((a, b) => parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1]))
    .slice(-epochs);

  const total = epochKeys.reduce((sum, key) => {
    const val = parseFloat(device[key] || '0');
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  return Response.json({
    mac,
    epochs: epochKeys,
    total_rewards: total,
  });
}
