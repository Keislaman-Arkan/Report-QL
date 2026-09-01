
const cleanUrl = (window.SUPABASE_URL && !window.SUPABASE_URL.includes('MASUKKAN_')) ? window.SUPABASE_URL : '';
const cleanKey = (window.SUPABASE_ANON_KEY && !window.SUPABASE_ANON_KEY.includes('MASUKKAN_')) ? window.SUPABASE_ANON_KEY : '';

window.SUPABASE_URL = cleanUrl;
window.SUPABASE_ANON_KEY = cleanKey;

const quranData = {
  1: [{name:'Al-Fatihah',ayat:7},{name:'Al-Baqarah',ayat:286}], 
  2: [{name:'Al-Baqarah',ayat:286}], 
  3: [{name:'Ali Imran',ayat:200}],
  4: [{name:'Ali Imran',ayat:200},{name:'An-Nisa',ayat:176}], 
  5: [{name:'An-Nisa',ayat:176}], 
  6: [{name:'An-Nisa',ayat:176},{name:'Al-Maidah',ayat:120}],
  7: [{name:'Al-Maidah',ayat:120},{name:'Al-An\'am',ayat:165}], 
  8: [{name:'Al-An\'am',ayat:165},{name:'Al-A\'raf',ayat:206}], 
  9: [{name:'Al-A\'raf',ayat:206},{name:'Al-Anfal',ayat:75}],
  10: [{name:'Al-Anfal',ayat:75},{name:'At-Taubah',ayat:129}], 
  11: [{name:'At-Taubah',ayat:129},{name:'Yunus',ayat:109},{name:'Hud',ayat:123}], 
  12: [{name:'Hud',ayat:123},{name:'Yusuf',ayat:111}],
  13: [{name:'Yusuf',ayat:111},{name:'Ar-Ra\'d',ayat:43},{name:'Ibrahim',ayat:52}], 
  14: [{name:'Al-Hijr',ayat:99},{name:'An-Nahl',ayat:128}], 
  15: [{name:'Al-Isra',ayat:111},{name:'Al-Kahf',ayat:110}],
  16: [{name:'Al-Kahf',ayat:110},{name:'Maryam',ayat:98},{name:'Taha',ayat:135}], 
  17: [{name:'Al-Anbiya',ayat:112},{name:'Al-Hajj',ayat:78}], 
  18: [{name:'Al-Mu\'minun',ayat:118},{name:'An-Nur',ayat:64},{name:'Al-Furqan',ayat:77}],
  19: [{name:'Al-Furqan',ayat:77},{name:'Asy-Syu\'ara',ayat:227},{name:'An-Naml',ayat:93}], 
  20: [{name:'An-Naml',ayat:93},{name:'Al-Qasas',ayat:88},{name:'Al-Ankabut',ayat:69}],
  21: [{name:'Al-Ankabut',ayat:69},{name:'Ar-Rum',ayat:60},{name:'Luqman',ayat:34},{name:'As-Sajdah',ayat:30},{name:'Al-Ahzab',ayat:73}], 
  22: [{name:'Al-Ahzab',ayat:73},{name:'Saba',ayat:54},{name:'Fatir',ayat:45},{name:'Ya Sin',ayat:83}], 
  23: [{name:'Ya Sin',ayat:83},{name:'As-Saffat',ayat:182},{name:'Sad',ayat:88},{name:'Az-Zumar',ayat:75}],
  24: [{name:'Az-Zumar',ayat:75},{name:'Ghafir',ayat:85},{name:'Fussilat',ayat:54}], 
  25: [{name:'Fussilat',ayat:54},{name:'Asy-Syura',ayat:53},{name:'Az-Zukhruf',ayat:89},{name:'Ad-Dukhan',ayat:59},{name:'Al-Jasiyah',ayat:37}], 
  26: [{name:'Al-Ahqaf',ayat:35},{name:'Muhammad',ayat:38},{name:'Al-Fath',ayat:29},{name:'Al-Hujurat',ayat:18},{name:'Qaf',ayat:45},{name:'Az-Zariyat',ayat:60}],
  27: [{name:'Az-Zariyat',ayat:60},{name:'At-Tur',ayat:49},{name:'An-Najm',ayat:62},{name:'Al-Qamar',ayat:55},{name:'Ar-Rahman',ayat:78},{name:'Al-Waqi\'ah',ayat:96},{name:'Al-Hadid',ayat:29}], 
  28: [{name:'Al-Mujadilah',ayat:22},{name:'Al-Hasyr',ayat:24},{name:'Al-Mumtahanah',ayat:13},{name:'As-Saff',ayat:14},{name:'Al-Jumu\'ah',ayat:11},{name:'Al-Munafiqun',ayat:11},{name:'At-Tagabun',ayat:18},{name:'At-Talaq',ayat:12},{name:'At-Tahrim',ayat:12}],
  29: [{name:'Al-Mulk',ayat:30},{name:'Al-Qalam',ayat:52},{name:'Al-Haqqah',ayat:52},{name:'Al-Ma\'arij',ayat:44},{name:'Nuh',ayat:28},{name:'Al-Jinn',ayat:28},{name:'Al-Muzzammil',ayat:20},{name:'Al-Muddassir',ayat:56},{name:'Al-Qiyamah',ayat:40},{name:'Al-Insan',ayat:31},{name:'Al-Mursalat',ayat:50}],
  30: [{name:'An-Naba',ayat:40},{name:'An-Nazi\'at',ayat:46},{name:'Abasa',ayat:42},{name:'At-Takwir',ayat:29},{name:'Al-Infitar',ayat:19},{name:'Al-Mutaffifin',ayat:36},{name:'Al-Insyiqaq',ayat:25},{name:'Al-Buruj',ayat:22},{name:'At-Tariq',ayat:17},{name:'Al-A\'la',ayat:19},{name:'Al-Gasiyah',ayat:26},{name:'Al-Fajr',ayat:30},{name:'Al-Balad',ayat:20},{name:'Asy-Syams',ayat:15},{name:'Al-Lail',ayat:21},{name:'Ad-Duha',ayat:11},{name:'Asy-Syarh',ayat:8},{name:'At-Tin',ayat:8},{name:'Al-Alaq',ayat:19},{name:'Al-Qadr',ayat:5},{name:'Al-Bayyinah',ayat:8},{name:'Az-Zalzalah',ayat:8},{name:'Al-Adiyat',ayat:11},{name:'Al-Qari\'ah',ayat:11},{name:'At-Takasur',ayat:8},{name:'Al-Asr',ayat:3},{name:'Al-Humazah',ayat:9},{name:'Al-Fil',ayat:5},{name:'Quraisy',ayat:4},{name:'Al-Ma\'un',ayat:7},{name:'Al-Kausar',ayat:3},{name:'Al-Kafirun',ayat:6},{name:'An-Nasr',ayat:3},{name:'Al-Lahab',ayat:5},{name:'Al-Ikhlas',ayat:4},{name:'Al-Falaq',ayat:5},{name:'An-Nas',ayat:6}]
};

// --- MEMBANGUN URUTAN PROGRESS HAFALAN (SDIT STANDARD) ---
let hafalanProgressPath = [];
for (let j = 30; j >= 1; j--) {
   if (quranData[j]) {
      [...quranData[j]].reverse().forEach(s => {
         if (!hafalanProgressPath.includes(s.name)) {
            hafalanProgressPath.push(s.name);
         }
      });
   }
}

const defaultGrades = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"];
const defaultConfig = { app_title: 'Report Qur\'an Learning', font_family: 'Plus Jakarta Sans' };

// --- 114 SURAH MASTER LIST & RESOLVER ---
const quranSurahList = [
  { no: 1, name: 'Al-Fatihah', nameArab: 'الفاتحة', ayat: 7, tempat: 'Mekah' },
  { no: 2, name: 'Al-Baqarah', nameArab: 'البقرة', ayat: 286, tempat: 'Madinah' },
  { no: 3, name: 'Ali \'Imran', nameArab: 'آل عمران', ayat: 200, tempat: 'Madinah' },
  { no: 4, name: 'An-Nisa\'', nameArab: 'النساء', ayat: 176, tempat: 'Madinah' },
  { no: 5, name: 'Al-Ma\'idah', nameArab: 'المائدة', ayat: 120, tempat: 'Madinah' },
  { no: 6, name: 'Al-An\'am', nameArab: 'الأنعام', ayat: 165, tempat: 'Mekah' },
  { no: 7, name: 'Al-A\'raf', nameArab: 'الأعراف', ayat: 206, tempat: 'Mekah' },
  { no: 8, name: 'Al-Anfal', nameArab: 'الأنفال', ayat: 75, tempat: 'Madinah' },
  { no: 9, name: 'At-Taubah', nameArab: 'التوبة', ayat: 129, tempat: 'Madinah' },
  { no: 10, name: 'Yunus', nameArab: 'يونس', ayat: 109, tempat: 'Mekah' },
  { no: 11, name: 'Hud', nameArab: 'هود', ayat: 123, tempat: 'Mekah' },
  { no: 12, name: 'Yusuf', nameArab: 'يوسف', ayat: 111, tempat: 'Mekah' },
  { no: 13, name: 'Ar-Ra\'d', nameArab: 'الرعد', ayat: 43, tempat: 'Madinah' },
  { no: 14, name: 'Ibrahim', nameArab: 'إبراهيم', ayat: 52, tempat: 'Mekah' },
  { no: 15, name: 'Al-Hijr', nameArab: 'الحجر', ayat: 99, tempat: 'Mekah' },
  { no: 16, name: 'An-Nahl', nameArab: 'النحل', ayat: 128, tempat: 'Mekah' },
  { no: 17, name: 'Al-Isra\'', nameArab: 'الإسراء', ayat: 111, tempat: 'Mekah' },
  { no: 18, name: 'Al-Kahf', nameArab: 'الكهف', ayat: 110, tempat: 'Mekah' },
  { no: 19, name: 'Maryam', nameArab: 'مريم', ayat: 98, tempat: 'Mekah' },
  { no: 20, name: 'Taha', nameArab: 'طه', ayat: 135, tempat: 'Mekah' },
  { no: 21, name: 'Al-Anbiya\'', nameArab: 'الأنبياء', ayat: 112, tempat: 'Mekah' },
  { no: 22, name: 'Al-Hajj', nameArab: 'الحج', ayat: 78, tempat: 'Madinah' },
  { no: 23, name: 'Al-Mu\'minun', nameArab: 'المؤمنون', ayat: 118, tempat: 'Mekah' },
  { no: 24, name: 'An-Nur', nameArab: 'النور', ayat: 64, tempat: 'Madinah' },
  { no: 25, name: 'Al-Furqan', nameArab: 'الفرقان', ayat: 77, tempat: 'Mekah' },
  { no: 26, name: 'Asy-Syu\'ara\'', nameArab: 'الشعراء', ayat: 227, tempat: 'Mekah' },
  { no: 27, name: 'An-Naml', nameArab: 'النمل', ayat: 93, tempat: 'Mekah' },
  { no: 28, name: 'Al-Qasas', nameArab: 'القصص', ayat: 88, tempat: 'Mekah' },
  { no: 29, name: 'Al-\'Ankabut', nameArab: 'العنكبوت', ayat: 69, tempat: 'Mekah' },
  { no: 30, name: 'Ar-Rum', nameArab: 'الروم', ayat: 60, tempat: 'Mekah' },
  { no: 31, name: 'Luqman', nameArab: 'لقمان', ayat: 34, tempat: 'Mekah' },
  { no: 32, name: 'As-Sajdah', nameArab: 'السجدة', ayat: 30, tempat: 'Mekah' },
  { no: 33, name: 'Al-Ahzab', nameArab: 'الأحزاب', ayat: 73, tempat: 'Madinah' },
  { no: 34, name: 'Saba\'', nameArab: 'سبأ', ayat: 54, tempat: 'Mekah' },
  { no: 35, name: 'Fatir', nameArab: 'فاطر', ayat: 45, tempat: 'Mekah' },
  { no: 36, name: 'Ya Sin', nameArab: 'يس', ayat: 83, tempat: 'Mekah' },
  { no: 37, name: 'As-Saffat', nameArab: 'الصافات', ayat: 182, tempat: 'Mekah' },
  { no: 38, name: 'Sad', nameArab: 'ص', ayat: 88, tempat: 'Mekah' },
  { no: 39, name: 'Az-Zumar', nameArab: 'الزمر', ayat: 75, tempat: 'Mekah' },
  { no: 40, name: 'Ghafir', nameArab: 'غافر', ayat: 85, tempat: 'Mekah' },
  { no: 41, name: 'Fussilat', nameArab: 'فصلت', ayat: 54, tempat: 'Mekah' },
  { no: 42, name: 'Asy-Syura', nameArab: 'الشورى', ayat: 53, tempat: 'Mekah' },
  { no: 43, name: 'Az-Zukhruf', nameArab: 'الزخرف', ayat: 89, tempat: 'Mekah' },
  { no: 44, name: 'Ad-Dukhan', nameArab: 'الدخان', ayat: 59, tempat: 'Mekah' },
  { no: 45, name: 'Al-Jasiyah', nameArab: 'الجاثية', ayat: 37, tempat: 'Mekah' },
  { no: 46, name: 'Al-Ahqaf', nameArab: 'الأحقاف', ayat: 35, tempat: 'Mekah' },
  { no: 47, name: 'Muhammad', nameArab: 'محمد', ayat: 38, tempat: 'Madinah' },
  { no: 48, name: 'Al-Fath', nameArab: 'الفتح', ayat: 29, tempat: 'Madinah' },
  { no: 49, name: 'Al-Hujurat', nameArab: 'الحجرات', ayat: 18, tempat: 'Madinah' },
  { no: 50, name: 'Qaf', nameArab: 'ق', ayat: 45, tempat: 'Mekah' },
  { no: 51, name: 'Az-Zariyat', nameArab: 'الذاريات', ayat: 60, tempat: 'Mekah' },
  { no: 52, name: 'At-Tur', nameArab: 'الطور', ayat: 49, tempat: 'Mekah' },
  { no: 53, name: 'An-Najm', nameArab: 'النجم', ayat: 62, tempat: 'Mekah' },
  { no: 54, name: 'Al-Qamar', nameArab: 'القمر', ayat: 55, tempat: 'Mekah' },
  { no: 55, name: 'Ar-Rahman', nameArab: 'الرحمن', ayat: 78, tempat: 'Madinah' },
  { no: 56, name: 'Al-Waqi\'ah', nameArab: 'الواقعة', ayat: 96, tempat: 'Mekah' },
  { no: 57, name: 'Al-Hadid', nameArab: 'الحديد', ayat: 29, tempat: 'Madinah' },
  { no: 58, name: 'Al-Mujadilah', nameArab: 'المجادلة', ayat: 22, tempat: 'Madinah' },
  { no: 59, name: 'Al-Hasyr', nameArab: 'الحشر', ayat: 24, tempat: 'Madinah' },
  { no: 60, name: 'Al-Mumtahanah', nameArab: 'الممتحنة', ayat: 13, tempat: 'Madinah' },
  { no: 61, name: 'As-Saff', nameArab: 'الصف', ayat: 14, tempat: 'Madinah' },
  { no: 62, name: 'Al-Jumu\'ah', nameArab: 'الجمعة', ayat: 11, tempat: 'Madinah' },
  { no: 63, name: 'Al-Munafiqun', nameArab: 'المنافقون', ayat: 11, tempat: 'Madinah' },
  { no: 64, name: 'At-Tagabun', nameArab: 'التغابن', ayat: 18, tempat: 'Madinah' },
  { no: 65, name: 'At-Talaq', nameArab: 'الطلاق', ayat: 12, tempat: 'Madinah' },
  { no: 66, name: 'At-Tahrim', nameArab: 'التحريم', ayat: 12, tempat: 'Madinah' },
  { no: 67, name: 'Al-Mulk', nameArab: 'الملك', ayat: 30, tempat: 'Mekah' },
  { no: 68, name: 'Al-Qalam', nameArab: 'القلم', ayat: 52, tempat: 'Mekah' },
  { no: 69, name: 'Al-Haqqah', nameArab: 'الحاقة', ayat: 52, tempat: 'Mekah' },
  { no: 70, name: 'Al-Ma\'arij', nameArab: 'المعارج', ayat: 44, tempat: 'Mekah' },
  { no: 71, name: 'Nuh', nameArab: 'نوح', ayat: 28, tempat: 'Mekah' },
  { no: 72, name: 'Al-Jinn', nameArab: 'الجن', ayat: 28, tempat: 'Mekah' },
  { no: 73, name: 'Al-Muzzammil', nameArab: 'المزمل', ayat: 20, tempat: 'Mekah' },
  { no: 74, name: 'Al-Muddassir', nameArab: 'المدثر', ayat: 56, tempat: 'Mekah' },
  { no: 75, name: 'Al-Qiyamah', nameArab: 'القيامة', ayat: 40, tempat: 'Mekah' },
  { no: 76, name: 'Al-Insan', nameArab: 'الإنسان', ayat: 31, tempat: 'Madinah' },
  { no: 77, name: 'Al-Mursalat', nameArab: 'المرسلات', ayat: 50, tempat: 'Mekah' },
  { no: 78, name: 'An-Naba\'', nameArab: 'النبأ', ayat: 40, tempat: 'Mekah' },
  { no: 79, name: 'An-Nazi\'at', nameArab: 'النازعات', ayat: 46, tempat: 'Mekah' },
  { no: 80, name: '\'Abasa', nameArab: 'عبس', ayat: 42, tempat: 'Mekah' },
  { no: 81, name: 'At-Takwir', nameArab: 'التكوير', ayat: 29, tempat: 'Mekah' },
  { no: 82, name: 'Al-Infitar', nameArab: 'الانفطار', ayat: 19, tempat: 'Mekah' },
  { no: 83, name: 'Al-Mutaffifin', nameArab: 'المطففين', ayat: 36, tempat: 'Mekah' },
  { no: 84, name: 'Al-Insyiqaq', nameArab: 'الانشقاق', ayat: 25, tempat: 'Mekah' },
  { no: 85, name: 'Al-Buruj', nameArab: 'البروج', ayat: 22, tempat: 'Mekah' },
  { no: 86, name: 'At-Tariq', nameArab: 'الطارق', ayat: 17, tempat: 'Mekah' },
  { no: 87, name: 'Al-A\'la', nameArab: 'الأعلى', ayat: 19, tempat: 'Mekah' },
  { no: 88, name: 'Al-Gasiyah', nameArab: 'الغاشية', ayat: 26, tempat: 'Mekah' },
  { no: 89, name: 'Al-Fajr', nameArab: 'الفجر', ayat: 30, tempat: 'Mekah' },
  { no: 90, name: 'Al-Balad', nameArab: 'البلد', ayat: 20, tempat: 'Mekah' },
  { no: 91, name: 'Asy-Syams', nameArab: 'الشمس', ayat: 15, tempat: 'Mekah' },
  { no: 92, name: 'Al-Lail', nameArab: 'الليل', ayat: 21, tempat: 'Mekah' },
  { no: 93, name: 'Ad-Duha', nameArab: 'الضحى', ayat: 11, tempat: 'Mekah' },
  { no: 94, name: 'Asy-Syarh', nameArab: 'الشرح', ayat: 8, tempat: 'Mekah' },
  { no: 95, name: 'At-Tin', nameArab: 'التين', ayat: 8, tempat: 'Mekah' },
  { no: 96, name: 'Al-\'Alaq', nameArab: 'العلق', ayat: 19, tempat: 'Mekah' },
  { no: 97, name: 'Al-Qadr', nameArab: 'القدر', ayat: 5, tempat: 'Mekah' },
  { no: 98, name: 'Al-Bayyinah', nameArab: 'البينة', ayat: 8, tempat: 'Madinah' },
  { no: 99, name: 'Az-Zalzalah', nameArab: 'الزلزلة', ayat: 8, tempat: 'Madinah' },
  { no: 100, name: 'Al-\'Adiyat', nameArab: 'العاديات', ayat: 11, tempat: 'Mekah' },
  { no: 101, name: 'Al-Qari\'ah', nameArab: 'القارعة', ayat: 11, tempat: 'Mekah' },
  { no: 102, name: 'At-Takasur', nameArab: 'التكاثر', ayat: 8, tempat: 'Mekah' },
  { no: 103, name: 'Al-\'Asr', nameArab: 'العصر', ayat: 3, tempat: 'Mekah' },
  { no: 104, name: 'Al-Humazah', nameArab: 'الهمزة', ayat: 9, tempat: 'Mekah' },
  { no: 105, name: 'Al-Fil', nameArab: 'الفيل', ayat: 5, tempat: 'Mekah' },
  { no: 106, name: 'Quraisy', nameArab: 'قريش', ayat: 4, tempat: 'Mekah' },
  { no: 107, name: 'Al-Ma\'un', nameArab: 'الماعون', ayat: 7, tempat: 'Mekah' },
  { no: 108, name: 'Al-Kausar', nameArab: 'الكوثر', ayat: 3, tempat: 'Mekah' },
  { no: 109, name: 'Al-Kafirun', nameArab: 'الكافرون', ayat: 6, tempat: 'Mekah' },
  { no: 110, name: 'An-Nasr', nameArab: 'النصر', ayat: 3, tempat: 'Madinah' },
  { no: 111, name: 'Al-Lahab', nameArab: 'اللهب', ayat: 5, tempat: 'Mekah' },
  { no: 112, name: 'Al-Ikhlas', nameArab: 'الإخلاص', ayat: 4, tempat: 'Mekah' },
  { no: 113, name: 'Al-Falaq', nameArab: 'الفلق', ayat: 5, tempat: 'Mekah' },
  { no: 114, name: 'An-Nas', nameArab: 'الناس', ayat: 6, tempat: 'Mekah' }
];

function normalizeSurahName(str) {
  if (!str) return '';
  return str.toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getSurahNumberByName(surahName) {
  if (!surahName) return 1;
  if (!isNaN(parseInt(surahName)) && parseInt(surahName) >= 1 && parseInt(surahName) <= 114) {
    return parseInt(surahName);
  }
  const clean = normalizeSurahName(surahName);
  
  // Custom alias mapping for Indonesian spellings
  const aliases = {
    'gasiyah': 88, 'gasyiyah': 88, 'algasiyah': 88, 'algasyiyah': 88,
    'taubah': 9, 'attaubah': 9, 'attawbah': 9, 'tawbah': 9,
    'aliimran': 3, 'imran': 3, 'alimran': 3,
    'insan': 76, 'addahr': 76, 'dahr': 76,
    'mukmin': 40, 'ghafir': 40, 'alghafir': 40,
    'syarh': 94, 'insyirah': 94, 'alinsyirah': 94, 'asyinsyirah': 94,
    'almasad': 111, 'masad': 111, 'allahab': 111, 'lahab': 111,
    'yasin': 36, 'yaseen': 36,
    'taha': 20, 'thaha': 20
  };
  if (aliases[clean]) return aliases[clean];

  const found = quranSurahList.find(s => normalizeSurahName(s.name) === clean);
  if (found) return found.no;

  // Fallback search partial
  const partial = quranSurahList.find(s => normalizeSurahName(s.name).includes(clean) || clean.includes(normalizeSurahName(s.name)));
  return partial ? partial.no : 1;
}

function getSurahMeta(surahNoOrName) {
  const no = getSurahNumberByName(surahNoOrName);
  return quranSurahList.find(s => s.no === no) || quranSurahList[0];
}
