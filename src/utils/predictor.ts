import { PredictionItem, PredictionStatus, TimeFrame } from '../types';

export interface RealTimeWingoDraw {
  issueNumber: string;
  number: number;
}

// Fetch real-time draws from express proxy and synchronize target period/countdown
export async function fetchRealTimeDraws(timeFrame: TimeFrame): Promise<{
  list: RealTimeWingoDraw[];
  currentPeriod: string;
  secondsLeft: number;
}> {
  try {
    const res = await fetch(`/api/wingo?timeframe=${timeFrame}`);
    const json = await res.json();
    
    if (json && json.code === 0 && json.data && json.data.list) {
      const list = json.data.list.map((item: any) => ({
        issueNumber: String(item.issueNumber),
        number: parseInt(item.number)
      }));

      const latestIssue = list[0]?.issueNumber;
      // Target upcoming period is drawn period + 1
      const currentPeriod = latestIssue ? (BigInt(latestIssue) + 1n).toString() : '';

      const now = new Date();
      const seconds = now.getSeconds();
      const secondsLeft = timeFrame === '1m' ? (60 - seconds) : (seconds >= 30 ? 60 - seconds : 30 - seconds);

      return { list, currentPeriod, secondsLeft };
    }
  } catch (error) {
    console.error('Failed to fetch real-time wingo draws:', error);
  }

  // Fallback to time-calculated period index
  const fallback = getCurrentPeriod(timeFrame);
  return { list: [], currentPeriod: fallback.period, secondsLeft: fallback.secondsLeft };
}

// Simple seeded pseudo-random number generator
class SeededRandom {
  private seed: number;

  constructor(seedStr: string) {
    this.seed = this.hashCode(seedStr);
  }

  private hashCode(str: string): number {
    let hash = 123456789;
    for (let i = 0; i < str.length; i++) {
      hash = Math.imul(hash ^ str.charCodeAt(i), 16777619);
    }
    return hash >>> 0;
  }

  // Returns number between 0 and 1
  next(): number {
    this.seed |= 0;
    this.seed = (this.seed + 0x9e3779b9) | 0;
    let t = this.seed ^ (this.seed >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    t = t ^ (t >>> 15);
    return (t >>> 0) / 4294967296;
  }

  // Returns number in range [min, max]
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Returns random element of array
  choice<T>(arr: T[]): T {
    const idx = Math.floor(this.next() * arr.length);
    return arr[idx];
  }
}

// Get formatted period code based on current date and time
export function getCurrentPeriod(timeFrame: TimeFrame): { period: string; secondsLeft: number } {
  const now = new Date();
  
  // Use UTC to align with the Wingo server exactly!
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const date = String(now.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}${month}${date}`;

  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();
  const seconds = now.getUTCSeconds();

  if (timeFrame === '1m') {
    const totalMinutes = hours * 60 + minutes;
    const periodIndex = totalMinutes + 1; // 1-indexed
    const period = `${dateStr}10001${String(periodIndex).padStart(4, '0')}`;
    const secondsLeft = 60 - seconds;
    return { period, secondsLeft };
  } else {
    // 30s timeframe
    const totalHalfMinutes = (hours * 60 + minutes) * 2 + (seconds >= 30 ? 1 : 0);
    const periodIndex = totalHalfMinutes + 1; // 1-indexed
    const period = `${dateStr}10005${String(periodIndex).padStart(4, '0')}`;
    const secondsLeft = seconds >= 30 ? 60 - seconds : 30 - seconds;
    return { period, secondsLeft };
  }
}

// Convert a full period number to secure masked display: "2026XXXXXXXX023"
export function formatPeriodMasked(periodStr: string): string {
  if (periodStr.length <= 6) return periodStr;
  return periodStr.slice(0, 4) + 'XXXXXXXX' + periodStr.slice(-3);
}

// Run the prediction engine on a specific period code
export function getPredictionForPeriod(
  periodStr: string,
  mode: 'size' | 'number',
  recentDraws?: RealTimeWingoDraw[]
): {
  prediction: 'BIG' | 'SMALL' | 'SKIP';
  number: string | number;
  confidence: number;
  skip: boolean;
  patternName?: string;
} {
  const rand = new SeededRandom(periodStr);

  // Default deterministic values (fallback)
  let prediction: 'BIG' | 'SMALL' = rand.next() >= 0.5 ? 'BIG' : 'SMALL';
  let number: number;
  if (prediction === 'BIG') {
    number = Math.floor(rand.range(5, 9.99));
  } else {
    number = Math.floor(rand.range(0, 4.99));
  }
  let confidence = Math.floor(rand.range(88, 99));
  let patternName = 'Algorithm Wave Sync';

  // If we have recent draws, analyze the actual real-world pattern!
  if (recentDraws && recentDraws.length >= 3) {
    const lastSizes = recentDraws.slice(0, 5).map((d) => (d.number >= 5 ? 'BIG' : 'SMALL'));

    // 1. Dragon Pattern (3 or more consecutive identical outcomes)
    if (lastSizes.length >= 3 && lastSizes[0] === lastSizes[1] && lastSizes[1] === lastSizes[2]) {
      prediction = lastSizes[0];
      patternName = `Dragon Trend (${prediction})`;
      confidence = Math.floor(rand.range(91, 98));
      
      // Select a matching frequent number for this size
      const sameSizeNums = recentDraws
        .filter((d) => (prediction === 'BIG' ? d.number >= 5 : d.number < 5))
        .map((d) => d.number);
      if (sameSizeNums.length > 0) {
        // Frequency check
        const counts: { [key: number]: number } = {};
        sameSizeNums.forEach((n) => { counts[n] = (counts[n] || 0) + 1; });
        let bestNum = sameSizeNums[0];
        let maxC = 0;
        for (const n in counts) {
          if (counts[n] > maxC) {
            maxC = counts[n];
            bestNum = parseInt(n);
          }
        }
        number = bestNum;
      } else {
        number = prediction === 'BIG' ? Math.floor(rand.range(5, 9.99)) : Math.floor(rand.range(0, 4.99));
      }
    }
    // 2. Alternating Pattern (V-Curve, e.g. B-S-B-S)
    else if (
      lastSizes.length >= 4 &&
      lastSizes[0] !== lastSizes[1] &&
      lastSizes[1] !== lastSizes[2] &&
      lastSizes[2] !== lastSizes[3]
    ) {
      prediction = lastSizes[0] === 'BIG' ? 'SMALL' : 'BIG';
      patternName = `Alternating V-Curve (${prediction})`;
      confidence = Math.floor(rand.range(89, 96));
      number = prediction === 'BIG' ? Math.floor(rand.range(5, 9.99)) : Math.floor(rand.range(0, 4.99));
    }
    // 3. Doublet Pattern (AABB -> AA BB)
    else if (
      lastSizes.length >= 4 &&
      lastSizes[0] === lastSizes[1] &&
      lastSizes[2] === lastSizes[3] &&
      lastSizes[1] !== lastSizes[2]
    ) {
      prediction = lastSizes[0] === 'BIG' ? 'SMALL' : 'BIG';
      patternName = `Doublet Shift (${prediction})`;
      confidence = Math.floor(rand.range(87, 94));
      number = prediction === 'BIG' ? Math.floor(rand.range(5, 9.99)) : Math.floor(rand.range(0, 4.99));
    }
    // 4. Volume Momentum (Majoritarian)
    else {
      const recentSubset = recentDraws.slice(0, 10);
      const bigCount = recentSubset.filter((d) => d.number >= 5).length;
      prediction = bigCount >= 5 ? 'BIG' : 'SMALL';
      patternName = `Volume Momentum (${prediction})`;
      confidence = Math.floor(rand.range(85, 92));
      number = prediction === 'BIG' ? Math.floor(rand.range(5, 9.99)) : Math.floor(rand.range(0, 4.99));
    }
  }

  return {
    prediction,
    number,
    confidence,
    skip: false,
    patternName,
  };
}

// Create fully validated prediction items matching real outcomes from fetched Wingo API draws list
export function getHistoricalRecordsFromDraws(
  draws: RealTimeWingoDraw[],
  mode: 'size' | 'number'
): PredictionItem[] {
  return draws.map((draw, index) => {
    const periodStr = draw.issueNumber;
    const actualNumber = draw.number;

    // Use only older draws as background context to simulate a real historical trend analysis
    const contextDraws = draws.slice(index + 1);
    const pred = getPredictionForPeriod(periodStr, 'size', contextDraws);
    const numPred = getPredictionForPeriod(periodStr, 'number', contextDraws);

    let status: PredictionStatus = 'Pending';
    if (pred.skip) {
      status = 'SKIP';
    } else {
      if (mode === 'size') {
        const isBig = actualNumber >= 5;
        const predictedBig = pred.prediction === 'BIG';
        status = (isBig === predictedBig) ? 'WIN' : 'LOSS';
      } else {
        // Number prediction
        status = (String(actualNumber) === String(numPred.number)) ? 'WIN' : 'LOSS';
      }
    }

    return {
      fullPeriod: periodStr,
      formattedPeriod: formatPeriodMasked(periodStr),
      prediction: pred.skip ? 'SKIP' : pred.prediction,
      number: numPred.skip ? '⚠' : numPred.number,
      status,
      skip: pred.skip,
      timestamp: Date.now() - (index * 60000), // approximate timestamp offset
    };
  });
}

// Retrieve past prediction results for list view (re-creates same results deterministically)
export function getHistoricalRecords(
  timeFrame: TimeFrame,
  count: number = 30,
  mode: 'size' | 'number' = 'size'
): PredictionItem[] {
  const { period: currentPeriod } = getCurrentPeriod(timeFrame);
  const records: PredictionItem[] = [];

  let tempPeriod = BigInt(currentPeriod);
  
  for (let i = 0; i < count; i++) {
    // Go backwards in periods
    tempPeriod = tempPeriod - 1n;
    const periodStr = tempPeriod.toString();

    // Deterministic prediction for this period
    const pred = getPredictionForPeriod(periodStr, 'size');
    const numPred = getPredictionForPeriod(periodStr, 'number');

    // Deterministic actual outcome of this period
    // In real life, outcome is determined by drawing. Here we simulate it deterministically.
    const resultRand = new SeededRandom(periodStr + '_outcome');
    const actualNumber = Math.floor(resultRand.range(0, 9.99));

    let status: PredictionStatus = 'Pending';
    if (pred.skip) {
      status = 'SKIP';
    } else {
      if (mode === 'size') {
        const isBig = actualNumber >= 5;
        const predictedBig = pred.prediction === 'BIG';
        status = (isBig === predictedBig) ? 'WIN' : 'LOSS';
      } else {
        status = (String(actualNumber) === String(numPred.number)) ? 'WIN' : 'LOSS';
      }
    }

    records.push({
      fullPeriod: periodStr,
      formattedPeriod: formatPeriodMasked(periodStr),
      prediction: pred.skip ? 'SKIP' : pred.prediction,
      number: numPred.skip ? '⚠' : numPred.number,
      status,
      skip: pred.skip,
      timestamp: Date.now() - (i * (timeFrame === '1m' ? 60000 : 30000)),
    });
  }

  return records;
}
