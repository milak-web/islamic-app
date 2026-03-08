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

3. **Add Adhan Sound (Optional but recommended)**:
   To enable the Adhan sound for notifications on Android:
   - Place an `adhan.wav` file in `android/app/src/main/res/raw/`.
   - On iOS, place it in the app's root bundle in Xcode.

4. Open the Android project in Android Studio:
   ```bash
   npx cap open android
   ```

5. Inside Android Studio:
   - Let Gradle sync complete.
   - Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - Once built, locate the APK in `android/app/build/outputs/apk/debug/app-debug.apk`.

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
