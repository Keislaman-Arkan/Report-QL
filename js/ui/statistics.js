// ============ STATISTICS ============
let statsPeriod = 'semua';
let statsDailyDate = today();
let statsWeekStart = getDefaultStatsWeek().start;
let statsWeekEnd = getDefaultStatsWeek().end;
let statsMonthStart = getDefaultStatsMonth().start;
let statsMonthEnd = getDefaultStatsMonth().end;
let statsYear = new Date().getFullYear();

function getDefaultStatsWeek() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

function getDefaultStatsMonth() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return {
    start: `${y}-${m}`,
    end: `${y}-${m}`
  };
}

function extractDateStr(val) {
  if (!val) return '';
  const s = String(val).trim();
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : s;
}

function extractMonthStr(val) {
  if (!val) return '';
  const s = String(val).trim();
  const match = s.match(/^(\d{4}-\d{2})/);
  return match ? match[1] : s.slice(0, 7);
}

function formatIndoDate(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return dateStr;
}

function formatIndoMonth(monthStr) {
  if (!monthStr) return '-';
  const parts = monthStr.split('-');
  if (parts.length === 2) {
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }
  return monthStr;
}

function setStatsPeriod(p) {
  statsPeriod = p;
  renderPage();
}

function setStatsDailyDate(val) {
  if (!val) return;
  statsDailyDate = val;
  renderPage();
}

function setStatsWeekRange(type, val) {
  if (!val) return;
  if (type === 'start') statsWeekStart = val;
  if (type === 'end') statsWeekEnd = val;
  renderPage();
}

function resetStatsWeekRange() {
  const def = getDefaultStatsWeek();
  statsWeekStart = def.start;
  statsWeekEnd = def.end;
  renderPage();
}

function setStatsMonthRange(type, val) {
  if (!val) return;
  if (type === 'start') statsMonthStart = val;
  if (type === 'end') statsMonthEnd = val;
  renderPage();
}

function resetStatsMonthRange() {
  const def = getDefaultStatsMonth();
  statsMonthStart = def.start;
  statsMonthEnd = def.end;
  renderPage();
}

function setStatsYear(val) {
  if (!val) return;
  statsYear = parseInt(val) || new Date().getFullYear();
  renderPage();
}

function getReportsByPeriod(period) {
  const reports = getReports();
  if (period === 'semua') return reports;
  
  if (period === 'harian') {
    const target = statsDailyDate || today();
    return reports.filter(r => extractDateStr(r.tanggal) === target);
  }
  
  if (period === 'pekanan' || period === 'mingguan') {
    const def = getDefaultStatsWeek();
    const start = statsWeekStart || def.start;
    const end = statsWeekEnd || def.end;
    const minD = start <= end ? start : end;
    const maxD = start <= end ? end : start;
    return reports.filter(r => {
      const d = extractDateStr(r.tanggal);
      return d && d >= minD && d <= maxD;
    });
  }
  
  if (period === 'bulanan') {
    const def = getDefaultStatsMonth();
    const startM = statsMonthStart || def.start;
    const endM = statsMonthEnd || def.end;
    const minM = startM <= endM ? startM : endM;
    const maxM = startM <= endM ? endM : startM;
    return reports.filter(r => {
      const m = extractMonthStr(r.tanggal);
      return m && m >= minM && m <= maxM;
    });
  }
  
  if (period === 'tahunan') {
    const yr = String(statsYear || new Date().getFullYear());
    return reports.filter(r => extractDateStr(r.tanggal).startsWith(yr));
  }
  
  return reports;
}

function getPeriodLabel() {
  if (statsPeriod === 'semua') return 'Semua Data Historis';
  if (statsPeriod === 'harian') return `Harian: ${formatIndoDate(statsDailyDate || today())}`;
  if (statsPeriod === 'pekanan' || statsPeriod === 'mingguan') {
    const def = getDefaultStatsWeek();
    const s = statsWeekStart || def.start;
    const e = statsWeekEnd || def.end;
    const minD = s <= e ? s : e;
    const maxD = s <= e ? e : s;
    return `Pekanan: ${formatIndoDate(minD)} s/d ${formatIndoDate(maxD)}`;
  }
  if (statsPeriod === 'bulanan') {
    const def = getDefaultStatsMonth();
    const s = statsMonthStart || def.start;
    const e = statsMonthEnd || def.end;
    const minM = s <= e ? s : e;
    const maxM = s <= e ? e : s;
    if (minM === maxM) {
      return `Bulan: ${formatIndoMonth(minM)}`;
    }
    return `Rentang Bulan: ${formatIndoMonth(minM)} s/d ${formatIndoMonth(maxM)}`;
  }
  if (statsPeriod === 'tahunan') {
    return `Tahun: ${statsYear || new Date().getFullYear()}`;
  }
  return 'Semua Data';
}

function renderStatistics(el) {
  const reports = getReportsByPeriod(statsPeriod);
  const latestReports = getLatestStudentStatus(reports);
  const students = getStudents();
  const map = getGradeKelasMap();
  
  const lancar = latestReports.filter(r => r.status === 'Lancar').length;
  const belumLancar = latestReports.filter(r => r.status !== 'Lancar').length;
  const total = latestReports.length || 1;
  const maxVal = Math.max(lancar, belumLancar, 1);


  el.innerHTML = `
  <div class="fade-in max-w-7xl mx-auto space-y-6">
    <!-- Header Halaman -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <div class="p-2 bg-emerald-100 rounded-xl text-emerald-700"><i data-lucide="bar-chart-2" class="w-6 h-6"></i></div>
          Statistik Laporan Pembelajaran
        </h2>
        <p class="text-slate-500 text-sm mt-1">Pantau perkembangan kelancaran dan ketuntasan target belajar Al-Qur'an siswa</p>
      </div>
      <div class="flex gap-2 w-full md:w-auto">
        <button onclick="exportStatsPDF()" class="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition">
          <i data-lucide="file-text" class="w-4 h-4"></i> Unduh PDF
        </button>
        <button onclick="printStats()" class="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition">
          <i data-lucide="printer" class="w-4 h-4"></i> Cetak Statistik
        </button>
      </div>
    </div>

    <!-- Filter Periode & Date/Month Range Selector -->
    <div class="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <i data-lucide="calendar" class="w-4 h-4 text-emerald-600"></i>
          <span class="text-xs font-bold uppercase tracking-wider text-slate-600">Pilih Periode:</span>
        </div>
        <div class="flex gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto text-xs font-semibold">
          <button onclick="setStatsPeriod('semua')" class="px-3.5 py-1.5 rounded-lg transition ${statsPeriod==='semua' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}">Semua Data</button>
          <button onclick="setStatsPeriod('harian')" class="px-3.5 py-1.5 rounded-lg transition ${statsPeriod==='harian' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}">📅 Harian</button>
          <button onclick="setStatsPeriod('pekanan')" class="px-3.5 py-1.5 rounded-lg transition ${(statsPeriod==='pekanan'||statsPeriod==='mingguan') ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}">🗓️ Pekanan (Rentang)</button>
          <button onclick="setStatsPeriod('bulanan')" class="px-3.5 py-1.5 rounded-lg transition ${statsPeriod==='bulanan' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}">📆 Bulanan (Rentang)</button>
          <button onclick="setStatsPeriod('tahunan')" class="px-3.5 py-1.5 rounded-lg transition ${statsPeriod==='tahunan' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}">Tahunan</button>
        </div>
      </div>

      <!-- Detail Input Pemilih Tanggal / Bulan Berdasarkan Periode yang Dipilih -->
      ${statsPeriod === 'harian' ? `
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-slate-100">
          <span class="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <i data-lucide="calendar" class="w-4 h-4 text-emerald-600"></i> Tanggal Laporan:
          </span>
          <div class="flex items-center gap-2">
            <input type="date" value="${statsDailyDate}" onchange="setStatsDailyDate(this.value)" class="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
            <button type="button" onclick="setStatsDailyDate('${today()}')" class="px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-xl font-bold transition">Hari Ini</button>
          </div>
        </div>
      ` : ''}

      ${(statsPeriod === 'pekanan' || statsPeriod === 'mingguan') ? `
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-slate-100 flex-wrap">
          <span class="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <i data-lucide="calendar-range" class="w-4 h-4 text-emerald-600"></i> Rentang Tanggal Pekanan:
          </span>
          <div class="flex items-center gap-2 flex-wrap">
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-slate-500">Dari:</span>
              <input type="date" value="${statsWeekStart}" onchange="setStatsWeekRange('start', this.value)" class="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-slate-500">Sampai:</span>
              <input type="date" value="${statsWeekEnd}" onchange="setStatsWeekRange('end', this.value)" class="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
            </div>
            <button type="button" onclick="resetStatsWeekRange()" class="px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-xl font-bold transition">7 Hari Terakhir</button>
          </div>
        </div>
      ` : ''}

      ${statsPeriod === 'bulanan' ? `
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-slate-100 flex-wrap">
          <span class="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <i data-lucide="calendar-days" class="w-4 h-4 text-emerald-600"></i> Rentang Bulan:
          </span>
          <div class="flex items-center gap-2 flex-wrap">
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-slate-500">Dari Bulan:</span>
              <input type="month" value="${statsMonthStart}" onchange="setStatsMonthRange('start', this.value)" class="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-slate-500">Sampai Bulan:</span>
              <input type="month" value="${statsMonthEnd}" onchange="setStatsMonthRange('end', this.value)" class="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
            </div>
            <button type="button" onclick="resetStatsMonthRange()" class="px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-xl font-bold transition">Bulan Ini</button>
          </div>
        </div>
      ` : ''}

      ${statsPeriod === 'tahunan' ? `
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-slate-100">
          <span class="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <i data-lucide="calendar" class="w-4 h-4 text-emerald-600"></i> Tahun:
          </span>
          <div class="flex items-center gap-2">
            <input type="number" min="2020" max="2035" value="${statsYear}" onchange="setStatsYear(this.value)" class="w-28 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
            <button type="button" onclick="setStatsYear(new Date().getFullYear())" class="px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-xl font-bold transition">Tahun Ini</button>
          </div>
        </div>
      ` : ''}

      <!-- Indikator Keterangan Periode Aktif -->
      <div class="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
        <div>
          Periode Terpilih: <strong class="text-emerald-800">${getPeriodLabel()}</strong>
        </div>
        <div class="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-bold">
          ${reports.length} Entri Laporan Ditemukan
        </div>
      </div>
    </div>

    <!-- Grid Statistik Utama -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Card 1: Kelancaran Laporan -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 class="font-bold text-slate-800 flex items-center gap-2 text-base">
              <i data-lucide="check-circle" class="w-5 h-5 text-emerald-600"></i>
              Status Kelancaran Bacaan
            </h3>
            <span class="text-xs text-slate-400">Update Terakhir</span>
          </div>
          <div class="space-y-5">
            <div>
              <div class="flex justify-between text-sm mb-1.5">
                <span class="text-emerald-700 font-bold flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Lancar
                </span>
                <span class="font-bold text-slate-800">${lancar} <span class="text-slate-400 font-normal">(${Math.round(lancar / total * 100)}%)</span></span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div class="h-3 rounded-full bg-emerald-500 transition-all duration-300" style="width:${lancar / maxVal * 100}%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1.5">
                <span class="text-amber-700 font-bold flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Belum Lancar
                </span>
                <span class="font-bold text-slate-800">${belumLancar} <span class="text-slate-400 font-normal">(${Math.round(belumLancar / total * 100)}%)</span></span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div class="h-3 rounded-full bg-amber-500 transition-all duration-300" style="width:${belumLancar / maxVal * 100}%"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-center">
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div class="text-lg font-black text-slate-800">${latestReports.length}</div>
            <div class="text-[11px] text-slate-400 font-medium">Siswa Disimak</div>
          </div>
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div class="text-lg font-black text-emerald-600">${Math.round(lancar / total * 100)}%</div>
            <div class="text-[11px] text-slate-400 font-medium">Tingkat Kelancaran</div>
          </div>
        </div>
      </div>
      
      <!-- Card 2: Progress Ketuntasan Target Per Tingkat (Dengan Jumlah Siswa Tercapai & Belum) -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h3 class="font-bold text-slate-800 flex items-center gap-2 text-base">
            <i data-lucide="target" class="w-5 h-5 text-indigo-600"></i>
            Ketuntasan Target Per Tingkat
          </h3>
          <span class="text-xs text-slate-400">${students.length} Total Siswa</span>
        </div>

        <div class="space-y-4 max-h-[480px] overflow-y-auto pr-1">
          ${Object.keys(map).map(gradeName => {
            const ks = students.filter(s => s.grade === gradeName);
            const totalSiswa = ks.length;
            const stMetrics = calculateTuntasMetrics(ks, reports);
            
            const tercapaiB = stMetrics.tuntasBacaan;
            const hampirTercapaiB = stMetrics.hampirTercapaiBacaan;
            const tertinggalB = stMetrics.tertinggalBacaan;
            const pctBacaan = totalSiswa > 0 ? Math.round((tercapaiB / totalSiswa) * 100) : 0;
            
            const tercapaiH = stMetrics.tuntasHafalan;
            const hampirTercapaiH = stMetrics.hampirTercapaiHafalan;
            const tertinggalH = stMetrics.tertinggalHafalan;
            const pctHafalan = totalSiswa > 0 ? Math.round((tercapaiH / totalSiswa) * 100) : 0;
            
            return `
            <div class="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-slate-200 transition">
              <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-slate-800 text-sm">${gradeName}</span>
                <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-600">${totalSiswa} Siswa</span>
              </div>

              <!-- Target Bacaan -->
              <div class="mb-3 bg-white p-2.5 rounded-xl border border-slate-100">
                <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span class="text-emerald-700 flex items-center gap-1"><i data-lucide="book" class="w-3.5 h-3.5"></i> Target Bacaan</span>
                  <span class="font-bold">${pctBacaan}%</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2 mb-1.5 overflow-hidden">
                  <div class="h-2 rounded-full bg-emerald-500" style="width:${pctBacaan}%"></div>
                </div>
                <div class="flex justify-between text-[11px] font-medium text-slate-500 gap-1 flex-wrap">
                  <span class="text-emerald-700">✓ Tercapai: <strong>${tercapaiB}</strong></span>
                  <span class="text-amber-600">⚡ Hampir: <strong>${hampirTercapaiB}</strong></span>
                  <span class="text-rose-600">✗ Tertinggal: <strong>${tertinggalB}</strong></span>
                </div>
              </div>

              <!-- Target Hafalan -->
              <div class="bg-white p-2.5 rounded-xl border border-slate-100">
                <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span class="text-purple-700 flex items-center gap-1"><i data-lucide="bookmark" class="w-3.5 h-3.5"></i> Target Hafalan</span>
                  <span class="font-bold">${pctHafalan}%</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2 mb-1.5 overflow-hidden">
                  <div class="h-2 rounded-full bg-purple-500" style="width:${pctHafalan}%"></div>
                </div>
                <div class="flex justify-between text-[11px] font-medium text-slate-500 gap-1 flex-wrap">
                  <span class="text-purple-700">✓ Tercapai: <strong>${tercapaiH}</strong></span>
                  <span class="text-amber-600">⚡ Hampir: <strong>${hampirTercapaiH}</strong></span>
                  <span class="text-rose-600">✗ Tertinggal: <strong>${tertinggalH}</strong></span>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  </div>`;

  if (window.lucide) lucide.createIcons();
}

// ============ EXPORT & PRINT ============

function exportStatsPDF() {
  const reports = getReportsByPeriod(statsPeriod);
  const latestReports = getLatestStudentStatus(reports);
  const students = getStudents();
  const map = getGradeKelasMap();
  const lancar = latestReports.filter(r => r.status === 'Lancar').length;
  const belumLancar = latestReports.filter(r => r.status !== 'Lancar').length;
  const total = latestReports.length || 1;
  const reportCount = reports.length;
  const avg = latestReports.length > 0 ? Math.round(lancar / latestReports.length * 100) : 0;

  let grandTotalSiswa = 0;
  let grandTercapaiBacaan = 0;
  let grandHampirTercapaiBacaan = 0;
  let grandTertinggalBacaan = 0;
  let grandTercapaiHafalan = 0;
  let grandHampirTercapaiHafalan = 0;
  let grandTertinggalHafalan = 0;

  const tableRowsHtml = Object.keys(map).map(gradeName => {
    const ks = students.filter(s => s.grade === gradeName);
    const totalSiswa = ks.length;
    const stMetrics = calculateTuntasMetrics(ks, reports);
    
    const tercapaiB = stMetrics.tuntasBacaan;
    const hampirTercapaiB = stMetrics.hampirTercapaiBacaan;
    const tertinggalB = stMetrics.tertinggalBacaan;
    const pctB = totalSiswa > 0 ? Math.round((tercapaiB / totalSiswa) * 100) : 0;

    const tercapaiH = stMetrics.tuntasHafalan;
    const hampirTercapaiH = stMetrics.hampirTercapaiHafalan;
    const tertinggalH = stMetrics.tertinggalHafalan;
    const pctH = totalSiswa > 0 ? Math.round((tercapaiH / totalSiswa) * 100) : 0;

    grandTotalSiswa += totalSiswa;
    grandTercapaiBacaan += tercapaiB;
    grandHampirTercapaiBacaan += hampirTercapaiB;
    grandTertinggalBacaan += tertinggalB;
    grandTercapaiHafalan += tercapaiH;
    grandHampirTercapaiHafalan += hampirTercapaiH;
    grandTertinggalHafalan += tertinggalH;

    return `
      <tr>
        <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 8px;">${gradeName}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${totalSiswa}</td>
        <td style="text-align: center; font-weight: bold; color: #047857; border: 1px solid #cbd5e1; padding: 8px; background-color: #f0fdf4;">${tercapaiB}</td>
        <td style="text-align: center; font-weight: bold; color: #b45309; border: 1px solid #cbd5e1; padding: 8px; background-color: #fffbeb;">${hampirTercapaiB}</td>
        <td style="text-align: center; color: #b91c1c; border: 1px solid #cbd5e1; padding: 8px; background-color: #fef2f2;">${tertinggalB}</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px;">${pctB}%</td>
        <td style="text-align: center; font-weight: bold; color: #6d28d9; border: 1px solid #cbd5e1; padding: 8px; background-color: #faf5ff;">${tercapaiH}</td>
        <td style="text-align: center; font-weight: bold; color: #b45309; border: 1px solid #cbd5e1; padding: 8px; background-color: #fffbeb;">${hampirTercapaiH}</td>
        <td style="text-align: center; color: #b91c1c; border: 1px solid #cbd5e1; padding: 8px; background-color: #fef2f2;">${tertinggalH}</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px;">${pctH}%</td>
      </tr>
    `;
  }).join('');

  const grandPctBacaan = grandTotalSiswa > 0 ? Math.round((grandTercapaiBacaan / grandTotalSiswa) * 100) : 0;
  const grandPctHafalan = grandTotalSiswa > 0 ? Math.round((grandTercapaiHafalan / grandTotalSiswa) * 100) : 0;

  const totalRowHtml = `
    <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #059669;">
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">TOTAL KESELURUHAN</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${grandTotalSiswa}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #047857; background-color: #dcfce7;">${grandTercapaiBacaan}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #b45309; background-color: #fef3c7;">${grandHampirTercapaiBacaan}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #b91c1c; background-color: #fee2e2;">${grandTertinggalBacaan}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${grandPctBacaan}%</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #6d28d9; background-color: #f3e8ff;">${grandTercapaiHafalan}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #b45309; background-color: #fef3c7;">${grandHampirTercapaiHafalan}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #b91c1c; background-color: #fee2e2;">${grandTertinggalHafalan}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${grandPctHafalan}%</td>
    </tr>
  `;
  
  let htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Laporan Statistik Pembelajaran Al-Qur'an</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 25px; color: #1e293b; line-height: 1.5; }
        h1 { color: #047857; border-bottom: 3px solid #047857; padding-bottom: 8px; font-size: 20px; }
        h2 { color: #0f172a; margin-top: 22px; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
        th { padding: 8px; text-align: left; border: 1px solid #cbd5e1; font-weight: bold; }
        td { padding: 8px; border: 1px solid #cbd5e1; }
        .period-box { background: #f0fdf4; border-left: 4px solid #047857; padding: 10px 14px; margin: 12px 0 20px 0; font-size: 13px; color: #065f46; font-weight: 500; }
        .stats-box { margin-top: 20px; padding: 14px; background-color: #f8fafc; border-left: 4px solid #047857; font-size: 13px; border-radius: 4px; }
        .footer { margin-top: 25px; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
      </style>
    </head>
    <body>
      <h1>📊 Laporan Statistik Pembelajaran Al-Qur'an</h1>
      <div class="period-box">
        Periode Laporan: <strong>${getPeriodLabel()}</strong> &bull; Total Laporan Masuk: <strong>${reportCount}</strong> entri
      </div>
      
      <h2>1. Status Kelancaran Bacaan (Berdasarkan Update Terakhir Siswa)</h2>
      <table>
        <tr style="background-color: #f1f5f9;"><th>Status</th><th>Jumlah Siswa</th><th>Persentase</th></tr>
        <tr><td style="color: #047857; font-weight: bold;">✓ Lancar</td><td><strong>${lancar}</strong> siswa</td><td>${latestReports.length > 0 ? Math.round(lancar / total * 100) : 0}%</td></tr>
        <tr><td style="color: #b45309; font-weight: bold;">⚠ Belum Lancar</td><td><strong>${belumLancar}</strong> siswa</td><td>${latestReports.length > 0 ? Math.round(belumLancar / total * 100) : 0}%</td></tr>
        <tr style="background-color: #ecfdf5; font-weight: bold;"><td>Total Siswa Disimak</td><td>${latestReports.length} siswa</td><td>100%</td></tr>
      </table>
      
      <h2>2. Progress Ketuntasan Target Per Tingkat (Grade)</h2>
      <table>
        <thead>
          <tr style="background-color: #064e3b; color: white;">
            <th rowspan="2" style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: middle;">Tingkat (Grade)</th>
            <th rowspan="2" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; vertical-align: middle;">Total Siswa</th>
            <th colspan="4" style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #047857;">Target Bacaan (Iqro / Al-Qur'an)</th>
            <th colspan="4" style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #6d28d9;">Target Hafalan</th>
          </tr>
          <tr style="color: white;">
            <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #059669; font-size: 11px;">Tercapai</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #059669; font-size: 11px;">Hampir Tercapai</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #059669; font-size: 11px;">Tertinggal</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #059669; font-size: 11px;">%</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #7c3aed; font-size: 11px;">Tercapai</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #7c3aed; font-size: 11px;">Hampir Tercapai</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #7c3aed; font-size: 11px;">Tertinggal</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #7c3aed; font-size: 11px;">%</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
          ${totalRowHtml}
        </tbody>
      </table>
      <div style="font-size: 11px; color: #64748b; margin-top: 6px; font-style: italic;">
        * Keterangan Kategori Ketuntasan: <strong>Tercapai</strong> (Mencapai target kurikulum), <strong>Hampir Tercapai</strong> (Bacaan &le; 15 halaman sebelum target / Hafalan &le; 3 surat sebelum target), <strong>Tertinggal</strong> (Bacaan &gt; 15 halaman sebelum target / Hafalan &gt; 3 surat sebelum target).
      </div>
      
      <h2>3. Komposisi Tipe Laporan Masuk</h2>
      <table>
        <tr style="background-color: #f1f5f9;"><th>Tipe Laporan</th><th>Jumlah Entri</th></tr>
        <tr><td>📖 Iqro'</td><td>${reports.filter(r => r.report_type === 'iqro').length} laporan</td></tr>
        <tr><td>📖 Bacaan Al-Qur'an</td><td>${reports.filter(r => r.report_type === 'quran').length} laporan</td></tr>
        <tr><td>📚 Hafalan</td><td>${reports.filter(r => r.report_type === 'hafalan').length} laporan</td></tr>
      </table>
      
      <div class="stats-box">
        <strong>📌 Ringkasan Umum:</strong><br>
        &bull; Total Siswa Terdaftar: <strong>${students.length}</strong> siswa<br>
        &bull; Total Entri Laporan Dalam Periode Ini: <strong>${reportCount}</strong> entri<br>
        &bull; Rata-rata Tingkat Kelancaran Siswa: <strong>${avg}%</strong>
      </div>
      
      <div class="footer">
        Dicetak secara otomatis dari Sistem IKASI Qur'an Learning pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} pukul ${new Date().toLocaleTimeString('id-ID')}.
      </div>
    </body>
  </html>`;
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Statistik-${statsPeriod}-${today().replace(/-/g, '')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  showToast('Laporan statistik berhasil diunduh', 'success');
}

function printStats() {
  const reports = getReportsByPeriod(statsPeriod);
  const latestReports = getLatestStudentStatus(reports);
  const students = getStudents();
  const map = getGradeKelasMap();
  const lancar = latestReports.filter(r => r.status === 'Lancar').length;
  const belumLancar = latestReports.filter(r => r.status !== 'Lancar').length;
  const total = latestReports.length || 1;
  const reportCount = reports.length;

  let grandTotalSiswa = 0;
  let grandTercapaiBacaan = 0;
  let grandHampirTercapaiBacaan = 0;
  let grandTertinggalBacaan = 0;
  let grandTercapaiHafalan = 0;
  let grandHampirTercapaiHafalan = 0;
  let grandTertinggalHafalan = 0;

  const tableRowsHtml = Object.keys(map).map(gradeName => {
    const ks = students.filter(s => s.grade === gradeName);
    const totalSiswa = ks.length;
    const stMetrics = calculateTuntasMetrics(ks, reports);
    
    const tercapaiB = stMetrics.tuntasBacaan;
    const hampirTercapaiB = stMetrics.hampirTercapaiBacaan;
    const tertinggalB = stMetrics.tertinggalBacaan;
    const pctB = totalSiswa > 0 ? Math.round((tercapaiB / totalSiswa) * 100) : 0;

    const tercapaiH = stMetrics.tuntasHafalan;
    const hampirTercapaiH = stMetrics.hampirTercapaiHafalan;
    const tertinggalH = stMetrics.tertinggalHafalan;
    const pctH = totalSiswa > 0 ? Math.round((tercapaiH / totalSiswa) * 100) : 0;

    grandTotalSiswa += totalSiswa;
    grandTercapaiBacaan += tercapaiB;
    grandHampirTercapaiBacaan += hampirTercapaiB;
    grandTertinggalBacaan += tertinggalB;
    grandTercapaiHafalan += tercapaiH;
    grandHampirTercapaiHafalan += hampirTercapaiH;
    grandTertinggalHafalan += tertinggalH;

    return `
      <tr>
        <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 7px;">${gradeName}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 7px;">${totalSiswa}</td>
        <td style="text-align: center; font-weight: bold; color: #047857; border: 1px solid #cbd5e1; padding: 7px; background-color: #f0fdf4;">${tercapaiB}</td>
        <td style="text-align: center; font-weight: bold; color: #b45309; border: 1px solid #cbd5e1; padding: 7px; background-color: #fffbeb;">${hampirTercapaiB}</td>
        <td style="text-align: center; color: #b91c1c; border: 1px solid #cbd5e1; padding: 7px; background-color: #fef2f2;">${tertinggalB}</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 7px;">${pctB}%</td>
        <td style="text-align: center; font-weight: bold; color: #6d28d9; border: 1px solid #cbd5e1; padding: 7px; background-color: #faf5ff;">${tercapaiH}</td>
        <td style="text-align: center; font-weight: bold; color: #b45309; border: 1px solid #cbd5e1; padding: 7px; background-color: #fffbeb;">${hampirTercapaiH}</td>
        <td style="text-align: center; color: #b91c1c; border: 1px solid #cbd5e1; padding: 7px; background-color: #fef2f2;">${tertinggalH}</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 7px;">${pctH}%</td>
      </tr>
    `;
  }).join('');

  const grandPctBacaan = grandTotalSiswa > 0 ? Math.round((grandTercapaiBacaan / grandTotalSiswa) * 100) : 0;
  const grandPctHafalan = grandTotalSiswa > 0 ? Math.round((grandTercapaiHafalan / grandTotalSiswa) * 100) : 0;

  const totalRowHtml = `
    <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #059669;">
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">TOTAL KESELURUHAN</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${grandTotalSiswa}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #047857; background-color: #dcfce7;">${grandTercapaiBacaan}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #b45309; background-color: #fef3c7;">${grandHampirTercapaiBacaan}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #b91c1c; background-color: #fee2e2;">${grandTertinggalBacaan}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${grandPctBacaan}%</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #6d28d9; background-color: #f3e8ff;">${grandTercapaiHafalan}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #b45309; background-color: #fef3c7;">${grandHampirTercapaiHafalan}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #b91c1c; background-color: #fee2e2;">${grandTertinggalHafalan}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${grandPctHafalan}%</td>
    </tr>
  `;
  
  let printContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Cetak Laporan Statistik Pembelajaran</title>
      <style>
        @media print {
          body { margin: 0; padding: 15px; }
          .no-print { display: none !important; }
        }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.5; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; }
        h1 { color: #047857; text-align: center; border-bottom: 3px solid #047857; padding-bottom: 8px; font-size: 22px; margin-bottom: 5px; }
        .header-info { text-align: center; margin-bottom: 20px; color: #475569; font-size: 13px; font-weight: 500; }
        h2 { color: #0f172a; margin-top: 25px; font-size: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
        th { padding: 7px; text-align: left; }
        td { padding: 7px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; }
        .stat-card { padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #047857; border-radius: 6px; }
        .stat-value { font-size: 22px; font-weight: bold; color: #047857; }
        .stat-label { font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600; text-transform: uppercase; }
        button { padding: 10px 18px; background-color: #047857; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 13px; }
        button:hover { background-color: #065f46; }
        .no-print { text-align: center; margin-bottom: 25px; background: #f1f5f9; padding: 12px; border-radius: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="no-print">
          <button onclick="window.print()">🖨️ Cetak Dokumen Sekarang</button>
          <button onclick="window.close()" style="background-color: #64748b; margin-left: 8px;">❌ Tutup</button>
        </div>
        
        <h1>📊 Laporan Statistik Pembelajaran Al-Qur'an</h1>
        <div class="header-info">
          Periode: <strong>${getPeriodLabel()}</strong><br>
          Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} pukul ${new Date().toLocaleTimeString('id-ID')}
        </div>
        
        <h2>1. Status Kelancaran Bacaan (Berdasarkan Update Terakhir Siswa)</h2>
        <table>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #cbd5e1; padding: 8px;">Status</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">Jumlah Siswa</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">Persentase</th>
          </tr>
          <tr>
            <td style="font-weight:bold; color:#047857; border: 1px solid #cbd5e1; padding: 8px;">✓ Lancar</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;"><strong>${lancar}</strong> siswa</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${latestReports.length > 0 ? Math.round(lancar / total * 100) : 0}%</td>
          </tr>
          <tr>
            <td style="font-weight:bold; color:#b45309; border: 1px solid #cbd5e1; padding: 8px;">⚠ Belum Lancar</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;"><strong>${belumLancar}</strong> siswa</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${latestReports.length > 0 ? Math.round(belumLancar / total * 100) : 0}%</td>
          </tr>
          <tr style="background-color: #ecfdf5; font-weight: bold;">
            <td style="border: 1px solid #cbd5e1; padding: 8px;">Total Siswa Disimak</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${latestReports.length} siswa</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">100%</td>
          </tr>
        </table>
        
        <h2>2. Progress Ketuntasan Target Per Tingkat (Grade)</h2>
        <table>
          <thead>
            <tr style="background-color: #064e3b; color: white;">
              <th rowspan="2" style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: middle;">Tingkat (Grade)</th>
              <th rowspan="2" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; vertical-align: middle;">Total Siswa</th>
              <th colspan="4" style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #047857;">Target Bacaan (Iqro / Al-Qur'an)</th>
              <th colspan="4" style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #6d28d9;">Target Hafalan</th>
            </tr>
            <tr style="color: white;">
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #059669; font-size: 11px;">Tercapai</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #059669; font-size: 11px;">Hampir Tercapai</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #059669; font-size: 11px;">Tertinggal</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #059669; font-size: 11px;">%</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #7c3aed; font-size: 11px;">Tercapai</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #7c3aed; font-size: 11px;">Hampir Tercapai</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #7c3aed; font-size: 11px;">Tertinggal</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: #7c3aed; font-size: 11px;">%</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
            ${totalRowHtml}
          </tbody>
        </table>
        <div style="font-size: 11px; color: #64748b; margin-top: 6px; font-style: italic;">
          * Keterangan Kategori Ketuntasan: <strong>Tercapai</strong> (Mencapai target kurikulum), <strong>Hampir Tercapai</strong> (Bacaan &le; 15 halaman sebelum target / Hafalan &le; 3 surat sebelum target), <strong>Tertinggal</strong> (Bacaan &gt; 15 halaman sebelum target / Hafalan &gt; 3 surat sebelum target).
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${students.length}</div>
            <div class="stat-label">Total Siswa Terdaftar</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${reportCount}</div>
            <div class="stat-label">Total Laporan Masuk</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Math.round(lancar / total * 100)}%</div>
            <div class="stat-label">Tingkat Kelancaran</div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
  }
}
