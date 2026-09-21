// ============ HALAQOH PAGE & MANAGEMENT ============

let selectedHalaqohId = null;
let halaqohPeriodFilter = 'all'; // 'all' | 'today' | 'week' | 'month'
let halaqohDateInput = today();
let halaqohSearchQuery = '';
let halaqohListFilterQuery = '';
let halaqohAdminViewScope = 'all'; // 'all' | 'mine' untuk admin
let isHalaqohCompactTable = localStorage.getItem('ikasi_hlq_compact') === 'true';

// State untuk Modal Kelola Siswa
let halaqohStudentGradeFilter = '';
let halaqohStudentClassFilter = '';
let halaqohStudentSearchFilter = '';
let tempSelectedStudentIds = new Set();
let pendingDeleteHalaqohId = null;

function toggleHalaqohCompactTable() {
  isHalaqohCompactTable = !isHalaqohCompactTable;
  try {
    localStorage.setItem('ikasi_hlq_compact', isHalaqohCompactTable);
  } catch (e) {}
  renderHalaqohContent({ animateSwitch: false });
}

// ============ RENDER HALAQOH MAIN ============
function renderHalaqoh(el, options = {}) {
  const existingView = document.getElementById('halaqoh-main-view');
  if (existingView && el.contains(existingView)) {
    renderHalaqohContent(options);
    return;
  }

  const isAdmin = currentUser.role === 'admin';

  el.innerHTML = `
  <div id="halaqoh-main-view" class="max-w-7xl mx-auto space-y-6">
    <!-- Header Layar (No-print) -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
      <div>
        <div class="flex items-center gap-3">
          <div class="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl shadow-sm">
            <i data-lucide="layers" class="w-6 h-6"></i>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-slate-800">Halaqoh Al-Qur'an</h2>
            <p class="text-sm text-slate-500">Kelompok pembinaan Al-Qur'an &amp; monitoring capaian siswa</p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 w-full md:w-auto flex-wrap">
        <div id="halaqoh-print-btn-slot"></div>
        ${isAdmin ? `
          <button onclick="showCreateHalaqohModal()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md transition flex items-center justify-center gap-2 flex-1 md:flex-none">
            <i data-lucide="plus-circle" class="w-4 h-4"></i> Buat Halaqoh Baru
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Pilihan Tab / Daftar Halaqoh -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 no-print">
      <div class="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-100 flex-wrap">
        <div class="flex items-center gap-2">
          <i data-lucide="bookmark" class="w-4 h-4 text-emerald-600"></i>
          <span class="text-sm font-bold text-slate-700">Daftar Halaqoh</span>
          <span id="halaqoh-count-badge" class="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
            0 Kelompok
          </span>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          ${isAdmin ? `
            <div class="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
              <button onclick="setHalaqohAdminScope('all')" id="btn-scope-all" class="px-3 py-1 rounded-lg transition ${halaqohAdminViewScope==='all' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-800'}">
                Semua Halaqoh
              </button>
              <button onclick="setHalaqohAdminScope('mine')" id="btn-scope-mine" class="px-3 py-1 rounded-lg transition ${halaqohAdminViewScope==='mine' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-800'}">
                Halaqoh Saya
              </button>
            </div>
            <span class="text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg font-medium">
              Admin: <strong>${currentUser.name}</strong>
            </span>
          ` : `
            <span class="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium">
              Guru Pengampu: <strong>${currentUser.name}</strong>
            </span>
          `}
        </div>
      </div>

      <div id="halaqoh-tabs-container"></div>
    </div>

    <!-- Konten Halaqoh Aktif (Transisi Mulus Tanpa Layar Putih) -->
    <div id="halaqoh-active-container" class="space-y-6"></div>

    <!-- Modal Container -->
    <div id="halaqoh-modal-container"></div>
  </div>
  `;

  renderHalaqohContent({ animateSwitch: false });
}

function setHalaqohAdminScope(scope) {
  halaqohAdminViewScope = scope;
  selectedHalaqohId = null;
  halaqohSearchQuery = '';
  halaqohListFilterQuery = '';
  renderHalaqohContent({ animateSwitch: true });
}

function renderHalaqohContent(options = {}) {
  const container = document.getElementById('halaqoh-active-container');
  const tabsContainer = document.getElementById('halaqoh-tabs-container');
  const badgeEl = document.getElementById('halaqoh-count-badge');
  const printSlot = document.getElementById('halaqoh-print-btn-slot');

  // Update Status Tombol Filter Scope Admin (Semua Halaqoh vs Halaqoh Saya)
  const btnAll = document.getElementById('btn-scope-all');
  const btnMine = document.getElementById('btn-scope-mine');
  if (btnAll && btnMine) {
    if (halaqohAdminViewScope === 'mine') {
      btnMine.className = 'px-3 py-1 rounded-lg transition bg-white text-emerald-700 shadow-sm font-bold';
      btnAll.className = 'px-3 py-1 rounded-lg transition text-slate-600 hover:text-slate-800';
    } else {
      btnAll.className = 'px-3 py-1 rounded-lg transition bg-white text-emerald-700 shadow-sm font-bold';
      btnMine.className = 'px-3 py-1 rounded-lg transition text-slate-600 hover:text-slate-800';
    }
  }

  if (!container || !tabsContainer) {
    const main = document.getElementById('main-content');
    if (main) renderHalaqoh(main, options);
    return;
  }

  const isAdmin = currentUser.role === 'admin';
  const halaqohList = getHalaqohList();

  // Filter halaqoh guru/admin sendiri
  const mineList = halaqohList.filter(h => 
    h.teacher_id === currentUser.id || 
    (h.teacher_name && currentUser.name && h.teacher_name.toLowerCase() === currentUser.name.toLowerCase()) ||
    (currentUser.role === 'admin' && h.teacher_name && (h.teacher_name.toLowerCase() === 'admin' || h.teacher_name.toLowerCase() === currentUser.name.toLowerCase()))
  );

  let myHalaqohList = isAdmin 
    ? (halaqohAdminViewScope === 'mine' ? mineList : halaqohList)
    : mineList;

  // Auto-select halaqoh jika belum dipilih atau jika halaqoh sebelumnya tidak ada di daftar saat ini
  if (!selectedHalaqohId && myHalaqohList.length > 0) {
    selectedHalaqohId = myHalaqohList[0].id;
  } else if (selectedHalaqohId && !myHalaqohList.some(h => h.id === selectedHalaqohId)) {
    selectedHalaqohId = myHalaqohList.length > 0 ? myHalaqohList[0].id : null;
  }

  const activeHalaqoh = myHalaqohList.find(h => h.id === selectedHalaqohId);

  // Ambil siswa dalam halaqoh yang aktif
  const allStudents = getStudents();
  const halaqohStudents = activeHalaqoh 
    ? allStudents.filter(s => (activeHalaqoh.student_ids || []).includes(s.__backendId))
    : [];

  // Hitung metrik ringkas halaqoh
  const halaqohReports = getReports();
  let tuntasBacaanCount = 0;
  let tuntasHafalanCount = 0;
  halaqohStudents.forEach(st => {
    const metrics = computeStudentHalaqohProgress(st, halaqohReports, halaqohPeriodFilter, halaqohDateInput);
    if (metrics.bacaanTuntas) tuntasBacaanCount++;
    if (metrics.hafalanTuntas) tuntasHafalanCount++;
  });
  const totalStudents = halaqohStudents.length;
  const tuntasBacaanPct = totalStudents > 0 ? Math.round((tuntasBacaanCount / totalStudents) * 100) : 0;
  const tuntasHafalanPct = totalStudents > 0 ? Math.round((tuntasHafalanCount / totalStudents) * 100) : 0;

  // Update Badge Jumlah Halaqoh
  if (badgeEl) {
    badgeEl.textContent = `${myHalaqohList.length} Kelompok`;
  }

  // Update Tombol Cetak di Header
  if (printSlot) {
    printSlot.innerHTML = activeHalaqoh ? `
      <button onclick="printHalaqohReport()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md transition flex items-center justify-center gap-2 flex-1 md:flex-none">
        <i data-lucide="printer" class="w-4 h-4"></i> Cetak Laporan Halaqoh
      </button>
    ` : '';
  }

  // Update Tombol Tab Halaqoh
  tabsContainer.innerHTML = renderHalaqohTabButtons(myHalaqohList, isAdmin);

  // Update Isi Konten Aktif
  container.innerHTML = renderActiveHalaqohBody(activeHalaqoh, halaqohStudents, halaqohReports, tuntasBacaanPct, tuntasHafalanPct, isAdmin);

  // Animasi Halus & Nyaman (hanya saat perpindahan halaqoh atau filter periode)
  if (options.animateSwitch) {
    container.classList.remove('halaqoh-transition-active');
    void container.offsetWidth; // force reflow untuk memulai animasi smooth
    container.classList.add('halaqoh-transition-active');
  } else {
    container.classList.remove('halaqoh-transition-active');
  }

  if (window.lucide) lucide.createIcons();

  const showAdminSearchToolbar = isAdmin && halaqohAdminViewScope === 'all';

  // Sinkronkan filter pencarian halaqoh jika sedang aktif (hanya di mode Semua Halaqoh Admin)
  if (showAdminSearchToolbar && halaqohListFilterQuery) {
    handleHalaqohListSearch(halaqohListFilterQuery);
  }

  // Scroll active pill into view
  if (selectedHalaqohId) {
    const activePill = document.querySelector(`#halaqoh-pills-container button[data-hlq-id="${selectedHalaqohId}"]`);
    if (activePill) {
      try {
        activePill.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      } catch (e) {}
    }
  }

  if (halaqohSearchQuery) {
    handleHalaqohSearch(halaqohSearchQuery);
  }
}

function renderHalaqohTabButtons(myHalaqohList, isAdmin) {
  if (myHalaqohList.length === 0) {
    return `
      <div class="text-center py-10 text-slate-400">
        <div class="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <i data-lucide="folder-search" class="w-6 h-6"></i>
        </div>
        <p class="text-sm font-semibold text-slate-700">
          ${!isAdmin 
            ? 'Anda belum memiliki kelompok halaqoh yang dibina' 
            : (halaqohAdminViewScope === 'mine' ? 'Anda belum memiliki kelompok halaqoh yang dibina atas nama Anda' : 'Belum ada data halaqoh')}
        </p>
        <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          ${!isAdmin 
            ? 'Silakan hubungi Administrator untuk mendaftarkan Anda sebagai guru pengampu halaqoh.' 
            : (halaqohAdminViewScope === 'mine' ? 'Klik tombol <strong>Semua Halaqoh</strong> di atas untuk melihat seluruh kelompok, atau buat halaqoh baru.' : 'Klik tombol <strong>+ Buat Halaqoh Baru</strong> di atas untuk membuat halaqoh pertama.')}
        </p>
      </div>
    `;
  }

  const showAdminSearchToolbar = isAdmin && halaqohAdminViewScope === 'all';

  return `
    <div class="space-y-3">
      ${showAdminSearchToolbar ? `
        <!-- Toolbar: Pencarian Halaqoh & Dropdown Pilih Cepat (Khusus Mode Semua Halaqoh Admin) -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <!-- Pencarian Nama Halaqoh / Guru -->
          <div class="relative flex-1">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            <input type="text" 
                   id="search-halaqoh-list" 
                   placeholder="Cari nama halaqoh atau guru pengampu..." 
                   value="${halaqohListFilterQuery}" 
                   oninput="handleHalaqohListSearch(this.value)" 
                   class="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition bg-slate-50/60 focus:bg-white">
            <button id="clear-hlq-list-search-btn" 
                    type="button" 
                    onclick="clearHalaqohListSearch()" 
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition ${halaqohListFilterQuery ? '' : 'hidden'}" 
                    title="Hapus pencarian halaqoh">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Dropdown Pilih Cepat Halaqoh -->
          <div class="sm:w-80 shrink-0">
            <div class="relative">
              <select id="select-active-halaqoh" 
                      onchange="selectHalaqoh(this.value)" 
                      class="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none transition cursor-pointer appearance-none shadow-xs">
                ${myHalaqohList.map(h => `
                  <option value="${h.id}" ${h.id === selectedHalaqohId ? 'selected' : ''}>
                    ${h.name} (${h.teacher_name || 'Guru'} &bull; ${(h.student_ids || []).length} Siswa)
                  </option>
                `).join('')}
              </select>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Container Pills Halaqoh (Wrapping, Tidak Terpotong di Desktop) -->
      <div id="halaqoh-pills-container" class="flex flex-wrap gap-2 ${showAdminSearchToolbar ? 'max-h-48 overflow-y-auto' : ''} pr-1 py-1">
        ${myHalaqohList.map(h => {
          const isSelected = h.id === selectedHalaqohId;
          const studentCount = (h.student_ids || []).length;
          return `
            <button type="button" 
                    onclick="selectHalaqoh('${h.id}')" 
                    data-hlq-id="${h.id}"
                    data-hlq-name="${(h.name || '').toLowerCase()}" 
                    data-hlq-teacher="${(h.teacher_name || '').toLowerCase()}" 
                    class="hlq-pill-item text-left px-3 py-2 rounded-xl border text-xs transition flex items-center gap-2.5 ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-bold' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-medium'}">
              <span class="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}">
                ${(h.name || 'H').charAt(0).toUpperCase()}
              </span>
              <div class="flex flex-col min-w-0">
                <div class="truncate max-w-[170px] leading-tight">${h.name}</div>
                <div class="text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'} leading-tight mt-0.5 truncate max-w-[170px]">
                  ${h.teacher_name || 'Guru'} &bull; ${studentCount} Siswa
                </div>
              </div>
            </button>
          `;
        }).join('')}
        ${showAdminSearchToolbar ? `
          <div id="hlq-list-no-results" class="w-full py-4 text-center text-xs text-slate-400 hidden">
            Tidak ada halaqoh yang cocok dengan kata kunci pencarian.
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderActiveHalaqohBody(activeHalaqoh, halaqohStudents, halaqohReports, tuntasBacaanPct, tuntasHafalanPct, isAdmin) {
  if (!activeHalaqoh) {
    return `
      <div class="bg-white rounded-3xl p-10 md:p-14 text-center shadow-sm border border-slate-100 no-print">
        <div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
          <i data-lucide="layers" class="w-8 h-8"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-700 mb-1">
          ${!isAdmin 
            ? 'Belum Ada Halaqoh' 
            : (halaqohAdminViewScope === 'mine' ? 'Tidak Ada Halaqoh Saya' : 'Pilih Salah Satu Halaqoh')}
        </h3>
        <p class="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          ${!isAdmin 
            ? 'Nama Anda saat ini belum tercatat sebagai guru pengampu di kelompok halaqoh mana pun. Silakan hubungi admin untuk mendaftarkan nama Anda sebagai pengampu.' 
            : (halaqohAdminViewScope === 'mine' 
              ? 'Anda saat ini belum mengampu kelompok halaqoh secara langsung. Klik tombol "Semua Halaqoh" di atas untuk melihat seluruh kelompok.' 
              : 'Silakan klik salah satu kelompok halaqoh pada daftar di atas untuk melihat detail siswa, capaian bacaan/hafalan, dan mencetak laporan.')}
        </p>
      </div>
    `;
  }

  return `
    <!-- Kartu Ringkasan Informasi Halaqoh -->
    <div class="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden no-print">
      <div class="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6 relative z-10">
        <div>
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/20">
              ${activeHalaqoh.grade || 'Lintas Tingkat'}
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-200">
              Kelas Campuran
            </span>
          </div>
          <h3 class="text-2xl md:text-3xl font-black tracking-tight">${activeHalaqoh.name}</h3>
          <p class="text-emerald-100 text-sm mt-1 flex items-center gap-2">
            <i data-lucide="user-check" class="w-4 h-4 text-emerald-300"></i>
            Guru Pengampu: <strong class="text-white">${activeHalaqoh.teacher_name || '-'}</strong>
          </p>
          ${activeHalaqoh.notes ? `<p class="text-xs text-emerald-200/80 mt-1 italic">${activeHalaqoh.notes}</p>` : ''}
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <!-- 3 Kotak Statistik (Selalu Berjejer ke Samping di Mobile) -->
          <div class="grid grid-cols-3 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:gap-2.5">
            <div class="bg-white/10 backdrop-blur-sm border border-white/10 px-2 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl text-center sm:min-w-[85px] flex flex-col justify-center">
              <div class="text-lg sm:text-2xl font-black leading-none">${halaqohStudents.length}</div>
              <div class="text-[9px] sm:text-[10px] uppercase tracking-wider text-emerald-200 font-semibold mt-1 leading-tight">Total Siswa</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm border border-white/10 px-2 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl text-center sm:min-w-[90px] flex flex-col justify-center">
              <div class="text-lg sm:text-2xl font-black text-emerald-300 leading-none">${tuntasBacaanPct}%</div>
              <div class="text-[9px] sm:text-[10px] uppercase tracking-wider text-emerald-200 font-semibold mt-1 leading-tight">Tuntas Bacaan</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm border border-white/10 px-2 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl text-center sm:min-w-[90px] flex flex-col justify-center">
              <div class="text-lg sm:text-2xl font-black text-amber-300 leading-none">${tuntasHafalanPct}%</div>
              <div class="text-[9px] sm:text-[10px] uppercase tracking-wider text-emerald-200 font-semibold mt-1 leading-tight">Tuntas Hafalan</div>
            </div>
          </div>

          ${isAdmin ? `
            <div class="flex items-center gap-2 shrink-0">
              <button onclick="showManageHalaqohStudents('${activeHalaqoh.id}')" class="bg-white text-emerald-800 hover:bg-emerald-50 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 flex-1 sm:flex-initial" title="Masukkan / kurangi murid">
                <i data-lucide="user-plus" class="w-4 h-4 text-emerald-600"></i> Kelola Siswa
              </button>
              <button onclick="showEditHalaqohModal('${activeHalaqoh.id}')" class="p-2 sm:p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-2xl transition flex items-center justify-center" title="Edit Halaqoh">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="confirmDeleteHalaqoh('${activeHalaqoh.id}')" class="p-2 sm:p-2.5 bg-red-500/80 hover:bg-red-600 text-white rounded-2xl transition flex items-center justify-center" title="Hapus Halaqoh">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- Filter & Pencarian Siswa Halaqoh (No-print) -->
    <div class="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-100 no-print">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <!-- Filter Periode Laporan -->
        <div class="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Periode:</span>
          <div class="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button onclick="setHalaqohPeriod('all')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${halaqohPeriodFilter==='all' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}">Semua</button>
            <button onclick="setHalaqohPeriod('today')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${halaqohPeriodFilter==='today' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}">Harian</button>
            <button onclick="setHalaqohPeriod('week')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${halaqohPeriodFilter==='week' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}">Pekanan</button>
            <button onclick="setHalaqohPeriod('month')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${halaqohPeriodFilter==='month' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}">Bulanan</button>
          </div>
          ${halaqohPeriodFilter === 'today' ? `
            <input type="date" value="${halaqohDateInput}" onchange="setHalaqohDate(this.value)" class="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none">
          ` : ''}
        </div>

        <!-- Tombol Perkecil Tabel & Pencarian Siswa -->
        <div class="flex items-center gap-2 w-full md:w-auto">
          <!-- Tombol Toggle Perkecil Tabel -->
          <button type="button" onclick="toggleHalaqohCompactTable()" class="shrink-0 px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${isHalaqohCompactTable ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'}" title="${isHalaqohCompactTable ? 'Tampilkan seluruh kolom tabel' : 'Kecilkan tabel: hanya tampilkan No, Nama, dan Laporan (khusus HP/Mobile)'}">
            <i data-lucide="${isHalaqohCompactTable ? 'maximize-2' : 'minimize-2'}" class="w-3.5 h-3.5"></i>
            <span>${isHalaqohCompactTable ? 'Tabel Lengkap' : 'Perkecil Tabel'}</span>
          </button>

          <!-- Pencarian Siswa -->
          <div class="flex-1 md:w-72">
            <div class="relative">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              <input type="text" id="search-halaqoh-student" placeholder="Cari nama siswa di halaqoh..." value="${halaqohSearchQuery}" oninput="handleHalaqohSearch(this.value)" class="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition">
              <button id="clear-halaqoh-search-btn" type="button" onclick="clearHalaqohSearch()" class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition ${halaqohSearchQuery ? '' : 'hidden'}" title="Hapus pencarian">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- KOP CETAK LAPORAN (Hanya Tampil Saat Print) -->
    <div class="print-header hidden mb-6">
      <div class="text-center border-b-2 border-slate-800 pb-4">
        <div class="flex justify-center items-center gap-2 mb-1">
          <h1 class="text-2xl font-black uppercase text-slate-900 tracking-wide">Laporan Halaqoh Al-Qur'an</h1>
        </div>
        <p class="text-sm font-semibold text-slate-600">Sistem Manajemen Pembelajaran &amp; Tahsin/Tahfidz Al-Qur'an</p>
        <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-700 text-left bg-slate-50 p-3 rounded-lg border border-slate-200 font-medium">
          <div>Nama Halaqoh: <strong class="text-slate-900">${activeHalaqoh.name}</strong></div>
          <div>Guru Pengampu: <strong class="text-slate-900">${activeHalaqoh.teacher_name || '-'}</strong></div>
          <div>Periode Laporan: <strong class="text-slate-900">${getHalaqohPeriodLabel(halaqohPeriodFilter, halaqohDateInput)}</strong></div>
          <div>Tanggal Cetak: <strong class="text-slate-900">${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></div>
        </div>
      </div>
    </div>

    <!-- Tabel Siswa & Capaian Halaqoh -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto w-full">
        <table class="w-full text-sm text-left ${isHalaqohCompactTable ? 'min-w-0' : 'min-w-[1000px]'} border-collapse">
          <thead class="bg-slate-50 border-b border-slate-200">
            ${isHalaqohCompactTable ? `
              <tr>
                <th class="px-2.5 py-3 text-center font-bold text-slate-600 text-xs w-10">No</th>
                <th class="px-3 py-3 text-left font-bold text-slate-600 text-xs">Nama Siswa</th>
                <th class="px-3 py-3 text-center font-bold text-slate-600 text-xs w-28 no-print">Laporan</th>
              </tr>
            ` : `
              <tr>
                <th class="px-4 py-3.5 text-center font-bold text-slate-600 text-xs w-12">No</th>
                <th class="px-5 py-3.5 text-center font-bold text-slate-600 text-xs">Nama Siswa</th>
                <th class="px-4 py-3.5 text-center font-bold text-slate-600 text-xs">Kelas Asal</th>
                <th class="px-5 py-3.5 text-center font-bold text-slate-600 text-xs">Bacaan Terakhir</th>
                <th class="px-5 py-3.5 text-center font-bold text-slate-600 text-xs">Hafalan Terakhir</th>
                <th class="px-5 py-3.5 text-center font-bold text-slate-600 text-xs">Perkembangan (${getHalaqohPeriodShortLabel(halaqohPeriodFilter)})</th>
                <th class="px-4 py-3.5 text-center font-bold text-slate-600 text-xs">Ketuntasan</th>
                <th class="px-4 py-3.5 text-center font-bold text-slate-600 text-xs no-print">Aksi Laporan</th>
              </tr>
            `}
          </thead>
          <tbody id="halaqoh-student-table-body" class="divide-y divide-slate-100">
            ${renderHalaqohStudentRows(halaqohStudents, halaqohReports)}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Bagian Tanda Tangan Resmi (Hanya Tampil Saat Print) -->
    <div class="print-signature hidden mt-12 pt-4">
      <div class="flex justify-between items-start text-xs font-semibold text-slate-800 px-8">
        <div class="text-center w-56">
          <p>Mengetahui,</p>
          <p class="font-bold mt-0.5">Koordinator Al-Qur'an</p>
          <div class="h-20"></div>
          <p class="border-b border-slate-800 pb-1 font-bold">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
          <p class="text-[10px] text-slate-500 mt-0.5">NIP / ID: ...................................</p>
        </div>
        <div class="text-center w-56">
          <p>${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p class="font-bold mt-0.5">Guru Pengampu Halaqoh</p>
          <div class="h-20"></div>
          <p class="border-b border-slate-800 pb-1 font-bold">${activeHalaqoh.teacher_name || 'Guru Halaqoh'}</p>
          <p class="text-[10px] text-slate-500 mt-0.5">Pengampu Halaqoh</p>
        </div>
      </div>
    </div>
  `;
}

// ============ STUDENT ROWS GENERATION ============
function renderHalaqohStudentRows(studentsList, reportsList) {
  if (!studentsList || studentsList.length === 0) {
    return `
      <tr id="halaqoh-table-empty">
        <td colspan="${isHalaqohCompactTable ? 3 : 8}" class="py-12 text-center text-slate-400">
          <div class="flex flex-col items-center justify-center">
            <i data-lucide="user-x" class="w-8 h-8 text-slate-300 mb-2"></i>
            <p class="font-medium text-sm">Belum ada siswa di halaqoh ini</p>
            <p class="text-xs text-slate-400 mt-1">Gunakan tombol <strong>Kelola Siswa</strong> untuk menambahkan siswa ke halaqoh ini.</p>
          </div>
        </td>
      </tr>
    `;
  }

  // Urutkan siswa berdasarkan nama
  const sorted = [...studentsList].sort((a, b) => a.name.localeCompare(b.name));
  const query = (halaqohSearchQuery || '').toLowerCase().trim();
  let visibleCount = 0;

  const rowsHtml = sorted.map((st, idx) => {
    const nameLower = (st.name || '').toLowerCase();
    const nisLower = (st.nis || '').toLowerCase();
    const kelasLower = (st.kelas || st.grade || '').toLowerCase();
    const isVisible = !query || nameLower.includes(query) || nisLower.includes(query) || kelasLower.includes(query);
    if (isVisible) visibleCount++;

    const rowNumber = isVisible ? visibleCount : idx + 1;
    const displayStyle = isVisible ? '' : 'style="display: none;"';

    // Mode Perkecil Tabel (Khusus Mobile / Input Cepat: No, Nama, Laporan Vertikal)
    if (isHalaqohCompactTable) {
      return `
        <tr class="halaqoh-student-row hover:bg-slate-50/70 transition"
            data-name="${nameLower}"
            data-nis="${nisLower}"
            data-kelas="${kelasLower}"
            ${displayStyle}>
          <td class="halaqoh-row-number px-2.5 py-3 text-center text-xs font-semibold text-slate-400 w-10">${rowNumber}</td>
          <td class="px-3 py-3 font-bold text-slate-800">
            <div class="flex items-center gap-1.5">
              <span>${st.name}</span>
            </div>
            <div class="text-[11px] text-slate-400 font-normal flex items-center gap-1.5 mt-0.5">
              <span class="font-medium text-slate-600">${st.kelas || st.grade || '-'}</span>
              <span>&bull;</span>
              <span>NIS: ${st.nis || '-'}</span>
            </div>
          </td>
          <td class="px-2.5 py-2.5 text-center whitespace-nowrap no-print">
            <div class="flex flex-col items-stretch gap-1 w-full max-w-[95px] mx-auto">
              <button onclick="showHalaqohBacaanModal('${st.__backendId}')" class="w-full inline-flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 border border-emerald-200/80 font-bold px-2 py-1.5 rounded-lg text-[11px] transition shadow-xs" title="Input Laporan Bacaan (${st.name})">
                <i data-lucide="book-open" class="w-3 h-3"></i>
                <span>Bacaan</span>
              </button>
              <button onclick="showHalaqohHafalanModal('${st.__backendId}')" class="w-full inline-flex items-center justify-center gap-1 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 text-purple-700 border border-purple-200/80 font-bold px-2 py-1.5 rounded-lg text-[11px] transition shadow-xs" title="Input Laporan Hafalan (${st.name})">
                <i data-lucide="bookmark" class="w-3.5 h-3.5"></i>
                <span>Hafalan</span>
              </button>
              <button onclick="showHalaqohHistoryModal('${st.__backendId}')" class="w-full inline-flex items-center justify-center gap-1 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-sky-700 border border-sky-200/80 font-bold px-2 py-1.5 rounded-lg text-[11px] transition shadow-xs" title="Preview Riwayat Laporan (${st.name})">
                <i data-lucide="history" class="w-3.5 h-3.5"></i>
                <span>Riwayat</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }

    const metrics = computeStudentHalaqohProgress(st, reportsList, halaqohPeriodFilter, halaqohDateInput);
    
    // Ketuntasan (2 hasil: Bacaan dan Hafalan tanpa background & ikon)
    const bacaanStatusText = metrics.bacaanTuntas ? 'Tuntas Bacaan' : 'Belum Tuntas Bacaan';
    const hafalanStatusText = metrics.hafalanTuntas ? 'Tuntas Hafalan' : 'Belum Tuntas Hafalan';

    const bacaanColorClass = metrics.bacaanTuntas ? 'font-bold text-emerald-700' : 'font-medium text-slate-500';
    const hafalanColorClass = metrics.hafalanTuntas ? 'font-bold text-emerald-700' : 'font-medium text-slate-500';

    const ketuntasanHtml = `
      <div class="space-y-1 leading-snug">
        <div class="${bacaanColorClass}">${bacaanStatusText}</div>
        <div class="${hafalanColorClass}">${hafalanStatusText}</div>
      </div>
    `;

    return `
      <tr class="halaqoh-student-row hover:bg-slate-50/70 transition"
          data-name="${nameLower}"
          data-nis="${nisLower}"
          data-kelas="${kelasLower}"
          ${displayStyle}>
        <td class="halaqoh-row-number px-4 py-3.5 text-center text-xs font-semibold text-slate-400">${rowNumber}</td>
        <td class="px-5 py-3.5 font-bold text-slate-800">
          <div class="flex items-center gap-2">
            <span>${st.name}</span>
          </div>
          <span class="text-[11px] text-slate-400 font-normal">NIS: ${st.nis || '-'}</span>
        </td>
        <td class="px-4 py-3.5 text-xs">
          <div class="font-semibold text-slate-800 leading-snug">${st.kelas || '-'}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">${st.grade || ''}</div>
        </td>
        <td class="px-5 py-3.5 text-xs">
          <div class="font-bold text-slate-800">${metrics.bacaanText}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">${metrics.bacaanDate ? `${metrics.bacaanDate} &bull; ${metrics.bacaanStatus}` : 'Target: Jld ' + metrics.targetIqroJilid + ' Hal ' + metrics.targetIqroHal}</div>
        </td>
        <td class="px-5 py-3.5 text-xs">
          <div class="font-bold text-slate-800">${metrics.hafalanText}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">${metrics.hafalanDate ? `${metrics.hafalanDate} &bull; ${metrics.hafalanStatus}` : 'Target: ' + metrics.targetHafalanSurat}</div>
        </td>
        <td class="px-5 py-3.5 text-xs">
          <div class="font-bold text-indigo-600">${metrics.perkembanganSummary}</div>
          <div class="text-[10px] text-slate-500 mt-0.5">${metrics.perkembanganDetail}</div>
        </td>
        <td class="px-4 py-3.5 text-xs">
          ${ketuntasanHtml}
        </td>
        <td class="px-4 py-3.5 text-center whitespace-nowrap no-print">
          <div class="inline-flex items-center gap-1.5">
            <button onclick="showHalaqohBacaanModal('${st.__backendId}')" class="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 border border-emerald-200/80 font-bold px-2.5 py-1.5 rounded-xl text-xs transition shadow-sm" title="Input Laporan Bacaan (${st.name})">
              <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
              <span>Bacaan</span>
            </button>
            <button onclick="showHalaqohHafalanModal('${st.__backendId}')" class="inline-flex items-center gap-1 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 text-purple-700 border border-purple-200/80 font-bold px-2.5 py-1.5 rounded-xl text-xs transition shadow-sm" title="Input Laporan Hafalan (${st.name})">
              <i data-lucide="bookmark" class="w-3.5 h-3.5"></i>
              <span>Hafalan</span>
            </button>
            <button onclick="showHalaqohHistoryModal('${st.__backendId}')" class="inline-flex items-center gap-1 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-sky-700 border border-sky-200/80 font-bold px-2.5 py-1.5 rounded-xl text-xs transition shadow-sm" title="Preview Riwayat Laporan (${st.name})">
              <i data-lucide="history" class="w-3.5 h-3.5"></i>
              <span>Riwayat</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const noResultsClass = (query && visibleCount === 0) ? '' : 'hidden';
  const noResultsRow = `
    <tr id="halaqoh-table-no-results" class="${noResultsClass}">
      <td colspan="${isHalaqohCompactTable ? 3 : 8}" class="py-12 text-center text-slate-400">
        <div class="flex flex-col items-center justify-center">
          <i data-lucide="search-x" class="w-8 h-8 text-slate-300 mb-2"></i>
          <p class="font-medium text-sm">Tidak ada siswa yang cocok dengan pencarian</p>
          <p class="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
        </div>
      </td>
    </tr>
  `;

  return rowsHtml + noResultsRow;
}

// ============ METRICS COMPUTATION ============
function computeStudentHalaqohProgress(student, allReports, periodFilter, customDate) {
  const grade = student.grade;
  const stReports = allReports.filter(r => r.student_id === student.__backendId);

  // 1. Ambil Laporan Bacaan Terakhir (Keseluruhan)
  const bacaanReports = stReports
    .filter(r => r.report_type === 'iqro' || r.report_type === 'quran')
    .sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0) || new Date(b.created_at || 0) - new Date(a.created_at || 0));
  
  const latestBacaan = bacaanReports[0];

  // 2. Ambil Laporan Hafalan Terakhir (Keseluruhan)
  const hafalanReports = stReports
    .filter(r => r.report_type === 'hafalan')
    .sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0) || new Date(b.created_at || 0) - new Date(a.created_at || 0));
  
  const latestHafalan = hafalanReports[0];

  // Target Kurikulum
  const tIqro = allData.find(x => x.type === 'setting' && x.subject === `iqro_target_${grade}`)?.data || { target_iqro_jilid: 1, target_iqro_halaman: 120 };
  const tHafalan = allData.find(x => x.type === 'setting' && x.subject === `hafalan_target_${grade}`)?.data || { target_hafalan_juz: 30, target_surat_awal: '', target_ayat_akhir: 1 };

  // Status Ketuntasan
  let bacaanTuntas = false;
  if (latestBacaan) {
    const targetScore = getBacaanScore('iqro', tIqro.target_iqro_jilid, tIqro.target_iqro_halaman);
    bacaanTuntas = getBacaanScore(latestBacaan.report_type, latestBacaan.iqro_jilid, latestBacaan.iqro_halaman) >= targetScore;
  }
  let hafalanTuntas = false;
  if (latestHafalan) {
    const targetScore = getHafalanScore(tHafalan.target_hafalan_juz, tHafalan.target_surat_awal, tHafalan.target_ayat_akhir);
    hafalanTuntas = getHafalanScore(latestHafalan.juz, latestHafalan.surat, latestHafalan.ayat_sampai) >= targetScore;
  }

  // Format Teks Bacaan & Hafalan Terakhir
  let bacaanText = 'Belum ada setoran';
  let bacaanDate = '';
  let bacaanStatus = '';
  if (latestBacaan) {
    bacaanText = latestBacaan.report_type === 'iqro' 
      ? `Iqro' Jld ${latestBacaan.iqro_jilid} Hal ${latestBacaan.iqro_halaman}`
      : `${latestBacaan.surat} Ayat ${latestBacaan.ayat_dari}-${latestBacaan.ayat_sampai}`;
    bacaanDate = latestBacaan.tanggal || '';
    bacaanStatus = latestBacaan.status || 'Lancar';
  }

  let hafalanText = 'Belum ada setoran';
  let hafalanDate = '';
  let hafalanStatus = '';
  if (latestHafalan) {
    hafalanText = `${latestHafalan.surat} Ayat ${latestHafalan.ayat_dari}-${latestHafalan.ayat_sampai}`;
    hafalanDate = latestHafalan.tanggal || '';
    hafalanStatus = latestHafalan.status || 'Lancar';
  }

  // 3. Hitung Perkembangan Halaman & Ayat Sesuai Periode
  let periodReports = [...stReports];
  const refDate = customDate ? new Date(customDate) : new Date();

  if (periodFilter === 'today') {
    const targetDayStr = customDate || today();
    periodReports = periodReports.filter(r => (r.tanggal || '').startsWith(targetDayStr));
  } else if (periodFilter === 'week') {
    const sevenDaysAgo = new Date(refDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startStr = sevenDaysAgo.toISOString().split('T')[0];
    const endStr = refDate.toISOString().split('T')[0];
    periodReports = periodReports.filter(r => r.tanggal >= startStr && r.tanggal <= endStr);
  } else if (periodFilter === 'month') {
    const thirtyDaysAgo = new Date(refDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startStr = thirtyDaysAgo.toISOString().split('T')[0];
    const endStr = refDate.toISOString().split('T')[0];
    periodReports = periodReports.filter(r => r.tanggal >= startStr && r.tanggal <= endStr);
  }

  // Urutkan laporan dalam periode dari yang terlama ke terbaru
  periodReports.sort((a, b) => new Date(a.tanggal || 0) - new Date(b.tanggal || 0) || new Date(a.created_at || 0) - new Date(a.created_at || 0));

  let totalHal = 0;
  let totalAyat = 0;

  const iqroInPeriod = periodReports.filter(r => r.report_type === 'iqro');
  if (iqroInPeriod.length > 0) {
    if (iqroInPeriod.length === 1) {
      totalHal = 1;
    } else {
      const firstIqro = iqroInPeriod[0];
      const lastIqro = iqroInPeriod[iqroInPeriod.length - 1];
      const fIdx = (parseInt(firstIqro.iqro_jilid - 1) || 0) * 30 + (parseInt(firstIqro.iqro_halaman) || 1);
      const lIdx = (parseInt(lastIqro.iqro_jilid - 1) || 0) * 30 + (parseInt(lastIqro.iqro_halaman) || 1);
      totalHal = Math.max(0, lIdx - fIdx);
    }
  }

  periodReports.forEach(r => {
    if (r.report_type !== 'iqro') {
      const d = parseInt(r.ayat_dari) || 0;
      const s = parseInt(r.ayat_sampai) || 0;
      if (s >= d) totalAyat += (s - d + 1);
    }
  });

  let perkembanganSummary = '-';
  if (totalHal > 0 && totalAyat > 0) {
    perkembanganSummary = `+${totalHal} Hal, +${totalAyat} Ayat`;
  } else if (totalHal > 0) {
    perkembanganSummary = `+${totalHal} Halaman`;
  } else if (totalAyat > 0) {
    perkembanganSummary = `+${totalAyat} Ayat`;
  }

  let perkembanganDetail = '';
  if (periodReports.length > 0) {
    const firstRep = periodReports[0];
    const lastRep = periodReports[periodReports.length - 1];
    const fStr = firstRep.report_type === 'iqro' ? `Jld ${firstRep.iqro_jilid} Hal ${firstRep.iqro_halaman}` : `${firstRep.surat} ${firstRep.ayat_dari}-${firstRep.ayat_sampai}`;
    const lStr = lastRep.report_type === 'iqro' ? `Jld ${lastRep.iqro_jilid} Hal ${lastRep.iqro_halaman}` : `${lastRep.surat} ${lastRep.ayat_dari}-${lastRep.ayat_sampai}`;
    perkembanganDetail = periodReports.length > 1 ? `${fStr} &rarr; ${lStr}` : `${fStr} (${periodReports.length} setoran)`;
  } else {
    perkembanganDetail = 'Tidak ada setoran periode ini';
  }

  return {
    bacaanText,
    bacaanDate,
    bacaanStatus,
    hafalanText,
    hafalanDate,
    hafalanStatus,
    bacaanTuntas,
    hafalanTuntas,
    perkembanganSummary,
    perkembanganDetail,
    targetIqroJilid: tIqro.target_iqro_jilid,
    targetIqroHal: tIqro.target_iqro_halaman,
    targetHafalanSurat: tHafalan.target_surat_awal || `Juz ${tHafalan.target_hafalan_juz}`
  };
}

// ============ HELPER PERIOD LABELS ============
function getHalaqohPeriodLabel(period, date) {
  if (period === 'today') {
    return `Harian (${date || today()})`;
  } else if (period === 'week') {
    return 'Pekanan (7 Hari Terakhir)';
  } else if (period === 'month') {
    return 'Bulanan (30 Hari Terakhir)';
  }
  return 'Keseluruhan (Semua Periode)';
}

function getHalaqohPeriodShortLabel(period) {
  if (period === 'today') return 'Harian';
  if (period === 'week') return 'Pekan Ini';
  if (period === 'month') return 'Bulan Ini';
  return 'Semua Periode';
}

// ============ ACTIONS & STATE SETTERS ============
function handleHalaqohListSearch(val) {
  halaqohListFilterQuery = val;
  const clearBtn = document.getElementById('clear-hlq-list-search-btn');
  if (clearBtn) {
    if (val && val.trim().length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }

  const query = (val || '').toLowerCase().trim();
  const pills = document.querySelectorAll('#halaqoh-pills-container button.hlq-pill-item');
  let visibleCount = 0;

  pills.forEach(pill => {
    const name = pill.getAttribute('data-hlq-name') || '';
    const teacher = pill.getAttribute('data-hlq-teacher') || '';

    if (!query || name.includes(query) || teacher.includes(query)) {
      pill.style.display = '';
      visibleCount++;
    } else {
      pill.style.display = 'none';
    }
  });

  const noResultsEl = document.getElementById('hlq-list-no-results');
  if (noResultsEl) {
    if (visibleCount === 0 && pills.length > 0) {
      noResultsEl.classList.remove('hidden');
    } else {
      noResultsEl.classList.add('hidden');
    }
  }

  // Sinkronkan dropdown pilihan
  const selectDropdown = document.getElementById('select-active-halaqoh');
  if (selectDropdown) {
    Array.from(selectDropdown.options).forEach(opt => {
      const txt = opt.textContent.toLowerCase();
      if (!query || txt.includes(query)) {
        opt.hidden = false;
      } else {
        opt.hidden = true;
      }
    });
  }
}

function clearHalaqohListSearch() {
  const input = document.getElementById('search-halaqoh-list');
  if (input) {
    input.value = '';
    input.focus();
  }
  handleHalaqohListSearch('');
}

function selectHalaqoh(id) {
  if (selectedHalaqohId === id) return;
  selectedHalaqohId = id;
  halaqohSearchQuery = '';
  renderHalaqohContent({ animateSwitch: true });
}

function setHalaqohPeriod(p) {
  halaqohPeriodFilter = p;
  renderHalaqohContent({ animateSwitch: true });
}

function setHalaqohDate(d) {
  halaqohDateInput = d;
  renderHalaqohContent({ animateSwitch: false });
}

function handleHalaqohSearch(val) {
  halaqohSearchQuery = val;
  const clearBtn = document.getElementById('clear-halaqoh-search-btn');
  if (clearBtn) {
    if (val && val.trim().length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }

  const query = (val || '').toLowerCase().trim();
  const rows = document.querySelectorAll('#halaqoh-student-table-body tr.halaqoh-student-row');
  let visibleCount = 0;

  rows.forEach(row => {
    const name = row.getAttribute('data-name') || '';
    const nis = row.getAttribute('data-nis') || '';
    const kelas = row.getAttribute('data-kelas') || '';

    if (!query || name.includes(query) || nis.includes(query) || kelas.includes(query)) {
      row.style.display = '';
      visibleCount++;
      const numCell = row.querySelector('.halaqoh-row-number');
      if (numCell) numCell.textContent = visibleCount;
    } else {
      row.style.display = 'none';
    }
  });

  const noResultsRow = document.getElementById('halaqoh-table-no-results');
  if (noResultsRow) {
    if (visibleCount === 0 && rows.length > 0) {
      noResultsRow.classList.remove('hidden');
    } else {
      noResultsRow.classList.add('hidden');
    }
  }
}

function clearHalaqohSearch() {
  const input = document.getElementById('search-halaqoh-student');
  if (input) {
    input.value = '';
    input.focus();
  }
  handleHalaqohSearch('');
}

function printHalaqohReport() {
  const wasCompact = isHalaqohCompactTable;
  if (wasCompact) {
    isHalaqohCompactTable = false;
    renderHalaqohContent({ animateSwitch: false });
  }
  window.print();
  if (wasCompact) {
    setTimeout(() => {
      isHalaqohCompactTable = true;
      renderHalaqohContent({ animateSwitch: false });
    }, 500);
  }
}

// ============ MODALS: CREATE & EDIT HALAQOH ============
function showCreateHalaqohModal() {
  showHalaqohFormModal(null);
}

function showEditHalaqohModal(id) {
  showHalaqohFormModal(id);
}

function showHalaqohFormModal(editId) {
  const container = document.getElementById('halaqoh-modal-container');
  if (!container) return;

  const halaqohList = getHalaqohList();
  const editData = editId ? halaqohList.find(h => h.id === editId) : null;
  const allTeachers = getAllTeacherProfiles();

  container.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl fade-in my-8">
      <div class="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <i data-lucide="${editData ? 'edit' : 'plus-circle'}" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="font-bold text-lg text-slate-800">${editData ? 'Edit Halaqoh' : 'Buat Halaqoh Baru'}</h3>
            <p class="text-xs text-slate-500">Atur kelompok belajar Al-Qur'an dan guru pengampu</p>
          </div>
        </div>
        <button onclick="closeHalaqohModal()" class="text-slate-400 hover:text-slate-600 p-1">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nama Halaqoh <span class="text-red-500">*</span></label>
          <input id="form-hlq-name" type="text" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Misal: Halaqoh Grade 5 - Al-Furqan" value="${editData ? editData.name : ''}">
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tingkat / Kategori</label>
            <select id="form-hlq-grade" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="Campuran" ${editData && editData.grade === 'Campuran' ? 'selected' : ''}>Kelas Campuran</option>
              <option value="Grade 1" ${editData && editData.grade === 'Grade 1' ? 'selected' : ''}>Grade 1</option>
              <option value="Grade 2" ${editData && editData.grade === 'Grade 2' ? 'selected' : ''}>Grade 2</option>
              <option value="Grade 3" ${editData && editData.grade === 'Grade 3' ? 'selected' : ''}>Grade 3</option>
              <option value="Grade 4" ${editData && editData.grade === 'Grade 4' ? 'selected' : ''}>Grade 4</option>
              <option value="Grade 5" ${editData && editData.grade === 'Grade 5' ? 'selected' : ''}>Grade 5</option>
              <option value="Grade 6" ${editData && editData.grade === 'Grade 6' ? 'selected' : ''}>Grade 6</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Guru Pengampu <span class="text-red-500">*</span></label>
            <select id="form-hlq-teacher" onchange="checkSelectedTeacherQuota(this.value, '${editId || ''}')" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="">-- Pilih Guru / Pengampu --</option>
              ${allTeachers.map(t => {
                const count = getTeacherHalaqohCount(t.__backendId || t.name, editId);
                const isSelected = editData && (editData.teacher_id === t.__backendId || editData.teacher_name === t.name);
                const roleTag = (t.role === 'admin' || t.name === 'Admin') ? ' [Admin]' : '';
                return `
                  <option value="${t.__backendId || t.name}" data-name="${t.name}" data-count="${count}" ${isSelected ? 'selected' : ''}>
                    ${t.name}${roleTag} (${count}/3 Halaqoh)
                  </option>
                `;
              }).join('')}
            </select>
          </div>
        </div>

        <!-- Peringatan Kuota 3 Halaqoh -->
        <div id="teacher-quota-warning" class="hidden p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-start gap-2">
          <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></i>
          <div>
            <strong>Perhatian:</strong> Guru ini sudah memegang 3 halaqoh (batas maksimal rekomendasi per guru).
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Catatan / Keterangan (Opsional)</label>
          <textarea id="form-hlq-notes" class="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-20" placeholder="Keterangan jadwal halaqoh, target khusus, dll...">${editData ? (editData.notes || '') : ''}</textarea>
        </div>
      </div>

      <div class="flex gap-3 mt-8">
        <button onclick="closeHalaqohModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-2xl text-sm transition">
          Batal
        </button>
        <button onclick="saveHalaqohForm('${editId || ''}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-2xl text-sm shadow-md shadow-emerald-200 transition">
          ${editData ? 'Perbarui Halaqoh' : 'Simpan Halaqoh'}
        </button>
      </div>
    </div>
  </div>
  `;

  if (window.lucide) lucide.createIcons();

  // Cek kuota awal jika edit
  const selTeacher = document.getElementById('form-hlq-teacher');
  if (selTeacher && selTeacher.value) {
    checkSelectedTeacherQuota(selTeacher.value, editId || '');
  }
}

function checkSelectedTeacherQuota(teacherId, excludeId) {
  const warning = document.getElementById('teacher-quota-warning');
  if (!warning) return;
  const count = getTeacherHalaqohCount(teacherId, excludeId);
  if (count >= 3) {
    warning.classList.remove('hidden');
  } else {
    warning.classList.add('hidden');
  }
}

async function saveHalaqohForm(editId) {
  const name = document.getElementById('form-hlq-name').value.trim();
  const grade = document.getElementById('form-hlq-grade').value;
  const teacherSelect = document.getElementById('form-hlq-teacher');
  const teacherVal = teacherSelect.value;
  const selectedOption = teacherSelect.options[teacherSelect.selectedIndex];
  const teacherName = selectedOption ? (selectedOption.getAttribute('data-name') || selectedOption.text.split('(')[0].trim()) : '';
  const notes = document.getElementById('form-hlq-notes').value.trim();

  if (!name) {
    showToast('Nama halaqoh wajib diisi', 'error');
    return;
  }
  if (!teacherVal) {
    showToast('Harap pilih guru pengampu', 'error');
    return;
  }

  const halaqohList = getHalaqohList();

  if (editId) {
    const idx = halaqohList.findIndex(h => h.id === editId);
    if (idx !== -1) {
      halaqohList[idx].name = name;
      halaqohList[idx].grade = grade;
      halaqohList[idx].teacher_id = teacherVal;
      halaqohList[idx].teacher_name = teacherName;
      halaqohList[idx].notes = notes;
    }
  } else {
    const newId = 'hlq_' + Date.now();
    halaqohList.push({
      id: newId,
      name,
      grade,
      teacher_id: teacherVal,
      teacher_name: teacherName,
      student_ids: [],
      notes,
      created_at: new Date().toISOString()
    });
    selectedHalaqohId = newId;
  }

  const res = await saveHalaqohList(halaqohList);
  if (res && res.isOk !== false) {
    showToast(editId ? 'Halaqoh berhasil diperbarui' : 'Halaqoh baru berhasil dibuat', 'success');
    closeHalaqohModal();
    renderHalaqohContent({ animateSwitch: true });
  } else {
    showToast('Gagal menyimpan halaqoh', 'error');
  }
}

// ============ HAPUS HALAQOH ============
function confirmDeleteHalaqoh(id) {
  pendingDeleteHalaqohId = id;
  const container = document.getElementById('halaqoh-modal-container');
  if (!container) return;

  const halaqohList = getHalaqohList();
  const halaqoh = halaqohList.find(h => h.id === id);

  container.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center fade-in">
      <div class="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <i data-lucide="alert-triangle" class="w-8 h-8"></i>
      </div>
      <h3 class="font-bold text-xl text-slate-800 mb-2">Hapus Halaqoh?</h3>
      <p class="text-sm text-slate-500 mb-6">
        Anda yakin ingin menghapus halaqoh <strong>${halaqoh ? halaqoh.name : ''}</strong>? Siswa di dalamnya tidak akan terhapus dari sistem, hanya dikeluarkan dari kelompok halaqoh ini.
      </p>
      <div class="flex gap-3">
        <button onclick="closeHalaqohModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-sm font-semibold transition">Batal</button>
        <button onclick="doDeleteHalaqoh()" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl text-sm font-semibold shadow-md shadow-red-200 transition">Ya, Hapus</button>
      </div>
    </div>
  </div>
  `;
  if (window.lucide) lucide.createIcons();
}

async function doDeleteHalaqoh() {
  if (!pendingDeleteHalaqohId) return;
  let halaqohList = getHalaqohList();
  halaqohList = halaqohList.filter(h => h.id !== pendingDeleteHalaqohId);

  const res = await saveHalaqohList(halaqohList);
  if (res && res.isOk !== false) {
    showToast('Halaqoh berhasil dihapus', 'success');
    selectedHalaqohId = halaqohList.length > 0 ? halaqohList[0].id : null;
    closeHalaqohModal();
    renderHalaqohContent({ animateSwitch: true });
  } else {
    showToast('Gagal menghapus halaqoh', 'error');
  }
  pendingDeleteHalaqohId = null;
}

// ============ MODAL: KELOLA SISWA HALAQOH (CAMPURAN) ============
function showManageHalaqohStudents(halaqohId) {
  const container = document.getElementById('halaqoh-modal-container');
  if (!container) return;

  const halaqohList = getHalaqohList();
  const halaqoh = halaqohList.find(h => h.id === halaqohId);
  if (!halaqoh) return;

  // Inisialisasi set siswa terpilih
  tempSelectedStudentIds = new Set(halaqoh.student_ids || []);
  halaqohStudentGradeFilter = halaqoh.grade && halaqoh.grade !== 'Campuran' ? halaqoh.grade : '';
  halaqohStudentClassFilter = '';
  halaqohStudentSearchFilter = '';

  renderManageHalaqohStudentsModal(halaqoh);
}

function renderManageHalaqohStudentsModal(halaqoh) {
  const container = document.getElementById('halaqoh-modal-container');
  if (!container) return;

  const allStudents = getStudents();
  const gradeMap = getGradeKelasMap();
  const gradeList = Object.keys(gradeMap);
  const classList = halaqohStudentGradeFilter ? (gradeMap[halaqohStudentGradeFilter] || []) : getAllClassesFlat();

  const candidateStudents = getFilteredHalaqohCandidates();

  container.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col fade-in overflow-hidden">
      <!-- Modal Header -->
      <div class="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
        <div>
          <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
            <i data-lucide="users" class="w-5 h-5 text-emerald-600"></i>
            Kelola Siswa Halaqoh
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Kelompok: <strong>${halaqoh.name}</strong> &bull; Guru: <strong>${halaqoh.teacher_name || '-'}</strong>
          </p>
        </div>
        <button onclick="closeHalaqohModal()" class="text-slate-400 hover:text-slate-600 p-1">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Filter Siswa (Kelas Campuran) -->
      <div class="p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tingkat</label>
            <select id="candidate-grade-select" onchange="updateHalaqohStudentFilter('grade', this.value, '${halaqoh.id}')" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="">Semua Tingkat</option>
              ${gradeList.map(g => `<option value="${g}" ${halaqohStudentGradeFilter===g?'selected':''}>${g}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kelas Asal</label>
            <select id="candidate-class-select" onchange="updateHalaqohStudentFilter('kelas', this.value, '${halaqoh.id}')" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="">Semua Kelas</option>
              ${classList.map(c => `<option value="${c}" ${halaqohStudentClassFilter===c?'selected':''}>${c}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cari Nama</label>
            <input id="candidate-search-input" type="text" placeholder="Ketik nama siswa..." value="${halaqohStudentSearchFilter}" oninput="updateHalaqohStudentFilter('search', this.value, '${halaqoh.id}')" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none">
          </div>
        </div>

        <div class="flex justify-between items-center pt-1 text-xs">
          <div class="flex items-center gap-2 font-semibold">
            <span class="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
              <span id="selected-student-count">${tempSelectedStudentIds.size}</span> Siswa Terpilih
            </span>
            <span class="text-slate-400">&bull;</span>
            <span id="candidate-student-count" class="text-slate-500">${candidateStudents.length} siswa ditampilkan</span>
          </div>
          <div class="flex gap-2">
            <button type="button" onclick="toggleSelectAllCandidates(true)" class="text-emerald-700 hover:text-emerald-800 font-bold hover:underline">
              Pilih Semua
            </button>
            <span class="text-slate-300">|</span>
            <button type="button" onclick="toggleSelectAllCandidates(false)" class="text-slate-500 hover:text-slate-700 font-medium hover:underline">
              Batal Semua
            </button>
          </div>
        </div>
      </div>

      <!-- Daftar Siswa dengan Checkbox -->
      <div id="halaqoh-candidates-list" class="flex-1 overflow-y-auto p-4 space-y-2">
        ${renderCandidateStudentItems(candidateStudents)}
      </div>

      <!-- Modal Footer -->
      <div class="p-4 border-t border-slate-100 bg-white flex gap-3 shrink-0">
        <button onclick="closeHalaqohModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-2xl text-sm transition">
          Batal
        </button>
        <button onclick="saveHalaqohStudents('${halaqoh.id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-2xl text-sm shadow-md shadow-emerald-200 transition flex items-center justify-center gap-2">
          <i data-lucide="check" class="w-4 h-4"></i> Simpan Daftar Siswa
        </button>
      </div>
    </div>
  </div>
  `;

  if (window.lucide) lucide.createIcons();
}

function getFilteredHalaqohCandidates() {
  const allStudents = getStudents();
  let candidateStudents = allStudents.filter(s => {
    if (halaqohStudentGradeFilter && s.grade !== halaqohStudentGradeFilter) return false;
    if (halaqohStudentClassFilter && s.kelas !== halaqohStudentClassFilter) return false;
    if (halaqohStudentSearchFilter) {
      const q = halaqohStudentSearchFilter.toLowerCase().trim();
      const matchName = s.name.toLowerCase().includes(q);
      const matchNis = s.nis && s.nis.toLowerCase().includes(q);
      const matchKelas = s.kelas && s.kelas.toLowerCase().includes(q);
      if (!matchName && !matchNis && !matchKelas) return false;
    }
    return true;
  });

  candidateStudents.sort((a, b) => a.name.localeCompare(b.name));
  return candidateStudents;
}

function renderCandidateStudentItems(candidateStudents) {
  if (candidateStudents.length === 0) {
    return `
      <div class="text-center py-10 text-slate-400">
        <i data-lucide="users" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
        <p class="text-sm">Tidak ada siswa yang sesuai filter</p>
      </div>
    `;
  }

  return candidateStudents.map(st => {
    const isChecked = tempSelectedStudentIds.has(st.__backendId);
    return `
      <label id="cand-item-${st.__backendId}" class="flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${isChecked ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}">
        <div class="flex items-center gap-3">
          <input type="checkbox" onchange="toggleStudentInHalaqoh('${st.__backendId}')" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer">
          <div>
            <div class="font-bold text-sm">${st.name}</div>
            <div class="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>NIS: ${st.nis || '-'}</span>
              <span>&bull;</span>
              <span class="font-medium text-slate-600">${st.kelas || '-'}</span>
            </div>
          </div>
        </div>
        <span class="grade-badge text-xs font-semibold px-2.5 py-1 rounded-lg ${isChecked ? 'bg-emerald-200/60 text-emerald-800' : 'bg-slate-100 text-slate-500'}">
          ${st.grade || '-'}
        </span>
      </label>
    `;
  }).join('');
}

function refreshHalaqohCandidatesList() {
  const listEl = document.getElementById('halaqoh-candidates-list');
  const countEl = document.getElementById('candidate-student-count');
  if (!listEl) return;

  const candidateStudents = getFilteredHalaqohCandidates();
  listEl.innerHTML = renderCandidateStudentItems(candidateStudents);
  if (countEl) countEl.textContent = `${candidateStudents.length} siswa ditampilkan`;
  if (window.lucide) lucide.createIcons();
}

function updateHalaqohStudentFilter(type, val, halaqohId) {
  if (type === 'search') {
    halaqohStudentSearchFilter = val;
    refreshHalaqohCandidatesList();
    return;
  }
  
  if (type === 'grade') {
    halaqohStudentGradeFilter = val;
    halaqohStudentClassFilter = '';
    const gradeMap = getGradeKelasMap();
    const classList = halaqohStudentGradeFilter ? (gradeMap[halaqohStudentGradeFilter] || []) : getAllClassesFlat();
    const classSelect = document.getElementById('candidate-class-select');
    if (classSelect) {
      classSelect.innerHTML = `<option value="">Semua Kelas</option>` + classList.map(c => `<option value="${c}">${c}</option>`).join('');
    }
    refreshHalaqohCandidatesList();
    return;
  }
  
  if (type === 'kelas') {
    halaqohStudentClassFilter = val;
    refreshHalaqohCandidatesList();
    return;
  }
}

function toggleStudentInHalaqoh(studentId) {
  const labelEl = document.getElementById(`cand-item-${studentId}`);
  if (tempSelectedStudentIds.has(studentId)) {
    tempSelectedStudentIds.delete(studentId);
    if (labelEl) {
      labelEl.className = "flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer bg-white border-slate-200 hover:bg-slate-50 text-slate-700";
      const badge = labelEl.querySelector('.grade-badge');
      if (badge) badge.className = "grade-badge text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500";
    }
  } else {
    tempSelectedStudentIds.add(studentId);
    if (labelEl) {
      labelEl.className = "flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer bg-emerald-50/70 border-emerald-300 text-emerald-950";
      const badge = labelEl.querySelector('.grade-badge');
      if (badge) badge.className = "grade-badge text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-200/60 text-emerald-800";
    }
  }
  const countEl = document.getElementById('selected-student-count');
  if (countEl) countEl.textContent = tempSelectedStudentIds.size;
}

function toggleSelectAllCandidates(selectAll) {
  const candidateStudents = getFilteredHalaqohCandidates();
  candidateStudents.forEach(s => {
    if (selectAll) tempSelectedStudentIds.add(s.__backendId);
    else tempSelectedStudentIds.delete(s.__backendId);
  });

  const countEl = document.getElementById('selected-student-count');
  if (countEl) countEl.textContent = tempSelectedStudentIds.size;
  refreshHalaqohCandidatesList();
}

async function saveHalaqohStudents(halaqohId) {
  const halaqohList = getHalaqohList();
  const halaqoh = halaqohList.find(h => h.id === halaqohId);
  if (!halaqoh) return;

  halaqoh.student_ids = Array.from(tempSelectedStudentIds);

  const res = await saveHalaqohList(halaqohList);
  if (res && res.isOk !== false) {
    showToast(`Berhasil memperbarui ${halaqoh.student_ids.length} siswa di ${halaqoh.name}`, 'success');
    closeHalaqohModal();
    renderHalaqohContent({ animateSwitch: false });
  } else {
    showToast('Gagal menyimpan daftar siswa halaqoh', 'error');
  }
}

function closeHalaqohModal() {
  const container = document.getElementById('halaqoh-modal-container');
  if (container) container.innerHTML = '';
}

// ============ MODAL: INPUT LAPORAN BACAAN (HALAQOH) ============
let currentHalaqohBacaanMode = 'iqro'; // 'iqro' | 'quran'

function showHalaqohBacaanModal(studentId) {
  const container = document.getElementById('halaqoh-modal-container');
  if (!container) return;

  const student = getStudents().find(s => s.__backendId === studentId);
  if (!student) return;

  const allReports = getReports();
  const stReports = allReports.filter(r => r.student_id === studentId);
  const bacaanReports = stReports
    .filter(r => r.report_type === 'iqro' || r.report_type === 'quran')
    .sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0) || new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const latestBacaan = bacaanReports[0];

  // Tentukan mode awal (iqro / quran)
  currentHalaqohBacaanMode = (latestBacaan && latestBacaan.report_type === 'quran') ? 'quran' : 'iqro';

  // Nilai awal Iqro
  let initIqroJilid = 1;
  let initIqroHal = 1;
  if (latestBacaan && latestBacaan.report_type === 'iqro') {
    initIqroJilid = latestBacaan.iqro_jilid || 1;
    initIqroHal = (latestBacaan.iqro_halaman || 0) + 1;
  } else if (student.iqro_jilid) {
    initIqroJilid = student.iqro_jilid || 1;
    initIqroHal = student.iqro_halaman || 1;
  }

  // Nilai awal Al-Qur'an
  let initQuranJuz = 1;
  let initQuranSurat = 'Al-Fatihah';
  let initQuranDari = 1;
  let initQuranSampai = 1;

  if (latestBacaan && latestBacaan.report_type === 'quran') {
    initQuranJuz = latestBacaan.juz || 1;
    initQuranSurat = latestBacaan.surat || 'Al-Fatihah';
    const mx = getAyatCount(initQuranJuz, initQuranSurat);
    const nextAyat = Math.min((latestBacaan.ayat_sampai || 0) + 1, mx || 1);
    initQuranDari = nextAyat;
    initQuranSampai = nextAyat;
  } else {
    const listSurat = getSuratByJuz(1);
    if (listSurat && listSurat.length > 0) initQuranSurat = listSurat[0].name;
  }

  const safeStudentName = student.name.replace(/'/g, "\\'");

  container.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl fade-in my-8">
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
            <i data-lucide="book-open" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="font-bold text-lg text-slate-800">Input Laporan Bacaan</h3>
            <p class="text-xs text-slate-500">${student.name} &bull; NIS: ${student.nis || '-'} &bull; ${student.kelas || student.grade || '-'}</p>
          </div>
        </div>
        <button onclick="closeHalaqohModal()" class="text-slate-400 hover:text-slate-600 p-1">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Tab Switch Iqro / Al-Qur'an -->
      <div class="flex bg-slate-100 p-1 rounded-2xl gap-1 mb-5">
        <button type="button" id="hlq-bacaan-tab-iqro" onclick="switchHalaqohBacaanTab('iqro')" class="flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${currentHalaqohBacaanMode === 'iqro' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}">
          <i data-lucide="book" class="w-3.5 h-3.5"></i> Bacaan Iqro'
        </button>
        <button type="button" id="hlq-bacaan-tab-quran" onclick="switchHalaqohBacaanTab('quran')" class="flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${currentHalaqohBacaanMode === 'quran' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}">
          <i data-lucide="scroll" class="w-3.5 h-3.5"></i> Bacaan Al-Qur'an
        </button>
      </div>

      <!-- Form Section: Iqro' -->
      <div id="hlq-bacaan-iqro-section" class="space-y-4 ${currentHalaqohBacaanMode === 'iqro' ? '' : 'hidden'}">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Jilid Iqro'</label>
            <input id="hlq-ri-jilid" type="number" min="1" max="6" value="${initIqroJilid}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Halaman</label>
            <input id="hlq-ri-hal" type="number" min="1" value="${initIqroHal}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tanggal</label>
            <input id="hlq-ri-date" type="date" value="${today()}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Status</label>
            <select id="hlq-ri-status" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="Lancar">Lancar</option>
              <option value="Tidak Lancar">Tidak Lancar</option>
              <option value="Mengulang">Mengulang</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Catatan Guru (Opsional)</label>
          <textarea id="hlq-ri-catatan" class="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-20" placeholder="Masukkan catatan perkembangan bacaan siswa..."></textarea>
        </div>
      </div>

      <!-- Form Section: Al-Qur'an -->
      <div id="hlq-bacaan-quran-section" class="space-y-4 ${currentHalaqohBacaanMode === 'quran' ? '' : 'hidden'}">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Juz</label>
            <select id="hlq-rq-juz" onchange="updateHalaqohQuranSuratDropdown()" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              ${Array.from({length:30}, (_,i) => `<option value="${i+1}" ${(i+1)===initQuranJuz ? 'selected' : ''}>Juz ${i+1}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Surat</label>
            <select id="hlq-rq-surat" onchange="updateHalaqohQuranAyatMax()" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Dari Ayat</label>
            <input id="hlq-rq-ayat-dari" type="number" min="1" value="${initQuranDari}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Sampai Ayat</label>
            <input id="hlq-rq-ayat-sampai" type="number" min="1" value="${initQuranSampai}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          </div>
        </div>

        <button type="button" onclick="openQuranViewerFromHalaqoh('rq', '${safeStudentName}')" class="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition shadow-sm">
          <i data-lucide="book-open" class="w-4 h-4"></i> Lihat Teks Surat & Ayat (Mushaf)
        </button>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tanggal</label>
            <input id="hlq-rq-date" type="date" value="${today()}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Status</label>
            <select id="hlq-rq-status" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="Lancar">Lancar</option>
              <option value="Tidak Lancar">Tidak Lancar</option>
              <option value="Mengulang">Mengulang</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Catatan Guru (Opsional)</label>
          <textarea id="hlq-rq-catatan" class="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20" placeholder="Masukkan catatan perkembangan bacaan siswa..."></textarea>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 mt-6">
        <button onclick="closeHalaqohModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-2xl text-sm transition">
          Batal
        </button>
        <button onclick="saveHalaqohBacaan('${student.__backendId}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-2xl text-sm shadow-md shadow-emerald-200 transition">
          Simpan Laporan Bacaan
        </button>
      </div>
    </div>
  </div>
  `;

  updateHalaqohQuranSuratDropdown(initQuranSurat);
  if (window.lucide) lucide.createIcons();
}

function switchHalaqohBacaanTab(mode) {
  currentHalaqohBacaanMode = mode;
  const iqroSec = document.getElementById('hlq-bacaan-iqro-section');
  const quranSec = document.getElementById('hlq-bacaan-quran-section');
  const tabIqro = document.getElementById('hlq-bacaan-tab-iqro');
  const tabQuran = document.getElementById('hlq-bacaan-tab-quran');

  if (mode === 'iqro') {
    if (iqroSec) iqroSec.classList.remove('hidden');
    if (quranSec) quranSec.classList.add('hidden');
    if (tabIqro) {
      tabIqro.className = 'flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-white text-emerald-700 shadow-sm';
    }
    if (tabQuran) {
      tabQuran.className = 'flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-800';
    }
  } else {
    if (iqroSec) iqroSec.classList.add('hidden');
    if (quranSec) quranSec.classList.remove('hidden');
    if (tabIqro) {
      tabIqro.className = 'flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-800';
    }
    if (tabQuran) {
      tabQuran.className = 'flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-white text-blue-700 shadow-sm';
    }
  }
}

function updateHalaqohQuranSuratDropdown(selectedSurat = null) {
  const juzEl = document.getElementById('hlq-rq-juz');
  const suratEl = document.getElementById('hlq-rq-surat');
  if (!juzEl || !suratEl) return;
  const juz = parseInt(juzEl.value) || 1;
  const surats = getSuratByJuz(juz);
  suratEl.innerHTML = surats.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
  if (selectedSurat && surats.some(s => s.name === selectedSurat)) {
    suratEl.value = selectedSurat;
  }
  updateHalaqohQuranAyatMax();
}

function updateHalaqohQuranAyatMax() {
  const juzEl = document.getElementById('hlq-rq-juz');
  const suratEl = document.getElementById('hlq-rq-surat');
  const dariEl = document.getElementById('hlq-rq-ayat-dari');
  const sampaiEl = document.getElementById('hlq-rq-ayat-sampai');
  if (!juzEl || !suratEl) return;
  const juz = parseInt(juzEl.value) || 1;
  const surat = suratEl.value;
  const mx = getAyatCount(juz, surat);
  if (dariEl) dariEl.max = mx;
  if (sampaiEl) sampaiEl.max = mx;
}

async function saveHalaqohBacaan(studentId) {
  if (currentUser.role === 'visitor') {
    showToast('Pengunjung tidak memiliki izin menyimpan laporan', 'warning');
    return;
  }

  if (currentHalaqohBacaanMode === 'iqro') {
    const jilid = parseInt(document.getElementById('hlq-ri-jilid').value) || 1;
    const hal = parseInt(document.getElementById('hlq-ri-hal').value) || 1;
    const tgl = document.getElementById('hlq-ri-date').value || today();
    const status = document.getElementById('hlq-ri-status').value || 'Lancar';
    const catatan = document.getElementById('hlq-ri-catatan').value.trim();

    await window.dataSdk.create({
      type: 'report',
      report_type: 'iqro',
      student_id: studentId,
      iqro_jilid: jilid,
      iqro_halaman: hal,
      status: status,
      tanggal: tgl,
      catatan: catatan,
      name: '', email: '', password: '', role: '', kelas: 0, target_juz: 0, juz: 0, surat: '', ayat_dari: 0, ayat_sampai: 0, subject: 'iqro', nip: '', phone: '', address: '', specialization: '', target_iqro_jilid: 0, target_iqro_halaman: 0, target_hafalan_juz: 0, target_surat_awal: '', target_surat_akhir: '', target_ayat_awal: 0, target_ayat_akhir: 0, standar_ketuntasan: 0, setting_kelas: 0
    });
  } else {
    const juz = parseInt(document.getElementById('hlq-rq-juz').value) || 1;
    const surat = document.getElementById('hlq-rq-surat').value;
    const ayatDari = parseInt(document.getElementById('hlq-rq-ayat-dari').value) || 1;
    const ayatSampai = parseInt(document.getElementById('hlq-rq-ayat-sampai').value) || 1;
    const tgl = document.getElementById('hlq-rq-date').value || today();
    const status = document.getElementById('hlq-rq-status').value || 'Lancar';
    const catatan = document.getElementById('hlq-rq-catatan').value.trim();

    await window.dataSdk.create({
      type: 'report',
      report_type: 'quran',
      student_id: studentId,
      juz: juz,
      surat: surat,
      ayat_dari: ayatDari,
      ayat_sampai: ayatSampai,
      status: status,
      tanggal: tgl,
      catatan: catatan,
      name: '', email: '', password: '', role: '', kelas: 0, target_juz: 0, iqro_jilid: 0, iqro_halaman: 0, subject: '', nip: '', phone: '', address: '', specialization: '', target_iqro_jilid: 0, target_iqro_halaman: 0, target_hafalan_juz: 0, target_surat_awal: '', target_surat_akhir: '', target_ayat_awal: 0, target_ayat_akhir: 0, standar_ketuntasan: 0, setting_kelas: 0
    });
  }

  showToast('Laporan bacaan berhasil disimpan', 'success');
  closeHalaqohModal();
  renderHalaqohContent({ animateSwitch: false });
}

// ============ MODAL: INPUT LAPORAN HAFALAN (HALAQOH) ============
function showHalaqohHafalanModal(studentId) {
  const container = document.getElementById('halaqoh-modal-container');
  if (!container) return;

  const student = getStudents().find(s => s.__backendId === studentId);
  if (!student) return;

  const allReports = getReports();
  const stReports = allReports.filter(r => r.student_id === studentId);
  const hafalanReports = stReports
    .filter(r => r.report_type === 'hafalan')
    .sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0) || new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const latestHafalan = hafalanReports[0];

  let initJuz = 30;
  let initSurat = "An-Naba'";
  let initDari = 1;
  let initSampai = 1;

  if (latestHafalan) {
    initJuz = latestHafalan.juz || 30;
    initSurat = latestHafalan.surat;
    const mx = getAyatCount(initJuz, initSurat);
    const nextAyat = Math.min((latestHafalan.ayat_sampai || 0) + 1, mx || 1);
    initDari = nextAyat;
    initSampai = nextAyat;
  } else {
    if (student.target_juz && !student.target_hafalan_surat) {
      initJuz = student.target_juz;
      const surats = getSuratByJuz(initJuz);
      if (surats && surats.length > 0) initSurat = surats[0].name;
    } else if (student.target_hafalan_surat) {
      let foundJuz = 30;
      for (let j = 1; j <= 30; j++) {
        if (quranData[j] && quranData[j].find(x => x.name === student.target_hafalan_surat)) {
          foundJuz = j;
          break;
        }
      }
      initJuz = foundJuz;
      initSurat = student.target_hafalan_surat;
      initDari = student.target_hafalan_ayat_dari || 1;
      initSampai = student.target_hafalan_ayat_sampai || 1;
    } else {
      initJuz = 30;
      const surats = getSuratByJuz(30);
      if (surats && surats.length > 0) initSurat = surats[0].name;
    }
  }

  const safeStudentName = student.name.replace(/'/g, "\\'");

  container.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl fade-in my-8">
      <div class="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-sm">
            <i data-lucide="bookmark" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="font-bold text-lg text-slate-800">Input Laporan Hafalan</h3>
            <p class="text-xs text-slate-500">${student.name} &bull; NIS: ${student.nis || '-'} &bull; ${student.kelas || student.grade || '-'}</p>
          </div>
        </div>
        <button onclick="closeHalaqohModal()" class="text-slate-400 hover:text-slate-600 p-1">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Juz</label>
            <select id="hlq-rh-juz" onchange="updateHalaqohSuratDropdownH()" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none">
              ${Array.from({length:30}, (_,i) => `<option value="${i+1}" ${(i+1)===initJuz ? 'selected' : ''}>Juz ${i+1}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Surat</label>
            <select id="hlq-rh-surat" onchange="updateHalaqohAyatMaxH()" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none">
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Dari Ayat</label>
            <input id="hlq-rh-ayat-dari" type="number" min="1" value="${initDari}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Sampai Ayat</label>
            <input id="hlq-rh-ayat-sampai" type="number" min="1" value="${initSampai}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none">
          </div>
        </div>

        <button type="button" onclick="openQuranViewerFromHalaqoh('rh', '${safeStudentName}')" class="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition shadow-sm">
          <i data-lucide="book-open" class="w-4 h-4"></i> Lihat Teks Surat & Ayat (Mushaf)
        </button>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tanggal</label>
            <input id="hlq-rh-date" type="date" value="${today()}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Status</label>
            <select id="hlq-rh-status" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none">
              <option value="Lancar">Lancar</option>
              <option value="Tidak Lancar">Tidak Lancar</option>
              <option value="Mengulang">Mengulang</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Catatan Guru (Opsional)</label>
          <textarea id="hlq-rh-catatan" class="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none h-20" placeholder="Masukkan catatan perkembangan hafalan siswa..."></textarea>
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button onclick="closeHalaqohModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-2xl text-sm transition">
          Batal
        </button>
        <button onclick="saveHalaqohHafalan('${student.__backendId}')" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-2xl text-sm shadow-md shadow-purple-200 transition">
          Simpan Laporan Hafalan
        </button>
      </div>
    </div>
  </div>
  `;

  updateHalaqohSuratDropdownH(initSurat);
  if (window.lucide) lucide.createIcons();
}

function updateHalaqohSuratDropdownH(selectedSurat = null) {
  const juzEl = document.getElementById('hlq-rh-juz');
  const suratEl = document.getElementById('hlq-rh-surat');
  if (!juzEl || !suratEl) return;
  const juz = parseInt(juzEl.value) || 30;
  const surats = getSuratByJuz(juz);
  suratEl.innerHTML = surats.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
  if (selectedSurat && surats.some(s => s.name === selectedSurat)) {
    suratEl.value = selectedSurat;
  }
  updateHalaqohAyatMaxH();
}

function updateHalaqohAyatMaxH() {
  const juzEl = document.getElementById('hlq-rh-juz');
  const suratEl = document.getElementById('hlq-rh-surat');
  const dariEl = document.getElementById('hlq-rh-ayat-dari');
  const sampaiEl = document.getElementById('hlq-rh-ayat-sampai');
  if (!juzEl || !suratEl) return;
  const juz = parseInt(juzEl.value) || 30;
  const surat = suratEl.value;
  const mx = getAyatCount(juz, surat);
  if (dariEl) dariEl.max = mx;
  if (sampaiEl) sampaiEl.max = mx;
}

function openQuranViewerFromHalaqoh(prefix, studentName) {
  const suratEl = document.getElementById(`hlq-${prefix}-surat`);
  const dariEl = document.getElementById(`hlq-${prefix}-ayat-dari`);
  const sampaiEl = document.getElementById(`hlq-${prefix}-ayat-sampai`);

  const suratName = suratEl ? suratEl.value : 'Al-Fatihah';
  const fromAyah = dariEl ? (parseInt(dariEl.value) || 1) : 1;
  const toAyah = sampaiEl ? (parseInt(sampaiEl.value) || fromAyah) : fromAyah;

  openQuranViewer({
    surah: suratName,
    fromAyah: Math.min(fromAyah, toAyah),
    toAyah: Math.max(fromAyah, toAyah),
    studentName: studentName,
    reportType: prefix === 'rh' ? 'hafalan' : 'quran'
  });
}

async function saveHalaqohHafalan(studentId) {
  if (currentUser.role === 'visitor') {
    showToast('Pengunjung tidak memiliki izin menyimpan laporan', 'warning');
    return;
  }

  const juz = parseInt(document.getElementById('hlq-rh-juz').value) || 30;
  const surat = document.getElementById('hlq-rh-surat').value;
  const ayatDari = parseInt(document.getElementById('hlq-rh-ayat-dari').value) || 1;
  const ayatSampai = parseInt(document.getElementById('hlq-rh-ayat-sampai').value) || 1;
  const tgl = document.getElementById('hlq-rh-date').value || today();
  const status = document.getElementById('hlq-rh-status').value || 'Lancar';
  const catatan = document.getElementById('hlq-rh-catatan').value.trim();

  await window.dataSdk.create({
    type: 'report',
    report_type: 'hafalan',
    student_id: studentId,
    juz: juz,
    surat: surat,
    ayat_dari: ayatDari,
    ayat_sampai: ayatSampai,
    status: status,
    tanggal: tgl,
    catatan: catatan,
    name: '', email: '', password: '', role: '', kelas: 0, target_juz: 0, iqro_jilid: 0, iqro_halaman: 0, subject: '', nip: '', phone: '', address: '', specialization: '', target_iqro_jilid: 0, target_iqro_halaman: 0, target_hafalan_juz: 0, target_surat_awal: '', target_surat_akhir: '', target_ayat_awal: 0, target_ayat_akhir: 0, standar_ketuntasan: 0, setting_kelas: 0
  });

  showToast('Laporan hafalan berhasil disimpan', 'success');
  closeHalaqohModal();
  renderHalaqohContent({ animateSwitch: false });
}

// ============ MODAL: PREVIEW RIWAYAT LAPORAN (HALAQOH) ============
function showHalaqohHistoryModal(studentId, filterCategory = 'all') {
  const container = document.getElementById('halaqoh-modal-container');
  if (!container) return;

  const student = getStudents().find(s => s.__backendId === studentId);
  if (!student) return;

  const allReports = getReports();
  const studentReports = allReports.filter(r => r.student_id === studentId);

  // Filter daftar setoran
  const bacaanList = studentReports
    .filter(r => r.report_type === 'iqro' || r.report_type === 'quran')
    .sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0) || new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const hafalanList = studentReports
    .filter(r => r.report_type === 'hafalan')
    .sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0) || new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const latestBacaan = bacaanList[0];
  const latestHafalan = hafalanList[0];

  let filteredReports = [...studentReports];
  if (filterCategory === 'bacaan') {
    filteredReports = filteredReports.filter(r => r.report_type === 'iqro' || r.report_type === 'quran');
  } else if (filterCategory === 'hafalan') {
    filteredReports = filteredReports.filter(r => r.report_type === 'hafalan');
  }

  // Urutkan dari terbaru ke terlama
  filteredReports.sort((a, b) => {
    const dDiff = new Date(b.tanggal || 0) - new Date(a.tanggal || 0);
    if (dDiff !== 0) return dDiff;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  const bacaanPosText = latestBacaan 
    ? (latestBacaan.report_type === 'iqro' ? `Iqro' Jld ${latestBacaan.iqro_jilid} Hal ${latestBacaan.iqro_halaman}` : `Juz ${latestBacaan.juz} ${latestBacaan.surat} (${latestBacaan.ayat_dari}-${latestBacaan.ayat_sampai})`)
    : 'Belum ada setoran';

  const hafalanPosText = latestHafalan
    ? `Juz ${latestHafalan.juz} ${latestHafalan.surat} (${latestHafalan.ayat_dari}-${latestHafalan.ayat_sampai})`
    : 'Belum ada setoran';

  const safeStudentName = student.name.replace(/'/g, "\\'");

  container.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col fade-in overflow-hidden">
      <!-- Modal Header -->
      <div class="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg shadow-sm">
            ${student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-lg text-slate-800">${student.name}</h3>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                NIS: ${student.nis || '-'}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Kelas: <strong class="text-slate-700">${student.kelas || '-'}</strong> &bull; Tingkat: <strong class="text-slate-700">${student.grade || '-'}</strong> &bull; Preview Riwayat Setoran
            </p>
          </div>
        </div>
        <button onclick="closeHalaqohModal()" class="text-slate-400 hover:text-slate-600 p-1">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Ringkasan Singkat -->
      <div class="p-4 bg-slate-50/80 border-b border-slate-200 shrink-0">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="bg-white p-3 rounded-xl border border-slate-200/70 shadow-sm">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Bacaan Terakhir</span>
            <div class="font-bold text-xs text-slate-800 truncate" title="${bacaanPosText}">${bacaanPosText}</div>
          </div>
          <div class="bg-white p-3 rounded-xl border border-slate-200/70 shadow-sm">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hafalan Terakhir</span>
            <div class="font-bold text-xs text-slate-800 truncate" title="${hafalanPosText}">${hafalanPosText}</div>
          </div>
          <div class="bg-white p-3 rounded-xl border border-slate-200/70 shadow-sm flex items-center justify-between">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Setoran</span>
              <span class="text-xs text-slate-500 font-medium">${bacaanList.length} bacaan &bull; ${hafalanList.length} hafalan</span>
            </div>
            <span class="text-lg font-black text-emerald-600">${studentReports.length}</span>
          </div>
        </div>

        <!-- Filter Tab Preview -->
        <div class="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-200/60 flex-wrap">
          <div class="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
            <button onclick="showHalaqohHistoryModal('${studentId}', 'all')" class="px-3 py-1 rounded-lg text-xs font-bold transition ${filterCategory === 'all' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}">
              Semua (${studentReports.length})
            </button>
            <button onclick="showHalaqohHistoryModal('${studentId}', 'bacaan')" class="px-3 py-1 rounded-lg text-xs font-bold transition ${filterCategory === 'bacaan' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}">
              📖 Bacaan (${bacaanList.length})
            </button>
            <button onclick="showHalaqohHistoryModal('${studentId}', 'hafalan')" class="px-3 py-1 rounded-lg text-xs font-bold transition ${filterCategory === 'hafalan' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}">
              📚 Hafalan (${hafalanList.length})
            </button>
          </div>
          <span class="text-xs text-slate-400 italic">Menampilkan ${filteredReports.length} catatan</span>
        </div>
      </div>

      <!-- Tabel Daftar Riwayat (Preview Read-only) -->
      <div class="flex-1 overflow-y-auto p-4">
        ${filteredReports.length === 0 ? `
          <div class="text-center py-12 text-slate-400">
            <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
            <p class="text-sm font-semibold">Belum ada riwayat setoran</p>
            <p class="text-xs text-slate-400 mt-1">Siswa ini belum memiliki data laporan pada kategori yang dipilih.</p>
          </div>
        ` : `
          <div class="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th class="px-3 py-2.5 text-center w-10">No</th>
                  <th class="px-3 py-2.5 w-24">Tanggal</th>
                  <th class="px-3 py-2.5 w-24">Tipe</th>
                  <th class="px-3 py-2.5">Capaian / Ayat</th>
                  <th class="px-3 py-2.5 w-24 text-center">Status</th>
                  <th class="px-3 py-2.5">Catatan Guru</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${filteredReports.map((r, idx) => {
                  const isIqro = r.report_type === 'iqro';
                  const isQuran = r.report_type === 'quran';

                  let badge = '';
                  let detail = '';
                  if (isIqro) {
                    badge = `<span class="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold">Iqro'</span>`;
                    detail = `<span class="font-bold text-slate-800">Jld ${r.iqro_jilid || 1}</span> Hal ${r.iqro_halaman || 1}`;
                  } else if (isQuran) {
                    badge = `<span class="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-semibold">Al-Qur'an</span>`;
                    detail = `<span class="cursor-pointer hover:text-blue-700 hover:underline inline-flex items-center gap-1 font-medium text-slate-800" onclick="openQuranViewer({ surah: '${(r.surat||'').replace(/'/g, "\\'")}', fromAyah: ${r.ayat_dari||1}, toAyah: ${r.ayat_sampai||1}, studentName: '${safeStudentName}', reportType: 'quran' })" title="Buka teks ayat">Juz ${r.juz || 1} &bull; ${r.surat} (${r.ayat_dari}-${r.ayat_sampai}) <i data-lucide="book-open" class="w-3 h-3 text-blue-500"></i></span>`;
                  } else {
                    badge = `<span class="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-semibold">Hafalan</span>`;
                    detail = `<span class="cursor-pointer hover:text-purple-700 hover:underline inline-flex items-center gap-1 font-medium text-slate-800" onclick="openQuranViewer({ surah: '${(r.surat||'').replace(/'/g, "\\'")}', fromAyah: ${r.ayat_dari||1}, toAyah: ${r.ayat_sampai||1}, studentName: '${safeStudentName}', reportType: 'hafalan' })" title="Buka teks ayat">Juz ${r.juz || 30} &bull; ${r.surat} (${r.ayat_dari}-${r.ayat_sampai}) <i data-lucide="book-open" class="w-3 h-3 text-purple-500"></i></span>`;
                  }

                  const statusColor = r.status === 'Lancar' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : (r.status === 'Mengulang' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200');

                  return `
                    <tr class="hover:bg-slate-50 transition">
                      <td class="px-3 py-2.5 text-center text-slate-400 font-semibold">${idx + 1}</td>
                      <td class="px-3 py-2.5 text-slate-600 font-medium">${r.tanggal || '-'}</td>
                      <td class="px-3 py-2.5">${badge}</td>
                      <td class="px-3 py-2.5">${detail}</td>
                      <td class="px-3 py-2.5 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}">${r.status || 'Lancar'}</span></td>
                      <td class="px-3 py-2.5 text-slate-600 max-w-[180px] truncate" title="${r.catatan || ''}">${r.catatan || '<span class="text-slate-300 italic">-</span>'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Modal Footer (Hanya Preview & Tombol ke Halaman Riwayat Lengkap) -->
      <div class="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div class="text-xs text-slate-500 flex items-center gap-1.5">
          <i data-lucide="info" class="w-4 h-4 text-slate-400 shrink-0"></i>
          <span>Mode preview. Untuk edit data, hapus setoran, atau cetak riwayat lengkap, buka halaman riwayat.</span>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button onclick="closeHalaqohModal()" class="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition flex-1 sm:flex-none">
            Tutup
          </button>
          <button onclick="goToFullHistoryPage('${student.__backendId}')" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200 transition flex items-center justify-center gap-1.5 flex-1 sm:flex-none">
            <span>Buka Halaman Riwayat Lengkap</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
  `;

  if (window.lucide) lucide.createIcons();
}

function goToFullHistoryPage(studentId) {
  selectedHistoryStudentId = studentId;
  closeHalaqohModal();
  navigate('report-history');
}
