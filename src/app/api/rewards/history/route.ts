import { fetchRewardsSheet, DeviceData } from '@/utils/sheet';
import { getCurrentEpoch, getEpochEndDate } from '@/utils/epoch';

interface EpochHistory {
  rewards: number;
  distribution_date: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mac = searchParams.get('mac');
  if (!mac) return new Response('Missing MAC', { status: 400 });

  const data = await fetchRewardsSheet();
  const device = data.find((d) => d['MAC Address'] === mac);
  if (!device) return new Response('Device not found', { status: 404 });

  const history: Record<string, EpochHistory> = {};
  const currentEpoch = getCurrentEpoch();

  for (const [key, value] of Object.entries(device)) {
    if (key.includes('Epoch')) {
      const epochNum = parseInt(key.split(' ')[1]);
      // Only include epochs up to the current epoch
      if (epochNum < currentEpoch) {
        const numericValue = parseFloat(value);
        const distributionDate = getEpochEndDate(epochNum);
        history[key] = {
          rewards: isNaN(numericValue) ? 0 : numericValue,
          distribution_date: distributionDate.toISOString().split('T')[0]
        };
      }
    }
  }

  return Response.json({ 
    mac, 
    current_epoch: currentEpoch,
    history 
  });
}

