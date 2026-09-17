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

// ============ STUDENT DASHBOARD QUR'AN WIDGET (HAFALAN & MUROJA'AH) ============

const StudentQuranState = {
  currentSurahNo: 78,
  defaultSurahNo: 78,
  fromAyah: 1,
  toAyah: 40,
  lastHafalanSurahName: '',
  lastHafalanFrom: 1,
  lastHafalanTo: 1,
  studentName: '',
  showLatin: true,
  showTranslation: true,
  filterOnlyTargetRange: false,
  fontSizeLevel: 2,
  currentAudio: null,
  currentPlayingAyah: null,
  isAutoPlaying: false
};

/**
 * Initialize Student Quran Widget in Student Dashboard
 */
async function initStudentQuranWidget({ surah = 'An-Naba', fromAyah = 1, toAyah = 1, studentName = '' }) {
  const surahNo = getSurahNumberByName(surah);
  const meta = getSurahMeta(surahNo);

  StudentQuranState.currentSurahNo = surahNo;
  StudentQuranState.defaultSurahNo = surahNo;
  StudentQuranState.lastHafalanSurahName = meta ? meta.name : surah;
  StudentQuranState.fromAyah = Math.max(1, parseInt(fromAyah) || 1);
  StudentQuranState.toAyah = Math.max(StudentQuranState.fromAyah, parseInt(toAyah) || (meta ? meta.ayat : 10));
  StudentQuranState.lastHafalanFrom = StudentQuranState.fromAyah;
  StudentQuranState.lastHafalanTo = StudentQuranState.toAyah;
  StudentQuranState.studentName = studentName;
  StudentQuranState.filterOnlyTargetRange = false;
  
  stopStudentAudio();

  const container = document.getElementById('student-quran-widget-container');
  if (!container) return;

  renderStudentQuranShell(container);
  await loadAndRenderStudentSurah(surahNo);
}

/**
 * Render Shell (Header, Controls, Toolbar, and Content Placeholder)
 */
function renderStudentQuranShell(container) {
  const { currentSurahNo, defaultSurahNo, fromAyah, toAyah, lastHafalanSurahName, lastHafalanFrom, lastHafalanTo, showLatin, showTranslation, filterOnlyTargetRange } = StudentQuranState;
  const isDifferentFromHafalan = currentSurahNo !== defaultSurahNo || fromAyah !== lastHafalanFrom || toAyah !== lastHafalanTo;

  // Generate Options for 114 Surahs
  const surahOptions = quranSurahList.map(s => {
    const isSelected = s.no === currentSurahNo;
    return `<option value="${s.no}" ${isSelected ? 'selected' : ''}>${s.no}. ${s.name} (${s.nameArab}) — ${s.ayat} Ayat</option>`;
  }).join('');

  container.innerHTML = `
    <!-- Top Header -->
    <div class="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700">
      <div class="flex items-start sm:items-center gap-3">
        <div class="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30 shrink-0 shadow-inner">
          <i data-lucide="book-open" class="w-6 h-6"></i>
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-bold text-base sm:text-lg text-white">Al-Qur'an & Hafalan Mandiri</h3>
            <span class="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-semibold">
              Muroja'ah Audio & Latin
            </span>
          </div>
          <p class="text-xs text-slate-300 mt-0.5">
            Dengarkan pelafalan murottal per ayat dan baca transliterasi latin untuk mempermudah hafalan Anda.
          </p>
        </div>
      </div>

      <!-- Action Buttons Top -->
      <div class="flex items-center gap-2 shrink-0">
        <button type="button" onclick="openStudentFullscreenQuran()" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm" title="Buka Tampilan Layar Penuh">
          <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i>
          <span>Layar Penuh</span>
        </button>
      </div>
    </div>

    <!-- Active Hafalan Info Banner -->
    <div class="px-5 py-2.5 bg-purple-50/80 border-b border-purple-100 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div class="flex items-center gap-2 text-purple-900">
        <span class="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
        <span class="font-semibold text-purple-800">Target Hafalan Terakhir:</span>
        <span class="bg-purple-100/80 text-purple-800 font-bold px-2 py-0.5 rounded-md border border-purple-200">
          QS. ${lastHafalanSuratName} (Ayat ${lastHafalanFrom} - ${lastHafalanTo})
        </span>
      </div>

      <div id="sq-reset-hafalan-container">
        ${isDifferentFromHafalan ? `
          <button type="button" onclick="resetToLastHafalanSurah()" class="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-purple-100 text-purple-700 font-bold rounded-lg border border-purple-300 shadow-xs transition text-xs">
            <i data-lucide="rotate-ccw" class="w-3 h-3 text-purple-600"></i>
            Kembali ke Hafalan Terakhir
          </button>
        ` : `
          <span class="text-purple-600/80 italic text-[11px] hidden sm:inline">Surat saat ini sesuai hafalan Anda</span>
        `}
      </div>
    </div>

    <!-- Toolbar Controls -->
    <div class="bg-slate-50 p-4 border-b border-slate-200 space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <!-- Surah Selector -->
        <div class="sm:col-span-6 lg:col-span-5">
          <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Pilih Surat Al-Qur'an (1-114):</label>
          <div class="relative">
            <select id="sq-surah-select" onchange="handleStudentSurahChange(this.value)" class="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs transition">
              ${surahOptions}
            </select>
          </div>
        </div>

        <!-- Ayat Range -->
        <div class="sm:col-span-6 lg:col-span-4">
          <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Rentang Ayat Target:</label>
          <div class="flex items-center gap-2">
            <div class="flex-1 flex items-center bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-emerald-500">
              <span class="text-xs text-slate-400 font-medium mr-1.5">Dari:</span>
              <input type="number" id="sq-from-ayah" value="${fromAyah}" min="1" class="w-full text-xs font-bold text-slate-800 outline-none" onchange="handleStudentAyahRangeChange()">
            </div>
            <span class="text-slate-400 font-bold text-xs">-</span>
            <div class="flex-1 flex items-center bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-emerald-500">
              <span class="text-xs text-slate-400 font-medium mr-1.5">S/d:</span>
              <input type="number" id="sq-to-ayah" value="${toAyah}" min="1" class="w-full text-xs font-bold text-slate-800 outline-none" onchange="handleStudentAyahRangeChange()">
            </div>
          </div>
        </div>

        <!-- Muroja'ah Playlist Auto-Play Button -->
        <div class="sm:col-span-12 lg:col-span-3 flex items-end">
          <button id="sq-autoplay-btn" type="button" onclick="toggleStudentAutoPlay()" class="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm" title="Putar audio ayat target berurutan secara otomatis">
            <i data-lucide="play" class="w-4 h-4"></i>
            <span id="sq-autoplay-label">Putar Muroja'ah (Auto)</span>
          </button>
        </div>
      </div>

      <!-- Secondary Toggles Bar -->
      <div class="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <!-- Filter Target Range Toggle -->
          <button id="sq-filter-range-btn" type="button" onclick="toggleStudentRangeFilter()" class="px-2.5 py-1.5 ${filterOnlyTargetRange ? 'bg-purple-600 text-white border-purple-600' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'} border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs">
            <i data-lucide="filter" class="w-3.5 h-3.5"></i>
            <span id="sq-filter-range-label">${filterOnlyTargetRange ? 'Lihat Semua Ayat' : 'Fokus Ayat Target'}</span>
          </button>

          <!-- Toggle Latin -->
          <button id="sq-toggle-latin-btn" type="button" onclick="toggleStudentOption('showLatin')" class="px-2.5 py-1.5 text-xs rounded-lg border ${showLatin ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold' : 'bg-white text-slate-500 border-slate-300'} transition shadow-xs flex items-center gap-1">
            <i data-lucide="type" class="w-3.5 h-3.5"></i>
            <span>Teks Latin</span>
          </button>

          <!-- Toggle Terjemahan -->
          <button id="sq-toggle-trans-btn" type="button" onclick="toggleStudentOption('showTranslation')" class="px-2.5 py-1.5 text-xs rounded-lg border ${showTranslation ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold' : 'bg-white text-slate-500 border-slate-300'} transition shadow-xs flex items-center gap-1">
            <i data-lucide="languages" class="w-3.5 h-3.5"></i>
            <span>Terjemahan</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <!-- Font Size Control -->
          <div class="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden text-xs shadow-xs">
            <span class="px-2 py-1 text-[11px] text-slate-400 font-medium border-r border-slate-200">Huruf Arab:</span>
            <button type="button" onclick="changeStudentFontSize(-1)" class="px-2 py-1 text-slate-700 hover:bg-slate-100 font-bold border-r border-slate-200 transition" title="Kecilkan Huruf Arab">A-</button>
            <button type="button" onclick="changeStudentFontSize(1)" class="px-2 py-1 text-slate-700 hover:bg-slate-100 font-bold transition" title="Besarkan Huruf Arab">A+</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Surah Info Ribbon -->
    <div id="sq-surah-ribbon" class="px-5 py-3 bg-slate-100/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2.5">
        <span id="sq-surah-badge-num" class="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
          ${currentSurahNo}
        </span>
        <div>
          <span id="sq-surah-name" class="font-bold text-slate-800 text-sm">Memuat Surat...</span>
          <span id="sq-surah-meta-text" class="text-xs text-slate-500 ml-2"></span>
        </div>
      </div>
      <div id="sq-surah-arabic-title" class="font-arabic text-emerald-800 text-xl font-normal hidden sm:block"></div>
    </div>

    <!-- Ayah List Container -->
    <div id="sq-content-body" class="p-4 sm:p-6 space-y-4 max-h-[650px] overflow-y-auto bg-slate-100/40">
      <div class="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
        <div class="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm font-medium">Sedang memuat ayat Al-Qur'an...</span>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

/**
 * Load Surah data from cache/API and render ayahs in widget
 */
async function loadAndRenderStudentSurah(surahNo) {
  const contentBody = document.getElementById('sq-content-body');
  if (!contentBody) return;

  try {
    const data = await fetchSurahData(surahNo);

    // Update Ribbon Info
    const badgeNum = document.getElementById('sq-surah-badge-num');
    const nameEl = document.getElementById('sq-surah-name');
    const metaEl = document.getElementById('sq-surah-meta-text');
    const arabEl = document.getElementById('sq-surah-arabic-title');
    const toAyahInput = document.getElementById('sq-to-ayah');

    if (badgeNum) badgeNum.textContent = data.nomor;
    if (nameEl) nameEl.textContent = `Surat ${data.namaLatin}`;
    if (arabEl) arabEl.textContent = data.namaArab;
    if (metaEl) {
      metaEl.innerHTML = `• ${data.tempatTurun} • ${data.jumlahAyat} Ayat • <span class="italic text-slate-400">"${data.arti}"</span>`;
    }

    if (toAyahInput && (!StudentQuranState.toAyah || StudentQuranState.toAyah > data.jumlahAyat)) {
      StudentQuranState.toAyah = data.jumlahAyat;
      toAyahInput.value = data.jumlahAyat;
      toAyahInput.max = data.jumlahAyat;
    }

    // Render Ayahs
    renderStudentAyahs(data);

    // If there is a target start ayah, smooth scroll to it
    setTimeout(() => {
      const targetAyahEl = document.getElementById(`sq-ayah-${StudentQuranState.fromAyah}`);
      if (targetAyahEl) {
        targetAyahEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 250);

  } catch (err) {
    contentBody.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 text-center px-4 bg-white rounded-2xl border border-red-100">
        <div class="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-3">
          <i data-lucide="wifi-off" class="w-6 h-6"></i>
        </div>
        <h4 class="font-bold text-slate-800 text-sm mb-1">Gagal Memuat Surat</h4>
        <p class="text-xs text-slate-500 max-w-sm mb-4">${err.message || 'Koneksi ke API Al-Qur\'an terputus. Pastikan perangkat Anda terhubung dengan internet.'}</p>
        <button type="button" onclick="loadAndRenderStudentSurah(${surahNo})" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5">
          <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i> Coba Lagi
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }
}

/**
 * Render Ayahs List inside Student Quran Widget
 */
function renderStudentAyahs(data) {
  const contentBody = document.getElementById('sq-content-body');
  if (!contentBody) return;

  const { fromAyah, toAyah, showLatin, showTranslation, filterOnlyTargetRange, fontSizeLevel } = StudentQuranState;
  const fontSizeClass = QURAN_FONT_SIZES[fontSizeLevel] || QURAN_FONT_SIZES[2];

  let displayAyat = data.ayat;
  if (filterOnlyTargetRange) {
    displayAyat = data.ayat.filter(a => a.nomorAyat >= fromAyah && a.nomorAyat <= toAyah);
  }

  let bismillahHtml = '';
  // Don't show Bismillah for At-Taubah (Surah 9) or Al-Fatihah (already Ayah 1)
  if (data.nomor !== 9 && data.nomor !== 1 && !filterOnlyTargetRange) {
    bismillahHtml = `
      <div class="text-center py-5 px-4 bg-white rounded-2xl shadow-xs border border-slate-200/80 mb-4">
        <div class="font-arabic text-2xl md:text-3xl text-slate-800 tracking-wide font-normal leading-[2.4]">
          بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
        </div>
        <div class="text-[11px] text-slate-400 mt-1 italic">Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang</div>
      </div>
    `;
  }

  const ayahsHtml = displayAyat.map(a => {
    const isTarget = a.nomorAyat >= fromAyah && a.nomorAyat <= toAyah;
    const isPlaying = StudentQuranState.currentPlayingAyah === a.nomorAyat;

    return `
      <div id="sq-ayah-${a.nomorAyat}" class="relative bg-white rounded-2xl p-4 sm:p-6 shadow-xs border transition-all duration-200 ${
        isTarget 
          ? 'border-l-4 border-l-purple-500 border-slate-200 bg-purple-50/20 shadow-sm' 
          : 'border-slate-200/80 hover:border-slate-300'
      } ${isPlaying ? 'ring-2 ring-purple-500 bg-purple-50/40 shadow-md' : ''}">
        
        <!-- Header: Number, Target Badge, Audio, Copy -->
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full ${isTarget ? 'bg-purple-600 text-white font-bold' : 'bg-slate-100 text-slate-700 font-semibold'} flex items-center justify-center text-xs shadow-inner">
              ${a.nomorAyat}
            </div>

            ${isTarget ? `
              <span class="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                <i data-lucide="bookmark" class="w-3 h-3 text-purple-600"></i>
                Target Hafalan Anda (${fromAyah}-${toAyah})
              </span>
            ` : ''}
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-1.5">
            ${a.audioUrl ? `
              <button type="button" onclick="playStudentAyahAudio('${a.audioUrl}', ${a.nomorAyat})" class="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                isPlaying 
                  ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-300' 
                  : 'bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800'
              }">
                <i data-lucide="${isPlaying ? 'pause' : 'volume-2'}" class="w-3.5 h-3.5 ${isPlaying ? 'animate-bounce' : ''}"></i>
                <span class="text-[11px]">${isPlaying ? 'Memutar' : 'Audio'}</span>
              </button>
            ` : ''}

            <button type="button" onclick="copyStudentAyahText(${a.nomorAyat})" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition" title="Salin Teks Ayat">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- Arabic Script -->
        <div class="text-right dir-rtl font-arabic ${fontSizeClass} text-slate-900 mb-3 tracking-normal" dir="rtl">
          ${a.teksArab}
          <span class="inline-flex items-center justify-center w-7 h-7 mx-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-full font-sans font-bold" dir="ltr">
            ${a.nomorAyat}
          </span>
        </div>

        <!-- Latin Transliteration -->
        ${showLatin && a.teksLatin ? `
          <div class="text-xs sm:text-sm text-emerald-800 font-medium italic mb-2 leading-relaxed bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/60">
            <span class="font-bold text-emerald-600 mr-1 not-italic">[Latin]</span>${a.teksLatin}
          </div>
        ` : ''}

        <!-- Indonesian Translation -->
        ${showTranslation && a.teksIndonesia ? `
          <div class="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
            <span class="font-semibold text-slate-400 mr-1">${a.nomorAyat}.</span>${a.teksIndonesia}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  contentBody.innerHTML = `
    <div class="max-w-3xl mx-auto">
      ${bismillahHtml}
      <div class="space-y-4">
        ${ayahsHtml.length ? ayahsHtml : '<div class="py-12 text-center text-slate-400 text-xs">Tidak ada ayat dalam rentang filter.</div>'}
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

/**
 * Audio Player for Student Quran Widget
 */
function playStudentAyahAudio(url, ayahNo, isAuto = false) {
  if (StudentQuranState.currentAudio && StudentQuranState.currentPlayingAyah === ayahNo && !isAuto) {
    if (!StudentQuranState.currentAudio.paused) {
      StudentQuranState.currentAudio.pause();
      StudentQuranState.currentPlayingAyah = null;
      rerenderStudentAyahsAfterAudioChange();
      return;
    }
  }

  stopStudentAudioOnly();

  try {
    const audio = new Audio(url);
    StudentQuranState.currentAudio = audio;
    StudentQuranState.currentPlayingAyah = ayahNo;
    rerenderStudentAyahsAfterAudioChange();

    // Scroll smoothly to playing ayah
    const el = document.getElementById(`sq-ayah-${ayahNo}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    audio.play().catch(err => {
      console.warn('Failed to play student audio:', err);
      showToast('Gagal memutar audio murottal', 'warning');
      StudentQuranState.currentPlayingAyah = null;
      rerenderStudentAyahsAfterAudioChange();
    });

    audio.onended = () => {
      StudentQuranState.currentPlayingAyah = null;
      
      // Auto-play next ayah if in Muroja'ah playlist mode
      if (StudentQuranState.isAutoPlaying) {
        const nextAyahNo = ayahNo + 1;
        if (nextAyahNo <= StudentQuranState.toAyah) {
          const cached = QuranViewerState.cache[StudentQuranState.currentSurahNo];
          const nextAyah = cached ? cached.ayat.find(x => x.nomorAyat === nextAyahNo) : null;
          if (nextAyah && nextAyah.audioUrl) {
            playStudentAyahAudio(nextAyah.audioUrl, nextAyahNo, true);
            return;
          }
        }
        // Ended playlist
        StudentQuranState.isAutoPlaying = false;
        updateStudentAutoPlayBtn();
        showToast('Muroja\'ah target ayat selesai! Alhamdulillah.', 'success');
      }

      rerenderStudentAyahsAfterAudioChange();
    };

    audio.onerror = () => {
      StudentQuranState.currentPlayingAyah = null;
      if (StudentQuranState.isAutoPlaying) {
        StudentQuranState.isAutoPlaying = false;
        updateStudentAutoPlayBtn();
      }
      rerenderStudentAyahsAfterAudioChange();
    };
  } catch (e) {
    console.error('Audio initialization error:', e);
  }
}

function stopStudentAudioOnly() {
  if (StudentQuranState.currentAudio) {
    StudentQuranState.currentAudio.pause();
    StudentQuranState.currentAudio = null;
  }
  StudentQuranState.currentPlayingAyah = null;
}

function stopStudentAudio() {
  stopStudentAudioOnly();
  StudentQuranState.isAutoPlaying = false;
  updateStudentAutoPlayBtn();
}

function rerenderStudentAyahsAfterAudioChange() {
  const cached = QuranViewerState.cache[StudentQuranState.currentSurahNo];
  if (cached) {
    renderStudentAyahs(cached);
  }
}

/**
 * Toggle Muroja'ah Auto-Play (plays consecutively through target ayahs)
 */
function toggleStudentAutoPlay() {
  if (StudentQuranState.isAutoPlaying) {
    stopStudentAudio();
    showToast('Pemutaran Muroja\'ah dihentikan');
    return;
  }

  const cached = QuranViewerState.cache[StudentQuranState.currentSurahNo];
  if (!cached || !cached.ayat || !cached.ayat.length) {
    showToast('Ayat belum selesai dimuat', 'warning');
    return;
  }

  const startAyah = Math.max(1, StudentQuranState.fromAyah);
  const targetAyah = cached.ayat.find(a => a.nomorAyat === startAyah) || cached.ayat[0];
  if (!targetAyah || !targetAyah.audioUrl) {
    showToast('Audio ayat tidak tersedia', 'warning');
    return;
  }

  StudentQuranState.isAutoPlaying = true;
  updateStudentAutoPlayBtn();
  showToast(`Memulai Muroja'ah Ayat ${StudentQuranState.fromAyah} - ${StudentQuranState.toAyah}...`, 'info');
  playStudentAyahAudio(targetAyah.audioUrl, targetAyah.nomorAyat, true);
}

function updateStudentAutoPlayBtn() {
  const btn = document.getElementById('sq-autoplay-btn');
  const label = document.getElementById('sq-autoplay-label');
  if (!btn || !label) return;

  if (StudentQuranState.isAutoPlaying) {
    btn.className = 'w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm animate-pulse';
    label.textContent = 'Hentikan Muroja\'ah';
    btn.querySelector('i')?.setAttribute('data-lucide', 'square');
  } else {
    btn.className = 'w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm';
    label.textContent = 'Putar Muroja\'ah (Auto)';
    btn.querySelector('i')?.setAttribute('data-lucide', 'play');
  }
  if (window.lucide) lucide.createIcons();
}

/**
 * Handle changing Surah from dropdown
 */
async function handleStudentSurahChange(val) {
  const surahNo = parseInt(val);
  if (!surahNo) return;

  stopStudentAudio();
  StudentQuranState.currentSurahNo = surahNo;
  StudentQuranState.fromAyah = 1;
  const meta = getSurahMeta(surahNo);
  StudentQuranState.toAyah = meta ? meta.ayat : 10;

  // Update inputs
  const fromInput = document.getElementById('sq-from-ayah');
  const toInput = document.getElementById('sq-to-ayah');
  if (fromInput) fromInput.value = 1;
  if (toInput) toInput.value = StudentQuranState.toAyah;

  updateResetHafalanButtonVisibility();
  await loadAndRenderStudentSurah(surahNo);
}

/**
 * Reset back to student's last hafalan surah
 */
async function resetToLastHafalanSurah() {
  stopStudentAudio();

  const surahNo = StudentQuranState.defaultSurahNo;
  StudentQuranState.currentSurahNo = surahNo;
  StudentQuranState.fromAyah = StudentQuranState.lastHafalanFrom;
  StudentQuranState.toAyah = StudentQuranState.lastHafalanTo;

  // Update select & inputs
  const select = document.getElementById('sq-surah-select');
  const fromInput = document.getElementById('sq-from-ayah');
  const toInput = document.getElementById('sq-to-ayah');

  if (select) select.value = surahNo;
  if (fromInput) fromInput.value = StudentQuranState.fromAyah;
  if (toInput) toInput.value = StudentQuranState.toAyah;

  updateResetHafalanButtonVisibility();
  showToast(`Kembali ke hafalan QS. ${StudentQuranState.lastHafalanSurahName}`, 'info');
  await loadAndRenderStudentSurah(surahNo);
}

function updateResetHafalanButtonVisibility() {
  const container = document.getElementById('sq-reset-hafalan-container');
  if (!container) return;

  const { currentSurahNo, defaultSurahNo, fromAyah, toAyah, lastHafalanFrom, lastHafalanTo, lastHafalanSurahName } = StudentQuranState;
  const isDifferent = currentSurahNo !== defaultSurahNo || fromAyah !== lastHafalanFrom || toAyah !== lastHafalanTo;

  if (isDifferent) {
    container.innerHTML = `
      <button type="button" onclick="resetToLastHafalanSurah()" class="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-purple-100 text-purple-700 font-bold rounded-lg border border-purple-300 shadow-xs transition text-xs">
        <i data-lucide="rotate-ccw" class="w-3 h-3 text-purple-600"></i>
        Kembali ke Hafalan Terakhir
      </button>
    `;
  } else {
    container.innerHTML = `
      <span class="text-purple-600/80 italic text-[11px] hidden sm:inline">Surat saat ini sesuai hafalan Anda</span>
    `;
  }
  if (window.lucide) lucide.createIcons();
}

/**
 * Handle changes to from/to ayah range inputs
 */
function handleStudentAyahRangeChange() {
  const fromInput = document.getElementById('sq-from-ayah');
  const toInput = document.getElementById('sq-to-ayah');
  if (!fromInput || !toInput) return;

  let f = parseInt(fromInput.value) || 1;
  let t = parseInt(toInput.value) || f;
  if (f < 1) f = 1;
  if (t < f) t = f;

  StudentQuranState.fromAyah = f;
  StudentQuranState.toAyah = t;

  updateResetHafalanButtonVisibility();
  const cached = QuranViewerState.cache[StudentQuranState.currentSurahNo];
  if (cached) renderStudentAyahs(cached);
}

/**
 * Toggle focus range (only show target ayahs)
 */
function toggleStudentRangeFilter() {
  StudentQuranState.filterOnlyTargetRange = !StudentQuranState.filterOnlyTargetRange;
  const label = document.getElementById('sq-filter-range-label');
  const btn = document.getElementById('sq-filter-range-btn');

  if (label) {
    label.textContent = StudentQuranState.filterOnlyTargetRange ? 'Lihat Semua Ayat' : 'Fokus Ayat Target';
  }
  if (btn) {
    if (StudentQuranState.filterOnlyTargetRange) {
      btn.className = 'px-2.5 py-1.5 bg-purple-600 text-white border-purple-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs';
    } else {
      btn.className = 'px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs';
    }
  }

  const cached = QuranViewerState.cache[StudentQuranState.currentSurahNo];
  if (cached) renderStudentAyahs(cached);
}

/**
 * Toggle Latin / Translation views for student widget
 */
function toggleStudentOption(opt) {
  StudentQuranState[opt] = !StudentQuranState[opt];
  const btnLatin = document.getElementById('sq-toggle-latin-btn');
  const btnTrans = document.getElementById('sq-toggle-trans-btn');

  if (opt === 'showLatin' && btnLatin) {
    btnLatin.className = `px-2.5 py-1.5 text-xs rounded-lg border ${StudentQuranState.showLatin ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold' : 'bg-white text-slate-500 border-slate-300'} transition shadow-xs flex items-center gap-1`;
  }
  if (opt === 'showTranslation' && btnTrans) {
    btnTrans.className = `px-2.5 py-1.5 text-xs rounded-lg border ${StudentQuranState.showTranslation ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold' : 'bg-white text-slate-500 border-slate-300'} transition shadow-xs flex items-center gap-1`;
  }

  const cached = QuranViewerState.cache[StudentQuranState.currentSurahNo];
  if (cached) renderStudentAyahs(cached);
}

/**
 * Change Arabic Font Size for student widget
 */
function changeStudentFontSize(delta) {
  const next = StudentQuranState.fontSizeLevel + delta;
  if (next >= 1 && next <= 3) {
    StudentQuranState.fontSizeLevel = next;
    const cached = QuranViewerState.cache[StudentQuranState.currentSurahNo];
    if (cached) renderStudentAyahs(cached);
  }
}

/**
 * Open Fullscreen Quran Modal from student widget
 */
function openStudentFullscreenQuran() {
  stopStudentAudio();
  const cached = QuranViewerState.cache[StudentQuranState.currentSurahNo];
  const surahName = cached ? cached.namaLatin : (getSurahMeta(StudentQuranState.currentSurahNo)?.name || 'An-Naba');
  
  openQuranViewer({
    surah: surahName,
    fromAyah: StudentQuranState.fromAyah,
    toAyah: StudentQuranState.toAyah,
    studentName: StudentQuranState.studentName,
    reportType: 'hafalan'
  });
}

/**
 * Select specific surah and range in student Quran widget
 */
async function setStudentQuranSurahAndRange(surah, fromAyah = 1, toAyah = 1) {
  const surahNo = getSurahNumberByName(surah);
  const meta = getSurahMeta(surahNo);

  stopStudentAudio();
  StudentQuranState.currentSurahNo = surahNo;
  StudentQuranState.fromAyah = Math.max(1, parseInt(fromAyah) || 1);
  StudentQuranState.toAyah = Math.max(StudentQuranState.fromAyah, parseInt(toAyah) || (meta ? meta.ayat : 10));

  const select = document.getElementById('sq-surah-select');
  const fromInput = document.getElementById('sq-from-ayah');
  const toInput = document.getElementById('sq-to-ayah');

  if (select) select.value = surahNo;
  if (fromInput) fromInput.value = StudentQuranState.fromAyah;
  if (toInput) toInput.value = StudentQuranState.toAyah;

  updateResetHafalanButtonVisibility();
  await loadAndRenderStudentSurah(surahNo);
}

/**
 * Copy Ayah text from student widget
 */
function copyStudentAyahText(ayahNo) {
  const cached = QuranViewerState.cache[StudentQuranState.currentSurahNo];
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

// Expose functions to window
window.initStudentQuranWidget = initStudentQuranWidget;
window.setStudentQuranSurahAndRange = setStudentQuranSurahAndRange;
window.handleStudentSurahChange = handleStudentSurahChange;
window.handleStudentAyahRangeChange = handleStudentAyahRangeChange;
window.resetToLastHafalanSurah = resetToLastHafalanSurah;
window.toggleStudentAutoPlay = toggleStudentAutoPlay;
window.toggleStudentRangeFilter = toggleStudentRangeFilter;
window.toggleStudentOption = toggleStudentOption;
window.changeStudentFontSize = changeStudentFontSize;
window.openStudentFullscreenQuran = openStudentFullscreenQuran;
window.playStudentAyahAudio = playStudentAyahAudio;
window.copyStudentAyahText = copyStudentAyahText;
