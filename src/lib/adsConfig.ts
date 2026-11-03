/**
 * Trends Box Multi-Platform Rewarded Ads Configuration & SDK Adapter
 * 
 * ARCHITECTURE:
 * 1. 'admob': Connects to Google AdSense / AdMob for Web (Google Publisher Tag - GPT / H5 SDK).
 * 2. 'custom': Connects to third-party ad networks (e.g. Unity Ads, AppLovin, custom VAST video tags).
 * 3. 'simulation': Interactive high-fidelity test ad player (active by default).
 * 
 * FALLBACK SAFETY GUARANTEE:
 * If a live ad network ('admob' or 'custom') fails to fill an ad (e.g. adblocker active, no inventory,
 * network timeout, or unapproved domain), `fallbackToSimulationOnNoFill: true` ensures the system
 * smoothly falls back to the interactive player so the user is NEVER cheated out of their earned TRB points!
 */

export type AdProviderType = 'simulation' | 'admob' | 'custom';

export interface AdsConfiguration {
  /** Active provider. Change to 'admob' or 'custom' when your credentials are live */
  provider: AdProviderType;
  /** Automatically fall back to demo simulation if the real ad network fails to fill */
  fallbackToSimulationOnNoFill: boolean;
  /** Rewards configuration */
  rewards: {
    pointsPerAd: number; // 5 TRB points per completed ad
    maxAdsPerDay: number; // 10 ads max per day
    durations: (15 | 30 | 60)[]; // Durations in seconds
  };
  /** Google AdMob / AdSense for Web credentials */
  admob: {
    publisherId: string; // e.g. "ca-pub-XXXXXXXXXXXXXXXX"
    rewardedSlotId: string; // e.g. "/1234567/rewarded_video" or "ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY"
    testMode: boolean; // Set to false when your account is approved and live
  };
  /** Custom / VAST video ad network credentials */
  custom: {
    networkName: string;
    vastUrl?: string; // VAST 3.0 / 4.0 XML Endpoint URL
    customScriptUrl?: string; // External ad network JavaScript SDK tag
  };
}

export const ADS_CONFIG: AdsConfiguration = {
  provider: 'simulation', // Set to 'admob' when you add your real publisherId & rewardedSlotId
  fallbackToSimulationOnNoFill: true, // Guarantees user can always earn their TRB points
  rewards: {
    pointsPerAd: 5,
    maxAdsPerDay: 10,
    durations: [15, 30, 60]
  },
  admob: {
    publisherId: 'ca-pub-0000000000000000', // Paste your Google AdSense/AdMob Publisher ID here
    rewardedSlotId: 'ca-app-pub-0000000000000000/0000000000', // Paste your Rewarded Ad Unit ID here
    testMode: true
  },
  custom: {
    networkName: 'Universal Ad Network',
    vastUrl: '' // Paste your VAST URL tag if using an ad partner
  }
};
