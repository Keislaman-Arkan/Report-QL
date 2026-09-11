// ============ HALAQOH PAGE & MANAGEMENT ============

let selectedHalaqohId = null;
let halaqohPeriodFilter = 'all'; // 'all' | 'today' | 'week' | 'month'
let halaqohDateInput = today();
let halaqohSearchQuery = '';
let halaqohViewScope = 'mine'; // 'mine' | 'all'

// State untuk Modal Kelola Siswa
let halaqohStudentGradeFilter = '';
let halaqohStudentClassFilter = '';
let halaqohStudentSearchFilter = '';
let tempSelectedStudentIds = new Set();
let pendingDeleteHalaqohId = null;

// ============ RENDER HALAQOH MAIN ============
function renderHalaqoh(el) {
  const isAdmin = currentUser.role === 'admin';
  const halaqohList = getHalaqohList();
  const allTeachers = getAllTeacherProfiles();

  // Filter halaqoh guru vs semua
  const mineList = halaqohList.filter(h => 
    h.teacher_id === currentUser.id || 
    (h.teacher_name && currentUser.name && h.teacher_name.toLowerCase() === currentUser.name.toLowerCase())
  );

  let myHalaqohList = isAdmin ? halaqohList : (halaqohViewScope === 'mine' && mineList.length > 0 ? mineList : halaqohList);

  // Auto-select halaqoh jika belum dipilih
  if (!selectedHalaqohId && myHalaqohList.length > 0) {
    selectedHalaqohId = myHalaqohList[0].id;
  } else if (selectedHalaqohId && !halaqohList.some(h => h.id === selectedHalaqohId)) {
    selectedHalaqohId = myHalaqohList.length > 0 ? myHalaqohList[0].id : null;
  }

  const activeHalaqoh = halaqohList.find(h => h.id === selectedHalaqohId);

  // Ambil siswa dalam halaqoh yang aktif
  const allStudents = getStudents();
  const halaqohStudents = activeHalaqoh 
    ? allStudents.filter(s => (activeHalaqoh.student_ids || []).includes(s.__backendId))
    : [];

  // Hitung metrik ringkas halaqoh
  const halaqohReports = getReports();
  let tuntasCount = 0;
  halaqohStudents.forEach(st => {
    const metrics = computeStudentHalaqohProgress(st, halaqohReports, halaqohPeriodFilter, halaqohDateInput);
    if (metrics.bacaanTuntas && metrics.hafalanTuntas) tuntasCount++;
  });
  const tuntasPct = halaqohStudents.length > 0 ? Math.round((tuntasCount / halaqohStudents.length) * 100) : 0;

  el.innerHTML = `
  <div class="fade-in max-w-7xl mx-auto space-y-6">
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
        ${activeHalaqoh ? `
          <button onclick="printHalaqohReport()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md transition flex items-center justify-center gap-2 flex-1 md:flex-none">
            <i data-lucide="printer" class="w-4 h-4"></i> Cetak Laporan Halaqoh
          </button>
        ` : ''}
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
          <span class="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
            ${myHalaqohList.length} Kelompok
          </span>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          ${!isAdmin ? `
            <div class="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
              <button onclick="halaqohViewScope='mine';renderPage()" class="px-3 py-1 rounded-lg transition ${halaqohViewScope==='mine' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-800'}">
                Halaqoh Saya (${mineList.length})
              </button>
              <button onclick="halaqohViewScope='all';renderPage()" class="px-3 py-1 rounded-lg transition ${halaqohViewScope==='all' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-800'}">
                Semua Halaqoh (${halaqohList.length})
              </button>
            </div>
            <span class="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium">
              Guru: <strong>${currentUser.name}</strong>
            </span>
          ` : `
            <span class="text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg font-medium">
              Mode Administrator (Akses Penuh Kelola Siswa)
            </span>
          `}
        </div>
      </div>

      ${myHalaqohList.length === 0 ? `
        <div class="text-center py-8 text-slate-400">
          <i data-lucide="folder-search" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
          <p class="text-sm font-medium">Belum ada halaqoh yang terdaftar.</p>
          ${isAdmin ? `<p class="text-xs text-slate-500 mt-1">Klik tombol <strong>+ Buat Halaqoh Baru</strong> di atas untuk membuat halaqoh pertama.</p>` : `<p class="text-xs text-slate-500 mt-1">Hubungi Administrator untuk mendaftarkan halaqoh Anda.</p>`}
        </div>
      ` : `
        <div class="flex gap-2 overflow-x-auto pb-1 hide-scroll">
          ${myHalaqohList.map(h => {
            const isSelected = h.id === selectedHalaqohId;
            const studentCount = (h.student_ids || []).length;
            return `
              <button onclick="selectHalaqoh('${h.id}')" class="shrink-0 text-left px-4 py-3 rounded-xl border transition flex items-center gap-3 ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}">
                  ${(h.name || 'H').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div class="font-bold text-sm leading-tight truncate max-w-[180px]">${h.name}</div>
                  <div class="text-[11px] ${isSelected ? 'text-emerald-100' : 'text-slate-500'} mt-0.5">
                    ${h.teacher_name || 'Guru'} &bull; ${studentCount} Siswa
                  </div>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      `}
    </div>

    <!-- Konten Halaqoh Aktif -->
    ${activeHalaqoh ? `
      <!-- Kartu Ringkasan Informasi Halaqoh -->
      <div class="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden no-print">
        <div class="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
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

          <div class="flex items-center gap-4 flex-wrap w-full md:w-auto">
            <div class="bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3 rounded-2xl text-center min-w-[100px]">
              <div class="text-2xl font-black">${halaqohStudents.length}</div>
              <div class="text-[11px] uppercase tracking-wider text-emerald-200 font-semibold mt-0.5">Total Siswa</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3 rounded-2xl text-center min-w-[100px]">
              <div class="text-2xl font-black text-amber-300">${tuntasPct}%</div>
              <div class="text-[11px] uppercase tracking-wider text-emerald-200 font-semibold mt-0.5">Ketuntasan</div>
            </div>
            ${isAdmin ? `
              <div class="flex items-center gap-2">
                <button onclick="showManageHalaqohStudents('${activeHalaqoh.id}')" class="bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-3 rounded-2xl text-xs font-bold shadow-md transition flex items-center gap-1.5" title="Masukkan / kurangi murid">
                  <i data-lucide="user-plus" class="w-4 h-4 text-emerald-600"></i> Kelola Siswa
                </button>
                <button onclick="showEditHalaqohModal('${activeHalaqoh.id}')" class="p-3 bg-white/20 hover:bg-white/30 text-white rounded-2xl transition" title="Edit Halaqoh">
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button onclick="confirmDeleteHalaqoh('${activeHalaqoh.id}')" class="p-3 bg-red-500/80 hover:bg-red-600 text-white rounded-2xl transition" title="Hapus Halaqoh">
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

          <!-- Pencarian Siswa -->
          <div class="w-full md:w-72">
            <div class="relative">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
              <input type="text" placeholder="Cari nama siswa di halaqoh..." value="${halaqohSearchQuery}" oninput="handleHalaqohSearch(this.value)" class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition">
              ${halaqohSearchQuery ? `
                <button onclick="handleHalaqohSearch(''); renderPage()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
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
          <table class="w-full text-sm text-left min-w-[850px] border-collapse">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3.5 text-center font-bold text-slate-600 text-xs w-12">No</th>
                <th class="px-5 py-3.5 font-bold text-slate-600 text-xs">Nama Siswa</th>
                <th class="px-4 py-3.5 font-bold text-slate-600 text-xs">Kelas Asal</th>
                <th class="px-5 py-3.5 font-bold text-slate-600 text-xs">Bacaan Terakhir</th>
                <th class="px-5 py-3.5 font-bold text-slate-600 text-xs">Hafalan Terakhir</th>
                <th class="px-5 py-3.5 font-bold text-slate-600 text-xs">Perkembangan (${getHalaqohPeriodShortLabel(halaqohPeriodFilter)})</th>
                <th class="px-4 py-3.5 text-center font-bold text-slate-600 text-xs">Ketuntasan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
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
    ` : ''}

    <!-- Modal Container -->
    <div id="halaqoh-modal-container"></div>
  </div>
  `;

  if (window.lucide) lucide.createIcons();
}

// ============ STUDENT ROWS GENERATION ============
function renderHalaqohStudentRows(studentsList, reportsList) {
  let filtered = [...studentsList];
  if (halaqohSearchQuery) {
    const q = halaqohSearchQuery.toLowerCase().trim();
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.nis && s.nis.toLowerCase().includes(q)) ||
      (s.kelas && s.kelas.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    return `
      <tr>
        <td colspan="7" class="py-12 text-center text-slate-400">
          <div class="flex flex-col items-center justify-center">
            <i data-lucide="user-x" class="w-8 h-8 text-slate-300 mb-2"></i>
            <p class="font-medium text-sm">Tidak ada siswa yang ditemukan</p>
            ${studentsList.length === 0 ? `<p class="text-xs text-slate-400 mt-1">Gunakan tombol <strong>Kelola Siswa</strong> untuk menambahkan siswa ke halaqoh ini.</p>` : ''}
          </div>
        </td>
      </tr>
    `;
  }

  // Urutkan siswa berdasarkan nama
  filtered.sort((a, b) => a.name.localeCompare(b.name));

  return filtered.map((st, idx) => {
    const metrics = computeStudentHalaqohProgress(st, reportsList, halaqohPeriodFilter, halaqohDateInput);
    
    // Ketuntasan Badge
    let ketuntasanHtml = '';
    if (metrics.bacaanTuntas && metrics.hafalanTuntas) {
      ketuntasanHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">✓ Tuntas</span>`;
    } else if (metrics.bacaanTuntas) {
      ketuntasanHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">✓ Tuntas Bacaan</span>`;
    } else if (metrics.hafalanTuntas) {
      ketuntasanHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">✓ Tuntas Hafalan</span>`;
    } else {
      ketuntasanHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">⏳ Belum Tuntas</span>`;
    }

    return `
      <tr class="hover:bg-slate-50/70 transition">
        <td class="px-4 py-3.5 text-center text-xs font-semibold text-slate-400">${idx + 1}</td>
        <td class="px-5 py-3.5 font-bold text-slate-800">
          <div class="flex items-center gap-2">
            <span>${st.name}</span>
          </div>
          <span class="text-[11px] text-slate-400 font-normal">NIS: ${st.nis || '-'}</span>
        </td>
        <td class="px-4 py-3.5 text-xs text-slate-600">
          <span class="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 border border-slate-200">${st.kelas || '-'}</span>
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
        <td class="px-4 py-3.5 text-center text-xs">
          ${ketuntasanHtml}
        </td>
      </tr>
    `;
  }).join('');
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
function selectHalaqoh(id) {
  selectedHalaqohId = id;
  renderPage();
}

function setHalaqohPeriod(p) {
  halaqohPeriodFilter = p;
  renderPage();
}

function setHalaqohDate(d) {
  halaqohDateInput = d;
  renderPage();
}

function handleHalaqohSearch(q) {
  halaqohSearchQuery = q;
  const main = document.getElementById('main-content');
  if (main) renderHalaqoh(main);
}

function printHalaqohReport() {
  window.print();
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
              <option value="">-- Pilih Guru --</option>
              ${allTeachers.map(t => {
                const count = getTeacherHalaqohCount(t.__backendId || t.name, editId);
                const isSelected = editData && (editData.teacher_id === t.__backendId || editData.teacher_name === t.name);
                return `
                  <option value="${t.__backendId || t.name}" data-name="${t.name}" data-count="${count}" ${isSelected ? 'selected' : ''}>
                    ${t.name} (${count}/3 Halaqoh)
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
    renderPage();
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
    renderPage();
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

  // Filter siswa untuk modal pemilihan
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
            <select onchange="updateHalaqohStudentFilter('grade', this.value, '${halaqoh.id}')" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="">Semua Tingkat</option>
              ${gradeList.map(g => `<option value="${g}" ${halaqohStudentGradeFilter===g?'selected':''}>${g}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kelas Asal</label>
            <select onchange="updateHalaqohStudentFilter('kelas', this.value, '${halaqoh.id}')" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="">Semua Kelas</option>
              ${classList.map(c => `<option value="${c}" ${halaqohStudentClassFilter===c?'selected':''}>${c}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cari Nama</label>
            <input type="text" placeholder="Ketik nama siswa..." value="${halaqohStudentSearchFilter}" oninput="updateHalaqohStudentFilter('search', this.value, '${halaqoh.id}')" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none">
          </div>
        </div>

        <div class="flex justify-between items-center pt-1 text-xs">
          <div class="flex items-center gap-2 font-semibold">
            <span class="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
              <span id="selected-student-count">${tempSelectedStudentIds.size}</span> Siswa Terpilih
            </span>
            <span class="text-slate-400">&bull;</span>
            <span class="text-slate-500">${candidateStudents.length} siswa ditampilkan</span>
          </div>
          <div class="flex gap-2">
            <button onclick="toggleSelectAllCandidates(true, '${halaqoh.id}')" class="text-emerald-700 hover:text-emerald-800 font-bold hover:underline">
              Pilih Semua
            </button>
            <span class="text-slate-300">|</span>
            <button onclick="toggleSelectAllCandidates(false, '${halaqoh.id}')" class="text-slate-500 hover:text-slate-700 font-medium hover:underline">
              Batal Semua
            </button>
          </div>
        </div>
      </div>

      <!-- Daftar Siswa dengan Checkbox -->
      <div class="flex-1 overflow-y-auto p-4 space-y-2">
        ${candidateStudents.length === 0 ? `
          <div class="text-center py-10 text-slate-400">
            <i data-lucide="users" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
            <p class="text-sm">Tidak ada siswa yang sesuai filter</p>
          </div>
        ` : candidateStudents.map(st => {
          const isChecked = tempSelectedStudentIds.has(st.__backendId);
          return `
            <label class="flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${isChecked ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}">
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
              <span class="text-xs font-semibold px-2.5 py-1 rounded-lg ${isChecked ? 'bg-emerald-200/60 text-emerald-800' : 'bg-slate-100 text-slate-500'}">
                ${st.grade || '-'}
              </span>
            </label>
          `;
        }).join('')}
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

function updateHalaqohStudentFilter(type, val, halaqohId) {
  if (type === 'grade') {
    halaqohStudentGradeFilter = val;
    halaqohStudentClassFilter = '';
  } else if (type === 'kelas') {
    halaqohStudentClassFilter = val;
  } else if (type === 'search') {
    halaqohStudentSearchFilter = val;
  }
  const halaqohList = getHalaqohList();
  const halaqoh = halaqohList.find(h => h.id === halaqohId);
  if (halaqoh) renderManageHalaqohStudentsModal(halaqoh);
}

function toggleStudentInHalaqoh(studentId) {
  if (tempSelectedStudentIds.has(studentId)) {
    tempSelectedStudentIds.delete(studentId);
  } else {
    tempSelectedStudentIds.add(studentId);
  }
  const countEl = document.getElementById('selected-student-count');
  if (countEl) countEl.textContent = tempSelectedStudentIds.size;
}

function toggleSelectAllCandidates(selectAll, halaqohId) {
  const allStudents = getStudents();
  let candidateStudents = allStudents.filter(s => {
    if (halaqohStudentGradeFilter && s.grade !== halaqohStudentGradeFilter) return false;
    if (halaqohStudentClassFilter && s.kelas !== halaqohStudentClassFilter) return false;
    if (halaqohStudentSearchFilter) {
      const q = halaqohStudentSearchFilter.toLowerCase().trim();
      if (!s.name.toLowerCase().includes(q) && !(s.nis && s.nis.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  candidateStudents.forEach(s => {
    if (selectAll) tempSelectedStudentIds.add(s.__backendId);
    else tempSelectedStudentIds.delete(s.__backendId);
  });

  const halaqohList = getHalaqohList();
  const halaqoh = halaqohList.find(h => h.id === halaqohId);
  if (halaqoh) renderManageHalaqohStudentsModal(halaqoh);
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
    renderPage();
  } else {
    showToast('Gagal menyimpan daftar siswa halaqoh', 'error');
  }
}

function closeHalaqohModal() {
  const container = document.getElementById('halaqoh-modal-container');
  if (container) container.innerHTML = '';
}
