import { fetchRewardsSheet, DeviceData } from '@/utils/sheet';
import { getCurrentEpoch, getEpochEndDate } from '@/utils/epoch';

interface EpochHistory {
  rewards: number;
  distribution_date: string;
}

interface DeviceHistoryResponse {
  mac: string;
  current_epoch: number;
  history: Record<string, EpochHistory>;
}

function processDeviceHistory(device: DeviceData, currentEpoch: number): Record<string, EpochHistory> {
  const history: Record<string, EpochHistory> = {};

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

  return history;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const macParam = searchParams.get('mac');
  if (!macParam) return new Response('Missing MAC', { status: 400 });

  // Parse comma-separated MAC addresses
  const macAddresses = macParam.split(',').map(mac => mac.trim()).filter(mac => mac.length > 0);
  if (macAddresses.length === 0) return new Response('Invalid MAC address(es)', { status: 400 });

  const data = await fetchRewardsSheet();
  const currentEpoch = getCurrentEpoch();

  // Handle single MAC address (maintain existing behavior)
  if (macAddresses.length === 1) {
    const device = data.find((d) => d['MAC Address'] === macAddresses[0]);
    if (!device) return new Response('Device not found', { status: 404 });

    const history = processDeviceHistory(device, currentEpoch);

    return Response.json({ 
      mac: macAddresses[0], 
      current_epoch: currentEpoch,
      history 
    });
  }

  // Handle multiple MAC addresses
  const results: DeviceHistoryResponse[] = [];
  const notFoundMacs: string[] = [];

  for (const mac of macAddresses) {
    const device = data.find((d) => d['MAC Address'] === mac);
    if (!device) {
      notFoundMacs.push(mac);
      continue;
    }

    const history = processDeviceHistory(device, currentEpoch);
    results.push({
      mac,
      current_epoch: currentEpoch,
      history
    });
  }

  // If some MACs were not found, return a 404 with details
  if (notFoundMacs.length > 0) {
    return new Response(`Devices not found: ${notFoundMacs.join(', ')}`, { status: 404 });
  }

  return Response.json(results);
}

