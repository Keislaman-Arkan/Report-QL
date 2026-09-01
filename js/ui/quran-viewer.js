// ============ QUR'AN VIEWER & API INTEGRATION ============

const QuranViewerState = {
  cache: {},
  currentAudio: null,
  currentPlayingAyah: null,
  currentSurahNo: 1,
  fromAyah: 1,
  toAyah: 1,
  studentName: '',
  reportType: 'quran', // 'quran' | 'hafalan'
  showLatin: true,
  showTranslation: true,
  filterOnlyTargetRange: false,
  fontSizeLevel: 2 // 1: small (text-xl), 2: normal (text-2xl), 3: large (text-3xl)
};

const QURAN_FONT_SIZES = {
  1: 'text-xl leading-[2.2]',
  2: 'text-2xl leading-[2.4]',
  3: 'text-3xl leading-[2.6]'
};

/**
 * Fetch Surah data from API with cache and multiple fallback endpoints
 */
async function fetchSurahData(surahNo) {
  if (QuranViewerState.cache[surahNo]) {
    return QuranViewerState.cache[surahNo];
  }

  // 1. Try EQuran.id API (Primary - Indonesian Kemenag standard)
  try {
    const res = await fetch(`https://equran.id/api/v2/surat/${surahNo}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        const normalized = normalizeEQuranData(json.data);
        QuranViewerState.cache[surahNo] = normalized;
        return normalized;
      }
    }
  } catch (err) {
    console.warn('Primary EQuran API failed, trying fallback...', err);
  }

  // 2. Try Al-Quran Cloud API (Fallback 1)
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNo}/editions/quran-uthmani,id.indonesian`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && json.data.length >= 2) {
        const normalized = normalizeAlQuranCloudData(json.data);
        QuranViewerState.cache[surahNo] = normalized;
        return normalized;
      }
    }
  } catch (err) {
    console.warn('Fallback 1 API failed, trying Fallback 2...', err);
  }

  // 3. Try Quran-API-ID (Fallback 2)
  try {
    const res = await fetch(`https://quran-api-id.vercel.app/surahs/${surahNo}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        const normalized = normalizeQuranApiIdData(json.data);
        QuranViewerState.cache[surahNo] = normalized;
        return normalized;
      }
    }
  } catch (err) {
    console.error('All Quran APIs failed:', err);
  }

  throw new Error('Gagal memuat teks Al-Qur\'an dari server. Mohon periksa koneksi internet Anda.');
}

function normalizeEQuranData(d) {
  return {
    nomor: d.nomor,
    namaLatin: d.namaLatin,
    namaArab: d.nama,
    arti: d.arti,
    tempatTurun: d.tempatTurun,
    jumlahAyat: d.jumlahAyat,
    deskripsi: d.deskripsi || '',
    ayat: (d.ayat || []).map(a => ({
      nomorAyat: a.nomorAyat,
      teksArab: a.teksArab,
      teksLatin: a.teksLatin,
      teksIndonesia: a.teksIndonesia,
      audioUrl: a.audio ? (a.audio['05'] || a.audio['01'] || Object.values(a.audio)[0]) : null
    }))
  };
}

function normalizeAlQuranCloudData(dataArray) {
  const arSurah = dataArray[0];
  const idSurah = dataArray[1];
  const meta = getSurahMeta(arSurah.number);
  
  return {
    nomor: arSurah.number,
    namaLatin: meta.name || arSurah.englishName,
    namaArab: arSurah.name,
    arti: meta.nameArab || '',
    tempatTurun: arSurah.revelationType === 'Meccan' ? 'Mekah' : 'Madinah',
    jumlahAyat: arSurah.numberOfAyahs,
    ayat: arSurah.ayahs.map((a, idx) => {
      const idAyah = idSurah.ayahs && idSurah.ayahs[idx] ? idSurah.ayahs[idx].text : '';
      return {
        nomorAyat: a.numberInSurah,
        teksArab: a.text,
        teksLatin: '',
        teksIndonesia: idAyah,
        audioUrl: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${a.number}.mp3`
      };
    })
  };
}

function normalizeQuranApiIdData(d) {
  return {
    nomor: d.number,
    namaLatin: d.name,
    namaArab: d.arabic,
    arti: d.translation,
    tempatTurun: d.revelation,
    jumlahAyat: d.numberOfAyahs,
    ayat: (d.ayahs || []).map(a => ({
      nomorAyat: a.number.inSurah,
      teksArab: a.arab,
      teksLatin: a.latin || '',
      teksIndonesia: a.translation,
      audioUrl: a.audio?.alafasy || null
    }))
  };
}

/**
 * Open Quran Viewer Modal from Form (Read inputs from 'rq' or 'rh' form)
 */
function openQuranViewerFromForm(prefix) {
  const suratEl = document.getElementById(`${prefix}-surat`);
  const dariEl = document.getElementById(`${prefix}-ayat-dari`);
  const sampaiEl = document.getElementById(`${prefix}-ayat-sampai`);
  const studentInput = document.getElementById(`search-${prefix}-student`);

  const suratName = suratEl ? suratEl.value : 'Al-Fatihah';
  const fromAyah = dariEl ? (parseInt(dariEl.value) || 1) : 1;
  const toAyah = sampaiEl ? (parseInt(sampaiEl.value) || fromAyah) : fromAyah;
  const studentName = studentInput ? studentInput.value : '';

  openQuranViewer({
    surah: suratName,
    fromAyah: Math.min(fromAyah, toAyah),
    toAyah: Math.max(fromAyah, toAyah),
    studentName: studentName,
    reportType: prefix === 'rh' ? 'hafalan' : 'quran'
  });
}

/**
 * Open and Render Quran Viewer Modal
 */
async function openQuranViewer({ surah, fromAyah = 1, toAyah = 1, studentName = '', reportType = 'quran' }) {
  const surahNo = getSurahNumberByName(surah);
  QuranViewerState.currentSurahNo = surahNo;
  QuranViewerState.fromAyah = fromAyah;
  QuranViewerState.toAyah = toAyah;
  QuranViewerState.studentName = studentName;
  QuranViewerState.reportType = reportType;
  QuranViewerState.filterOnlyTargetRange = false;

  // Stop any playing audio
  stopQuranAudio();

  // Create or get modal element
  let modalEl = document.getElementById('quran-viewer-modal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'quran-viewer-modal';
    document.body.appendChild(modalEl);
  }

  modalEl.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm transition-all duration-200 quran-modal-overlay';
  modalEl.onclick = (e) => {
    if (e.target === modalEl) closeQuranViewer();
  };

  modalEl.innerHTML = `
    <div class="quran-modal-card bg-white w-full max-w-4xl h-full max-h-[88dvh] sm:max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in" onclick="event.stopPropagation()">
      <!-- Modal Header -->
      <div class="px-4 sm:px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base sm:text-lg border border-emerald-500/30 shrink-0">
            ${surahNo}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 id="qv-surah-title" class="font-bold text-base sm:text-lg text-white truncate">Memuat Surat...</h3>
              <span id="qv-surah-arab" class="font-arabic text-emerald-400 text-lg sm:text-xl font-normal hidden xs:inline"></span>
            </div>
            <div id="qv-surah-subtitle" class="text-[11px] sm:text-xs text-slate-400 flex items-center gap-2 truncate">
              <span>Mengambil data dari API Qur'an...</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          ${studentName ? `
            <div class="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs font-medium">
              <i data-lucide="user" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span class="truncate max-w-[130px]">${studentName}</span>
            </div>
          ` : ''}
          <button type="button" onclick="closeQuranViewer()" class="h-10 px-3 rounded-xl bg-slate-800 hover:bg-rose-600 active:bg-rose-700 text-slate-200 hover:text-white flex items-center gap-1.5 transition font-semibold text-xs border border-slate-700 hover:border-rose-500 shadow-sm" title="Tutup Mushaf (ESC)">
            <i data-lucide="x" class="w-4 h-4"></i>
            <span class="font-bold">Tutup</span>
          </button>
        </div>
      </div>

      <!-- Quick Toolbar Controls -->
      <div class="bg-slate-50 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <!-- Target Ayah Badge -->
          <div class="inline-flex items-center gap-1 px-2.5 py-1.5 ${reportType === 'hafalan' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200'} border rounded-lg text-xs font-bold shadow-sm">
            <i data-lucide="bookmark" class="w-3.5 h-3.5"></i>
            <span>Ayat ${fromAyah} - ${toAyah}</span>
          </div>

          <!-- Filter Range Toggle -->
          <button id="qv-filter-range-btn" onclick="toggleQuranRangeFilter()" class="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition">
            <i data-lucide="filter" class="w-3.5 h-3.5 text-slate-500"></i>
            <span id="qv-filter-range-label">Fokus Target</span>
          </button>

          <!-- Jump Ayah Dropdown -->
          <div class="flex items-center gap-1 text-xs text-slate-500">
            <select id="qv-jump-ayah" onchange="jumpToAyah(this.value)" class="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none max-w-[120px]">
              <option value="">Loncat Ayat...</option>
            </select>
          </div>
        </div>

        <div class="flex items-center gap-1.5 sm:gap-2">
          <!-- Font Size Control -->
          <div class="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden text-xs">
            <button onclick="changeQuranFontSize(-1)" class="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold border-r border-slate-200" title="Kecilkan Font">A-</button>
            <button onclick="changeQuranFontSize(1)" class="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold" title="Besarkan Font">A+</button>
          </div>

          <!-- Toggle Latin -->
          <button id="qv-toggle-latin-btn" onclick="toggleQuranOption('showLatin')" class="px-2 py-1 text-xs rounded-lg border ${QuranViewerState.showLatin ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold' : 'bg-white text-slate-500 border-slate-300'} transition" title="Tampilkan/Sembunyikan Transliterasi Latin">
            Latin
          </button>

          <!-- Toggle Terjemahan -->
          <button id="qv-toggle-trans-btn" onclick="toggleQuranOption('showTranslation')" class="px-2 py-1 text-xs rounded-lg border ${QuranViewerState.showTranslation ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold' : 'bg-white text-slate-500 border-slate-300'} transition" title="Tampilkan/Sembunyikan Terjemahan Indonesia">
            Arti
          </button>
        </div>
      </div>

      <!-- Modal Body (Ayah List Container) -->
      <div id="qv-content-body" class="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 bg-slate-100/50">
        <div class="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
          <div class="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-sm font-medium">Sedang memuat ayat dari API Qur'an...</span>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-3 sm:px-5 py-2.5 sm:py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
        <div class="flex items-center gap-2">
          <button onclick="closeQuranViewer()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 transition text-xs border border-slate-200">
            <i data-lucide="x" class="w-3.5 h-3.5 text-slate-500"></i> Tutup
          </button>
          <span class="hidden sm:inline-flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            API Kemenag RI
          </span>
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="navigateSurah(-1)" class="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-1 transition text-xs">
            <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i> <span class="hidden sm:inline">Surat</span> Sebelumnya
          </button>
          <button onclick="navigateSurah(1)" class="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-1 transition text-xs">
            <span class="hidden sm:inline">Surat</span> Berikutnya <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  // Handle ESC key to close
  window.addEventListener('keydown', handleQuranViewerKeyDown);

  // Load and render surah content
  await loadAndRenderSurah(surahNo);
}

function handleQuranViewerKeyDown(e) {
  if (e.key === 'Escape') {
    closeQuranViewer();
  }
}

function closeQuranViewer() {
  stopQuranAudio();
  window.removeEventListener('keydown', handleQuranViewerKeyDown);
  const modalEl = document.getElementById('quran-viewer-modal');
  if (modalEl) {
    modalEl.remove();
  }
}

/**
 * Load and render the surah content
 */
async function loadAndRenderSurah(surahNo) {
  const contentBody = document.getElementById('qv-content-body');
  if (!contentBody) return;

  try {
    const data = await fetchSurahData(surahNo);
    
    // Update Header
    const titleEl = document.getElementById('qv-surah-title');
    const arabEl = document.getElementById('qv-surah-arab');
    const subEl = document.getElementById('qv-surah-subtitle');
    
    if (titleEl) titleEl.textContent = `Surat ${data.namaLatin}`;
    if (arabEl) arabEl.textContent = data.namaArab;
    if (subEl) {
      subEl.innerHTML = `
        <span class="font-semibold text-slate-300">Surat ke-${data.nomor}</span> • 
        <span>${data.tempatTurun}</span> • 
        <span>${data.jumlahAyat} Ayat</span> • 
        <span class="italic text-slate-400">"${data.arti}"</span>
      `;
    }

    // Populate Jump dropdown
    const jumpSelect = document.getElementById('qv-jump-ayah');
    if (jumpSelect) {
      jumpSelect.innerHTML = `<option value="">Pilih Ayat (1-${data.jumlahAyat})...</option>` + 
        data.ayat.map(a => `<option value="${a.nomorAyat}">Ayat ${a.nomorAyat}</option>`).join('');
    }

    // Render Ayahs
    renderQuranAyahs(data);

    // Smooth scroll to target start ayah
    setTimeout(() => {
      const targetAyahEl = document.getElementById(`ayah-${QuranViewerState.fromAyah}`);
      if (targetAyahEl) {
        targetAyahEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);

  } catch (err) {
    contentBody.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 text-center px-4">
        <div class="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
          <i data-lucide="wifi-off" class="w-7 h-7"></i>
        </div>
        <h4 class="font-bold text-slate-800 text-base mb-1">Gagal Memuat Surat</h4>
        <p class="text-sm text-slate-500 max-w-md mb-5">${err.message || 'Koneksi ke API Al-Qur\'an terputus. Pastikan perangkat terhubung dengan internet.'}</p>
        <button onclick="loadAndRenderSurah(${surahNo})" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md transition flex items-center gap-2">
          <i data-lucide="rotate-cw" class="w-4 h-4"></i> Coba Lagi
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }
}

/**
 * Render Ayahs List inside Viewer Body
 */
function renderQuranAyahs(data) {
  const contentBody = document.getElementById('qv-content-body');
  if (!contentBody) return;

  const { fromAyah, toAyah, showLatin, showTranslation, filterOnlyTargetRange, fontSizeLevel, reportType } = QuranViewerState;
  const fontSizeClass = QURAN_FONT_SIZES[fontSizeLevel] || QURAN_FONT_SIZES[2];

  let displayAyat = data.ayat;
  if (filterOnlyTargetRange) {
    displayAyat = data.ayat.filter(a => a.nomorAyat >= fromAyah && a.nomorAyat <= toAyah);
  }

  const highlightBorderColor = reportType === 'hafalan' ? 'border-purple-500 bg-purple-50/50' : 'border-blue-500 bg-blue-50/50';
  const highlightBadgeColor = reportType === 'hafalan' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200';

  let bismillahHtml = '';
  // Don't show Bismillah for At-Taubah (Surah 9) or Al-Fatihah (already Ayah 1)
  if (data.nomor !== 9 && data.nomor !== 1 && !filterOnlyTargetRange) {
    bismillahHtml = `
      <div class="text-center py-6 px-4 bg-white rounded-2xl shadow-sm border border-slate-200/80 mb-4">
        <div class="font-arabic text-3xl md:text-4xl text-slate-800 tracking-wide font-normal leading-[2.5]">
          بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
        </div>
        <div class="text-xs text-slate-400 mt-1 italic">Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang</div>
      </div>
    `;
  }

  const ayahsHtml = displayAyat.map(a => {
    const isTarget = a.nomorAyat >= fromAyah && a.nomorAyat <= toAyah;
    const isPlaying = QuranViewerState.currentPlayingAyah === a.nomorAyat;

    return `
      <div id="ayah-${a.nomorAyat}" class="relative bg-white rounded-2xl p-5 md:p-6 shadow-sm border transition-all duration-200 ${
        isTarget 
          ? `border-l-4 ${highlightBorderColor} shadow-md` 
          : 'border-slate-200/80 hover:border-slate-300'
      } ${isPlaying ? 'ring-2 ring-emerald-500' : ''}">
        
        <!-- Ayah Card Header (Number & Actions) -->
        <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <!-- Ayah Number Badge -->
            <div class="w-8 h-8 rounded-full ${isTarget ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-700 font-semibold'} flex items-center justify-center text-xs shadow-inner">
              ${a.nomorAyat}
            </div>

            ${isTarget ? `
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${highlightBadgeColor}">
                Target Setoran (${fromAyah}-${toAyah})
              </span>
            ` : ''}
          </div>

          <!-- Audio & Action Buttons -->
          <div class="flex items-center gap-1.5">
            ${a.audioUrl ? `
              <button onclick="playQuranAudio('${a.audioUrl}', ${a.nomorAyat})" class="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                isPlaying 
                  ? 'bg-emerald-600 text-white animate-pulse' 
                  : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800'
              }">
                <i data-lucide="${isPlaying ? 'pause' : 'play'}" class="w-3.5 h-3.5"></i>
                <span class="hidden sm:inline">${isPlaying ? 'Memutar' : 'Audio'}</span>
              </button>
            ` : ''}

            <button onclick="copyAyahText(${a.nomorAyat})" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition" title="Salin Teks Ayat">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- Arabic Text -->
        <div class="text-right dir-rtl font-arabic ${fontSizeClass} text-slate-900 mb-4 tracking-normal" dir="rtl" style="font-family: 'Amiri', 'Scheherazade New', serif, 'Traditional Arabic';">
          ${a.teksArab}
          <span class="inline-flex items-center justify-center w-7 h-7 mx-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-full font-sans font-bold" dir="ltr">
            ${a.nomorAyat}
          </span>
        </div>

        <!-- Latin Transliteration -->
        ${showLatin && a.teksLatin ? `
          <div class="text-xs md:text-sm text-emerald-700 font-medium italic mb-2 leading-relaxed bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/60">
            ${a.teksLatin}
          </div>
        ` : ''}

        <!-- Indonesian Translation -->
        ${showTranslation && a.teksIndonesia ? `
          <div class="text-xs md:text-sm text-slate-600 leading-relaxed pt-1">
            <span class="font-semibold text-slate-400 mr-1.5">${a.nomorAyat}.</span>${a.teksIndonesia}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  contentBody.innerHTML = `
    <div class="max-w-3xl mx-auto">
      ${bismillahHtml}
      <div class="space-y-4">
        ${ayahsHtml}
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

/**
 * Audio Player for Ayah Murottal
 */
function playQuranAudio(url, ayahNo) {
  if (QuranViewerState.currentAudio && QuranViewerState.currentPlayingAyah === ayahNo) {
    if (!QuranViewerState.currentAudio.paused) {
      QuranViewerState.currentAudio.pause();
      QuranViewerState.currentPlayingAyah = null;
      rerenderAyahsAfterAudioChange();
      return;
    }
  }

  stopQuranAudio();

  try {
    const audio = new Audio(url);
    QuranViewerState.currentAudio = audio;
    QuranViewerState.currentPlayingAyah = ayahNo;
    rerenderAyahsAfterAudioChange();

    audio.play().catch(err => {
      console.warn('Failed to play audio:', err);
      showToast('Gagal memutar audio murottal', 'warning');
      QuranViewerState.currentPlayingAyah = null;
      rerenderAyahsAfterAudioChange();
    });

    audio.onended = () => {
      QuranViewerState.currentPlayingAyah = null;
      rerenderAyahsAfterAudioChange();
    };

    audio.onerror = () => {
      QuranViewerState.currentPlayingAyah = null;
      rerenderAyahsAfterAudioChange();
    };
  } catch (e) {
    console.error('Audio initialization error:', e);
  }
}

function stopQuranAudio() {
  if (QuranViewerState.currentAudio) {
    QuranViewerState.currentAudio.pause();
    QuranViewerState.currentAudio = null;
  }
  QuranViewerState.currentPlayingAyah = null;
}

function rerenderAyahsAfterAudioChange() {
  const cached = QuranViewerState.cache[QuranViewerState.currentSurahNo];
  if (cached) {
    renderQuranAyahs(cached);
  }
}

/**
 * Jump smoothly to a specific ayah
 */
function jumpToAyah(ayahNo) {
  if (!ayahNo) return;
  const el = document.getElementById(`ayah-${ayahNo}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-amber-400');
    setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400'), 1500);
  }
}

/**
 * Toggle between showing only target range vs all ayahs
 */
function toggleQuranRangeFilter() {
  QuranViewerState.filterOnlyTargetRange = !QuranViewerState.filterOnlyTargetRange;
  const label = document.getElementById('qv-filter-range-label');
  const btn = document.getElementById('qv-filter-range-btn');
  
  if (label) {
    label.textContent = QuranViewerState.filterOnlyTargetRange ? 'Lihat Semua Ayat' : 'Fokus Ayat Target';
  }
  if (btn) {
    if (QuranViewerState.filterOnlyTargetRange) {
      btn.className = 'px-2.5 py-1.5 bg-emerald-600 text-white border border-emerald-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition';
    } else {
      btn.className = 'px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition';
    }
  }

  const cached = QuranViewerState.cache[QuranViewerState.currentSurahNo];
  if (cached) renderQuranAyahs(cached);
}

/**
 * Toggle Latin / Translation views
 */
function toggleQuranOption(opt) {
  QuranViewerState[opt] = !QuranViewerState[opt];
  const btnLatin = document.getElementById('qv-toggle-latin-btn');
  const btnTrans = document.getElementById('qv-toggle-trans-btn');

  if (opt === 'showLatin' && btnLatin) {
    btnLatin.className = `px-2.5 py-1 text-xs rounded-lg border ${QuranViewerState.showLatin ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold' : 'bg-white text-slate-500 border-slate-300'} transition`;
  }
  if (opt === 'showTranslation' && btnTrans) {
    btnTrans.className = `px-2.5 py-1 text-xs rounded-lg border ${QuranViewerState.showTranslation ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold' : 'bg-white text-slate-500 border-slate-300'} transition`;
  }

  const cached = QuranViewerState.cache[QuranViewerState.currentSurahNo];
  if (cached) renderQuranAyahs(cached);
}

/**
 * Change Arabic Font Size
 */
function changeQuranFontSize(delta) {
  const next = QuranViewerState.fontSizeLevel + delta;
  if (next >= 1 && next <= 3) {
    QuranViewerState.fontSizeLevel = next;
    const cached = QuranViewerState.cache[QuranViewerState.currentSurahNo];
    if (cached) renderQuranAyahs(cached);
  }
}

/**
 * Navigate to next/prev surah
 */
function navigateSurah(delta) {
  let nextNo = QuranViewerState.currentSurahNo + delta;
  if (nextNo < 1) nextNo = 114;
  if (nextNo > 114) nextNo = 1;

  QuranViewerState.currentSurahNo = nextNo;
  QuranViewerState.fromAyah = 1;
  const meta = quranSurahList.find(s => s.no === nextNo);
  QuranViewerState.toAyah = meta ? meta.ayat : 10;
  
  stopQuranAudio();
  loadAndRenderSurah(nextNo);
}

/**
 * Copy Ayah text to clipboard
 */
function copyAyahText(ayahNo) {
  const cached = QuranViewerState.cache[QuranViewerState.currentSurahNo];
  if (!cached) return;
  const a = cached.ayat.find(x => x.nomorAyat === ayahNo);
  if (!a) return;

  const textToCopy = `${a.teksArab}\n\n"${a.teksIndonesia}" (QS. ${cached.namaLatin}: ${a.nomorAyat})`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast(`Ayat ${ayahNo} disalin ke clipboard!`, 'success');
    });
  } else {
    showToast(`Ayat ${ayahNo} disalin!`, 'success');
  }
}
