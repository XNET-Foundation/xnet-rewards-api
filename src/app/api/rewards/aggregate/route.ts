import { fetchRewardsSheet, DeviceData } from '@/utils/sheet';
import { getCurrentEpoch, getRecentEpochs } from '@/utils/epoch';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mac = searchParams.get('mac');
  const epochs = parseInt(searchParams.get('epochs') || '1');

  if (!mac) return new Response('Missing MAC', { status: 400 });

  const data = await fetchRewardsSheet();
  const device = data.find((d) => d['MAC Address'] === mac);
  if (!device) return new Response('Device not found', { status: 404 });

  // Get the list of recent epochs to aggregate
  const recentEpochs = getRecentEpochs(epochs);
  
  // Create epoch keys in the format "Epoch X"
  const epochKeys = recentEpochs.map(ep => `Epoch ${ep}`);

  const total = epochKeys.reduce((sum, key) => {
    const numericValue = parseFloat(device[key] || '0');
    return sum + (isNaN(numericValue) ? 0 : numericValue);
  }, 0);

  return Response.json({
    mac,
    current_epoch: getCurrentEpoch(),
    epochs: epochKeys,
    total_rewards: total
  });
}
