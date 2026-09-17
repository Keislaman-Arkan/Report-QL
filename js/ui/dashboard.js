// ============ DASHBOARD ============

function createDonutSVG(pct, color, size, strokeWidth) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const center = size / 2;
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle class="donut-ring" cx="${center}" cy="${center}" r="${radius}" stroke-width="${strokeWidth}"/>
      <circle class="donut-segment animate-in" cx="${center}" cy="${center}" r="${radius}" 
        stroke="${color}" stroke-width="${strokeWidth}"
        stroke-dasharray="${circumference}" 
        stroke-dashoffset="${offset}"
        style="--circumference:${circumference};--target-offset:${offset}"/>
    </svg>`;
}

function renderDashboard(el) {
  const students = getStudents();
  const reports = getReports();
  const map = getGradeKelasMap();
  
  const metrics = calculateTuntasMetrics(students, reports);
  const totalReports = reports.length;
  
  // Calculate overall percentages
  const pctBacaanAll = metrics.evaluatedBacaan > 0 ? Math.round((metrics.tuntasBacaan / metrics.evaluatedBacaan) * 100) : 0;
  const pctHafalanAll = metrics.evaluatedHafalan > 0 ? Math.round((metrics.tuntasHafalan / metrics.evaluatedHafalan) * 100) : 0;
  const belumBacaan = metrics.evaluatedBacaan - metrics.tuntasBacaan;
  const belumHafalan = metrics.evaluatedHafalan - metrics.tuntasHafalan;
  const belumDievaluasiBacaan = students.length - metrics.evaluatedBacaan;
  const belumDievaluasiHafalan = students.length - metrics.evaluatedHafalan;
  
  el.innerHTML = `
  <div class="fade-in max-w-7xl mx-auto">
    <h2 class="text-2xl font-bold text-slate-800 mb-6">Dashboard Utama</h2>
    
    <!-- Summary Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="card-hover bg-white rounded-xl p-4 md:p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-3">
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0"><i data-lucide="users" class="w-5 h-5 text-blue-600"></i></div>
        <div><p class="text-xl md:text-2xl font-bold text-slate-800">${students.length}</p><p class="text-xs text-slate-500">Total Siswa Terdaftar</p></div>
      </div>
      <div class="card-hover bg-white rounded-xl p-4 md:p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-3">
        <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0"><i data-lucide="book-open-check" class="w-5 h-5 text-emerald-600"></i></div>
        <div><p class="text-xl md:text-2xl font-bold text-emerald-600">${metrics.tuntasBacaan}</p><p class="text-xs text-slate-500">Siswa Tuntas Bacaan</p></div>
      </div>
      <div class="card-hover bg-white rounded-xl p-4 md:p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-3">
        <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0"><i data-lucide="bookmark-check" class="w-5 h-5 text-purple-600"></i></div>
        <div><p class="text-xl md:text-2xl font-bold text-purple-600">${metrics.tuntasHafalan}</p><p class="text-xs text-slate-500">Siswa Tuntas Hafalan</p></div>
      </div>
      <div class="card-hover bg-white rounded-xl p-4 md:p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-3">
        <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0"><i data-lucide="history" class="w-5 h-5 text-amber-600"></i></div>
        <div><p class="text-xl md:text-2xl font-bold text-amber-600">${totalReports}</p><p class="text-xs text-slate-500">Total Histori Laporan</p></div>
      </div>
    </div>
    
    <!-- Overall Donut Charts -->
    <div class="summary-donut-card rounded-2xl p-5 md:p-8 shadow-sm mb-8">
      <h3 class="text-lg font-bold text-slate-800 mb-6 text-center">Ringkasan Capaian Target Keseluruhan</h3>
      <div class="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
        
        <!-- Donut: Bacaan -->
        <div class="chart-tooltip-wrap flex flex-col items-center" tabindex="0">
          <div class="chart-tooltip">
            <div class="font-bold text-emerald-400 mb-1">📖 Target Bacaan</div>
            <div>✅ Tuntas: <strong>${metrics.tuntasBacaan}</strong> siswa</div>
            <div>⏳ Belum Tuntas: <strong>${belumBacaan}</strong> siswa</div>
            <div class="text-slate-400 mt-1 text-[11px]">Dievaluasi: ${metrics.evaluatedBacaan} dari ${students.length} siswa</div>
          </div>
          <div class="donut-chart" style="width:140px;height:140px">
            ${createDonutSVG(pctBacaanAll, '#10b981', 140, 14)}
            <div class="donut-center-text">
              <span class="pct text-emerald-600">${pctBacaanAll}%</span>
              <span class="label">Tuntas</span>
            </div>
          </div>
          <p class="mt-3 text-sm font-bold text-slate-700">Target Bacaan</p>
          <p class="text-xs text-slate-400">Hover/tap untuk detail</p>
        </div>

        <!-- Donut: Hafalan -->
        <div class="chart-tooltip-wrap flex flex-col items-center" tabindex="0">
          <div class="chart-tooltip">
            <div class="font-bold text-purple-400 mb-1">📚 Target Hafalan</div>
            <div>✅ Tuntas: <strong>${metrics.tuntasHafalan}</strong> siswa</div>
            <div>⏳ Belum Tuntas: <strong>${belumHafalan}</strong> siswa</div>
            <div class="text-slate-400 mt-1 text-[11px]">Dievaluasi: ${metrics.evaluatedHafalan} dari ${students.length} siswa</div>
          </div>
          <div class="donut-chart" style="width:140px;height:140px">
            ${createDonutSVG(pctHafalanAll, '#8b5cf6', 140, 14)}
            <div class="donut-center-text">
              <span class="pct text-purple-600">${pctHafalanAll}%</span>
              <span class="label">Tuntas</span>
            </div>
          </div>
          <p class="mt-3 text-sm font-bold text-slate-700">Target Hafalan</p>
          <p class="text-xs text-slate-400">Hover/tap untuk detail</p>
        </div>

      </div>
    </div>

    <!-- Per-Grade Donut Charts -->
    <h3 class="text-lg font-semibold text-slate-700 mb-4">Capaian Target Kurikulum Per Tingkat</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      ${Object.keys(map).map(gradeName => {
        const gradeClasses = map[gradeName] || [];
        const ks = students.filter(s => s.grade === gradeName);
        const stMetrics = calculateTuntasMetrics(ks, reports);
        
        const pctBacaan = stMetrics.evaluatedBacaan > 0 ? Math.round((stMetrics.tuntasBacaan/stMetrics.evaluatedBacaan)*100) : 0;
        const pctHafalan = stMetrics.evaluatedHafalan > 0 ? Math.round((stMetrics.tuntasHafalan/stMetrics.evaluatedHafalan)*100) : 0;
        const bBacaan = stMetrics.evaluatedBacaan - stMetrics.tuntasBacaan;
        const bHafalan = stMetrics.evaluatedHafalan - stMetrics.tuntasHafalan;
        
        return `
        <div class="card-hover bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer" onclick="reportFilterGrade='${gradeName}';reportFilterClass='';navigate('reports')">
          <div class="flex justify-between items-center mb-5">
            <h4 class="font-bold text-slate-700 text-base">${gradeName}</h4>
            <span class="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-semibold">${ks.length} Siswa</span>
          </div>
          
          <div class="flex items-center justify-around gap-4">
            <!-- Bacaan Mini Donut -->
            <div class="chart-tooltip-wrap flex flex-col items-center" tabindex="0" onclick="event.stopPropagation()">
              <div class="chart-tooltip">
                <div class="font-bold text-emerald-400 mb-1">📖 Bacaan — ${gradeName}</div>
                <div>✅ Tuntas: <strong>${stMetrics.tuntasBacaan}</strong> siswa</div>
                <div>⏳ Belum: <strong>${bBacaan}</strong> siswa</div>
                <div class="text-slate-400 mt-1 text-[11px]">Dievaluasi: ${stMetrics.evaluatedBacaan} dari ${ks.length}</div>
              </div>
              <div class="donut-chart" style="width:90px;height:90px">
                ${createDonutSVG(pctBacaan, '#10b981', 90, 10)}
                <div class="donut-center-text">
                  <span class="pct text-emerald-600" style="font-size:1.1rem">${pctBacaan}%</span>
                </div>
              </div>
              <p class="mt-2 text-xs font-semibold text-slate-500">Bacaan</p>
            </div>
            
            <!-- Hafalan Mini Donut -->
            <div class="chart-tooltip-wrap flex flex-col items-center" tabindex="0" onclick="event.stopPropagation()">
              <div class="chart-tooltip">
                <div class="font-bold text-purple-400 mb-1">📚 Hafalan — ${gradeName}</div>
                <div>✅ Tuntas: <strong>${stMetrics.tuntasHafalan}</strong> siswa</div>
                <div>⏳ Belum: <strong>${bHafalan}</strong> siswa</div>
                <div class="text-slate-400 mt-1 text-[11px]">Dievaluasi: ${stMetrics.evaluatedHafalan} dari ${ks.length}</div>
              </div>
              <div class="donut-chart" style="width:90px;height:90px">
                ${createDonutSVG(pctHafalan, '#8b5cf6', 90, 10)}
                <div class="donut-center-text">
                  <span class="pct text-purple-600" style="font-size:1.1rem">${pctHafalan}%</span>
                </div>
              </div>
              <p class="mt-2 text-xs font-semibold text-slate-500">Hafalan</p>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <i data-lucide="mouse-pointer-click" class="w-3.5 h-3.5"></i>
            <span>Klik kartu untuk lihat rekap laporan</span>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function renderStudentDashboard(el) {
  const studentId = currentUser.id;
  const student = getStudents().find(s => s.__backendId === studentId);
  const reports = getReports().filter(r => r.student_id === studentId);
  
  if (!student) {
    el.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4"><i data-lucide="alert-circle" class="w-8 h-8 text-red-600"></i></div>
        <h3 class="font-bold text-lg text-slate-800">Siswa Tidak Ditemukan</h3>
        <p class="text-sm text-slate-500 mt-1 max-w-xs">Data profil siswa Anda tidak ditemukan dalam sistem. Silakan hubungi Guru Anda.</p>
        <button onclick="handleLogout()" class="mt-6 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition">Keluar (Logout)</button>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  const stReports = reports;
  const bacaanReports = stReports.filter(r => r.report_type === 'iqro' || r.report_type === 'quran').sort((a,b) => {
    const dateDiff = new Date(b.tanggal || 0) - new Date(a.tanggal || 0);
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
  const hafalanReports = stReports.filter(r => r.report_type === 'hafalan').sort((a,b) => {
    const dateDiff = new Date(b.tanggal || 0) - new Date(a.tanggal || 0);
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
  
  const grade = student.grade;
  const tIqro = allData.find(x => x.type === 'setting' && x.subject === `iqro_target_${grade}`)?.data || {target_iqro_jilid:1, target_iqro_halaman:120};
  const tHafalan = allData.find(x => x.type === 'setting' && x.subject === `hafalan_target_${grade}`)?.data || {target_hafalan_juz:30, target_surat_awal:'', target_ayat_akhir:1};

  const targetBacaanScore = getBacaanScore('iqro', tIqro.target_iqro_jilid, tIqro.target_iqro_halaman);
  const targetHafalanScore = getHafalanScore(tHafalan.target_hafalan_juz, tHafalan.target_surat_awal, tHafalan.target_ayat_akhir);

  let isBacaanTuntas = false;
  let isHafalanTuntas = false;
  
  let currentBacaanText = 'Belum ada laporan';
  let currentHafalanText = 'Belum ada laporan';
  
  if (bacaanReports.length > 0) {
    const latest = bacaanReports[0];
    isBacaanTuntas = getBacaanScore(latest.report_type, latest.iqro_jilid, latest.iqro_halaman) >= targetBacaanScore;
    currentBacaanText = latest.report_type === 'iqro' ? `Jilid ${latest.iqro_jilid} Hal ${latest.iqro_halaman}` : `${latest.surat} ${latest.ayat_dari}-${latest.ayat_sampai}`;
  }
  let latestHafalanSurat = '';
  let latestHafalanFrom = 1;
  let latestHafalanTo = 1;

  if (hafalanReports.length > 0) {
    const latest = hafalanReports[0];
    isHafalanTuntas = getHafalanScore(latest.juz, latest.surat, latest.ayat_sampai) >= targetHafalanScore;
    currentHafalanText = `${latest.surat} Ayat ${latest.ayat_dari}-${latest.ayat_sampai}`;
    latestHafalanSurat = latest.surat || '';
    latestHafalanFrom = parseInt(latest.ayat_dari) || 1;
    latestHafalanTo = parseInt(latest.ayat_sampai) || latestHafalanFrom;
  } else {
    // If no hafalan report yet, check if there is any quran reading report
    const quranRep = bacaanReports.find(r => r.report_type === 'quran');
    if (quranRep && quranRep.surat) {
      latestHafalanSurat = quranRep.surat;
      latestHafalanFrom = parseInt(quranRep.ayat_dari) || 1;
      latestHafalanTo = parseInt(quranRep.ayat_sampai) || latestHafalanFrom;
    } else if (tHafalan && tHafalan.target_surat_awal) {
      latestHafalanSurat = tHafalan.target_surat_awal;
      latestHafalanFrom = 1;
      latestHafalanTo = parseInt(tHafalan.target_ayat_akhir) || 10;
    } else {
      latestHafalanSurat = 'An-Naba';
      latestHafalanFrom = 1;
      latestHafalanTo = 40;
    }
  }

  // Helper: normalize any date value to YYYY-MM-DD string for comparison
  function toDateStr(val) {
    if (!val) return '';
    const s = String(val).trim();
    // Extract YYYY-MM-DD from any format (timestamp, date string, etc.)
    const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
  }

  // Calculate accumulated progress (total read/memorized) - reset/filter on promotion
  const promoteDateStr = toDateStr(student.class_updated_at);
  const progressReports = promoteDateStr
    ? stReports.filter(r => {
        const rDateStr = toDateStr(r.tanggal);
        // Only include reports STRICTLY AFTER promotion date
        return rDateStr > promoteDateStr;
      })
    : stReports;

  let totalHal = 0;
  let totalAyatBacaan = 0;
  let totalAyatHafalan = 0;
  
  const sortedIqro = progressReports.filter(cr => cr.report_type === 'iqro').sort((a,b) => new Date(a.tanggal || 0) - new Date(b.tanggal || 0) || new Date(a.created_at || 0) - new Date(b.created_at || 0));
  if (sortedIqro.length > 0) {
    if (sortedIqro.length === 1) {
      totalHal = 1;
    } else {
      const firstIqro = sortedIqro[0];
      const lastIqro = sortedIqro[sortedIqro.length - 1];
      const firstIndex = (parseInt(firstIqro.iqro_jilid - 1) || 0) * 30 + (parseInt(firstIqro.iqro_halaman) || 1);
      const lastIndex = (parseInt(lastIqro.iqro_jilid - 1) || 0) * 30 + (parseInt(lastIqro.iqro_halaman) || 1);
      totalHal = lastIndex - firstIndex;
      if (totalHal < 0) totalHal = 0;
    }
  }
  
  progressReports.forEach(cr => {
    if (cr.report_type === 'quran') {
      let d = parseInt(cr.ayat_dari)||0;
      let s = parseInt(cr.ayat_sampai)||0;
      if (s >= d) totalAyatBacaan += (s - d + 1);
    } else if (cr.report_type === 'hafalan') {
      let d = parseInt(cr.ayat_dari)||0;
      let s = parseInt(cr.ayat_sampai)||0;
      if (s >= d) totalAyatHafalan += (s - d + 1);
    }
  });

  let perkembanganBacaan = '';
  if (totalHal > 0 && totalAyatBacaan > 0) perkembanganBacaan = `+${totalHal} Hal, +${totalAyatBacaan} Ayat`;
  else if (totalHal > 0) perkembanganBacaan = `+${totalHal} Halaman`;
  else if (totalAyatBacaan > 0) perkembanganBacaan = `+${totalAyatBacaan} Ayat`;
  else perkembanganBacaan = 'Belum ada progress';

  let perkembanganHafalan = totalAyatHafalan > 0 ? `+${totalAyatHafalan} Ayat` : 'Belum ada progress';

  el.innerHTML = `
  <div class="min-h-screen bg-slate-50 flex flex-col pb-12">
    <!-- Student Header -->
    <header class="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white shadow-md z-40 w-full shrink-0 pt-[max(1rem,env(safe-area-inset-top))]">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><i data-lucide="book-open" class="w-5 h-5 text-emerald-300"></i></div>
          <div>
            <h1 class="font-bold text-lg leading-tight">Qur'an Learning</h1>
            <p class="text-xs text-emerald-200 font-medium">Rapor Perkembangan Mandiri</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="showChangePasswordModal()" class="bg-emerald-700/60 hover:bg-emerald-700 text-white border border-emerald-600 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition">
            <i data-lucide="key" class="w-3.5 h-3.5"></i> Ubah Sandi
          </button>
          <button onclick="handleLogout()" class="bg-emerald-700/60 hover:bg-emerald-700 text-white border border-emerald-600 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition">
            <i data-lucide="log-out" class="w-3.5 h-3.5"></i> Keluar
          </button>
        </div>
      </div>
    </header>

    <!-- Content Area -->
    <main class="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
      
      <!-- Card Identitas -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span class="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-100 uppercase">Profil Siswa</span>
          <h2 class="text-xl font-bold text-slate-800 mt-2">${student.name}</h2>
          <p class="text-xs text-slate-500 mt-1">NIS: <span class="font-semibold text-slate-700">${student.nis || '-'}</span></p>
        </div>
        <div class="flex flex-col items-start sm:items-end text-left sm:text-right gap-2">
          <span class="bg-slate-100 text-slate-600 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200">${student.grade} - Kelas ${student.kelas}</span>
          ${isStudentPromoteEnabled() ? `
            <button onclick="showPromoteClassModal()" class="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
              <i data-lucide="trending-up" class="w-3.5 h-3.5"></i> Naik Kelas
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Target Capaian & Perkembangan Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Bacaan Card -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-slate-800 flex items-center gap-2"><i data-lucide="book-open" class="w-5 h-5 text-emerald-600"></i> Bacaan</h3>
              ${isBacaanTuntas 
                ? `<span class="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200 flex items-center gap-1">✓ Tuntas Target</span>`
                : `<span class="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-200 flex items-center gap-1">⏳ Belum Tuntas</span>`
              }
            </div>
            
            <div class="space-y-3 text-sm mt-4">
              <div class="flex justify-between border-b border-slate-50 pb-2">
                <span class="text-slate-500">Posisi Terakhir:</span>
                <span class="font-semibold text-slate-800">${currentBacaanText}</span>
              </div>
              <div class="flex justify-between border-b border-slate-50 pb-2">
                <span class="text-slate-500">Target Kurikulum:</span>
                <span class="font-medium text-slate-600">Jilid ${tIqro.target_iqro_jilid} Hal ${tIqro.target_iqro_halaman}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 font-medium text-indigo-700">Total Perkembangan:</span>
                <span class="font-bold text-indigo-600">${perkembanganBacaan}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Hafalan Card -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-slate-800 flex items-center gap-2"><i data-lucide="bookmark" class="w-5 h-5 text-purple-600"></i> Hafalan</h3>
              ${isHafalanTuntas 
                ? `<span class="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200 flex items-center gap-1">✓ Tuntas Target</span>`
                : `<span class="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-200 flex items-center gap-1">⏳ Belum Tuntas</span>`
              }
            </div>
            
            <div class="space-y-3 text-sm mt-4">
              <div class="flex justify-between border-b border-slate-50 pb-2">
                <span class="text-slate-500">Hafalan Terakhir:</span>
                <span class="font-semibold text-slate-800">${currentHafalanText}</span>
              </div>
              <div class="flex justify-between border-b border-slate-50 pb-2">
                <span class="text-slate-500">Target Kurikulum:</span>
                <span class="font-medium text-slate-600">${tHafalan.target_surat_awal || 'Juz ' + tHafalan.target_hafalan_juz} s/d ayat ${tHafalan.target_ayat_akhir}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 font-medium text-indigo-700">Total Perkembangan:</span>
                <span class="font-bold text-indigo-600">${perkembanganHafalan}</span>
              </div>
            </div>
          </div>

          <!-- Quick button to open Quran popup directly -->
          <div class="pt-4 mt-4 border-t border-slate-100">
            <button type="button" onclick="openQuranViewer({ surah: '${latestHafalanSurat.replace(/'/g, "\\'")}', fromAyah: ${latestHafalanFrom}, toAyah: ${latestHafalanTo}, studentName: '${student.name.replace(/'/g, "\\'")}', reportType: 'hafalan' })" class="w-full bg-purple-50 hover:bg-purple-100 active:bg-purple-200 text-purple-700 border border-purple-200 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs">
              <i data-lucide="book-open" class="w-4 h-4 text-purple-600"></i>
              <span>Buka Al-Qur'an Hafalan Terakhir (${latestHafalanSurat}) 🎧</span>
            </button>
          </div>
        </div>

      </div>

      <!-- Al-Qur'an & Hafalan Mandiri Card (Pop Up Mushaf & Audio) -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div class="flex items-start sm:items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xl shrink-0">
              <i data-lucide="book-open" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-bold text-base sm:text-lg text-slate-800">Al-Qur'an & Hafalan Mandiri</h3>
                <span class="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[11px] font-bold">
                  Mushaf, Audio & Latin
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                Buka teks Al-Qur'an dengan lantunan audio murottal per ayat dan transliterasi latin untuk mempermudah hafalan.
              </p>
            </div>
          </div>

          <!-- Quick direct button for latest hafalan -->
          <button type="button" onclick="openQuranViewer({ surah: '${latestHafalanSurat.replace(/'/g, "\\'")}', fromAyah: ${latestHafalanFrom}, toAyah: ${latestHafalanTo}, studentName: '${student.name.replace(/'/g, "\\'")}', reportType: 'hafalan' })" class="shrink-0 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-purple-200 shadow-xs">
            <i data-lucide="zap" class="w-3.5 h-3.5 text-purple-600"></i>
            <span>Langsung Buka Hafalan (${latestHafalanSurat})</span>
          </button>
        </div>

        <!-- Form Pemilihan Surat & Ayat -->
        <div class="pt-5 grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
          <!-- Dropdown 114 Surat -->
          <div class="sm:col-span-6 lg:col-span-5">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Pilih Surat Al-Qur'an:
            </label>
            <select id="sq-dash-surat" onchange="updateStudentDashAyatMax()" class="w-full px-3.5 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500 transition">
              ${quranSurahList.map(s => {
                const isSelected = normalizeSurahName(s.name) === normalizeSurahName(latestHafalanSurat) || s.no === getSurahNumberByName(latestHafalanSurat);
                return `<option value="${s.name}" ${isSelected ? 'selected' : ''}>${s.no}. ${s.name} (${s.nameArab}) — ${s.ayat} Ayat</option>`;
              }).join('')}
            </select>
          </div>

          <!-- Input Rentang Ayat -->
          <div class="sm:col-span-6 lg:col-span-4">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Rentang Ayat:
            </label>
            <div class="flex items-center gap-2">
              <div class="flex-1 flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus-within:ring-2 focus-within:ring-purple-500">
                <span class="text-slate-400 text-xs mr-1.5">Dari:</span>
                <input id="sq-dash-dari" type="number" min="1" value="${latestHafalanFrom}" class="w-full bg-transparent text-slate-800 font-bold outline-none text-xs sm:text-sm">
              </div>
              <span class="text-slate-400 font-bold">-</span>
              <div class="flex-1 flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus-within:ring-2 focus-within:ring-purple-500">
                <span class="text-slate-400 text-xs mr-1.5">S/d:</span>
                <input id="sq-dash-sampai" type="number" min="1" value="${latestHafalanTo}" class="w-full bg-transparent text-slate-800 font-bold outline-none text-xs sm:text-sm">
              </div>
            </div>
          </div>

          <!-- Tombol Buka Pop-up -->
          <div class="sm:col-span-12 lg:col-span-3">
            <button type="button" onclick="openStudentQuranFromDashboard('${student.name.replace(/'/g, "\\'")}')" class="w-full py-2.5 sm:py-2.5 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm">
              <i data-lucide="book-open" class="w-4 h-4"></i>
              <span>Buka Teks & Audio</span>
            </button>
          </div>
        </div>

        <div class="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span class="flex items-center gap-1.5">
            <i data-lucide="info" class="w-3.5 h-3.5 text-purple-500"></i>
            Teks Al-Qur'an resmi Kemenag RI dilengkapi audio murottal & transliterasi latin per ayat.
          </span>
          <span class="hidden sm:inline text-purple-600 font-semibold">Tersedia 114 Surat Lengkap</span>
        </div>
      </div>

      <!-- Riwayat Laporan & Catatan Guru -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 class="font-bold text-slate-800 flex items-center gap-2"><i data-lucide="history" class="w-5 h-5 text-slate-600"></i> Riwayat Belajar & Catatan Guru</h3>
            <p class="text-xs text-slate-500 mt-0.5">Klik pada nama surat untuk langsung membuka mushaf Al-Qur'an dan mendengarkan audio</p>
          </div>
        </div>
        
        <div class="overflow-x-auto w-full">
          <table class="w-full text-sm min-w-[600px]">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="text-left px-5 py-4 font-semibold text-slate-600 w-28">Tanggal</th>
                <th class="text-left px-5 py-4 font-semibold text-slate-600 w-24">Tipe</th>
                <th class="text-left px-5 py-4 font-semibold text-slate-600 w-52">Capaian</th>
                <th class="text-left px-5 py-4 font-semibold text-slate-600">Catatan Guru</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              ${progressReports.length ? [...progressReports].sort((a,b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0) || new Date(b.created_at || 0) - new Date(a.created_at || 0)).map(r => {
                const isIqro = r.report_type === 'iqro';
                const isHafalan = r.report_type === 'hafalan';
                const typeLabel = isIqro ? '📖 Bacaan' : r.report_type === 'quran' ? '📖 Bacaan' : '📚 Hafalan';
                const safeSurat = (r.surat || '').replace(/'/g, "\\'");
                const fromAy = parseInt(r.ayat_dari) || 1;
                const toAy = parseInt(r.ayat_sampai) || fromAy;

                const detailContent = isIqro 
                  ? `Jilid ${r.iqro_jilid} Halaman ${r.iqro_halaman}`
                  : `
                    <button type="button" onclick="openQuranViewer({ surah: '${safeSurat}', fromAyah: ${fromAy}, toAyah: ${toAy}, studentName: '${student.name.replace(/'/g, "\\'")}', reportType: '${r.report_type}' })" class="text-left font-semibold ${isHafalan ? 'text-purple-700 hover:text-purple-900' : 'text-blue-700 hover:text-blue-900'} hover:underline inline-flex items-center gap-1.5 transition" title="Buka dan dengarkan di Al-Qur'an">
                      <i data-lucide="book-open" class="w-3.5 h-3.5 ${isHafalan ? 'text-purple-500' : 'text-blue-500'}"></i>
                      <span>${r.surat} Ayat ${r.ayat_dari}-${r.ayat_sampai}</span>
                    </button>
                  `;

                return `
                  <tr class="hover:bg-slate-50/50 transition">
                    <td class="px-5 py-4 text-slate-500 whitespace-nowrap">${r.tanggal}</td>
                    <td class="px-5 py-4 whitespace-nowrap"><span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs border border-slate-200 font-semibold">${typeLabel}</span></td>
                    <td class="px-5 py-4 font-semibold text-slate-850">${detailContent}</td>
                    <td class="px-5 py-4 text-slate-600 break-words leading-relaxed">${r.catatan || '<span class="text-slate-400 italic">Tidak ada catatan</span>'}</td>
                  </tr>`;
              }).join('') : `<tr><td colspan="4" class="px-5 py-12 text-center text-slate-400">Belum ada riwayat pembelajaran yang tercatat.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

    </main>
  </div>`;

  if (window.lucide) lucide.createIcons();
}

function updateStudentDashAyatMax() {
  const suratEl = document.getElementById('sq-dash-surat');
  if (!suratEl) return;
  const meta = getSurahMeta(suratEl.value);
  const maxAyat = meta ? meta.ayat : 40;
  const dariEl = document.getElementById('sq-dash-dari');
  const sampaiEl = document.getElementById('sq-dash-sampai');
  if (dariEl) {
    dariEl.max = maxAyat;
    if (parseInt(dariEl.value) > maxAyat) dariEl.value = 1;
  }
  if (sampaiEl) {
    sampaiEl.max = maxAyat;
    sampaiEl.value = maxAyat;
  }
}

function openStudentQuranFromDashboard(studentName) {
  const suratEl = document.getElementById('sq-dash-surat');
  const dariEl = document.getElementById('sq-dash-dari');
  const sampaiEl = document.getElementById('sq-dash-sampai');

  const surahName = suratEl ? suratEl.value : 'An-Naba';
  const fromAyah = dariEl ? (parseInt(dariEl.value) || 1) : 1;
  const toAyah = sampaiEl ? (parseInt(sampaiEl.value) || fromAyah) : fromAyah;

  openQuranViewer({
    surah: surahName,
    fromAyah: Math.min(fromAyah, toAyah),
    toAyah: Math.max(fromAyah, toAyah),
    studentName: studentName || '',
    reportType: 'hafalan'
  });
}

window.updateStudentDashAyatMax = updateStudentDashAyatMax;
window.openStudentQuranFromDashboard = openStudentQuranFromDashboard;

function showChangePasswordModal() {
  const modal = document.createElement('div');
  modal.id = 'change-password-modal';
  modal.className = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 fade-in space-y-4">
      <div class="flex justify-between items-center pb-3 border-b border-slate-100">
        <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
          <i data-lucide="key" class="w-5 h-5 text-emerald-600"></i> Ubah Kata Sandi Siswa
        </h3>
        <button onclick="document.getElementById('change-password-modal').remove()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1">Kata Sandi Lama</label>
          <input id="pwd-old" type="password" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Masukkan sandi saat ini">
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
          <input id="pwd-new" type="password" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Minimal 6 karakter">
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1">Konfirmasi Kata Sandi Baru</label>
          <input id="pwd-confirm" type="password" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Ulangi sandi baru">
        </div>
      </div>
      
      <p id="pwd-error" class="text-red-500 text-xs font-medium hidden"></p>
      
      <div class="flex gap-3 pt-2">
        <button onclick="document.getElementById('change-password-modal').remove()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition">Batal</button>
        <button onclick="saveStudentPassword()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md transition">Simpan Sandi</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  if (window.lucide) lucide.createIcons();
}

async function saveStudentPassword() {
  const oldPwd = document.getElementById('pwd-old').value;
  const newPwd = document.getElementById('pwd-new').value;
  const confirmPwd = document.getElementById('pwd-confirm').value;
  const errorEl = document.getElementById('pwd-error');
  
  errorEl.classList.add('hidden');
  
  if (!oldPwd || !newPwd || !confirmPwd) {
    errorEl.textContent = 'Harap isi semua kolom';
    errorEl.classList.remove('hidden');
    return;
  }
  
  if (newPwd.length < 6) {
    errorEl.textContent = 'Kata sandi baru minimal 6 karakter';
    errorEl.classList.remove('hidden');
    return;
  }
  
  if (newPwd !== confirmPwd) {
    errorEl.textContent = 'Konfirmasi kata sandi baru tidak cocok';
    errorEl.classList.remove('hidden');
    return;
  }
  
  const student = getStudents().find(s => s.__backendId === currentUser.id);
  if (!student) {
    errorEl.textContent = 'Data siswa tidak ditemukan';
    errorEl.classList.remove('hidden');
    return;
  }
  
  const expectedOldPwd = student.password || student.nis || '123456';
  if (oldPwd !== expectedOldPwd) {
    errorEl.textContent = 'Kata sandi lama salah';
    errorEl.classList.remove('hidden');
    return;
  }
  
  student.password = newPwd;
  const r = await window.dataSdk.update(student);
  if (r.isOk) {
    showToast('Kata sandi berhasil diubah!');
    document.getElementById('change-password-modal').remove();
  } else {
    errorEl.textContent = 'Gagal menyimpan ke database Supabase';
    errorEl.classList.remove('hidden');
  }
}

function showPromoteClassModal() {
  const modal = document.createElement('div');
  modal.id = 'promote-class-modal';
  modal.className = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4';
  
  const map = getGradeKelasMap();
  const grades = Object.keys(map);
  const student = getStudents().find(s => s.__backendId === currentUser.id);
  
  const currentGradeIdx = grades.indexOf(student.grade);
  const nextGrade = currentGradeIdx !== -1 && currentGradeIdx + 1 < grades.length ? grades[currentGradeIdx + 1] : student.grade;
  const initialClasses = map[nextGrade] || [];
  
  modal.innerHTML = `
    <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 fade-in space-y-4">
      <div class="flex justify-between items-center pb-3 border-b border-slate-100">
        <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
          <i data-lucide="trending-up" class="w-5 h-5 text-amber-600"></i> Update Kelas / Naik Kelas
        </h3>
        <button onclick="document.getElementById('promote-class-modal').remove()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-855 leading-relaxed">
        <strong>PENTING:</strong> Jika Anda menaikkan kelas, grafik perkembangan (halaman/ayat yang dibaca di kelas sebelumnya) akan di-reset dari 0 untuk melacak progres di kelas baru Anda. Namun, data pencapaian bacaan/hafalan terakhir Anda tidak akan hilang.
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1">Tingkat Baru (Grade)</label>
          <select id="promote-grade" onchange="updatePromoteClassOptions()" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
            ${grades.map(g => `<option value="${g}" ${g === nextGrade ? 'selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1">Kelas Baru</label>
          <select id="promote-kelas" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
            ${initialClasses.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
      </div>
      
      <div class="flex gap-3 pt-2">
        <button onclick="document.getElementById('promote-class-modal').remove()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition">Batal</button>
        <button onclick="saveStudentPromotion()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md transition">Update Kelas</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  if (window.lucide) lucide.createIcons();
}

function updatePromoteClassOptions() {
  const grade = document.getElementById('promote-grade').value;
  const map = getGradeKelasMap();
  const classes = map[grade] || [];
  const classSelect = document.getElementById('promote-kelas');
  classSelect.innerHTML = classes.map(c => `<option value="${c}">${c}</option>`).join('');
}

async function saveStudentPromotion() {
  const grade = document.getElementById('promote-grade').value;
  const kelas = document.getElementById('promote-kelas').value;
  if (!grade || !kelas) { showToast('Harap pilih Tingkat dan Kelas', 'error'); return; }
  
  const student = getStudents().find(s => s.__backendId === currentUser.id);
  if (!student) { showToast('Data siswa tidak ditemukan', 'error'); return; }
  
  const today = new Date().toISOString().split('T')[0];
  
  student.grade = grade;
  student.kelas = kelas;
  student.class_updated_at = today;
  
  const r = await window.dataSdk.update(student);
  if (r.isOk) {
    currentUser.grade = grade;
    currentUser.kelas = kelas;
    saveSession();
    
    showToast('Selamat! Kelas Anda berhasil di-update.', 'success');
    document.getElementById('promote-class-modal').remove();
    render();
  } else {
    showToast('Gagal memperbarui kelas di database Supabase', 'error');
  }
}
