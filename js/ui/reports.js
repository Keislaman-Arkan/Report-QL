// ============ FORMS REPORT BACAAN & HAFALAN ============
function renderReportBacaan(el) {
  if (currentUser.role === 'visitor') return;
  el.innerHTML = `
  <div class="fade-in max-w-7xl mx-auto">
    <h2 class="text-2xl font-bold text-slate-800 mb-6">Input Laporan Bacaan</h2>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100">
        <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2"><div class="p-1.5 bg-emerald-100 rounded-lg"><i data-lucide="book" class="w-4 h-4 text-emerald-600"></i></div> Bacaan Iqro'</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Siswa</label>
            <div class="relative w-full">
              <input type="text" id="search-ri-student" placeholder="Ketik nama siswa untuk mencari..." class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" autocomplete="off" oninput="filterStudents('ri', this.value)" onfocus="filterStudents('ri', this.value)">
              <input type="hidden" id="ri-student" value="">
              <div id="dropdown-ri-student" class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto hidden"></div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4"><div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Jilid</label><input id="ri-jilid" type="number" value="1" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm"></div><div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Halaman</label><input id="ri-hal" type="number" value="1" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm"></div></div>
          <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal</label><input id="ri-date" type="date" value="${today()}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm"></div>
          <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Status</label><select id="ri-status" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"><option>Lancar</option><option>Tidak Lancar</option><option>Mengulang</option></select></div>
          <button onclick="saveReportIqro()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold shadow-md transition">Simpan Laporan Iqro</button>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100">
        <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2"><div class="p-1.5 bg-blue-100 rounded-lg"><i data-lucide="scroll" class="w-4 h-4 text-blue-600"></i></div> Bacaan Al-Qur'an</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Siswa</label>
            <div class="relative w-full">
              <input type="text" id="search-rq-student" placeholder="Ketik nama siswa untuk mencari..." class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" autocomplete="off" oninput="filterStudents('rq', this.value)" onfocus="filterStudents('rq', this.value)">
              <input type="hidden" id="rq-student" value="">
              <div id="dropdown-rq-student" class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto hidden"></div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Juz</label><select id="rq-juz" onchange="updateQuranSuratDropdown()" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white">${Array.from({length:30},(_,i)=>`<option value="${i+1}">Juz ${i+1}</option>`).join('')}</select></div>
            <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Surat</label><select id="rq-surat" onchange="updateQuranAyatMax()" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"></select></div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Dari Ayat</label><input id="rq-ayat-dari" type="number" min="1" value="1" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm"></div>
            <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Sampai</label><input id="rq-ayat-sampai" type="number" min="1" value="1" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm"></div>
          </div>
          <div class="grid grid-cols-2 gap-4">
             <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal</label><input id="rq-date" type="date" value="${today()}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm"></div>
             <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Status</label><select id="rq-status" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"><option>Lancar</option><option>Tidak Lancar</option><option>Mengulang</option></select></div>
          </div>
          <button onclick="saveReportQuran()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-md transition">Simpan Laporan Qur'an</button>
        </div>
      </div>
    </div>
  </div>`;
  setTimeout(() => { updateQuranSuratDropdown(); if(window.lucide) lucide.createIcons(); }, 100);
}

function renderReportHafalan(el) {
  if (currentUser.role === 'visitor') return;
  el.innerHTML = `
  <div class="fade-in max-w-2xl mx-auto">
    <h2 class="text-2xl font-bold text-slate-800 mb-6">Input Laporan Hafalan</h2>
    <div class="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100">
      <div class="space-y-5">
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1.5">Siswa</label>
          <div class="relative w-full">
            <input type="text" id="search-rh-student" placeholder="Ketik nama siswa untuk mencari..." class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none" autocomplete="off" oninput="filterStudents('rh', this.value)" onfocus="filterStudents('rh', this.value)">
            <input type="hidden" id="rh-student" value="">
            <div id="dropdown-rh-student" class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto hidden"></div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Juz</label><select id="rh-juz" onchange="updateSuratDropdownH()" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white">${Array.from({length:30},(_,i)=>`<option value="${i+1}">Juz ${i+1}</option>`).join('')}</select></div>
            <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Surat</label><select id="rh-surat" onchange="updateAyatMaxH()" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"></select></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Dari Ayat</label><input id="rh-ayat-dari" type="number" min="1" value="1" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm"></div>
            <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Sampai</label><input id="rh-ayat-sampai" type="number" min="1" value="1" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm"></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal</label><input id="rh-date" type="date" value="${today()}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm"></div>
            <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Status</label><select id="rh-status" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"><option>Lancar</option><option>Tidak Lancar</option><option>Mengulang</option></select></div>
        </div>
        <button onclick="saveReportHafalan()" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold shadow-md mt-2 transition">Simpan Laporan Hafalan</button>
      </div>
    </div>
  </div>`;
  setTimeout(() => updateSuratDropdownH(), 100);
}

function updateQuranSuratDropdown() { const j=parseInt(document.getElementById('rq-juz').value); document.getElementById('rq-surat').innerHTML=getSuratByJuz(j).map(s=>`<option value="${s.name}">${s.name}</option>`).join(''); updateQuranAyatMax(); }
function updateQuranAyatMax() { const j=parseInt(document.getElementById('rq-juz').value), s=document.getElementById('rq-surat').value, mx=getAyatCount(j,s); const m1=document.getElementById('rq-ayat-sampai'), m2=document.getElementById('rq-ayat-dari'); if(m1) m1.max=mx; if(m2) m2.max=mx; if(m1 && parseInt(m1.value) > mx) m1.value=mx; }
function updateSuratDropdownH() { const j=parseInt(document.getElementById('rh-juz').value); document.getElementById('rh-surat').innerHTML=getSuratByJuz(j).map(s=>`<option value="${s.name}">${s.name}</option>`).join(''); updateAyatMaxH(); }
function updateAyatMaxH() { const j=parseInt(document.getElementById('rh-juz').value), s=document.getElementById('rh-surat').value, mx=getAyatCount(j,s); const m1=document.getElementById('rh-ayat-sampai'); const m2=document.getElementById('rh-ayat-dari'); if(m1) m1.max=mx; if(m2) m2.max=mx; if(m1 && parseInt(m1.value) > mx) m1.value=mx; }

async function saveReportIqro(){ const st=document.getElementById('ri-student').value; if(!st){showToast('Pilih siswa dari daftar pencarian terlebih dahulu','warning'); return;} await window.dataSdk.create({type:'report',report_type:'iqro',student_id:st,iqro_jilid:parseInt(document.getElementById('ri-jilid').value),iqro_halaman:parseInt(document.getElementById('ri-hal').value),status:document.getElementById('ri-status').value,tanggal:document.getElementById('ri-date').value,name:'',email:'',password:'',role:'',kelas:0,target_juz:0,juz:0,surat:'',ayat_dari:0,ayat_sampai:0,subject:'iqro',nip:'',phone:'',address:'',specialization:'',target_iqro_jilid:0,target_iqro_halaman:0,target_hafalan_juz:0,target_surat_awal:'',target_surat_akhir:'',target_ayat_awal:0,target_ayat_akhir:0,standar_ketuntasan:0,setting_kelas:0}); showToast('Laporan Iqro disimpan'); document.getElementById('ri-student').value=''; document.getElementById('search-ri-student').value=''; }
async function saveReportQuran(){ const st=document.getElementById('rq-student').value; if(!st){showToast('Pilih siswa dari daftar pencarian terlebih dahulu','warning'); return;} await window.dataSdk.create({type:'report',report_type:'quran',student_id:st,juz:parseInt(document.getElementById('rq-juz').value),surat:document.getElementById('rq-surat').value,ayat_dari:parseInt(document.getElementById('rq-ayat-dari').value),ayat_sampai:parseInt(document.getElementById('rq-ayat-sampai').value),status:document.getElementById('rq-status').value,tanggal:document.getElementById('rq-date').value,name:'',email:'',password:'',role:'',kelas:0,target_juz:0,iqro_jilid:0,iqro_halaman:0,subject:'',nip:'',phone:'',address:'',specialization:'',target_iqro_jilid:0,target_iqro_halaman:0,target_hafalan_juz:0,target_surat_awal:'',target_surat_akhir:'',target_ayat_awal:0,target_ayat_akhir:0,standar_ketuntasan:0,setting_kelas:0}); showToast('Laporan Quran disimpan'); document.getElementById('rq-student').value=''; document.getElementById('search-rq-student').value=''; }
async function saveReportHafalan(){ const st=document.getElementById('rh-student').value; if(!st){showToast('Pilih siswa dari daftar pencarian terlebih dahulu','warning'); return;} await window.dataSdk.create({type:'report',report_type:'hafalan',student_id:st,juz:parseInt(document.getElementById('rh-juz').value),surat:document.getElementById('rh-surat').value,ayat_dari:parseInt(document.getElementById('rh-ayat-dari').value),ayat_sampai:parseInt(document.getElementById('rh-ayat-sampai').value),status:document.getElementById('rh-status').value,tanggal:document.getElementById('rh-date').value,name:'',email:'',password:'',role:'',kelas:0,target_juz:0,iqro_jilid:0,iqro_halaman:0,subject:'',nip:'',phone:'',address:'',specialization:'',target_iqro_jilid:0,target_iqro_halaman:0,target_hafalan_juz:0,target_surat_awal:'',target_surat_akhir:'',target_ayat_awal:0,target_ayat_akhir:0,standar_ketuntasan:0,setting_kelas:0}); showToast('Laporan Hafalan disimpan'); document.getElementById('rh-student').value=''; document.getElementById('search-rh-student').value=''; }

let reportSearchQuery = "";

function setReportFilter(field, val) {
  if (field === 'type') reportFilterType = val;
  if (field === 'grade') { reportFilterGrade = val; reportFilterClass = ''; }
  if (field === 'kelas') reportFilterClass = val;
  renderPage();
}

function handleReportTableSearch(val) {
  reportSearchQuery = val;
  const query = val.toLowerCase().trim();
  const rows = document.querySelectorAll("#report-table-body tr:not(#report-table-no-results)");
  let hasVisibleRows = false;
  
  rows.forEach(row => {
    const nameCell = row.querySelector(".report-student-name-cell");
    if (nameCell) {
      const name = nameCell.childNodes[0].textContent.toLowerCase();
      if (name.includes(query)) {
        row.style.display = "";
        hasVisibleRows = true;
      } else {
        row.style.display = "none";
      }
    }
  });

  const noResultsRow = document.getElementById("report-table-no-results");
  if (noResultsRow) {
    if (!hasVisibleRows && rows.length > 0) {
      noResultsRow.style.display = "";
    } else {
      noResultsRow.style.display = "none";
    }
  }
}

function renderReports(el) {
  let reports = getReports();
  const students = getStudents();
  const map = getGradeKelasMap();
  const gradeList = Object.keys(map);
  const classList = reportFilterGrade ? (map[reportFilterGrade] || []) : getAllClassesFlat();

  if (reportFilterType === 'bacaan') reports = reports.filter(r => r.report_type === 'iqro' || r.report_type === 'quran');
  if (reportFilterType === 'hafalan') reports = reports.filter(r => r.report_type === 'hafalan');

  if (reportFilterGrade || reportFilterClass) {
    reports = reports.filter(r => {
      const s = students.find(x => x.__backendId === r.student_id);
      if (!s) return false;
      if (reportFilterGrade && s.grade !== reportFilterGrade) return false;
      if (reportFilterClass && s.kelas !== reportFilterClass) return false;
      return true;
    });
  }

  // Filter berdasarkan pencarian nama jika ada
  if (reportSearchQuery) {
    const q = reportSearchQuery.toLowerCase().trim();
    reports = reports.filter(r => {
      const s = students.find(x => x.__backendId === r.student_id);
      return s && s.name.toLowerCase().includes(q);
    });
  }

  function getKetuntasanBadge(report, student) {
    if (!student) return '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-400">-</span>';
    const grade = student.grade;

    if (report.report_type === 'iqro' || report.report_type === 'quran') {
      const tIqro = allData.find(x => x.type === 'setting' && x.subject === `iqro_target_${grade}`)?.data;
      if (!tIqro) return '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-400">Belum ada target</span>';
      const targetScore = getBacaanScore('iqro', tIqro.target_iqro_jilid, tIqro.target_iqro_halaman);
      const reportScore = getBacaanScore(report.report_type, report.iqro_jilid, report.iqro_halaman);
      const tuntas = reportScore >= targetScore;
      const targetLabel = `Target: Jilid ${tIqro.target_iqro_jilid} Hal ${tIqro.target_iqro_halaman}`;
      return tuntas
        ? `<span title="${targetLabel}" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">✓ Tuntas</span>`
        : `<span title="${targetLabel}" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">⏳ Belum Tuntas</span>`;

    } else if (report.report_type === 'hafalan') {
      const tHafalan = allData.find(x => x.type === 'setting' && x.subject === `hafalan_target_${grade}`)?.data;
      if (!tHafalan) return '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-400">Belum ada target</span>';
      const targetScore = getHafalanScore(tHafalan.target_hafalan_juz, tHafalan.target_surat_awal, tHafalan.target_ayat_akhir);
      const reportScore = getHafalanScore(report.juz, report.surat, report.ayat_sampai);
      const tuntas = reportScore >= targetScore;
      const targetLabel = `Target: ${tHafalan.target_surat_awal || 'Juz ' + tHafalan.target_hafalan_juz} s/d ayat ${tHafalan.target_ayat_akhir}`;
      return tuntas
        ? `<span title="${targetLabel}" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">✓ Tuntas</span>`
        : `<span title="${targetLabel}" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">⏳ Belum Tuntas</span>`;
    }
    return '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-400">-</span>';
  }

  el.innerHTML = `
  <div class="fade-in max-w-7xl mx-auto">
    <h2 class="text-2xl font-bold text-slate-800 mb-6">Rekap Histori Laporan</h2>
    
    <div class="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
      <h3 class="text-sm font-semibold text-slate-600 mb-3">Filter Laporan</h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
           <label class="block text-xs font-semibold text-slate-500 mb-1">Cari Nama Siswa</label>
           <input type="text" id="search-report-student" placeholder="Ketik nama siswa..." class="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" oninput="handleReportTableSearch(this.value)" value="${reportSearchQuery}">
        </div>
        <div>
           <label class="block text-xs font-semibold text-slate-500 mb-1">Kategori</label>
           <select onchange="setReportFilter('type', this.value)" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
             <option value="" ${reportFilterType===''?'selected':''}>Semua Kategori</option>
             <option value="bacaan" ${reportFilterType==='bacaan'?'selected':''}>📖 Bacaan (Iqro / Qur'an)</option>
             <option value="hafalan" ${reportFilterType==='hafalan'?'selected':''}>📚 Hafalan</option>
           </select>
        </div>
        <div>
           <label class="block text-xs font-semibold text-slate-500 mb-1">Tingkat (Grade)</label>
           <select onchange="setReportFilter('grade', this.value)" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
             <option value="" ${reportFilterGrade===''?'selected':''}>Semua Tingkat</option>
             ${gradeList.map(g => `<option value="${g}" ${reportFilterGrade===g?'selected':''}>${g}</option>`).join('')}
           </select>
        </div>
        <div>
           <label class="block text-xs font-semibold text-slate-500 mb-1">Kelas</label>
           <select onchange="setReportFilter('kelas', this.value)" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none ${!reportFilterGrade && 'bg-slate-50'}">
             <option value="" ${reportFilterClass===''?'selected':''}>Semua Kelas</option>
             ${classList.map(k => `<option value="${k}" ${reportFilterClass===k?'selected':''}>${k}</option>`).join('')}
           </select>
        </div>
      </div>
    </div>

    <!-- Legend ketuntasan -->
    <div class="flex flex-wrap gap-3 mb-3 text-xs font-medium text-slate-500">
      <span class="flex items-center gap-1.5"><span class="inline-block w-3 h-3 rounded-full bg-emerald-400"></span> Tuntas = Sudah mencapai/melewati target grade</span>
      <span class="flex items-center gap-1.5"><span class="inline-block w-3 h-3 rounded-full bg-amber-400"></span> Belum Tuntas = Masih di bawah target grade</span>
      <span class="flex items-center gap-1.5 text-slate-400 italic">* Arahkan kursor ke badge untuk melihat target</span>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto w-full">
        <table class="w-full text-sm min-w-[750px]">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="text-left px-5 py-4 font-semibold text-slate-600">Tanggal</th>
              <th class="text-left px-5 py-4 font-semibold text-slate-600">Siswa</th>
              <th class="text-left px-5 py-4 font-semibold text-slate-600">Tipe</th>
              <th class="text-left px-5 py-4 font-semibold text-slate-600">Detail</th>
              <th class="text-left px-5 py-4 font-semibold text-slate-600">Status</th>
              <th class="text-left px-5 py-4 font-semibold text-slate-600">Ketuntasan Target</th>
            </tr>
          </thead>
          <tbody id="report-table-body" class="divide-y divide-slate-50">
            ${reports.length ? reports.sort((a,b)=>new Date(b.tanggal) - new Date(a.tanggal)).map(r => {
              const student = students.find(s=>s.__backendId===r.student_id);
              let detail = r.report_type==='iqro'? `Jilid ${r.iqro_jilid} Hal ${r.iqro_halaman}` : `Juz ${r.juz} ${r.surat} (${r.ayat_dari}-${r.ayat_sampai})`;
              const color = r.status==='Lancar'?'bg-emerald-100 text-emerald-700':r.status==='Mengulang'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700';
              const ketuntasanBadge = getKetuntasanBadge(r, student);
              return `<tr class="hover:bg-slate-50/50 transition">
                <td class="px-5 py-3 whitespace-nowrap text-slate-500">${r.tanggal||'-'}</td>
                <td class="px-5 py-3 font-semibold text-slate-800 report-student-name-cell">${student?.name||'-'} <span class="text-xs font-normal text-slate-400 block">${student?.kelas||''}</span></td>
                <td class="px-5 py-3 capitalize"><span class="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 border border-slate-200">${r.report_type}</span></td>
                <td class="px-5 py-3 text-slate-600">${detail}</td>
                <td class="px-5 py-3"><span class="px-3 py-1 rounded-full text-xs font-bold ${color}">${r.status}</span></td>
                <td class="px-5 py-3">${ketuntasanBadge}</td>
              </tr>`;
            }).join('') : '<tr><td colspan="6" class="px-5 py-12 text-center text-slate-400">Belum ada laporan dicatat.</td></tr>'}
            <tr id="report-table-no-results" style="display: none;"><td colspan="6" class="px-5 py-12 text-center text-slate-400">Tidak ada nama siswa yang cocok.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
  
  if (reportSearchQuery) {
    handleReportTableSearch(reportSearchQuery);
  }
}
