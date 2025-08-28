import { fetchWifiStatsSheet } from '@/utils/sheet';
import { getCurrentEpoch } from '@/utils/epoch';

interface DeviceWiFiStats {
  mac: string;
  epoch: number;
  stats: {
    sessions: number;
    users: number;
    rejects: number;
    total_gbs: number;
    network_status: string;
    location_status: string;
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mac = searchParams.get('mac');
  const epoch = searchParams.get('epoch');

  if (!mac) return new Response('Missing MAC', { status: 400 });

  try {
    const wifiStats = await fetchWifiStatsSheet();
    const device = wifiStats.find((d) => d['MAC Address'] === mac);
    
    if (!device) return new Response('Device not found', { status: 404 });

    // Determine which epoch to use
    let targetEpoch: number;
    if (epoch) {
      targetEpoch = parseInt(epoch);
      if (isNaN(targetEpoch)) {
        return new Response('Invalid epoch', { status: 400 });
      }
    } else {
      // Use latest epoch if none specified
      targetEpoch = getCurrentEpoch();
    }

    // For now, return basic structure - we'll need to examine the actual data format
    // Each epoch has 6 columns: Sessions, Users, Rejects, Total GBs, Network Status, Location Status
    const epochKey = `Epoch ${targetEpoch}`;
    
    // Extract available data for this epoch
    const totalGbs = parseFloat(device[epochKey] || '0') || 0;

    const stats: DeviceWiFiStats = {
      mac,
      epoch: targetEpoch,
      stats: {
        sessions: 0, // Will need to map to correct column
        users: 0,    // Will need to map to correct column
        rejects: 0,  // Will need to map to correct column
        total_gbs: totalGbs,
        network_status: 'Unknown', // Will need to map to correct column
        location_status: 'Unknown' // Will need to map to correct column
      }
    };

    return Response.json(stats);

  } catch (error) {
    console.error('Error fetching device WiFi stats:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
