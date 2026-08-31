// ============ RIWAYAT LAPORAN SISWA ============

let selectedHistoryStudentId = null;
let historyFilterCategory = 'all'; // 'all' | 'bacaan' | 'hafalan'
let historySortOrder = 'asc'; // 'asc' (Pertama ke Terakhir) | 'desc' (Terbaru ke Pertama)
let pendingDeleteReportId = null;

function renderReportHistory(el) {
  if (currentUser.role === 'visitor') return;

  const students = getStudents();
  let student = selectedHistoryStudentId ? students.find(s => s.__backendId === selectedHistoryStudentId) : null;
  
  // Jika siswa sebelumnya sudah tidak ada (terhapus), reset pilihan
  if (selectedHistoryStudentId && !student) {
    selectedHistoryStudentId = null;
  }

  const reports = getReports();
  let studentReports = student ? reports.filter(r => r.student_id === student.__backendId) : [];

  // Filter berdasarkan kategori
  if (historyFilterCategory === 'bacaan') {
    studentReports = studentReports.filter(r => r.report_type === 'iqro' || r.report_type === 'quran');
  } else if (historyFilterCategory === 'hafalan') {
    studentReports = studentReports.filter(r => r.report_type === 'hafalan');
  }

  // Urutkan laporan
  studentReports.sort((a, b) => {
    const dateDiff = new Date(a.tanggal || 0) - new Date(b.tanggal || 0);
    if (dateDiff !== 0) return historySortOrder === 'asc' ? dateDiff : -dateDiff;
    const createDiff = new Date(a.created_at || 0) - new Date(b.created_at || 0);
    return historySortOrder === 'asc' ? createDiff : -createDiff;
  });

  // Hitung metrik capaian siswa jika siswa dipilih
  let summaryHtml = '';
  if (student) {
    const allStudentReports = reports.filter(r => r.student_id === student.__backendId);
    const bacaanList = allStudentReports.filter(r => r.report_type === 'iqro' || r.report_type === 'quran').sort((a,b) => new Date(b.tanggal||0) - new Date(a.tanggal||0) || new Date(b.created_at||0) - new Date(a.created_at||0));
    const hafalanList = allStudentReports.filter(r => r.report_type === 'hafalan').sort((a,b) => new Date(b.tanggal||0) - new Date(a.tanggal||0) || new Date(b.created_at||0) - new Date(a.created_at||0));

    const latestBacaan = bacaanList[0];
    const latestHafalan = hafalanList[0];

    const grade = student.grade;
    const tIqro = allData.find(x => x.type === 'setting' && x.subject === `iqro_target_${grade}`)?.data || {target_iqro_jilid:1, target_iqro_halaman:120};
    const tHafalan = allData.find(x => x.type === 'setting' && x.subject === `hafalan_target_${grade}`)?.data || {target_hafalan_juz:30, target_surat_awal:'', target_ayat_akhir:1};

    let bacaanText = latestBacaan ? (latestBacaan.report_type === 'iqro' ? `Jilid ${latestBacaan.iqro_jilid} Hal ${latestBacaan.iqro_halaman}` : `${latestBacaan.surat} ${latestBacaan.ayat_dari}-${latestBacaan.ayat_sampai}`) : 'Belum ada laporan';
    let hafalanText = latestHafalan ? `${latestHafalan.surat} Ayat ${latestHafalan.ayat_dari}-${latestHafalan.ayat_sampai}` : 'Belum ada laporan';

    // Status ketuntasan
    let bacaanTuntas = false;
    let hafalanTuntas = false;
    if (latestBacaan) {
      const targetScore = getBacaanScore('iqro', tIqro.target_iqro_jilid, tIqro.target_iqro_halaman);
      bacaanTuntas = getBacaanScore(latestBacaan.report_type, latestBacaan.iqro_jilid, latestBacaan.iqro_halaman) >= targetScore;
    }
    if (latestHafalan) {
      const targetScore = getHafalanScore(tHafalan.target_hafalan_juz, tHafalan.target_surat_awal, tHafalan.target_ayat_akhir);
      hafalanTuntas = getHafalanScore(latestHafalan.juz, latestHafalan.surat, latestHafalan.ayat_sampai) >= targetScore;
    }

    summaryHtml = `
      <!-- Ringkasan Siswa Terpilih -->
      <div class="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100 mb-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-md">
              ${student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-xl font-bold text-slate-800">${student.name}</h3>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">NIS: ${student.nis || '-'}</span>
              </div>
              <p class="text-sm text-slate-500 mt-0.5">Tingkat: <span class="font-medium text-slate-700">${student.grade || '-'}</span> &bull; Kelas: <span class="font-medium text-slate-700">${student.kelas || '-'}</span></p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="printStudentHistory()" class="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow-sm">
              <i data-lucide="printer" class="w-4 h-4"></i> Cetak Riwayat
            </button>
            <button onclick="clearHistoryStudentSelection()" class="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-xl text-sm font-medium transition" title="Ganti Siswa">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- Kartu Metrik Ringkas -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div class="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-semibold text-slate-500">Posisi Bacaan Terakhir</span>
              ${latestBacaan ? (bacaanTuntas ? '<span class="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">✓ Tuntas</span>' : '<span class="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">⏳ Berproses</span>') : ''}
            </div>
            <p class="text-base font-bold text-slate-800">${bacaanText}</p>
            <p class="text-xs text-slate-400 mt-1">Target: Jilid ${tIqro.target_iqro_jilid} Hal ${tIqro.target_iqro_halaman}</p>
          </div>

          <div class="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-semibold text-slate-500">Posisi Hafalan Terakhir</span>
              ${latestHafalan ? (hafalanTuntas ? '<span class="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">✓ Tuntas</span>' : '<span class="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">⏳ Berproses</span>') : ''}
            </div>
            <p class="text-base font-bold text-slate-800">${hafalanText}</p>
            <p class="text-xs text-slate-400 mt-1">Target: ${tHafalan.target_surat_awal || 'Juz ' + tHafalan.target_hafalan_juz} s/d ayat ${tHafalan.target_ayat_akhir}</p>
          </div>

          <div class="bg-slate-50/80 rounded-xl p-4 border border-slate-100 flex flex-col justify-center">
            <span class="text-xs font-semibold text-slate-500 mb-1">Total Laporan Tercatat</span>
            <div class="flex items-baseline gap-2">
              <p class="text-2xl font-black text-emerald-600">${allStudentReports.length}</p>
              <span class="text-xs text-slate-400">entri (${bacaanList.length} bacaan, ${hafalanList.length} hafalan)</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  el.innerHTML = `
  <div class="fade-in max-w-7xl mx-auto" id="printable-history-area">
    <!-- Header Halaman -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <div class="p-2 bg-emerald-100 rounded-xl text-emerald-700"><i data-lucide="history" class="w-6 h-6"></i></div>
          Riwayat Laporan Siswa
        </h2>
        <p class="text-slate-500 text-sm mt-1">Lihat, edit, dan pantau perjalanan perkembangan belajar siswa dari awal hingga sekarang</p>
      </div>
    </div>

    <!-- Kotak Pencarian Siswa (Sistem sama dengan form input laporan) -->
    <div class="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100 mb-6 no-print">
      <label class="block text-sm font-bold text-slate-700 mb-2">Cari & Pilih Siswa</label>
      <div class="relative w-full max-w-2xl">
        <div class="relative">
          <i data-lucide="search" class="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" id="search-history-student" 
                 value="${student ? `${student.name} (${student.kelas || student.grade || '-'})` : ''}"
                 placeholder="Ketik nama siswa atau NIS untuk mencari..." 
                 class="w-full pl-11 pr-10 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" 
                 autocomplete="off" 
                 oninput="filterStudents('history', this.value)" 
                 onfocus="filterStudents('history', this.value)">
          <button type="button" id="clear-history-student-btn" onclick="clearStudentSearch('history')" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 ${student ? '' : 'hidden'}" title="Hapus pilihan siswa">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <input type="hidden" id="history-student" value="${student ? student.__backendId : ''}" data-name="${student ? `${student.name} (${student.kelas || student.grade || '-'})` : ''}">
        <div id="dropdown-history-student" class="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto hidden"></div>
      </div>
      <p class="text-xs text-slate-400 mt-2">💡 Tips: Ketik beberapa huruf dari nama siswa untuk memunculkan daftar pilihan.</p>
    </div>

    ${summaryHtml}

    ${student ? `
      <!-- Toolbar Filter & Pengurutan -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 no-print">
        <!-- Tab Kategori -->
        <div class="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button onclick="setHistoryCategory('all')" class="px-4 py-2 rounded-lg text-xs font-bold transition ${historyFilterCategory === 'all' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
            Semua Laporan (${studentReports.length})
          </button>
          <button onclick="setHistoryCategory('bacaan')" class="px-4 py-2 rounded-lg text-xs font-bold transition ${historyFilterCategory === 'bacaan' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
            📖 Bacaan
          </button>
          <button onclick="setHistoryCategory('hafalan')" class="px-4 py-2 rounded-lg text-xs font-bold transition ${historyFilterCategory === 'hafalan' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
            📚 Hafalan
          </button>
        </div>

        <!-- Pengurutan Kronologis -->
        <div class="flex items-center gap-2 text-xs font-medium text-slate-600">
          <span>Urutan:</span>
          <select onchange="setHistorySortOrder(this.value)" class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none">
            <option value="asc" ${historySortOrder === 'asc' ? 'selected' : ''}>⏳ Pertama ke Terakhir (Kronologis)</option>
            <option value="desc" ${historySortOrder === 'desc' ? 'selected' : ''}>🔄 Terakhir ke Pertama (Terbaru)</option>
          </select>
        </div>
      </div>

      <!-- Tabel Riwayat Laporan -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto w-full">
          <table class="w-full text-sm min-w-[750px]">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="text-center px-4 py-3.5 font-bold text-slate-600 w-14">No</th>
                <th class="text-left px-4 py-3.5 font-semibold text-slate-600 w-28">Tanggal</th>
                <th class="text-left px-4 py-3.5 font-semibold text-slate-600 w-28">Tipe</th>
                <th class="text-left px-4 py-3.5 font-semibold text-slate-600">Detail Capaian</th>
                <th class="text-left px-4 py-3.5 font-semibold text-slate-600 w-32">Status</th>
                <th class="text-left px-4 py-3.5 font-semibold text-slate-600">Catatan Guru</th>
                <th class="text-center px-4 py-3.5 font-semibold text-slate-600 w-36 no-print">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${studentReports.length ? studentReports.map((r, idx) => {
                const isIqro = r.report_type === 'iqro';
                const isQuran = r.report_type === 'quran';
                const isHafalan = r.report_type === 'hafalan';

                let typeBadge = '';
                let detailText = '';
                if (isIqro) {
                  typeBadge = `<span class="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-xs font-semibold">📖 Iqro'</span>`;
                  detailText = `<span class="font-bold text-slate-800">Jilid ${r.iqro_jilid || 1}</span> <span class="text-slate-500 font-normal">Halaman ${r.iqro_halaman || 1}</span>`;
                } else if (isQuran) {
                  typeBadge = `<span class="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-xs font-semibold">📖 Al-Qur'an</span>`;
                  detailText = `<span class="font-bold text-slate-800">Juz ${r.juz || 1}</span> - <span class="font-semibold text-slate-700">${r.surat || '-'}</span> <span class="text-slate-500 font-normal">(Ayat ${r.ayat_dari || 1}-${r.ayat_sampai || 1})</span>`;
                } else {
                  typeBadge = `<span class="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-xs font-semibold">📚 Hafalan</span>`;
                  detailText = `<span class="font-bold text-slate-800">Juz ${r.juz || 30}</span> - <span class="font-semibold text-slate-700">${r.surat || '-'}</span> <span class="text-slate-500 font-normal">(Ayat ${r.ayat_dari || 1}-${r.ayat_sampai || 1})</span>`;
                }

                const statusColor = r.status === 'Lancar' 
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                  : (r.status === 'Mengulang' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-red-100 text-red-700 border border-red-200');

                const rowNumber = historySortOrder === 'asc' ? (idx + 1) : (studentReports.length - idx);

                return `
                  <tr class="hover:bg-slate-50/70 transition">
                    <td class="px-4 py-3.5 text-center font-bold text-slate-400 text-xs">#${rowNumber}</td>
                    <td class="px-4 py-3.5 whitespace-nowrap text-slate-600 font-medium text-xs">${r.tanggal || '-'}</td>
                    <td class="px-4 py-3.5 whitespace-nowrap">${typeBadge}</td>
                    <td class="px-4 py-3.5 text-slate-800">${detailText}</td>
                    <td class="px-4 py-3.5 whitespace-nowrap"><span class="px-2.5 py-1 rounded-full text-xs font-bold ${statusColor}">${r.status || 'Lancar'}</span></td>
                    <td class="px-4 py-3.5 text-slate-600 max-w-[240px] truncate cursor-pointer hover:text-slate-900 transition" onclick="toggleNoteExpansion(this)" title="Klik untuk memperluas catatan">${r.catatan || '<span class="text-slate-300 italic">-</span>'}</td>
                    <td class="px-4 py-3.5 whitespace-nowrap text-center no-print">
                      <div class="inline-flex items-center gap-1.5">
                        <button onclick="editHistoryReport('${r.__backendId}')" class="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs shadow-sm transition" title="Edit Laporan Tanggal ${r.tanggal || ''}">
                          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                          <span>Edit</span>
                        </button>
                        <button onclick="confirmDeleteHistoryReport('${r.__backendId}')" class="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs shadow-sm transition" title="Hapus Laporan">
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="7" class="px-5 py-12 text-center text-slate-400">
                    <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <i data-lucide="file-x" class="w-6 h-6"></i>
                    </div>
                    <p class="font-semibold text-slate-600">Belum ada riwayat laporan untuk kategori ini</p>
                    <p class="text-xs text-slate-400 mt-1">Laporan yang diinput oleh guru akan otomatis muncul di sini</p>
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    ` : `
      <!-- State Kosong Belum Pilih Siswa -->
      <div class="bg-white rounded-2xl p-10 md:p-16 text-center border border-slate-100 shadow-sm max-w-2xl mx-auto">
        <div class="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-5 text-emerald-600 shadow-inner">
          <i data-lucide="user-search" class="w-10 h-10"></i>
        </div>
        <h3 class="text-xl font-bold text-slate-800 mb-2">Pilih Siswa Terlebih Dahulu</h3>
        <p class="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
          Gunakan kolom pencarian di atas untuk memilih nama siswa. Sistem akan menampilkan seluruh riwayat pembelajaran bacaan dan hafalan secara terstruktur dari laporan pertama kali hingga laporan terkini.
        </p>
      </div>
    `}
  </div>

  <!-- Modal Container untuk Edit & Hapus -->
  <div id="history-modal-container"></div>
  `;

  if (window.lucide) lucide.createIcons();
}

function selectHistoryStudent(studentId) {
  selectedHistoryStudentId = studentId;
  const main = document.getElementById('main-content');
  if (main) renderReportHistory(main);
}

function clearHistoryStudentSelection() {
  selectedHistoryStudentId = null;
  const main = document.getElementById('main-content');
  if (main) renderReportHistory(main);
}

function setHistoryCategory(category) {
  historyFilterCategory = category;
  const main = document.getElementById('main-content');
  if (main) renderReportHistory(main);
}

function setHistorySortOrder(order) {
  historySortOrder = order;
  const main = document.getElementById('main-content');
  if (main) renderReportHistory(main);
}

// ============ EDIT RIWAYAT LAPORAN ============

function editHistoryReport(reportId) {
  const report = allData.find(d => d.__backendId === reportId);
  if (!report) {
    showToast('Data laporan tidak ditemukan', 'error');
    return;
  }

  const container = document.getElementById('history-modal-container');
  if (!container) return;

  const isIqro = report.report_type === 'iqro';
  const isQuran = report.report_type === 'quran';
  const isHafalan = report.report_type === 'hafalan';

  container.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 fade-in space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center pb-3 border-b border-slate-100">
        <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
          <i data-lucide="edit" class="w-5 h-5 text-emerald-600"></i> Edit Laporan Siswa
        </h3>
        <button onclick="closeHistoryModal()" class="text-slate-400 hover:text-slate-600 p-1"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>

      <div class="space-y-4 text-sm">
        <!-- Tanggal Laporan -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Tanggal Laporan</label>
          <input id="edit-rep-date" type="date" value="${report.tanggal || today()}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
        </div>

        <!-- Tipe Laporan -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Jenis Laporan</label>
          <select id="edit-rep-type" onchange="toggleEditReportFields(this.value)" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-medium">
            <option value="iqro" ${isIqro ? 'selected' : ''}>📖 Bacaan Iqro'</option>
            <option value="quran" ${isQuran ? 'selected' : ''}>📖 Bacaan Al-Qur'an</option>
            <option value="hafalan" ${isHafalan ? 'selected' : ''}>📚 Hafalan</option>
          </select>
        </div>

        <!-- Iqro Fields -->
        <div id="edit-iqro-fields" class="${isIqro ? 'grid' : 'hidden'} grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Jilid</label>
            <input id="edit-rep-jilid" type="number" min="1" max="6" value="${report.iqro_jilid || 1}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Halaman</label>
            <input id="edit-rep-hal" type="number" min="1" value="${report.iqro_halaman || 1}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm">
          </div>
        </div>

        <!-- Quran / Hafalan Fields -->
        <div id="edit-quran-fields" class="${!isIqro ? 'block' : 'hidden'} space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Juz</label>
              <select id="edit-rep-juz" onchange="updateEditSuratDropdown()" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white">
                ${Array.from({length:30}, (_,i) => `<option value="${i+1}" ${(report.juz || (isHafalan ? 30 : 1)) === (i+1) ? 'selected' : ''}>Juz ${i+1}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Surat</label>
              <select id="edit-rep-surat" onchange="updateEditAyatMax()" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"></select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Dari Ayat</label>
              <input id="edit-rep-ayat-dari" type="number" min="1" value="${report.ayat_dari || 1}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Sampai Ayat</label>
              <input id="edit-rep-ayat-sampai" type="number" min="1" value="${report.ayat_sampai || 1}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm">
            </div>
          </div>
        </div>

        <!-- Status Kelancaran -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Status Kelancaran</label>
          <select id="edit-rep-status" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white">
            <option value="Lancar" ${report.status === 'Lancar' ? 'selected' : ''}>Lancar</option>
            <option value="Mengulang" ${report.status === 'Mengulang' ? 'selected' : ''}>Mengulang</option>
            <option value="Tidak Lancar" ${report.status === 'Tidak Lancar' ? 'selected' : ''}>Tidak Lancar</option>
          </select>
        </div>

        <!-- Catatan Guru -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Catatan Guru</label>
          <textarea id="edit-rep-catatan" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" rows="3" placeholder="Masukkan catatan evaluasi/perkembangan...">${report.catatan || ''}</textarea>
        </div>

        <div class="flex gap-3 pt-3 border-t border-slate-100">
          <button onclick="closeHistoryModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition">Batal</button>
          <button onclick="saveEditHistoryReport('${reportId}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl shadow-md transition">Simpan Perubahan</button>
        </div>
      </div>
    </div>
  </div>
  `;

  if (window.lucide) lucide.createIcons();

  if (!isIqro) {
    updateEditSuratDropdown(report.surat);
  }
}

function toggleEditReportFields(type) {
  const iqroBox = document.getElementById('edit-iqro-fields');
  const quranBox = document.getElementById('edit-quran-fields');
  if (type === 'iqro') {
    iqroBox.classList.remove('hidden');
    iqroBox.classList.add('grid');
    quranBox.classList.add('hidden');
    quranBox.classList.remove('block');
  } else {
    iqroBox.classList.add('hidden');
    iqroBox.classList.remove('grid');
    quranBox.classList.remove('hidden');
    quranBox.classList.add('block');
    updateEditSuratDropdown();
  }
}

function updateEditSuratDropdown(selectedSurat) {
  const juzEl = document.getElementById('edit-rep-juz');
  const suratEl = document.getElementById('edit-rep-surat');
  if (!juzEl || !suratEl) return;

  const juz = parseInt(juzEl.value) || 1;
  const list = getSuratByJuz(juz);
  suratEl.innerHTML = list.map(s => `<option value="${s.name}" ${s.name === selectedSurat ? 'selected' : ''}>${s.name}</option>`).join('');
  updateEditAyatMax();
}

function updateEditAyatMax() {
  const juzEl = document.getElementById('edit-rep-juz');
  const suratEl = document.getElementById('edit-rep-surat');
  if (!juzEl || !suratEl) return;
  const maxAyat = getAyatCount(parseInt(juzEl.value), suratEl.value);
  const dariEl = document.getElementById('edit-rep-ayat-dari');
  const sampaiEl = document.getElementById('edit-rep-ayat-sampai');
  if (dariEl) dariEl.max = maxAyat;
  if (sampaiEl) sampaiEl.max = maxAyat;
}

async function saveEditHistoryReport(reportId) {
  const report = allData.find(d => d.__backendId === reportId);
  if (!report) {
    showToast('Laporan tidak ditemukan', 'error');
    return;
  }

  const newDate = document.getElementById('edit-rep-date').value;
  const newType = document.getElementById('edit-rep-type').value;
  const newStatus = document.getElementById('edit-rep-status').value;
  const newCatatan = document.getElementById('edit-rep-catatan').value.trim();

  if (!newDate) {
    showToast('Harap tentukan tanggal laporan', 'warning');
    return;
  }

  report.tanggal = newDate;
  report.report_type = newType;
  report.status = newStatus;
  report.catatan = newCatatan;

  if (newType === 'iqro') {
    report.iqro_jilid = parseInt(document.getElementById('edit-rep-jilid').value) || 1;
    report.iqro_halaman = parseInt(document.getElementById('edit-rep-hal').value) || 1;
    report.juz = 0;
    report.surat = '';
    report.ayat_dari = 0;
    report.ayat_sampai = 0;
  } else {
    report.iqro_jilid = 0;
    report.iqro_halaman = 0;
    report.juz = parseInt(document.getElementById('edit-rep-juz').value) || 1;
    report.surat = document.getElementById('edit-rep-surat').value;
    report.ayat_dari = parseInt(document.getElementById('edit-rep-ayat-dari').value) || 1;
    report.ayat_sampai = parseInt(document.getElementById('edit-rep-ayat-sampai').value) || 1;
  }

  const res = await window.dataSdk.update(report);
  if (res.isOk) {
    showToast('Laporan berhasil diperbarui', 'success');
    closeHistoryModal();
    const main = document.getElementById('main-content');
    if (main) renderReportHistory(main);
  } else {
    showToast('Gagal memperbarui laporan', 'error');
  }
}

// ============ HAPUS RIWAYAT LAPORAN ============

function confirmDeleteHistoryReport(reportId) {
  pendingDeleteReportId = reportId;
  const container = document.getElementById('history-modal-container');
  if (!container) return;

  const report = allData.find(d => d.__backendId === reportId);
  const detail = report ? (report.report_type === 'iqro' ? `Iqro' Jilid ${report.iqro_jilid} Hal ${report.iqro_halaman}` : `${report.surat} Ayat ${report.ayat_dari}-${report.ayat_sampai}`) : 'laporan ini';

  container.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center fade-in">
      <div class="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <i data-lucide="alert-triangle" class="w-8 h-8"></i>
      </div>
      <h3 class="font-bold text-xl text-slate-800 mb-2">Hapus Laporan?</h3>
      <p class="text-sm text-slate-500 mb-6">
        Anda yakin ingin menghapus data <strong>${detail}</strong> pada tanggal <strong>${report?.tanggal || '-'}</strong>? Data yang terhapus tidak dapat dipulihkan.
      </p>
      <div class="flex gap-3">
        <button onclick="closeHistoryModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-sm font-semibold transition">Batal</button>
        <button onclick="doDeleteHistoryReport()" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-semibold shadow-md shadow-red-200 transition">Ya, Hapus</button>
      </div>
    </div>
  </div>
  `;
  if (window.lucide) lucide.createIcons();
}

async function doDeleteHistoryReport() {
  if (!pendingDeleteReportId) return;
  const item = allData.find(d => d.__backendId === pendingDeleteReportId);
  if (item) {
    const res = await window.dataSdk.delete(item);
    if (res.isOk) {
      showToast('Laporan berhasil dihapus', 'success');
    } else {
      showToast('Gagal menghapus laporan', 'error');
    }
  }
  pendingDeleteReportId = null;
  closeHistoryModal();
  const main = document.getElementById('main-content');
  if (main) renderReportHistory(main);
}

function closeHistoryModal() {
  const container = document.getElementById('history-modal-container');
  if (container) container.innerHTML = '';
}

// ============ PRINT RIWAYAT SISWA ============

function printStudentHistory() {
  window.print();
}
