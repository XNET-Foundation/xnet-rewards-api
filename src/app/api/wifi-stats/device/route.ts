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

    let targetEpoch: number;
    if (epoch) {
      targetEpoch = parseInt(epoch);
      if (isNaN(targetEpoch)) {
        return new Response('Invalid epoch', { status: 400 });
      }
    } else {
      targetEpoch = getCurrentEpoch();
    }

    // The new data structure has epochs as direct keys
    const epochKey = `Epoch ${targetEpoch}`;
    console.log(`🔍 Looking for epoch key: "${epochKey}"`);
    
    // Check if the device has data for this epoch by looking for epoch-specific metric keys
    const epochMetricKeys = Object.keys(device).filter(key => key.startsWith(epochKey));
    console.log(`🔍 Found epoch metric keys:`, epochMetricKeys);
    
    if (epochMetricKeys.length === 0) {
      console.log(`❌ Epoch ${targetEpoch} not found in device data`);
      return Response.json({
        mac,
        epoch: targetEpoch,
        stats: {
          sessions: 0,
          users: 0,
          rejects: 0,
          total_gbs: 0,
          network_status: 'Unknown',
          location_status: 'Unknown'
        }
      });
    }

    console.log(`✅ Epoch ${targetEpoch} found in device data`);
    
    // Extract the metrics for this epoch using epoch-specific keys
    const sessions = parseFloat(device[`${epochKey} # Sessions`] || '0') || 0;
    const users = parseFloat(device[`${epochKey} # Users`] || '0') || 0;
    const rejects = parseFloat(device[`${epochKey} # Rejects`] || '0') || 0;
    const totalGbs = parseFloat(device[`${epochKey} Total GBs`] || '0') || 0;
    const networkStatus = device[`${epochKey} Network Status`] || 'Unknown';
    const locationStatus = device[`${epochKey} Location Status`] || 'Unknown';

    console.log(`🔍 Extracted values:`);
    console.log(`  Sessions: ${sessions}`);
    console.log(`  Users: ${users}`);
    console.log(`  Rejects: ${rejects}`);
    console.log(`  Total GBs: ${totalGbs}`);
    console.log(`  Network Status: ${networkStatus}`);
    console.log(`  Location Status: ${locationStatus}`);
    
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
