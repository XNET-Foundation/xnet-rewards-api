import { fetchWifiStatsSheet } from '@/utils/sheet';

export async function GET() {
  try {
    const wifiStats = await fetchWifiStatsSheet();

    const radio_ids = Array.from(
      new Set(
        wifiStats
          .map((device) => device['MAC Address']?.trim())
          .filter((id): id is string => Boolean(id))
      )
    ).sort();

    return Response.json({
      count: radio_ids.length,
      radio_ids,
    });
  } catch (error) {
    console.error('Error fetching radio IDs:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
