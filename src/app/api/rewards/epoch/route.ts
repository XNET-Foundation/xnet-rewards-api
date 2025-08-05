import { fetchDataRewardsSheet, fetchBonusRewardsSheet, fetchPocRewardsSheet, DeviceData } from '@/utils/sheet';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mac = searchParams.get('mac');
  const epoch = searchParams.get('epoch');

  if (!mac) return new Response('Missing MAC', { status: 400 });
  if (!epoch) return new Response('Missing epoch', { status: 400 });

  // Fetch all three reward types
  const [dataRewards, bonusRewards, pocRewards] = await Promise.all([
    fetchDataRewardsSheet(),
    fetchBonusRewardsSheet(),
    fetchPocRewardsSheet()
  ]);

  const dataDevice = dataRewards.find((d) => d['MAC Address'] === mac);
  const bonusDevice = bonusRewards.find((d) => d['MAC Address'] === mac);
  const pocDevice = pocRewards.find((d) => d['MAC Address'] === mac);
  
  if (!dataDevice) return new Response('Device not found', { status: 404 });

  const key = `Epoch ${epoch}`;
  
  // Get all three reward types for this epoch
  const dataRewardsValue = parseFloat(dataDevice[key] || '0') || 0;
  const bonusRewardsValue = parseFloat(bonusDevice?.[key] || '0') || 0;
  const pocRewardsValue = parseFloat(pocDevice?.[key] || '0') || 0;
  
  const totalRewards = dataRewardsValue + bonusRewardsValue + pocRewardsValue;

  return Response.json({
    mac,
    epoch,
    rewards: {
      data_rewards: dataRewardsValue,
      bonus_rewards: bonusRewardsValue,
      poc_rewards: pocRewardsValue,
      total_rewards: totalRewards
    }
  });
}

