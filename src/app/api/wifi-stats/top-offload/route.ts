import { fetchWifiStatsSheet } from '@/utils/sheet';
import { getCurrentEpoch } from '@/utils/epoch';

interface TopOffloadDevice {
  mac: string;
  total_gbs: number;
  rank: number;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const epoch = searchParams.get('epoch');

  if (limit <= 0 || limit > 100) {
    return new Response('Limit must be between 1 and 100', { status: 400 });
  }

  try {
    const wifiStats = await fetchWifiStatsSheet();
    
    let targetEpoch: number;
    if (epoch) {
      targetEpoch = parseInt(epoch);
      if (isNaN(targetEpoch)) {
        return new Response('Invalid epoch', { status: 400 });
      }
    } else {
      targetEpoch = getCurrentEpoch() - 1;
    }

    const devicesWithStats: TopOffloadDevice[] = [];

    wifiStats.forEach(device => {
      // Check if this device has data for the target epoch
      const epochKey = `Epoch ${targetEpoch}`;
      
      // Look for epoch-specific metric keys
      const epochMetricKeys = Object.keys(device).filter(key => key.startsWith(epochKey));
      
      if (epochMetricKeys.length > 0) {
        // The data structure now has epoch-specific keys for each metric
        const totalGbs = parseFloat(device[`${epochKey} Total GBs`] || '0') || 0;
        if (!isNaN(totalGbs) && totalGbs > 0) {
          devicesWithStats.push({
            mac: device['MAC Address'],
            total_gbs: totalGbs,
            rank: 0 // Will be set after sorting
          });
        }
      }
    });

    const topDevices = devicesWithStats
      .sort((a, b) => b.total_gbs - a.total_gbs)
      .slice(0, limit)
      .map((device, index) => ({
        ...device,
        rank: index + 1
      }));

    return Response.json({
      current_epoch: getCurrentEpoch(),
      target_epoch: targetEpoch,
      top_devices: topDevices
    });

  } catch (error) {
    console.error('Error fetching top offload data:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
