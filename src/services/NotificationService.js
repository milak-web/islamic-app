import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const scheduleNotification = async (id, title, body, date, extra = {}) => {
  const platform = Capacitor.getPlatform();
  
  // Skip notification scheduling on web if it's causing dynamic import issues
  // Web notifications are generally not reliable for custom sounds anyway.
  if (platform === 'web') {
    console.log("Skipping notification schedule on web platform");
    return;
  }

  const selectedAdhan = localStorage.getItem('selectedAdhan') || 'adhan_makkah';
  
  // Note: Sound files must be in the native project's resources folder
  // Android: res/raw (reference without extension)
  // iOS: Main bundle (reference with extension)
  // Web/PWA: Custom sounds are generally not supported for notifications.
  const soundFile = platform === 'android' ? selectedAdhan : `${selectedAdhan}.mp3`;

  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title,
        body,
        schedule: { at: date, allowPause: false },
        sound: soundFile,
        attachments: [],
        actionTypeId: '',
        extra,
        smallIcon: 'ic_stat_name', // Needs to be in res/drawable
        iconColor: '#10b981'
      }
    ]
  });
};

const scheduleAdhanNotifications = async (timings, dateStr) => {
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    // Clear all existing adhan notifications (100-200 range)
    const pending = await LocalNotifications.getPending();
    const toCancel = pending.notifications
      .filter(n => n.id >= 100 && n.id < 200)
      .map(n => ({ id: n.id }));
    
    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
    }

    const prayers = [
      { id: 1, name: 'Fajr', time: timings.Fajr },
      { id: 2, name: 'Dhuhr', time: timings.Dhuhr },
      { id: 3, name: 'Asr', time: timings.Asr },
      { id: 4, name: 'Maghrib', time: timings.Maghrib },
      { id: 5, name: 'Isha', time: timings.Isha }
    ];

    const now = new Date();
    const [day, month, year] = dateStr.split('-').map(Number);

    // Schedule for the next 3 days to keep it fresh
    for (let i = 0; i < 3; i++) {
      const targetDate = new Date(year, month - 1, day + i);
      
      prayers.forEach(async (prayer) => {
        const [hours, minutes] = prayer.time.split(':').map(Number);
        const prayerDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hours, minutes);

        if (prayerDate > now) {
          await scheduleNotification(
            100 + (i * 10) + prayer.id,
            `Time for ${prayer.name}`,
            `It is time for ${prayer.name} prayer.`,
            prayerDate,
            { type: 'adhan', prayer: prayer.name }
          );
        }
      });
    }
  } catch (err) {
    console.error("Failed to schedule notifications:", err);
  }
};

const scheduleDailyReminders = async () => {
  // Clear existing daily reminders (200-300 range)
  const pending = await LocalNotifications.getPending();
  const toCancel = pending.notifications
    .filter(n => n.id >= 200 && n.id < 300)
    .map(n => ({ id: n.id }));
  
  if (toCancel.length > 0) {
    await LocalNotifications.cancel({ notifications: toCancel });
  }

  const today = new Date();

  // 1. Morning Adhkar (7 AM)
  const morningAdhkar = new Date();
  morningAdhkar.setHours(7, 0, 0, 0);
  if (morningAdhkar < today) morningAdhkar.setDate(morningAdhkar.getDate() + 1);

  await scheduleNotification(
    201,
    'Morning Adhkar',
    'Start your day with the remembrance of Allah.',
    morningAdhkar,
    { type: 'adhkar' }
  );

  // 2. Quran Reading Streak (10 AM)
  const quranReminder = new Date();
  quranReminder.setHours(10, 0, 0, 0);
  if (quranReminder < today) quranReminder.setDate(quranReminder.getDate() + 1);

  await scheduleNotification(
    202,
    'Daily Quran Reading',
    "Don't forget to maintain your Quran reading streak today!",
    quranReminder,
    { type: 'quran' }
  );

  // 3. Evening Adhkar (6 PM)
  const eveningAdhkar = new Date();
  eveningAdhkar.setHours(18, 0, 0, 0);
  if (eveningAdhkar < today) eveningAdhkar.setDate(eveningAdhkar.getDate() + 1);

  await scheduleNotification(
    203,
    'Evening Adhkar',
    'Time for your evening Adhkar and remembrance.',
    eveningAdhkar,
    { type: 'adhkar' }
  );
};

export const NotificationService = {
  scheduleAdhanNotifications,
  scheduleDailyReminders,
  requestPermissions: async () => {
    const status = await LocalNotifications.requestPermissions();
    return status.display === 'granted';
  }
};
