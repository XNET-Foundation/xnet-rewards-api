import { fetchDataRewardsSheet, fetchBonusRewardsSheet, fetchPocRewardsSheet, DeviceData } from '@/utils/sheet';
import { getCurrentEpoch, getRecentEpochs } from '@/utils/epoch';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mac = searchParams.get('mac');
  const epochs = parseInt(searchParams.get('epochs') || '1');

  if (!mac) return new Response('Missing MAC', { status: 400 });

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

  // Get the list of recent epochs to aggregate
  const recentEpochs = getRecentEpochs(epochs);
  
  // Create epoch keys in the format "Epoch X"
  const epochKeys = recentEpochs.map(ep => `Epoch ${ep}`);

  // Calculate all three reward types separately
  let dataRewardsTotal = 0;
  let bonusRewardsTotal = 0;
  let pocRewardsTotal = 0;

  epochKeys.forEach(key => {
    // Data rewards (from the data rewards sheet)
    const dataValue = parseFloat(dataDevice[key] || '0') || 0;
    dataRewardsTotal += dataValue;

    // Bonus rewards (from the bonus rewards sheet)
    const bonusValue = parseFloat(bonusDevice?.[key] || '0') || 0;
    bonusRewardsTotal += bonusValue;

    // PoC rewards (from the PoC rewards sheet)
    const pocValue = parseFloat(pocDevice?.[key] || '0') || 0;
    pocRewardsTotal += pocValue;
  });

  const totalRewards = dataRewardsTotal + bonusRewardsTotal + pocRewardsTotal;

  return Response.json({
    mac,
    current_epoch: getCurrentEpoch(),
    epochs: epochKeys,
    rewards: {
      data_rewards: dataRewardsTotal,
      bonus_rewards: bonusRewardsTotal,
      poc_rewards: pocRewardsTotal,
      total_rewards: totalRewards
    }
  });
}
