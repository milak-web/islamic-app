
const loadQuranData = async () => {
  try {
    const [arabicModule, englishModule] = await Promise.all([
      import('../data/quran-uthmani.json'),
      import('../data/quran-en.json')
    ]);
    return {
      arabic: arabicModule.default.data.surahs,
      english: englishModule.default.data.surahs
    };
  } catch (error) {
    console.error("Failed to load local Quran data:", error);
    return null;
  }
};

export const getAllSurahs = async () => {
  const data = await loadQuranData();
  if (!data) return [];
  // Return just the metadata for the list (using Arabic source for metadata)
  return data.arabic.map(surah => ({
    number: surah.number,
    name: surah.name,
    englishName: surah.englishName,
    englishNameTranslation: surah.englishNameTranslation,
    numberOfAyahs: surah.ayahs.length,
    revelationType: surah.revelationType
  }));
};

export const getSurah = async (number) => {
  const data = await loadQuranData();
  if (!data) return null;
  
  const surahIndex = parseInt(number) - 1;
  if (surahIndex < 0 || surahIndex >= 114) return null;

  return {
    arabic: data.arabic[surahIndex],
    english: data.english[surahIndex]
  };
};
