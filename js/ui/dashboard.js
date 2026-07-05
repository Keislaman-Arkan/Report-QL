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
