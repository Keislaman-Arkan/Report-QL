// ============ DASHBOARD ============
function renderDashboard(el) {
  const students = getStudents();
  const reports = getReports();
  const map = getGradeKelasMap();
  
  const metrics = calculateTuntasMetrics(students, reports);
  const totalReports = reports.length;
  
  el.innerHTML = `
  <div class="fade-in max-w-7xl mx-auto">
    <h2 class="text-2xl font-bold text-slate-800 mb-6">Dashboard Utama</h2>
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
    
    <h3 class="text-lg font-semibold text-slate-700 mb-4">Capaian Target Kurikulum Per Tingkat</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${Object.keys(map).map(gradeName => {
        const gradeClasses = map[gradeName] || [];
        const ks = students.filter(s => s.grade === gradeName);
        const stMetrics = calculateTuntasMetrics(ks, reports);
        
        const pctBacaan = stMetrics.evaluatedBacaan > 0 ? Math.round((stMetrics.tuntasBacaan/stMetrics.evaluatedBacaan)*100) : 0;
        const pctHafalan = stMetrics.evaluatedHafalan > 0 ? Math.round((stMetrics.tuntasHafalan/stMetrics.evaluatedHafalan)*100) : 0;
        
        return `
        <div class="card-hover bg-white rounded-xl p-5 shadow-sm border border-slate-100 cursor-pointer" onclick="navigate('students');filterByGrade('${gradeName}')">
          <div class="flex justify-between items-center mb-4">
            <h4 class="font-bold text-slate-700">${gradeName}</h4>
            <span class="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-semibold">${ks.length} Siswa</span>
          </div>
          
          <div class="mb-3">
            <div class="flex justify-between text-xs font-semibold text-slate-600 mb-1.5"><span>Target Bacaan</span><span class="text-emerald-600">${pctBacaan}%</span></div>
            <div class="w-full bg-slate-100 rounded-full h-2"><div class="h-2 rounded-full bg-emerald-500" style="width:${pctBacaan}%"></div></div>
          </div>
          <div>
            <div class="flex justify-between text-xs font-semibold text-slate-600 mb-1.5"><span>Target Hafalan</span><span class="text-purple-600">${pctHafalan}%</span></div>
            <div class="w-full bg-slate-100 rounded-full h-2"><div class="h-2 rounded-full bg-purple-500" style="width:${pctHafalan}%"></div></div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}
