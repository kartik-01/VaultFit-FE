/**
 * XML parsing utilities using fast-xml-parser
 * Parses Apple Health XML export files
 */
import { XMLParser } from 'fast-xml-parser';

export interface UserInfo {
  name?: string; // Optional, manually entered by user
  dateOfBirth?: string;
  biologicalSex?: string;
  bloodType?: string;
  skinType?: string;
  age?: number;
}

export interface ParsedHealthData {
  userInfo?: UserInfo;
  steps: Array<{ date: string; value: number }>;
  heartRate: Array<{ date: string; value: number }>;
  activeEnergy: Array<{ date: string; value: number }>;
  restingEnergy: Array<{ date: string; value: number }>;
  sleep: Array<{ date: string; deep: number; light: number; rem: number }>;
  workouts: Array<{
    type: string;
    date: string;
    duration: number;
    calories: number;
    distance?: number;
  }>;
}

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
      console.warn('Invalid date string:', dateString);
      return null;
    }
    
    // Convert to ISO string and extract date part
    const isoString = date.toISOString();
    return isoString.split('T')[0];
  } catch (error) {
    console.warn('Error parsing date:', dateString, error);
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

/**
 * Parse Apple Health XML file
 */
export function parseHealthXML(xmlString: string): ParsedHealthData {
  const result = parser.parse(xmlString);
  const healthData = result.HealthData || {};

  const parsed: ParsedHealthData = {
    userInfo: undefined,
    steps: [],
    heartRate: [],
    activeEnergy: [],
    restingEnergy: [],
    sleep: [],
    workouts: [],
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
    const type = record['@_type'];
    const startDate = record['@_startDate'];
    const value = parseFloat(record['@_value'] || '0');
    const date = safeParseDate(startDate);

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
        if (sleepValue && endDate && startDate) {
          const start = safeParseDateObject(startDate);
          const end = safeParseDateObject(endDate);
          
          if (start && end) {
            const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
            
            if (duration > 0 && duration < 24) { // Sanity check: sleep duration should be reasonable
              const existingSleep = parsed.sleep.find(s => s.date === date);
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
    const startDate = workout['@_startDate'];
    const _endDate = workout['@_endDate'];
    const type = workout['@_workoutActivityType'] || 'Unknown';
    const duration = parseFloat(workout['@_duration'] || '0');
    const calories = parseFloat(workout['@_totalEnergyBurned'] || '0');
    const distance = parseFloat(workout['@_totalDistance'] || '0');

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

  // Aggregate data by date
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
    return Array.from(grouped.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );
  };

  parsed.steps = aggregateByDate(parsed.steps);
  parsed.activeEnergy = aggregateByDate(parsed.activeEnergy);
  parsed.restingEnergy = aggregateByDate(parsed.restingEnergy);

  // Aggregate heart rate by averaging
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
  parsed.heartRate = Array.from(heartRateGrouped.values()).map((item) => ({
    date: item.date,
    value: Math.round(item.sum / item.count),
  })).sort((a, b) => a.date.localeCompare(b.date));

  return parsed;
}

/**
 * Extract XML from ZIP file (Apple Health export)
 */
export async function extractXMLFromZip(file: File): Promise<string> {
  // Check if file is already XML
  if (file.name.endsWith('.xml')) {
    const text = await file.text();
    if (text.trim().startsWith('<?xml') || text.trim().startsWith('<HealthData')) {
      return text;
    }
    throw new Error('Invalid XML file format.');
  }

  // Handle ZIP files
  if (file.name.endsWith('.zip')) {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(file);
      
      // Look for export.xml in the root or in apple_health_export folder
      const xmlFile = zip.file('export.xml') || 
                      zip.file('apple_health_export/export.xml') ||
                      Object.values(zip.files).find(f => f.name.endsWith('export.xml'));
      
      if (xmlFile) {
        const xmlString = await xmlFile.async('string');
        return xmlString;
      }
      
      throw new Error('Could not find export.xml in the ZIP file. Please ensure you exported from Apple Health correctly.');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Could not find')) {
        throw error;
      }
      throw new Error(`Failed to extract XML from ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  throw new Error('Unsupported file format. Please upload an Apple Health XML export (.xml) or ZIP file (.zip).');
}

