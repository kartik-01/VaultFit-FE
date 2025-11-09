/**
 * Web Worker for parsing large XML files
 * This prevents blocking the main thread
 */
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  trimValues: true,
  parseTagValue: true,
});

/**
 * Safely parse a date string and return ISO date string (YYYY-MM-DD)
 * Handles mobile browser date parsing issues
 */
function safeParseDate(dateString: string | undefined | null): string | null {
  if (!dateString) return null;
  
  try {
    // Clean the date string - remove any whitespace
    const cleaned = dateString.trim();
    if (!cleaned) return null;
    
    // Create date object
    const date = new Date(cleaned);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // Try parsing as ISO string directly if it's already in that format
      if (cleaned.match(/^\d{4}-\d{2}-\d{2}/)) {
        return cleaned.substring(0, 10);
      }
      return null;
    }
    
    // Convert to ISO string and extract date part
    // Use UTC methods to avoid timezone issues on mobile
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    // Fallback: try to extract date from string if it's in ISO format
    try {
      if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
        return dateString.substring(0, 10);
      }
    } catch (e) {
      // Ignore fallback errors
    }
    return null;
  }
}

/**
 * Safely parse a date string and return Date object
 */
function safeParseDateObject(dateString: string | undefined | null): Date | null {
  if (!dateString) return null;
  
  try {
    const cleaned = dateString.trim();
    if (!cleaned) return null;
    
    const date = new Date(cleaned);
    
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (error) {
    return null;
  }
}

self.onmessage = function (e: MessageEvent) {
  const { xmlString } = e.data;

  try {
    const result = parser.parse(xmlString);
    const healthData = result.HealthData || {};

    const parsed = {
      userInfo: undefined as any,
      steps: [] as Array<{ date: string; value: number }>,
      heartRate: [] as Array<{ date: string; value: number }>,
      activeEnergy: [] as Array<{ date: string; value: number }>,
      restingEnergy: [] as Array<{ date: string; value: number }>,
      sleep: [] as Array<{ date: string; deep: number; light: number; rem: number }>,
      workouts: [] as Array<{
        type: string;
        date: string;
        duration: number;
        calories: number;
        distance?: number;
      }>,
    };

    // Parse User Info from <Me> element
    if (healthData.Me) {
      const me = healthData.Me;
      const dateOfBirth = me['@_HKCharacteristicTypeIdentifierDateOfBirth'];
      const biologicalSex = me['@_HKCharacteristicTypeIdentifierBiologicalSex'];
      const bloodType = me['@_HKCharacteristicTypeIdentifierBloodType'];
      const skinType = me['@_HKCharacteristicTypeIdentifierFitzpatrickSkinType'];

      let age: number | undefined;
      if (dateOfBirth) {
        const birthDate = safeParseDateObject(dateOfBirth);
        if (birthDate) {
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }
      }

      // Format biological sex
      let formattedSex: string | undefined;
      if (biologicalSex) {
        if (biologicalSex.includes('Male')) formattedSex = 'Male';
        else if (biologicalSex.includes('Female')) formattedSex = 'Female';
        else if (biologicalSex.includes('Other')) formattedSex = 'Other';
      }

      // Format blood type
      let formattedBloodType: string | undefined;
      if (bloodType && !bloodType.includes('NotSet')) {
        formattedBloodType = bloodType.replace('HKBloodType', '');
      }

      parsed.userInfo = {
        dateOfBirth: dateOfBirth || undefined,
        biologicalSex: formattedSex,
        bloodType: formattedBloodType,
        skinType: skinType && !skinType.includes('NotSet') ? skinType.replace('HKFitzpatrickSkinType', '') : undefined,
        age,
      };
    }

    // Parse Records
    const records = Array.isArray(healthData.Record)
      ? healthData.Record
      : healthData.Record
        ? [healthData.Record]
        : [];

    records.forEach((record: any) => {
      // Handle both @_ prefixed attributes and direct attribute access (mobile compatibility)
      const type = record['@_type'] || record.type;
      const startDate = record['@_startDate'] || record.startDate;
      
      // Handle value parsing more robustly for mobile
      let value = 0;
      const valueStr = record['@_value'] || record.value;
      if (valueStr !== undefined && valueStr !== null && valueStr !== '') {
        const parsed = parseFloat(String(valueStr));
        if (!isNaN(parsed)) {
          value = parsed;
        }
      }
      
      const date = safeParseDate(startDate);

      if (!date || !type) return;

      switch (type) {
        case 'HKQuantityTypeIdentifierStepCount':
          parsed.steps.push({ date, value });
          break;
        case 'HKQuantityTypeIdentifierHeartRate':
          parsed.heartRate.push({ date, value });
          break;
        case 'HKQuantityTypeIdentifierActiveEnergyBurned':
          parsed.activeEnergy.push({ date, value });
          break;
        case 'HKQuantityTypeIdentifierBasalEnergyBurned':
          parsed.restingEnergy.push({ date, value });
          break;
        case 'HKCategoryTypeIdentifierSleepAnalysis':
          const sleepValue = record['@_value'] || record.value;
          const endDate = record['@_endDate'] || record.endDate;
          if (sleepValue && endDate && startDate) {
            const start = safeParseDateObject(startDate);
            const end = safeParseDateObject(endDate);
            
            if (start && end) {
              const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

              if (duration > 0 && duration < 24) { // Sanity check: sleep duration should be reasonable
                const existingSleep = parsed.sleep.find((s) => s.date === date);
                if (existingSleep) {
                  if (sleepValue.includes('Deep')) existingSleep.deep += duration;
                  else if (sleepValue.includes('Core')) existingSleep.light += duration;
                  else if (sleepValue.includes('REM')) existingSleep.rem += duration;
                } else {
                  parsed.sleep.push({
                    date,
                    deep: sleepValue.includes('Deep') ? duration : 0,
                    light: sleepValue.includes('Core') ? duration : 0,
                    rem: sleepValue.includes('REM') ? duration : 0,
                  });
                }
              }
            }
          }
          break;
      }
    });

    // Parse Workouts
    const workouts = Array.isArray(healthData.Workout)
      ? healthData.Workout
      : healthData.Workout
        ? [healthData.Workout]
        : [];

    workouts.forEach((workout: any) => {
      const startDate = workout['@_startDate'] || workout.startDate;
      const _endDate = workout['@_endDate'] || workout.endDate;
      const type = workout['@_workoutActivityType'] || workout.workoutActivityType || 'Unknown';
      
      // Handle numeric parsing more robustly
      let duration = 0;
      const durationStr = workout['@_duration'] || workout.duration;
      if (durationStr !== undefined && durationStr !== null && durationStr !== '') {
        const parsed = parseFloat(String(durationStr));
        if (!isNaN(parsed)) duration = parsed;
      }
      
      let calories = 0;
      const caloriesStr = workout['@_totalEnergyBurned'] || workout.totalEnergyBurned;
      if (caloriesStr !== undefined && caloriesStr !== null && caloriesStr !== '') {
        const parsed = parseFloat(String(caloriesStr));
        if (!isNaN(parsed)) calories = parsed;
      }
      
      let distance = 0;
      const distanceStr = workout['@_totalDistance'] || workout.totalDistance;
      if (distanceStr !== undefined && distanceStr !== null && distanceStr !== '') {
        const parsed = parseFloat(String(distanceStr));
        if (!isNaN(parsed)) distance = parsed;
      }

      if (startDate) {
        const date = safeParseDate(startDate);
        if (date) {
          parsed.workouts.push({
            type: type.replace('HKWorkoutActivityType', ''),
            date,
            duration,
            calories,
            distance: distance || undefined,
          });
        }
      }
    });

    // Aggregate data
    const aggregateByDate = <T extends { date: string; value: number }>(
      data: T[]
    ): T[] => {
      const grouped = new Map<string, T>();
      data.forEach((item) => {
        const existing = grouped.get(item.date);
        if (existing) {
          existing.value += item.value;
        } else {
          grouped.set(item.date, { ...item });
        }
      });
      return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
    };

    parsed.steps = aggregateByDate(parsed.steps);
    parsed.activeEnergy = aggregateByDate(parsed.activeEnergy);
    parsed.restingEnergy = aggregateByDate(parsed.restingEnergy);

    const heartRateGrouped = new Map<string, { date: string; sum: number; count: number }>();
    parsed.heartRate.forEach((item) => {
      const existing = heartRateGrouped.get(item.date);
      if (existing) {
        existing.sum += item.value;
        existing.count += 1;
      } else {
        heartRateGrouped.set(item.date, { date: item.date, sum: item.value, count: 1 });
      }
    });
    parsed.heartRate = Array.from(heartRateGrouped.values())
      .map((item) => ({
        date: item.date,
        value: Math.round(item.sum / item.count),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    self.postMessage({ success: true, data: parsed });
  } catch (error) {
    self.postMessage({ success: false, error: (error as Error).message });
  }
};

