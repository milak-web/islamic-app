import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { getHijriDateInfo, getPrayerMoments, getStoredPrayerCoords } from '../utils/islamicCalendar';

const PRAYER_NOTIFICATION_BASE_ID = 1000;
const REMINDER_NOTIFICATION_BASE_ID = 2000;
const PRAYER_CHANNEL_PREFIX = 'prayer-adhan';
const REMINDER_CHANNEL_ID = 'good-deeds-reminders';
const ACTION_TYPE_ID = 'good-deed-actions';
const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

let listenersRegistered = false;

const isNativePlatform = () => {
  const platform = Capacitor.getPlatform();
  return platform === 'android' || platform === 'ios';
};

const isAndroid = () => Capacitor.getPlatform() === 'android';

const getLanguage = () => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  return window.localStorage.getItem('appLanguage') === 'ar' ? 'ar' : 'en';
};

const getSelectedAdhan = () => {
  if (typeof window === 'undefined') {
    return 'adhan_makkah';
  }

  return window.localStorage.getItem('selectedAdhan') || 'adhan_makkah';
};

const getPrayerChannelId = (adhanVoice = getSelectedAdhan()) => `${PRAYER_CHANNEL_PREFIX}-${adhanVoice}`;

const getLocalizedCopy = () => {
  const language = getLanguage();

  const prayerLabels = language === 'ar'
    ? {
        Fajr: 'الفجر',
        Dhuhr: 'الظهر',
        Asr: 'العصر',
        Maghrib: 'المغرب',
        Isha: 'العشاء'
      }
    : {
        Fajr: 'Fajr',
        Dhuhr: 'Dhuhr',
        Asr: 'Asr',
        Maghrib: 'Maghrib',
        Isha: 'Isha'
      };

  return {
    prayerLabels,
    actions: language === 'ar'
      ? {
          quran: 'افتح القرآن',
          tasbih: 'افتح الأذكار',
          prayers: 'مواقيت الصلاة'
        }
      : {
          quran: 'Open Quran',
          tasbih: 'Open Adhkar',
          prayers: 'Prayer Times'
        },
    reminders: language === 'ar'
      ? {
          morningAdhkar: {
            title: 'أذكار الصباح',
            body: 'ابدأ يومك بذكر الله وحصن نفسك مع أذكار الصباح.',
            route: '/tasbih?tab=morning'
          },
          quran: {
            title: 'ورد القرآن اليومي',
            body: 'صفحات قليلة الآن تقرّبك من ختمة مباركة.',
            route: '/quran/read'
          },
          eveningAdhkar: {
            title: 'أذكار المساء',
            body: 'حان وقت أذكار المساء والسكينة قبل نهاية اليوم.',
            route: '/tasbih?tab=evening'
          },
          fridayKahf: {
            title: 'سنة الجمعة',
            body: 'لا تنس قراءة سورة الكهف اليوم.',
            route: '/quran/read/18'
          },
          ramadanQuran: {
            title: 'ختمة رمضان',
            body: 'رمضان فرصة عظيمة؛ افتح القرآن وأكمل وردك اليوم.',
            route: '/quran/read'
          },
          lastTenNights: {
            title: 'العشر الأواخر',
            body: 'خصص هذه الليلة للقيام والقرآن والدعاء.',
            route: '/quran/read'
          },
          fastingPrep: {
            title: 'تذكير بصيام الغد',
            body: 'غدًا يوم صيام مستحب، جدّد نيتك واستعد له من الليلة.',
            route: '/prayer-times'
          },
          shawwal: {
            title: 'ست من شوال',
            body: 'واصل صيام الست من شوال بخطوات ثابتة.',
            route: '/prayer-times'
          }
        }
      : {
          morningAdhkar: {
            title: 'Morning Adhkar',
            body: 'Begin your morning with remembrance and protection.',
            route: '/tasbih?tab=morning'
          },
          quran: {
            title: 'Daily Quran Reading',
            body: 'A few pages now can move your khatmah forward beautifully.',
            route: '/quran/read'
          },
          eveningAdhkar: {
            title: 'Evening Adhkar',
            body: 'Take a moment for your evening adhkar before the day closes.',
            route: '/tasbih?tab=evening'
          },
          fridayKahf: {
            title: 'Friday Sunnah',
            body: 'Do not miss Surah Al-Kahf today.',
            route: '/quran/read/18'
          },
          ramadanQuran: {
            title: 'Ramadan Khatam',
            body: 'Ramadan is your season for Quran. Open your reading and continue today.',
            route: '/quran/read'
          },
          lastTenNights: {
            title: 'Last Ten Nights',
            body: 'Set aside this night for Quran, dhikr, and dua.',
            route: '/quran/read'
          },
          fastingPrep: {
            title: 'Fast Tomorrow',
            body: 'Tomorrow is a recommended fasting day. Renew your intention tonight.',
            route: '/prayer-times'
          },
          shawwal: {
            title: 'Six of Shawwal',
            body: 'A gentle reminder to keep your Shawwal fasting journey going.',
            route: '/prayer-times'
          }
        }
  };
};

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

const setTime = (date, hours, minutes) => {
  const nextDate = new Date(date);
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate;
};

const normalizeCoords = (coords) => {
  if (coords?.latitude && coords?.longitude) {
    return coords;
  }

  return getStoredPrayerCoords();
};

const getFastingOpportunity = (date) => {
  const dayOfWeek = date.getDay();
  const hijri = getHijriDateInfo(date, 'en');

  if (hijri.month === 9) {
    return true;
  }

  if (dayOfWeek === 1 || dayOfWeek === 4) {
    return true;
  }

  if ([13, 14, 15].includes(hijri.day)) {
    return true;
  }

  if (hijri.month === 1 && (hijri.day === 9 || hijri.day === 10)) {
    return true;
  }

  if (hijri.month === 12 && hijri.day === 9) {
    return true;
  }

  return false;
};

const ensureNotificationChannels = async () => {
  if (!isAndroid()) {
    return;
  }

  const adhanVoice = getSelectedAdhan();
  const prayerChannelId = getPrayerChannelId(adhanVoice);

  await LocalNotifications.createChannel({
    id: prayerChannelId,
    name: 'Prayer Adhan Alerts',
    description: 'Exact prayer alerts with the selected adhan voice.',
    sound: `${adhanVoice}.mp3`,
    importance: 5,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: '#10b981'
  });

  await LocalNotifications.createChannel({
    id: REMINDER_CHANNEL_ID,
    name: 'Good Deeds Reminders',
    description: 'Reminders for Quran, adhkar, fasting, and seasonal Sunnah.',
    importance: 4,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: '#10b981'
  });
};

const ensureActionTypes = async () => {
  if (!isNativePlatform()) {
    return;
  }

  const copy = getLocalizedCopy();

  await LocalNotifications.registerActionTypes({
    types: [
      {
        id: ACTION_TYPE_ID,
        actions: [
          { id: 'open-quran', title: copy.actions.quran },
          { id: 'open-tasbih', title: copy.actions.tasbih },
          { id: 'open-prayers', title: copy.actions.prayers }
        ]
      }
    ]
  });
};

const ensureListeners = async () => {
  if (!isNativePlatform() || listenersRegistered) {
    return;
  }

  await LocalNotifications.addListener('localNotificationActionPerformed', ({ actionId, notification }) => {
    const routeFromAction = {
      'open-quran': '/quran/read',
      'open-tasbih': '/tasbih',
      'open-prayers': '/prayer-times'
    };

    const route = routeFromAction[actionId] || notification?.extra?.route;
    if (route && typeof window !== 'undefined') {
      window.location.hash = `#${route}`;
    }
  });

  listenersRegistered = true;
};

const buildPrayerNotifications = (coords, startDate = new Date(), days = 5) => {
  const copy = getLocalizedCopy();
  const notifications = [];

  for (let offset = 0; offset < days; offset += 1) {
    const targetDate = new Date(startDate);
    targetDate.setHours(12, 0, 0, 0);
    targetDate.setDate(startDate.getDate() + offset);

    const prayerMoments = getPrayerMoments(targetDate, coords);
    const prayerDates = [
      prayerMoments.fajr,
      prayerMoments.dhuhr,
      prayerMoments.asr,
      prayerMoments.maghrib,
      prayerMoments.isha
    ];

    prayerDates.forEach((prayerDate, index) => {
      if (prayerDate <= new Date()) {
        return;
      }

      const prayerName = PRAYER_NAMES[index];
      const prayerLabel = copy.prayerLabels[prayerName] || prayerName;

      notifications.push({
        id: PRAYER_NOTIFICATION_BASE_ID + (offset * 10) + index,
        title: copy.prayerLabels[prayerName] === prayerName ? `Time for ${prayerLabel}` : `حان وقت ${prayerLabel}`,
        body: copy.prayerLabels[prayerName] === prayerName
          ? `It is time for ${prayerLabel} prayer.`
          : `حان الآن وقت صلاة ${prayerLabel}.`,
        schedule: {
          at: prayerDate,
          allowWhileIdle: true
        },
        channelId: getPrayerChannelId(),
        actionTypeId: ACTION_TYPE_ID,
        extra: {
          type: 'adhan',
          prayer: prayerName,
          route: '/prayer-times'
        },
        smallIcon: 'ic_stat_name',
        iconColor: '#10b981'
      });
    });
  }

  return notifications;
};

const buildReminderNotifications = (coords, startDate = new Date(), days = 7) => {
  const copy = getLocalizedCopy();
  const notifications = [];

  for (let offset = 0; offset < days; offset += 1) {
    const targetDate = new Date(startDate);
    targetDate.setHours(12, 0, 0, 0);
    targetDate.setDate(startDate.getDate() + offset);

    const hijri = getHijriDateInfo(targetDate, 'en');
    const prayerMoments = getPrayerMoments(targetDate, coords);
    const dayOfWeek = targetDate.getDay();
    const reminderBaseId = REMINDER_NOTIFICATION_BASE_ID + (offset * 20);

    const morningAdhkarDate = addMinutes(prayerMoments.fajr, 25);
    if (morningAdhkarDate > new Date()) {
      notifications.push({
        id: reminderBaseId + 1,
        title: copy.reminders.morningAdhkar.title,
        body: copy.reminders.morningAdhkar.body,
        schedule: { at: morningAdhkarDate },
        channelId: REMINDER_CHANNEL_ID,
        actionTypeId: ACTION_TYPE_ID,
        extra: { type: 'adhkar', route: copy.reminders.morningAdhkar.route },
        smallIcon: 'ic_stat_name',
        iconColor: '#10b981'
      });
    }

    const quranReminderDate = setTime(targetDate, 10, 30);
    if (quranReminderDate > new Date()) {
      const quranReminder = hijri.month === 9 ? copy.reminders.ramadanQuran : copy.reminders.quran;
      notifications.push({
        id: reminderBaseId + 2,
        title: quranReminder.title,
        body: quranReminder.body,
        schedule: { at: quranReminderDate },
        channelId: REMINDER_CHANNEL_ID,
        actionTypeId: ACTION_TYPE_ID,
        extra: { type: 'quran', route: quranReminder.route },
        smallIcon: 'ic_stat_name',
        iconColor: '#10b981'
      });
    }

    const eveningAdhkarDate = addMinutes(prayerMoments.asr, 25);
    if (eveningAdhkarDate > new Date()) {
      notifications.push({
        id: reminderBaseId + 3,
        title: copy.reminders.eveningAdhkar.title,
        body: copy.reminders.eveningAdhkar.body,
        schedule: { at: eveningAdhkarDate },
        channelId: REMINDER_CHANNEL_ID,
        actionTypeId: ACTION_TYPE_ID,
        extra: { type: 'adhkar', route: copy.reminders.eveningAdhkar.route },
        smallIcon: 'ic_stat_name',
        iconColor: '#10b981'
      });
    }

    if (dayOfWeek === 5) {
      const fridayKahfDate = setTime(targetDate, 9, 0);
      if (fridayKahfDate > new Date()) {
        notifications.push({
          id: reminderBaseId + 4,
          title: copy.reminders.fridayKahf.title,
          body: copy.reminders.fridayKahf.body,
          schedule: { at: fridayKahfDate },
          channelId: REMINDER_CHANNEL_ID,
          actionTypeId: ACTION_TYPE_ID,
          extra: { type: 'friday', route: copy.reminders.fridayKahf.route },
          smallIcon: 'ic_stat_name',
          iconColor: '#10b981'
        });
      }
    }

    if (hijri.month === 9 && hijri.day >= 21) {
      const lastTenNightDate = setTime(targetDate, 22, 30);
      if (lastTenNightDate > new Date()) {
        notifications.push({
          id: reminderBaseId + 5,
          title: copy.reminders.lastTenNights.title,
          body: copy.reminders.lastTenNights.body,
          schedule: { at: lastTenNightDate },
          channelId: REMINDER_CHANNEL_ID,
          actionTypeId: ACTION_TYPE_ID,
          extra: { type: 'last-ten-nights', route: copy.reminders.lastTenNights.route },
          smallIcon: 'ic_stat_name',
          iconColor: '#10b981'
        });
      }
    }

    if (hijri.month === 10 && hijri.day > 1) {
      const shawwalReminderDate = setTime(targetDate, 11, 30);
      if (shawwalReminderDate > new Date()) {
        notifications.push({
          id: reminderBaseId + 6,
          title: copy.reminders.shawwal.title,
          body: copy.reminders.shawwal.body,
          schedule: { at: shawwalReminderDate },
          channelId: REMINDER_CHANNEL_ID,
          actionTypeId: ACTION_TYPE_ID,
          extra: { type: 'shawwal', route: copy.reminders.shawwal.route },
          smallIcon: 'ic_stat_name',
          iconColor: '#10b981'
        });
      }
    }

    const tomorrow = new Date(targetDate);
    tomorrow.setDate(targetDate.getDate() + 1);
    if (getFastingOpportunity(tomorrow)) {
      const fastingPrepDate = setTime(targetDate, 21, 0);
      if (fastingPrepDate > new Date()) {
        notifications.push({
          id: reminderBaseId + 7,
          title: copy.reminders.fastingPrep.title,
          body: copy.reminders.fastingPrep.body,
          schedule: { at: fastingPrepDate },
          channelId: REMINDER_CHANNEL_ID,
          actionTypeId: ACTION_TYPE_ID,
          extra: { type: 'fasting-prep', route: copy.reminders.fastingPrep.route },
          smallIcon: 'ic_stat_name',
          iconColor: '#10b981'
        });
      }
    }
  }

  return notifications;
};

const cancelNotificationRange = async (start, end) => {
  const pending = await LocalNotifications.getPending();
  const toCancel = pending.notifications
    .filter((notification) => notification.id >= start && notification.id < end)
    .map((notification) => ({ id: notification.id }));

  if (toCancel.length > 0) {
    await LocalNotifications.cancel({ notifications: toCancel });
  }
};

const scheduleNotificationBatch = async (notifications) => {
  if (!notifications.length) {
    return;
  }

  await LocalNotifications.schedule({ notifications });
};

const requestPermissions = async () => {
  const displayStatus = await LocalNotifications.requestPermissions();
  return displayStatus.display === 'granted';
};

const getExactAlarmStatus = async () => {
  if (!isAndroid()) {
    return 'granted';
  }

  const status = await LocalNotifications.checkExactNotificationSetting();
  return status.exact_alarm;
};

const openExactAlarmSettings = async () => {
  if (!isAndroid()) {
    return 'granted';
  }

  const status = await LocalNotifications.changeExactNotificationSetting();
  return status.exact_alarm;
};

const initialize = async () => {
  if (!isNativePlatform()) {
    return { display: 'skipped', exactAlarm: 'skipped' };
  }

  const displayGranted = await requestPermissions();
  await ensureNotificationChannels();
  await ensureActionTypes();
  await ensureListeners();

  return {
    display: displayGranted ? 'granted' : 'denied',
    exactAlarm: await getExactAlarmStatus()
  };
};

const refreshPrayerNotifications = async (coords = getStoredPrayerCoords()) => {
  if (!isNativePlatform()) {
    return;
  }

  const safeCoords = normalizeCoords(coords);
  await ensureNotificationChannels();
  await ensureActionTypes();
  await ensureListeners();
  await cancelNotificationRange(PRAYER_NOTIFICATION_BASE_ID, REMINDER_NOTIFICATION_BASE_ID);
  const prayerNotifications = buildPrayerNotifications(safeCoords, new Date(), 5);
  await scheduleNotificationBatch(prayerNotifications);
};

const scheduleDailyReminders = async (coords = getStoredPrayerCoords()) => {
  if (!isNativePlatform()) {
    return;
  }

  const safeCoords = normalizeCoords(coords);
  await ensureNotificationChannels();
  await ensureActionTypes();
  await ensureListeners();
  await cancelNotificationRange(REMINDER_NOTIFICATION_BASE_ID, REMINDER_NOTIFICATION_BASE_ID + 1000);
  const reminderNotifications = buildReminderNotifications(safeCoords, new Date(), 7);
  await scheduleNotificationBatch(reminderNotifications);
};

const syncAllNotifications = async (coords = getStoredPrayerCoords()) => {
  await refreshPrayerNotifications(coords);
  await scheduleDailyReminders(coords);
};

export const NotificationService = {
  initialize,
  refreshPrayerNotifications,
  scheduleDailyReminders,
  syncAllNotifications,
  requestPermissions,
  getExactAlarmStatus,
  openExactAlarmSettings
};
