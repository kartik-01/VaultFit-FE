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
  parseTrueNumberOnly: true,
});

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
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
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
      const type = record['@_type'];
      const startDate = record['@_startDate'];
      const value = parseFloat(record['@_value'] || '0');
      const date = startDate ? new Date(startDate).toISOString().split('T')[0] : null;

      if (!date) return;

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
          const sleepValue = record['@_value'];
          const endDate = record['@_endDate'];
          if (sleepValue && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

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
      const startDate = workout['@_startDate'];
      const endDate = workout['@_endDate'];
      const type = workout['@_workoutActivityType'] || 'Unknown';
      const duration = parseFloat(workout['@_duration'] || '0');
      const calories = parseFloat(workout['@_totalEnergyBurned'] || '0');
      const distance = parseFloat(workout['@_totalDistance'] || '0');

      if (startDate) {
        const date = new Date(startDate).toISOString().split('T')[0];
        parsed.workouts.push({
          type: type.replace('HKWorkoutActivityType', ''),
          date,
          duration,
          calories,
          distance: distance || undefined,
        });
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

