// ============ STATISTICS ============
let statsPeriod = 'semua';

function getReportsByPeriod(period) {
  const reports = getReports();
  const now = new Date();
  if (period === 'semua') return reports;
  if (period === 'harian') return reports.filter(r => r.tanggal === today());
  if (period === 'mingguan') {
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    return reports.filter(r => { const d = new Date(r.tanggal); return d >= weekStart && d <= weekEnd; });
  }
  if (period === 'bulanan') return reports.filter(r => new Date(r.tanggal).getMonth() === now.getMonth() && new Date(r.tanggal).getFullYear() === now.getFullYear());
  if (period === 'tahunan') return reports.filter(r => new Date(r.tanggal).getFullYear() === now.getFullYear());
  return reports;
}

function renderStatistics(el) {
  const reports = getReportsByPeriod(statsPeriod);
  const latestReports = getLatestStudentStatus(reports);
  const students = getStudents();
  const map = getGradeKelasMap();
  
  const lancar = latestReports.filter(r=>r.status==='Lancar').length;
  const mengulang = latestReports.filter(r=>r.status==='Mengulang').length;
  const tidakLancar = latestReports.filter(r=>r.status==='Tidak Lancar').length;
  const total = latestReports.length || 1;
  const maxVal = Math.max(lancar, mengulang, tidakLancar, 1);
  
  el.innerHTML = `
  <div class="fade-in max-w-7xl mx-auto">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Statistik Laporan</h2>
      <div class="flex gap-2 w-full md:w-auto">
        <button onclick="exportStatsPDF()" class="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm"><i data-lucide="file-pdf" class="w-4 h-4"></i>Unduh PDF</button>
        <button onclick="printStats()" class="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm"><i data-lucide="printer" class="w-4 h-4"></i>Cetak</button>
      </div>
    </div>

    <div class="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scroll">
      <button onclick="statsPeriod='semua';renderPage()" class="shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition ${statsPeriod==='semua'?'bg-emerald-600 text-white shadow-md':'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}">Semua</button>
      <button onclick="statsPeriod='harian';renderPage()" class="shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition ${statsPeriod==='harian'?'bg-emerald-600 text-white shadow-md':'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}">Harian</button>
      <button onclick="statsPeriod='mingguan';renderPage()" class="shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition ${statsPeriod==='mingguan'?'bg-emerald-600 text-white shadow-md':'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}">Mingguan</button>
      <button onclick="statsPeriod='bulanan';renderPage()" class="shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition ${statsPeriod==='bulanan'?'bg-emerald-600 text-white shadow-md':'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}">Bulanan</button>
      <button onclick="statsPeriod='tahunan';renderPage()" class="shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition ${statsPeriod==='tahunan'?'bg-emerald-600 text-white shadow-md':'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}">Tahunan</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 class="font-bold text-slate-700 mb-4">Status Kelancaran (Berdasarkan Update Terakhir)</h3>
        <div class="space-y-4">
          <div><div class="flex justify-between text-sm mb-1"><span class="text-emerald-600 font-bold">Lancar</span><span class="font-semibold text-slate-700">${lancar} <span class="text-slate-400 font-normal">(${Math.round(lancar/total*100)}%)</span></span></div><div class="w-full bg-slate-100 rounded-full h-3"><div class="h-3 rounded-full bg-emerald-500" style="width:${lancar/maxVal*100}%"></div></div></div>
          <div><div class="flex justify-between text-sm mb-1"><span class="text-amber-600 font-bold">Mengulang</span><span class="font-semibold text-slate-700">${mengulang} <span class="text-slate-400 font-normal">(${Math.round(mengulang/total*100)}%)</span></span></div><div class="w-full bg-slate-100 rounded-full h-3"><div class="h-3 rounded-full bg-amber-500" style="width:${mengulang/maxVal*100}%"></div></div></div>
          <div><div class="flex justify-between text-sm mb-1"><span class="text-red-600 font-bold">Tidak Lancar</span><span class="font-semibold text-slate-700">${tidakLancar} <span class="text-slate-400 font-normal">(${Math.round(tidakLancar/total*100)}%)</span></span></div><div class="w-full bg-slate-100 rounded-full h-3"><div class="h-3 rounded-full bg-red-500" style="width:${tidakLancar/maxVal*100}%"></div></div></div>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 class="font-bold text-slate-700 mb-4">Progress Ketuntasan Target Per Tingkat</h3>
        <div class="space-y-4">
          ${Object.keys(map).map(gradeName => {
            const ks = students.filter(s => s.grade === gradeName);
            const stMetrics = calculateTuntasMetrics(ks, reports);
            const pctBacaan = stMetrics.evaluatedBacaan > 0 ? Math.round((stMetrics.tuntasBacaan/stMetrics.evaluatedBacaan)*100) : 0;
            const pctHafalan = stMetrics.evaluatedHafalan > 0 ? Math.round((stMetrics.tuntasHafalan/stMetrics.evaluatedHafalan)*100) : 0;
            
            return `
            <div>
              <div class="flex justify-between text-sm mb-1"><span class="font-bold text-slate-700">${gradeName} <span class="font-normal text-slate-400 text-xs">(${ks.length} Siswa)</span></span></div>
              <div class="mb-1.5">
                 <div class="flex justify-between text-[10px] text-slate-500 mb-0.5"><span>Target Bacaan</span><span>${pctBacaan}%</span></div>
                 <div class="w-full bg-slate-100 rounded-full h-1.5"><div class="h-1.5 rounded-full bg-emerald-500" style="width:${pctBacaan}%"></div></div>
              </div>
              <div>
                 <div class="flex justify-between text-[10px] text-slate-500 mb-0.5"><span>Target Hafalan</span><span>${pctHafalan}%</span></div>
                 <div class="w-full bg-slate-100 rounded-full h-1.5"><div class="h-1.5 rounded-full bg-purple-500" style="width:${pctHafalan}%"></div></div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

// ============ EXPORT & PRINT ============
function getPeriodLabel() {
  const todayDate = new Date();
  if (statsPeriod === 'semua') return 'Semua Data';
  if (statsPeriod === 'harian') return `Harian - ${todayDate.toLocaleDateString('id-ID')}`;
  if (statsPeriod === 'mingguan') return `Mingguan - ${todayDate.toLocaleDateString('id-ID')}`;
  if (statsPeriod === 'bulanan') return `Bulan ${todayDate.toLocaleString('id-ID', {month:'long', year:'numeric'})}`;
  if (statsPeriod === 'tahunan') return `Tahun ${todayDate.getFullYear()}`;
  return '';
}

function exportStatsPDF() {
  const reports = getReportsByPeriod(statsPeriod);
  const latestReports = getLatestStudentStatus(reports);
  const students = getStudents();
  const map = getGradeKelasMap();
  const lancar = latestReports.filter(r=>r.status==='Lancar').length;
  const mengulang = latestReports.filter(r=>r.status==='Mengulang').length;
  const tidakLancar = latestReports.filter(r=>r.status==='Tidak Lancar').length;
  const total = latestReports.length || 1;
  const reportCount = reports.length;
  const avg = latestReports.length > 0 ? Math.round(lancar/latestReports.length*100) : 0;
  
  let htmlContent = `
  <html>
    <head>
      <meta charset="utf-8">
      <title>Laporan Statistik</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; }
        h2 { color: #1e293b; margin-top: 20px; font-size: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #f1f5f9; padding: 10px; text-align: left; border: 1px solid #cbd5e1; font-weight: bold; }
        td { padding: 10px; border: 1px solid #cbd5e1; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .stats-box { margin-top: 15px; padding: 15px; background-color: #f1f5f9; border-left: 4px solid #059669; }
        .period-label { color: #64748b; font-size: 12px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>📊 Laporan Statistik Pembelajaran Al-Qur'an</h1>
      <div class="period-label">Periode: ${getPeriodLabel()}</div>
      
      <h2>1. Status Bacaan (Berdasarkan Update Terakhir Anak)</h2>
      <table>
        <tr><th>Status</th><th>Jumlah Anak</th><th>Persentase</th></tr>
        <tr><td>Lancar</td><td>${lancar}</td><td>${latestReports.length > 0 ? Math.round(lancar/total*100) : 0}%</td></tr>
        <tr><td>Mengulang</td><td>${mengulang}</td><td>${latestReports.length > 0 ? Math.round(mengulang/total*100) : 0}%</td></tr>
        <tr><td>Tidak Lancar</td><td>${tidakLancar}</td><td>${latestReports.length > 0 ? Math.round(tidakLancar/total*100) : 0}%</td></tr>
        <tr style="background-color: #ecfdf5;"><td><strong>Total Anak Disimak</strong></td><td><strong>${latestReports.length}</strong></td><td><strong>100%</strong></td></tr>
      </table>
      
      <h2>2. Progress Ketuntasan Target Per Tingkat (Grade)</h2>
      <table>
        <tr><th>Grade</th><th>Total Siswa</th><th>Tuntas Bacaan</th><th>Tuntas Hafalan</th></tr>
  `;
  
  Object.keys(map).forEach(gradeName => {
    const ks = students.filter(s => s.grade === gradeName);
    const stMetrics = calculateTuntasMetrics(ks, reports);
    const pctBacaan = stMetrics.evaluatedBacaan > 0 ? Math.round((stMetrics.tuntasBacaan/stMetrics.evaluatedBacaan)*100) : 0;
    const pctHafalan = stMetrics.evaluatedHafalan > 0 ? Math.round((stMetrics.tuntasHafalan/stMetrics.evaluatedHafalan)*100) : 0;
    htmlContent += `<tr><td>${gradeName}</td><td>${ks.length}</td><td>${pctBacaan}%</td><td>${pctHafalan}%</td></tr>`;
  });
  
  htmlContent += `</table>
      
      <h2>3. Tipe Laporan</h2>
      <table>
        <tr><th>Tipe</th><th>Total Entri Laporan</th></tr>
        <tr><td>Iqro'</td><td>${reports.filter(r=>r.report_type==='iqro').length}</td></tr>
        <tr><td>Hafalan</td><td>${reports.filter(r=>r.report_type==='hafalan').length}</td></tr>
        <tr><td>Bacaan Al-Qur'an</td><td>${reports.filter(r=>r.report_type==='quran').length}</td></tr>
      </table>
      
      <div class="stats-box">
        <strong>📌 Ringkasan:</strong><br>
        Total Siswa Terdaftar: ${students.length}<br>
        Total Entri Laporan Masuk: ${reportCount}<br>
        Rata-rata Kelancaran (Bukan Target): <strong>${avg}%</strong>
      </div>
      
      <div class="stats-box" style="margin-top: 30px; border-left-color: #999;">
        <small>Laporan ini dihasilkan dari Sistem IKASI Qur'an Learning<br>
        Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</small>
      </div>
    </body>
  </html>`;
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Statistik-${statsPeriod}-${today().replace(/-/g, '')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  showToast('PDF siap diunduh');
}

function printStats() {
  const reports = getReportsByPeriod(statsPeriod);
  const latestReports = getLatestStudentStatus(reports);
  const students = getStudents();
  const map = getGradeKelasMap();
  const lancar = latestReports.filter(r=>r.status==='Lancar').length;
  const mengulang = latestReports.filter(r=>r.status==='Mengulang').length;
  const tidakLancar = latestReports.filter(r=>r.status==='Tidak Lancar').length;
  const total = latestReports.length || 1;
  const reportCount = reports.length;
  const avg = latestReports.length > 0 ? Math.round(lancar/latestReports.length*100) : 0;
  
  let printContent = `
  <html>
    <head>
      <meta charset="utf-8">
      <title>Laporan Statistik - Cetak</title>
      <style>
        @media print {
          body { margin: 0; padding: 10px; }
          .no-print { display: none; }
        }
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #059669; text-align: center; border-bottom: 3px solid #059669; padding-bottom: 10px; }
        h2 { color: #1e293b; margin-top: 25px; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #059669; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border: 1px solid #cbd5e1; }
        tr:nth-child(even) { background-color: #f1f5f9; }
        .header-info { text-align: center; margin-bottom: 20px; color: #64748b; font-size: 12px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
        .stat-card { padding: 15px; background-color: #f1f5f9; border-left: 4px solid #059669; }
        .stat-value { font-size: 24px; font-weight: bold; color: #059669; }
        .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
        button { padding: 10px 15px; background-color: #059669; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px; }
        button:hover { background-color: #047857; }
        .no-print { text-align: center; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="no-print">
          <button onclick="window.print()">🖨️ Cetak Dokumen</button>
          <button onclick="window.close()">❌ Tutup</button>
        </div>
        
        <h1>📊 Laporan Statistik Pembelajaran Al-Qur'an</h1>
        <div class="header-info">
          Periode: ${getPeriodLabel()}<br>
          Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}
        </div>
        
        <h2>1. Status Kelancaran (Berdasarkan Update Terakhir Anak)</h2>
        <table>
          <tr><th>Status</th><th>Jumlah Anak</th><th>Persentase</th></tr>
          <tr><td style="font-weight:bold; color:#059669">✓ Lancar</td><td>${lancar}</td><td>${latestReports.length > 0 ? Math.round(lancar/total*100) : 0}%</td></tr>
          <tr><td style="font-weight:bold; color:#f59e0b">⟲ Mengulang</td><td>${mengulang}</td><td>${latestReports.length > 0 ? Math.round(mengulang/total*100) : 0}%</td></tr>
          <tr><td style="font-weight:bold; color:#ef4444">✗ Tidak Lancar</td><td>${tidakLancar}</td><td>${latestReports.length > 0 ? Math.round(tidakLancar/total*100) : 0}%</td></tr>
          <tr style="background-color: #ecfdf5; font-weight: bold;"><td>Total</td><td>${total}</td><td>100%</td></tr>
        </table>
        
        <h2>2. Progress Ketuntasan Target Per Tingkat (Grade)</h2>
        <table>
          <tr><th>Grade</th><th>Total Siswa</th><th>Tuntas Bacaan</th><th>Tuntas Hafalan</th></tr>
  `;
  
  Object.keys(map).forEach(gradeName => {
    const ks = students.filter(s => s.grade === gradeName);
    const stMetrics = calculateTuntasMetrics(ks, reports);
    const pctBacaan = stMetrics.evaluatedBacaan > 0 ? Math.round((stMetrics.tuntasBacaan/stMetrics.evaluatedBacaan)*100) : 0;
    const pctHafalan = stMetrics.evaluatedHafalan > 0 ? Math.round((stMetrics.tuntasHafalan/stMetrics.evaluatedHafalan)*100) : 0;
    printContent += `<tr><td>${gradeName}</td><td>${ks.length}</td><td>${pctBacaan}%</td><td>${pctHafalan}%</td></tr>`;
  });
  
  printContent += `
        </table>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${students.length}</div>
            <div class="stat-label">Total Siswa Terdaftar</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${reportCount}</div>
            <div class="stat-label">Total Laporan Masuk</div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
}
