import * as adhan from 'adhan';

const DEFAULT_PRAYER_COORDS = { latitude: 21.4225, longitude: 39.8262 };

const hijriNumericFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric'
});

const getNumericHijriParts = (date) => hijriNumericFormatter.formatToParts(date).reduce((acc, part) => {
  if (part.type === 'day' || part.type === 'month' || part.type === 'year') {
    acc[part.type] = parseInt(part.value, 10);
  }
  return acc;
}, {});

export const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

export const buildHijriPeriodKey = ({ year, month }) => `${year}-${String(month).padStart(2, '0')}`;

export const getHijriDateInfo = (date, language = 'en') => {
  const localizedFormatter = new Intl.DateTimeFormat(
    language === 'ar' ? 'ar-SA-u-ca-islamic-umalqura' : 'en-u-ca-islamic-umalqura',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  );

  const numericParts = getNumericHijriParts(date);

  return {
    day: numericParts.day,
    month: numericParts.month,
    year: numericParts.year,
    label: localizedFormatter.format(date)
  };
};

export const getStoredPrayerCoords = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_PRAYER_COORDS;
  }

  try {
    const saved = window.localStorage.getItem('prayerCoords');
    if (!saved) {
      return DEFAULT_PRAYER_COORDS;
    }

    const parsed = JSON.parse(saved);
    if (typeof parsed?.latitude === 'number' && typeof parsed?.longitude === 'number') {
      return parsed;
    }
  } catch (error) {
    console.error('Unable to parse stored prayer coordinates:', error);
  }

  return DEFAULT_PRAYER_COORDS;
};

export const getPrayerMoments = (date, coords = DEFAULT_PRAYER_COORDS) => {
  const safeCoords = typeof coords?.latitude === 'number' && typeof coords?.longitude === 'number'
    ? coords
    : DEFAULT_PRAYER_COORDS;

  const coordinates = new adhan.Coordinates(safeCoords.latitude, safeCoords.longitude);
  const params = adhan.CalculationMethod.MuslimWorldLeague();
  const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);

  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  const nextDayPrayerTimes = new adhan.PrayerTimes(coordinates, nextDay, params);

  const nightDuration = nextDayPrayerTimes.fajr.getTime() - prayerTimes.maghrib.getTime();

  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    duhaStart: addMinutes(prayerTimes.sunrise, 20),
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
    nextFajr: nextDayPrayerTimes.fajr,
    lastThirdStart: new Date(nextDayPrayerTimes.fajr.getTime() - (nightDuration / 3))
  };
};

export const isTimeWithinWindow = (date, start, end) => {
  const current = date.getTime();
  return current >= start.getTime() && current < end.getTime();
};

export const getHijriMonthLength = (date) => {
  const currentHijri = getNumericHijriParts(date);
  const cursor = new Date(date);
  cursor.setHours(12, 0, 0, 0);

  while (getNumericHijriParts(cursor).day !== 1) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let length = 0;

  while (length < 35) {
    const info = getNumericHijriParts(cursor);
    if (info.month !== currentHijri.month || info.year !== currentHijri.year) {
      break;
    }

    length += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return length || 30;
};
