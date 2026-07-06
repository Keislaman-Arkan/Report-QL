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
  if (hafalanReports.length > 0) {
    const latest = hafalanReports[0];
    isHafalanTuntas = getHafalanScore(latest.juz, latest.surat, latest.ayat_sampai) >= targetHafalanScore;
    currentHafalanText = `${latest.surat} Ayat ${latest.ayat_dari}-${latest.ayat_sampai}`;
  }

  // Calculate accumulated progress (total read/memorized)
  let totalHal = 0;
  let totalAyatBacaan = 0;
  let totalAyatHafalan = 0;
  
  const sortedIqro = stReports.filter(cr => cr.report_type === 'iqro').sort((a,b) => new Date(a.tanggal || 0) - new Date(b.tanggal || 0) || new Date(a.created_at || 0) - new Date(b.created_at || 0));
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
  
  stReports.forEach(cr => {
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
        <button onclick="handleLogout()" class="bg-emerald-700/60 hover:bg-emerald-700 text-white border border-emerald-600 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition">
          <i data-lucide="log-out" class="w-4 h-4"></i> Keluar
        </button>
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
        <div class="flex flex-col items-start sm:items-end text-left sm:text-right">
          <span class="bg-slate-100 text-slate-600 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200">${student.grade} - Kelas ${student.kelas}</span>
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
        </div>

      </div>

      <!-- Riwayat Laporan & Catatan Guru -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 class="font-bold text-slate-800 flex items-center gap-2"><i data-lucide="history" class="w-5 h-5 text-slate-600"></i> Riwayat Belajar & Catatan Guru</h3>
          <p class="text-xs text-slate-500 mt-1">Siswa dapat melihat catatan dari guru di setiap sesi laporan pembelajaran</p>
        </div>
        
        <div class="overflow-x-auto w-full">
          <table class="w-full text-sm min-w-[600px]">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="text-left px-5 py-4 font-semibold text-slate-600 w-28">Tanggal</th>
                <th class="text-left px-5 py-4 font-semibold text-slate-600 w-24">Tipe</th>
                <th class="text-left px-5 py-4 font-semibold text-slate-600 w-44">Capaian</th>
                <th class="text-left px-5 py-4 font-semibold text-slate-600">Catatan Guru</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              ${reports.length ? reports.sort((a,b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0) || new Date(b.created_at || 0) - new Date(a.created_at || 0)).map(r => {
                const isIqro = r.report_type === 'iqro';
                const typeLabel = isIqro ? '📖 Bacaan' : r.report_type === 'quran' ? '📖 Bacaan' : '📚 Hafalan';
                const detail = isIqro ? `Jilid ${r.iqro_jilid} Halaman ${r.iqro_halaman}` : `${r.surat} Ayat ${r.ayat_dari}-${r.ayat_sampai}`;
                return `
                  <tr class="hover:bg-slate-50/50 transition">
                    <td class="px-5 py-4 text-slate-500 whitespace-nowrap">${r.tanggal}</td>
                    <td class="px-5 py-4 whitespace-nowrap"><span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs border border-slate-200 font-semibold">${typeLabel}</span></td>
                    <td class="px-5 py-4 font-semibold text-slate-850">${detail}</td>
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

