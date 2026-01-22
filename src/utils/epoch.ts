// Genesis epoch start date (November 14th, 2022, midnight Pacific)
const GENESIS_EPOCH_BEGIN_DATE = new Date("2022-11-14T08:00:00.000Z");

// Time an epoch lasts (2 weeks)
const EPOCH_INTERVAL_MS = 14 * 24 * 60 * 60 * 1000;

// Payout delay: epochs are not available in API until 4 days after they end
const PAYOUT_DELAY_MS = 4 * 24 * 60 * 60 * 1000;

/**
 * Get the most recently completed epoch number (accounting for payout delay)
 */
export const getLastEpoch = () => {
  const now = new Date().getTime();
  const adjustedTime = now - PAYOUT_DELAY_MS;
  return Math.floor((adjustedTime - GENESIS_EPOCH_BEGIN_DATE.getTime()) / EPOCH_INTERVAL_MS) - 1;
};

/**
 * Get the current (uncompleted) epoch number
 */
export const getCurrentEpoch = () =>
  getLastEpoch() + 1;

/**
 * Get the start date of a specific epoch
 */
export const getEpochBeginDate = (ep: number) =>
  new Date(GENESIS_EPOCH_BEGIN_DATE.getTime() + EPOCH_INTERVAL_MS * ep);

/**
 * Get the end date of a specific epoch
 */
export const getEpochEndDate = (ep: number) =>
  getEpochBeginDate(ep + 1);

/**
 * Get a list of epoch numbers from current epoch going backwards
 * @param count Number of epochs to get
 * @returns Array of epoch numbers in descending order
 */
export const getRecentEpochs = (count: number) => {
  const currentEpoch = getCurrentEpoch();
  return Array.from({ length: count }, (_, i) => currentEpoch - i - 1);
}; 