/**
 * Trends Box Multi-Platform Rewarded Ads Configuration & Adapter
 * 
 * Supports:
 * 1. 'simulation': Ultra-realistic, high-performance interactive video player
 *    with timer countdown (15s, 30s, 60s), anti-skip protection, and instant TRB rewards.
 * 2. 'admob': Google AdMob / AdSense for Web (Google Publisher Tag / H5 Games SDK).
 * 3. 'custom': Custom VAST 3.0 / HTML5 tag or ad network partner.
 * 
 * HOW TO CONNECT YOUR AD NETWORK CREDENTIALS:
 * - Set `provider` to 'admob' or 'custom'.
 * - Paste your Google AdMob/AdSense Publisher ID in `admob.publisherId` (e.g., 'ca-pub-1234567890123456').
 * - Paste your Rewarded Video Ad Unit ID in `admob.rewardedSlotId` (e.g., '/1234567/rewarded_video').
 * - Or set VAST XML tag URL in `custom.vastUrl`.
 */

export type AdProviderType = 'simulation' | 'admob' | 'custom';

export interface AdsConfiguration {
  /** Active provider. Defaults to 'simulation' so rewards work immediately before keys are added */
  provider: AdProviderType;
  /** Rewards configuration */
  rewards: {
    pointsPerAd: number; // Default: 5 TRB points
    maxAdsPerDay: number; // Default: 10 ads per day
    durations: (15 | 30 | 60)[]; // Allowed durations in seconds
  };
  /** Google AdMob / AdSense Web settings */
  admob: {
    publisherId: string; // e.g. "ca-pub-XXXXXXXXXXXXXXXX"
    rewardedSlotId: string; // e.g. "ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY" or "/network/slot"
    testMode: boolean;
  };
  /** Custom / VAST video ad network settings */
  custom: {
    networkName: string;
    vastUrl?: string;
    customScriptUrl?: string;
  };
}

export const ADS_CONFIG: AdsConfiguration = {
  provider: 'simulation', // Change to 'admob' or 'custom' when credentials are ready
  rewards: {
    pointsPerAd: 5,
    maxAdsPerDay: 10,
    durations: [15, 30, 60]
  },
  admob: {
    publisherId: 'ca-pub-0000000000000000', // Paste your AdSense/AdMob Publisher ID here
    rewardedSlotId: 'ca-app-pub-0000000000000000/0000000000', // Paste your Ad Unit ID here
    testMode: true
  },
  custom: {
    networkName: 'Universal Ad Network',
    vastUrl: ''
  }
};
