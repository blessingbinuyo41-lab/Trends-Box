# Custom Multi-Platform Rewarded Ads & "TRB" Points Quota System (Revised)

A monetization and engagement architecture to incentivize rewarded video ads (AdMob / AdSense for Web, Unity Ads, AppLovin, or custom network tags), featuring branded **"TRB" Points** and reducing standard everyday free quotas from **10 to 6**, with dynamic warning color thresholds adapted to the earned TRB points.

---

## 1. Core Quota & TRB Rules (Updated)

```
                    [ Everyday Free Quota: 6 Generations ]
                                       │
                    Used < 6 Generations Today?
                      ├── YES ──► Normal Generation (Watching ads disabled)
                      └── NO  ──► Free Quotas Exhausted (Locked)
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
             [ Option A: Wait ]             [ Option B: Watch Rewarded Ad ]
         Auto-resets at 12:00 AM WAT          • 15s, 30s, or 60s video ad
                                              • Max: 10 ads/day
                                              • Earn: +5 "TRB" Points / Quotas
                                              • Effective limit becomes: 6 + (Earned TRB)
                                              • Instantly unlocks generation!
```

### Key Specifications:
1. **Everyday Free Quota Reduced to 6**:
   - `DAILY_LIMIT` changed from `10` to `6` generations per day.
   - Resets automatically at 12:00 AM West Africa Time (WAT / Africa:Lagos).
2. **Access Gate**:
   - Users **cannot** watch ads while they still have free daily quota remaining ($< 6$ used).
   - Once all 6 generations are exhausted, the rewarded ad flow is unlocked.
3. **Reward Structure**:
   - Each completed ad view credits **+5 TRB Points** (equivalent to 5 additional editorial generations).
   - Total effective limit for the day dynamically scales:
     $$\text{Effective Limit} = 6 + \text{Earned TRB}$$
4. **Daily Cap**:
   - Maximum of **10 ads per day** (allowing dedicated users to earn up to +50 bonus generations, for a daily maximum of 56 generations).
5. **Adaptive Color Warning Indicator**:
   - The deduction color warnings adapt dynamically to the expanded `effectiveLimit`:
     - **Normal (Green/Neutral)**: Used $< 70\%$ of current effective limit (e.g. 0–3 of 6, or 6–8 of 11).
     - **Warning (Amber)**: Used $\ge 70\%$ of current effective limit (e.g. 4–5 of 6, or 9–10 of 11).
     - **Locked / Exhausted (Rose/Red)**: Used $\ge \text{Effective Limit}$. Prompts the user to watch a rewarded ad to earn +5 TRB or wait until midnight.
6. **Real-time Persistence**:
   - Synchronized across local storage and Supabase user metadata so TRB points persist across devices and reloads.

---

## 2. Multi-Platform Ad Support & Architecture

We build an extensible, modular ad engine (`src/lib/adsConfig.ts` & `src/components/RewardedAdModal.tsx`):

### Supported Ad Modes:
- **Interactive Simulation Mode (Default)**:
  - Realistic, sleek branded video ad player with timer countdown (15s, 30s, 60s), anti-skip protection, and sound toggle. Allows instant end-to-end testing of TRB unlocks without requiring pre-approved ad network keys.
- **Google AdSense / AdMob for Web (Rewarded H5 Ads)**:
  - Ready placement hooks using the standard Google Publisher Tag (`googletag`) rewarded slot pattern.
- **Custom Network / VAST 3.0 / HTML5 Tags**:
  - Modular config in `src/lib/adsConfig.ts` where you can paste your Publisher ID, Ad Unit ID, or VAST XML tag URL.

---

## 3. UI/UX & Component Upgrades

1. **`src/lib/quota.ts`**:
   - Update `DAILY_LIMIT = 6`.
   - Add TRB methods: `getTrbBonusQuota()`, `addTrbReward()`, `getTrbAdsWatchedToday()`, `canWatchRewardedAd()`, and `getEffectiveLimit()`.
2. **`src/lib/adsConfig.ts`**:
   - Multi-platform ad adapter and configuration slots with documentation comments.
3. **`src/components/RewardedAdModal.tsx`**:
   - 3D-styled, hardware-accelerated video ad player modal with live countdown, anti-skip verification, and celebration view when 5 TRB points are added.
4. **`src/components/DailyLimitModal.tsx`**:
   - Displays new 6-quota baseline.
   - When quota is reached, provides the prominent **"Watch Ad & Earn +5 TRB"** button with live remaining ad slots (`X / 10 watched today`), alongside the midnight WAT countdown.
5. **`src/App.tsx` & `UsageBadge`**:
   - Badges display the adapted ratio (e.g., `4/6` or `6/6 + 5 TRB`).
   - Warning colors automatically shift dynamically based on $\ge 70\%$ of the dynamic effective limit.
6. **Landing Page & Modals**:
   - Synchronize copy from "10 daily generations" to "6 daily generations + earn bonus TRB points".
