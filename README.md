# Islamic App (Quran & Hadith)

A comprehensive Islamic application built with React, Vite, and Capacitor.

## Features
- **Quran Reader**: Read Quran with English translation, Reading Mode, and progress tracking.
- **Hadith**: Browse Hadith collections.
- **Prayer Times**: Accurate prayer times based on location.
- **Dua**: Collection of authentic Duas.
- **Tasbih**: Digital Tasbih counter.
- **Offline Support**: PWA capabilities for offline access.

## Tech Stack
- React 19
- Vite
- Tailwind CSS
- Capacitor (for Android/iOS builds)

## Setup & Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

## Building for Android

This project uses Capacitor to build native mobile apps.

### Prerequisites
- Java 17+ (Required by Gradle 8.0+)
- Android Studio (latest version recommended)

### Build Steps
1. Build the web assets:
   ```bash
   npm run build
   ```

2. Sync web assets to Android project:
   ```bash
   npx cap sync
   ```

3. **Add Adhan Sounds (Crucial for sound notifications)**:
   To enable the Adhan sound for notifications on mobile:
   - **Android**: Create a folder `android/app/src/main/res/raw/` and place your `.mp3` files there. The files should be named exactly as the voice IDs (e.g., `adhan_makkah.mp3`, `adhan_madinah.mp3`, etc.).
   - **iOS**: Drag the `.mp3` files into your project in Xcode and ensure they are included in the "Copy Bundle Resources" phase.
   - **Web/PWA**: Note that custom sounds for notifications are generally not supported by browsers. Sound will only play in the foreground via the app's internal player.

4. Open the Android project in Android Studio:
   ```bash
   npx cap open android
   ```

5. Inside Android Studio:
   - Let Gradle sync complete.
   - Ensure the `res/raw` folder exists and contains the Adhan files.
   - Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - Once built, locate the APK in `android/app/build/outputs/apk/debug/app-debug.apk`.

## Important Note on Sound Playback
- **Browser Restrictions**: Mobile browsers (Chrome/Safari) prevent automatic sound playback unless the user has interacted with the page first.
- **Background Execution**: On most mobile devices, browsers pause execution when the app is in the background or the screen is locked, which may prevent the "Adhan" sound from triggering in PWA mode. For the most reliable sound experience, use the **Native Android/iOS app**.
- **Adhan Name**: You might see the Adhan referred to as "Adam" or "Adan" in some contexts, but it refers to the Islamic call to prayer.

## Features Breakdown

### Offline Reliability
- **Prayer Times**: Calculated locally using the `adhan` library if the internet is unavailable. It uses your last saved location.
- **Quran & Duas**: 100% offline, bundled with the app.
- **Hadith**: Cached for 30 days after the first online browse.

### Notifications
- **Adhan**: The app schedules notifications for all 5 daily prayers.
- **Reminders**: Daily reminders for Morning/Evening Adhkar and maintaining your Quran reading streak.

## Troubleshooting

### Gradle Build Failed (Java Version)
If you see an error about Java version mismatch (e.g., "Dependency requires at least JVM runtime version 11. This build uses a Java 8 JVM"), you need to update your JAVA_HOME environment variable to point to JDK 17 or higher. Android Studio usually bundles a compatible JDK.
