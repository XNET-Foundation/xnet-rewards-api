import { fetchDataRewardsSheet, fetchBonusRewardsSheet, fetchPocRewardsSheet, DeviceData } from '@/utils/sheet';
import { getCurrentEpoch, getEpochEndDate } from '@/utils/epoch';

interface EpochHistory {
  data_rewards: number;
  bonus_rewards: number;
  poc_rewards: number;
  total_rewards: number;
  distribution_date: string;
}

interface DeviceHistoryResponse {
  mac: string;
  current_epoch: number;
  history: Record<string, EpochHistory>;
}

function processDeviceHistory(dataDevice: DeviceData, bonusDevice: DeviceData | undefined, pocDevice: DeviceData | undefined, currentEpoch: number): Record<string, EpochHistory> {
  const history: Record<string, EpochHistory> = {};

  for (const [key, value] of Object.entries(dataDevice)) {
    if (key.includes('Epoch')) {
      const epochNum = parseInt(key.split(' ')[1]);
      // Only include epochs up to the current epoch
      if (epochNum < currentEpoch) {
        const dataRewards = parseFloat(value) || 0;
        const bonusRewards = parseFloat(bonusDevice?.[key] || '0') || 0;
        const pocRewards = parseFloat(pocDevice?.[key] || '0') || 0;
        const totalRewards = dataRewards + bonusRewards + pocRewards;
        const distributionDate = getEpochEndDate(epochNum);
        
        history[key] = {
          data_rewards: dataRewards,
          bonus_rewards: bonusRewards,
          poc_rewards: pocRewards,
          total_rewards: totalRewards,
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

  // Fetch all three reward types
  const [dataRewards, bonusRewards, pocRewards] = await Promise.all([
    fetchDataRewardsSheet(),
    fetchBonusRewardsSheet(),
    fetchPocRewardsSheet()
  ]);
  
  const currentEpoch = getCurrentEpoch();

  // Handle single MAC address (maintain existing behavior)
  if (macAddresses.length === 1) {
    const dataDevice = dataRewards.find((d) => d['MAC Address'] === macAddresses[0]);
    const bonusDevice = bonusRewards.find((d) => d['MAC Address'] === macAddresses[0]);
    const pocDevice = pocRewards.find((d) => d['MAC Address'] === macAddresses[0]);
    
    if (!dataDevice) return new Response('Device not found', { status: 404 });

    const history = processDeviceHistory(dataDevice, bonusDevice, pocDevice, currentEpoch);

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
    const dataDevice = dataRewards.find((d) => d['MAC Address'] === mac);
    const bonusDevice = bonusRewards.find((d) => d['MAC Address'] === mac);
    const pocDevice = pocRewards.find((d) => d['MAC Address'] === mac);
    
    if (!dataDevice) {
      notFoundMacs.push(mac);
      continue;
    }

    const history = processDeviceHistory(dataDevice, bonusDevice, pocDevice, currentEpoch);
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

