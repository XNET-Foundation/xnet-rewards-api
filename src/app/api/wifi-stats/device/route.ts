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

    // For WiFi Stats, each epoch has 6 columns starting from column F
    // We need to find the correct column headers and map them
    // Let's look for the data in the device object
    const epochKey = `Epoch ${targetEpoch}`;
    
    // Extract data - we'll need to examine the actual structure
    // For now, let's try to find the data in the device object
    let sessions = 0, users = 0, rejects = 0, totalGbs = 0;
    let networkStatus = 'Unknown', locationStatus = 'Unknown';
    
    // Look for the data in the device object
    Object.keys(device).forEach(key => {
      if (key.includes(epochKey)) {
        const value = device[key];
        // Try to identify which column this is based on the value type
        if (typeof value === 'string' && value.includes('Active')) {
          networkStatus = value;
        } else if (typeof value === 'string' && value.includes('Valid')) {
          locationStatus = value;
        } else if (!isNaN(parseFloat(value))) {
          const numValue = parseFloat(value);
          // Assume the largest number is total_gbs
          if (numValue > totalGbs) {
            totalGbs = numValue;
          }
        }
      }
    });

    const stats: DeviceWiFiStats = {
      mac,
      epoch: targetEpoch,
      stats: {
        sessions,
        users,
        rejects,
        total_gbs: totalGbs,
        network_status: networkStatus,
        location_status: locationStatus
      }
    };

    return Response.json(stats);

  } catch (error) {
    console.error('Error fetching device WiFi stats:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
