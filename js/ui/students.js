// ============ STUDENTS ============
let studentFilterClass = "";
let studentFilterGrade = null;
let studentSearchQuery = ""; // Query pencarian untuk tabel

function filterByGrade(grade) { studentFilterGrade = grade; studentFilterClass = ""; renderPage(); }
function filterByClass(className) { studentFilterClass = className; renderPage(); }

function handleStudentTableSearch(val) {
  studentSearchQuery = val;
  const query = val.toLowerCase().trim();
  const rows = document.querySelectorAll("#student-table-body tr:not(#student-table-no-results)");
  let hasVisibleRows = false;
  
  rows.forEach(row => {
    const nameCell = row.querySelector(".student-name-cell");
    if (nameCell) {
      const name = nameCell.textContent.toLowerCase();
      if (name.includes(query)) {
        row.style.display = "";
        hasVisibleRows = true;
      } else {
        row.style.display = "none";
      }
    }
  });

  const noResultsRow = document.getElementById("student-table-no-results");
  if (noResultsRow) {
    if (!hasVisibleRows && rows.length > 0) {
      noResultsRow.style.display = "";
    } else {
      noResultsRow.style.display = "none";
    }
  }
}

function renderStudents(el) {
  const isVisitor = currentUser.role === 'visitor';
  const map = getGradeKelasMap();
  const gradeList = Object.keys(map);
  
  let students = getStudents();
  if (studentFilterGrade) students = students.filter(s => s.grade === studentFilterGrade);
  if (studentFilterClass) students = students.filter(s => s.kelas === studentFilterClass);
  
  const displayKelas = studentFilterGrade ? (map[studentFilterGrade] || []) : getAllClassesFlat();
  
  el.innerHTML = `
  <div class="fade-in max-w-7xl mx-auto">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
      <h2 class="text-2xl font-bold text-slate-800">Data Siswa</h2>
    </div>

    <!-- PENCARIAN CEPAT & TAMBAH SISWA -->
    <div class="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center relative z-20">
      <div class="w-full md:w-1/2 lg:w-1/3 relative">
        <label class="block text-xs font-semibold text-slate-500 mb-1.5">${isVisitor ? 'Cari Nama Siswa' : 'Pencarian Cepat (Edit Siswa)'}</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i data-lucide="search" class="w-4 h-4 text-slate-400"></i>
          </div>
          ${isVisitor ? `
            <input type="text" id="search-table-student" placeholder="Ketik nama siswa..." class="w-full pl-10 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" oninput="handleStudentTableSearch(this.value)" value="${studentSearchQuery}">
          ` : `
            <input type="text" id="search-edit-student" placeholder="Ketik nama siswa..." class="w-full pl-10 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" autocomplete="off" oninput="filterStudents('edit', this.value)" onfocus="filterStudents('edit', this.value)">
            <input type="hidden" id="edit-student" value="">
            <div id="dropdown-edit-student" class="absolute z-[60] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto hidden"></div>
          `}
        </div>
      </div>
      ${!isVisitor ? `
      <div class="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
        <button onclick="downloadStudentTemplate()" class="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
          <i data-lucide="download" class="w-4 h-4"></i>Unduh Template
        </button>
        <button onclick="showImportStudents()" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition">
          <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>Import CSV/Excel
        </button>
        <button onclick="showAddStudent()" class="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition">
          <i data-lucide="user-plus" class="w-5 h-5"></i>Tambah Siswa
        </button>
      </div>` : ''}
    </div>
    
    <div class="mb-4">
      <h3 class="text-sm font-semibold text-slate-600 mb-2">Filter Tingkat (Grade)</h3>
      <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scroll">
        <button onclick="studentFilterGrade=null;studentFilterClass='';studentSearchQuery='';renderPage()" class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${!studentFilterGrade?'bg-emerald-600 text-white shadow-md':'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}">Semua</button>
        ${gradeList.map(g => `<button onclick="filterByGrade('${g}')" class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${studentFilterGrade===g?'bg-emerald-600 text-white shadow-md':'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}">${g}</button>`).join('')}
      </div>
    </div>
    
    ${(studentFilterGrade && displayKelas.length > 0) ? `
    <div class="mb-6">
      <h3 class="text-sm font-semibold text-slate-600 mb-2">Filter Kelas</h3>
      <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scroll">
        <button onclick="studentFilterClass='';renderPage()" class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${!studentFilterClass?'bg-blue-600 text-white shadow-md':'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}">Semua Kelas</button>
        ${displayKelas.map(k => `<button onclick="filterByClass('${k}')" class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${studentFilterClass===k?'bg-blue-600 text-white shadow-md':'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}">${k}</button>`).join('')}
      </div>
    </div>
    ` : ''}
    
    <div id="student-modal" class="hidden relative z-[100]"></div>
    <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto w-full">
        <table class="w-full text-sm min-w-[700px]">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="text-left px-4 py-3 font-semibold text-slate-600">Nama</th>
              <th class="text-left px-4 py-3 font-semibold text-slate-600">Tingkat</th>
              <th class="text-left px-4 py-3 font-semibold text-slate-600">Kelas</th>
              <th class="text-left px-4 py-3 font-semibold text-slate-600">Target Iqro'</th>
              <th class="text-left px-4 py-3 font-semibold text-slate-600">Target Hafalan</th>
              ${!isVisitor?'<th class="text-center px-4 py-3 font-semibold text-slate-600">Aksi</th>':''}
            </tr>
          </thead>
          <tbody id="student-table-body" class="divide-y divide-slate-50">
            ${students.length ? students.map(s => `
              <tr class="hover:bg-slate-50/50 transition">
                <td class="px-4 py-3 font-bold text-slate-700 student-name-cell">${s.name}</td>
                <td class="px-4 py-3 text-slate-500">${s.grade || '-'}</td>
                <td class="px-4 py-3"><span class="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200">${s.kelas || '-'}</span></td>
                <td class="px-4 py-3 text-xs font-semibold text-emerald-600">Jilid ${s.iqro_jilid||'-'} Hal ${s.iqro_halaman||'-'}</td>
                <td class="px-4 py-3 text-xs font-semibold text-purple-600">${s.target_hafalan_surat ? `${s.target_hafalan_surat} (Ayt ${s.target_hafalan_ayat_dari||'-'}-${s.target_hafalan_ayat_sampai||'-'})` : 'Juz ' + (s.target_juz||'-')}</td>
                ${!isVisitor?`<td class="px-4 py-3 flex justify-center gap-2">
                  <button onclick="editStudent('${s.__backendId}')" class="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition"><i data-lucide="edit" class="w-4 h-4"></i></button>
                  <button onclick="confirmDeleteStudent('${s.__backendId}')" class="p-1.5 hover:bg-red-50 rounded text-red-600 transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>`:''}
              </tr>
            `).join('') : '<tr><td colspan="6" class="px-4 py-12 text-center text-slate-400">Belum ada data siswa. Silakan tambah siswa baru.</td></tr>'}
            <tr id="student-table-no-results" style="display: none;"><td colspan="6" class="px-4 py-12 text-center text-slate-400">Tidak ada nama siswa yang cocok.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
  
  if (isVisitor && studentSearchQuery) {
    // Jalankan filter ulang jika search query masih aktif saat render ulang halaman
    handleStudentTableSearch(studentSearchQuery);
  }
}

function showAddStudent() {
  const map = getGradeKelasMap();
  const gradeList = Object.keys(map);
  
  const modal = document.getElementById('student-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] fade-in">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 class="font-bold text-lg text-slate-800">Tambah Siswa Baru</h3>
        <button onclick="closeStudentModal()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <div class="p-6 overflow-y-auto flex-1 space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Nama Lengkap</label><input id="s-name" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="Masukkan nama siswa"></div>
          <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Tingkat (Grade)</label><select id="s-grade" onchange="handleGradeChangeForm()" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"><option value="">-- Pilih Tingkat --</option>${gradeList.map(g => `<option value="${g}">${g}</option>`).join('')}</select></div>
        </div>
        <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Kelas</label><select id="s-kelas" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50"><option value="">Pilih Tingkat Terlebih Dahulu</option></select></div>
        
        <div class="border-t border-slate-100 pt-4">
          <h4 class="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2"><i data-lucide="book" class="w-4 h-4"></i> Target Iqro'</h4>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-xs font-semibold text-slate-600 mb-1">Jilid (1-6)</label><input id="s-jilid" type="number" min="1" max="6" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" value="1"></div>
            <div><label class="block text-xs font-semibold text-slate-600 mb-1">Halaman</label><input id="s-hal" type="number" min="1" max="120" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" value="1"></div>
          </div>
        </div>
        
        <div class="border-t border-slate-100 pt-4">
          <h4 class="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2"><i data-lucide="bookmark" class="w-4 h-4"></i> Target Hafalan Al-Qur'an</h4>
          <div class="bg-slate-50 p-3 rounded-xl mb-3 flex gap-4">
            <label class="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" id="hafal-juz" name="hafal-type" value="juz" checked onchange="updateHafalanMode()" class="text-purple-600 focus:ring-purple-500"> <span>Berdasarkan Juz</span></label>
            <label class="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" id="hafal-surat" name="hafal-type" value="surat" onchange="updateHafalanMode()" class="text-purple-600 focus:ring-purple-500"> <span>Berdasarkan Surat</span></label>
          </div>
          
          <div id="hafal-juz-mode">
            <div><label class="block text-xs font-semibold text-slate-600 mb-1">Target Juz Selesai (1-30)</label><input id="s-target-juz" type="number" min="1" max="30" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" value="30"></div>
          </div>
          
          <div id="hafal-surat-mode" class="hidden space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label class="block text-xs font-semibold text-slate-600 mb-1">Juz</label><select id="s-hafal-juz" onchange="updateHafalanSuratDropdown()" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm bg-white">${Array.from({length:30},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></div>
              <div><label class="block text-xs font-semibold text-slate-600 mb-1">Surat</label><select id="s-hafal-surat" onchange="updateHafalanAyatMax()" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm bg-white"></select></div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="block text-xs font-semibold text-slate-600 mb-1">Dari Ayat</label><input id="s-hafal-ayat-dari" type="number" min="1" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" value="1"></div>
              <div><label class="block text-xs font-semibold text-slate-600 mb-1">Sampai Ayat</label><input id="s-hafal-ayat-sampai" type="number" min="1" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" value="1"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
        <button onclick="closeStudentModal()" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition">Batal</button>
        <button onclick="saveStudent()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-200 transition">Simpan Siswa</button>
      </div>
    </div>
  </div>`;
  updateHafalanSuratDropdown();
  if(window.lucide) lucide.createIcons();
}

function handleGradeChangeForm() {
  updateKelasOptionsForm();
  const grade = document.getElementById('s-grade').value;
  if (!grade) return;
  
  const iqroSetting = allData.find(x => x.type === 'setting' && x.subject === 'iqro_target_' + grade);
  const hafalanSetting = allData.find(x => x.type === 'setting' && x.subject === 'hafalan_target_' + grade);
  
  if (iqroSetting && iqroSetting.data) {
    document.getElementById('s-jilid').value = iqroSetting.data.target_iqro_jilid || 1;
    document.getElementById('s-hal').value = iqroSetting.data.target_iqro_halaman || 120;
  }
  
  if (hafalanSetting && hafalanSetting.data) {
    const hData = hafalanSetting.data;
    document.getElementById('hafal-surat').checked = true;
    document.getElementById('hafal-juz').checked = false; 
    updateHafalanMode();
    
    document.getElementById('s-hafal-juz').value = hData.target_hafalan_juz || 30;
    updateHafalanSuratDropdown(); 
    
    setTimeout(() => {
      if (hData.target_surat_awal) {
        const suratEl = document.getElementById('s-hafal-surat');
        if (suratEl) suratEl.value = hData.target_surat_awal;
        updateHafalanAyatMax(); 
      }
      const dariEl = document.getElementById('s-hafal-ayat-dari');
      const sampaiEl = document.getElementById('s-hafal-ayat-sampai');
      if (dariEl) dariEl.value = hData.target_ayat_awal || 1;
      if (sampaiEl) sampaiEl.value = hData.target_ayat_akhir || 1;
    }, 100);
  }
}

function updateKelasOptionsForm(selectedKelasVal = "") {
  const grade = document.getElementById('s-grade').value;
  const sel = document.getElementById('s-kelas');
  
  if (!grade) {
    sel.innerHTML = '<option value="">Pilih Tingkat Terlebih Dahulu</option>';
    sel.classList.add('bg-slate-50');
    return;
  }
  
  const map = getGradeKelasMap();
  const classes = map[grade] || [];
  
  sel.classList.remove('bg-slate-50');
  sel.classList.add('bg-white');
  
  if(classes.length === 0) {
    sel.innerHTML = '<option value="">(Belum ada kelas di tingkat ini)</option>';
  } else {
    sel.innerHTML = `<option value="">-- Pilih Kelas --</option>` + classes.map(k => `<option value="${k}" ${k===selectedKelasVal?'selected':''}>${k}</option>`).join('');
  }
}

function updateHafalanMode() {
  const juzMode = document.getElementById('hafal-juz').checked;
  const hafalJuzMode = document.getElementById('hafal-juz-mode');
  const hafalSuratMode = document.getElementById('hafal-surat-mode');
  if (hafalJuzMode) hafalJuzMode.classList.toggle('hidden', !juzMode);
  if (hafalSuratMode) hafalSuratMode.classList.toggle('hidden', juzMode);
}

function updateHafalanSuratDropdown() {
  const juzEl = document.getElementById('s-hafal-juz');
  const suratEl = document.getElementById('s-hafal-surat');
  if (!juzEl || !suratEl) return;
  const juz = parseInt(juzEl.value);
  const surats = getSuratByJuz(juz);
  suratEl.innerHTML = surats.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
  updateHafalanAyatMax();
}

function updateHafalanAyatMax() {
  const juzEl = document.getElementById('s-hafal-juz');
  const suratEl = document.getElementById('s-hafal-surat');
  const sampaiEl = document.getElementById('s-hafal-ayat-sampai');
  const dariEl = document.getElementById('s-hafal-ayat-dari');
  if (!juzEl || !suratEl || !sampaiEl || !dariEl) return;
  
  const juz = parseInt(juzEl.value);
  const surat = suratEl.value;
  const max = getAyatCount(juz, surat);
  sampaiEl.max = max;
  dariEl.max = max;
  if(parseInt(sampaiEl.value) > max) sampaiEl.value = max;
}

function closeStudentModal() { document.getElementById('student-modal').classList.add('hidden'); document.getElementById('student-modal').innerHTML = ''; }

async function saveStudent() {
  const name = document.getElementById('s-name').value.trim();
  const grade = document.getElementById('s-grade').value;
  const kelas = document.getElementById('s-kelas').value;
  if (!name || !grade || !kelas) { showToast('Isi nama, grade, dan kelas', 'error'); return; }
  
  let hafalanData = {};
  if (document.getElementById('hafal-juz').checked) {
    hafalanData = { target_juz: parseInt(document.getElementById('s-target-juz').value) };
  } else {
    hafalanData = {
      target_hafalan_surat: document.getElementById('s-hafal-surat').value,
      target_hafalan_ayat_dari: parseInt(document.getElementById('s-hafal-ayat-dari').value),
      target_hafalan_ayat_sampai: parseInt(document.getElementById('s-hafal-ayat-sampai').value)
    };
  }
  
  const r = await window.dataSdk.create({
    type: 'student', name, grade, kelas,
    iqro_jilid: parseInt(document.getElementById('s-jilid').value),
    iqro_halaman: parseInt(document.getElementById('s-hal').value),
    ...hafalanData,
    email:'',password:'',role:'',juz:0,surat:'',ayat_dari:0,ayat_sampai:0,status:'',tanggal:'',student_id:'',report_type:'',subject:'',nip:'',phone:'',address:'',specialization:'',target_iqro_jilid:0,target_iqro_halaman:0,target_hafalan_juz:0,target_surat_awal:'',target_surat_akhir:'',target_ayat_awal:0,target_ayat_akhir:0,standar_ketuntasan:0,setting_kelas:0
  });
  if (r.isOk) { showToast('Siswa berhasil ditambahkan'); closeStudentModal(); }
  else showToast('Gagal menyimpan','error');
}

function editStudent(id) {
  const s = allData.find(d => d.__backendId === id);
  if (!s) return;
  
  const map = getGradeKelasMap();
  const gradeList = Object.keys(map);
  
  const modal = document.getElementById('student-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] fade-in">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 class="font-bold text-lg text-slate-800">Edit Data Siswa</h3>
        <button onclick="closeStudentModal()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <div class="p-6 overflow-y-auto flex-1 space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Nama</label><input id="s-name" value="${s.name}" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"></div>
          <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Tingkat (Grade)</label><select id="s-grade" onchange="handleGradeChangeForm()" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"><option value="">Pilih Tingkat</option>${gradeList.map(g => `<option value="${g}" ${s.grade === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
        </div>
        <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Kelas</label><select id="s-kelas" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"></select></div>
        
        <div class="border-t border-slate-100 pt-4">
          <h4 class="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2"><i data-lucide="book" class="w-4 h-4"></i> Target Iqro'</h4>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-xs font-semibold text-slate-600 mb-1">Jilid (1-6)</label><input id="s-jilid" type="number" min="1" max="6" value="${s.iqro_jilid||1}" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"></div>
            <div><label class="block text-xs font-semibold text-slate-600 mb-1">Halaman (1-120)</label><input id="s-hal" type="number" min="1" max="120" value="${s.iqro_halaman||1}" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"></div>
          </div>
        </div>
        
        <div class="border-t border-slate-100 pt-4">
          <h4 class="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2"><i data-lucide="bookmark" class="w-4 h-4"></i> Target Hafalan Al-Qur'an</h4>
          <div class="bg-slate-50 p-3 rounded-xl mb-3 flex gap-4">
            <label class="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" id="hafal-juz" name="hafal-type" value="juz" ${!s.target_hafalan_surat ? 'checked' : ''} onchange="updateHafalanMode()" class="text-purple-600 focus:ring-purple-500"> <span>Berdasarkan Juz</span></label>
            <label class="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" id="hafal-surat" name="hafal-type" value="surat" ${s.target_hafalan_surat ? 'checked' : ''} onchange="updateHafalanMode()" class="text-purple-600 focus:ring-purple-500"> <span>Berdasarkan Surat</span></label>
          </div>
          
          <div id="hafal-juz-mode" class="${s.target_hafalan_surat ? 'hidden' : ''}">
            <div><label class="block text-xs font-semibold text-slate-600 mb-1">Target Juz (1-30)</label><input id="s-target-juz" type="number" min="1" max="30" value="${s.target_juz || 30}" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"></div>
          </div>
          
          <div id="hafal-surat-mode" class="${s.target_hafalan_surat ? '' : 'hidden'} space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label class="block text-xs font-semibold text-slate-600 mb-1">Juz</label><select id="s-hafal-juz" onchange="updateHafalanSuratDropdown()" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm bg-white">${Array.from({length:30},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></div>
              <div><label class="block text-xs font-semibold text-slate-600 mb-1">Surat</label><select id="s-hafal-surat" onchange="updateHafalanAyatMax()" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm bg-white"></select></div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="block text-xs font-semibold text-slate-600 mb-1">Dari Ayat</label><input id="s-hafal-ayat-dari" type="number" min="1" value="${s.target_hafalan_ayat_dari || 1}" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"></div>
              <div><label class="block text-xs font-semibold text-slate-600 mb-1">Sampai Ayat</label><input id="s-hafal-ayat-sampai" type="number" min="1" value="${s.target_hafalan_ayat_sampai || 1}" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
        <button onclick="closeStudentModal()" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition">Batal</button>
        <button onclick="updateStudent('${id}')" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-200 transition">Update</button>
      </div>
    </div>
  </div>`;
  updateKelasOptionsForm(s.kelas);
  updateHafalanSuratDropdown();
  
  setTimeout(() => {
    if (s.target_hafalan_surat) {
      const suratEl = document.getElementById('s-hafal-surat');
      if (suratEl) suratEl.value = s.target_hafalan_surat;
      updateHafalanAyatMax();
      const dariEl = document.getElementById('s-hafal-ayat-dari');
      const sampaiEl = document.getElementById('s-hafal-ayat-sampai');
      if (dariEl) dariEl.value = s.target_hafalan_ayat_dari || 1;
      if (sampaiEl) sampaiEl.value = s.target_hafalan_ayat_sampai || 1;
    }
  }, 100);

  if(window.lucide) lucide.createIcons();
}

async function updateStudent(id) {
  const s = allData.find(d => d.__backendId === id);
  if (!s) return;
  s.name = document.getElementById('s-name').value.trim();
  s.grade = document.getElementById('s-grade').value;
  s.kelas = document.getElementById('s-kelas').value;
  s.iqro_jilid = parseInt(document.getElementById('s-jilid').value);
  s.iqro_halaman = parseInt(document.getElementById('s-hal').value);
  
  if (document.getElementById('hafal-juz').checked) {
    s.target_juz = parseInt(document.getElementById('s-target-juz').value);
    s.target_hafalan_surat = '';
    s.target_hafalan_ayat_dari = 0;
    s.target_hafalan_ayat_sampai = 0;
  } else {
    s.target_juz = 0;
    s.target_hafalan_surat = document.getElementById('s-hafal-surat').value;
    s.target_hafalan_ayat_dari = parseInt(document.getElementById('s-hafal-ayat-dari').value);
    s.target_hafalan_ayat_sampai = parseInt(document.getElementById('s-hafal-ayat-sampai').value);
  }
  
  const r = await window.dataSdk.update(s);
  if (r.isOk) { showToast('Data siswa diperbarui'); closeStudentModal(); }
  else showToast('Gagal update','error');
}

let pendingDeleteId = null;
function confirmDeleteStudent(id) {
  pendingDeleteId = id;
  const modal = document.getElementById('student-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center fade-in">
      <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><i data-lucide="alert-triangle" class="w-8 h-8 text-red-500"></i></div>
      <h3 class="font-bold text-xl text-slate-800 mb-2">Hapus Data?</h3>
      <p class="text-sm text-slate-500 mb-6">Data yang dihapus tidak dapat dikembalikan lagi ke dalam sistem.</p>
      <div class="flex gap-3">
        <button onclick="closeStudentModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-sm font-semibold transition">Batal</button>
        <button onclick="doDelete()" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-semibold shadow-md shadow-red-200 transition">Ya, Hapus</button>
      </div>
    </div>
  </div>`;
  if(window.lucide) lucide.createIcons();
}

async function doDelete() {
  const item = allData.find(d => d.__backendId === pendingDeleteId);
  if (item) { const r = await window.dataSdk.delete(item); if(r.isOk) showToast('Data berhasil dihapus'); }
  closeStudentModal();
}

// ============ SEARCH SISWA HELPER ============
function filterStudents(prefix, query) {
  const students = getStudents();
  const dropdown = document.getElementById(`dropdown-${prefix}-student`);
  const hiddenInput = document.getElementById(`${prefix}-student`);
  
  if (hiddenInput.dataset.name !== query) hiddenInput.value = ''; 

  if (!query) {
    renderDropdown(prefix, students.slice(0, 15)); 
    dropdown.classList.remove('hidden');
    return;
  }
  
  const filtered = students.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
  renderDropdown(prefix, filtered.slice(0, 20)); 
  dropdown.classList.remove('hidden');
}

function renderDropdown(prefix, list) {
  const dropdown = document.getElementById(`dropdown-${prefix}-student`);
  if(list.length === 0) {
     dropdown.innerHTML = '<div class="p-4 text-sm text-slate-500 text-center italic">Siswa tidak ditemukan</div>';
     return;
  }
  dropdown.innerHTML = list.map(s => `
    <div class="p-3 hover:bg-emerald-50 cursor-pointer border-b border-slate-50 last:border-0 text-sm transition" 
         onmousedown="selectStudent('${prefix}', '${s.__backendId}', '${s.name.replace(/'/g, "\\'")}', '${s.kelas||s.grade||'-'}')">
      <div class="font-bold text-slate-800">${s.name}</div>
      <div class="text-xs text-slate-500 mt-0.5">Kelas: ${s.kelas||s.grade||'-'}</div>
    </div>`
  ).join('');
}

function selectStudent(prefix, id, name, kelas) {
  if (prefix === 'edit') {
    document.getElementById('dropdown-edit-student').classList.add('hidden');
    document.getElementById('search-edit-student').value = '';
    editStudent(id); 
    return;
  }
  
  const searchInput = document.getElementById(`search-${prefix}-student`);
  const hiddenInput = document.getElementById(`${prefix}-student`);
  
  const displayText = `${name} (${kelas})`;
  searchInput.value = displayText;
  hiddenInput.value = id;
  hiddenInput.dataset.name = displayText;
  
  document.getElementById(`dropdown-${prefix}-student`).classList.add('hidden');

  // TRIGGER AUTO-FILL
  autoFillReportForm(prefix, id);
}

function autoFillReportForm(prefix, studentId) {
  const reports = getReports();
  let reportType = '';
  if (prefix === 'ri') reportType = 'iqro';
  else if (prefix === 'rq') reportType = 'quran';
  else if (prefix === 'rh') reportType = 'hafalan';

  const stReports = reports.filter(r => r.student_id === studentId && r.report_type === reportType);
  
  // Sortir untuk memastikan data terakhir diinput (berdasarkan tanggal dan created_at descending)
  stReports.sort((a, b) => {
    const dateDiff = new Date(b.tanggal || 0) - new Date(a.tanggal || 0);
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
  
  if (stReports.length > 0) {
    const latest = stReports[0];
    if (prefix === 'ri') {
      document.getElementById('ri-jilid').value = latest.iqro_jilid || 1;
      document.getElementById('ri-hal').value = (latest.iqro_halaman || 0) + 1; // Tambah 1 halaman
    } else if (prefix === 'rq') {
      document.getElementById('rq-juz').value = latest.juz || 1;
      updateQuranSuratDropdown(); 
      setTimeout(() => {
        const suratEl = document.getElementById('rq-surat');
        if (suratEl && latest.surat) suratEl.value = latest.surat;
        updateQuranAyatMax();
        
        const mx = getAyatCount(latest.juz || 1, latest.surat);
        const nextAyat = Math.min((latest.ayat_sampai || 0) + 1, mx || 1); // Tambah 1 ayat

        const dariEl = document.getElementById('rq-ayat-dari');
        const sampaiEl = document.getElementById('rq-ayat-sampai');
        if (dariEl) dariEl.value = nextAyat; 
        if (sampaiEl) sampaiEl.value = nextAyat; 
      }, 50);
    } else if (prefix === 'rh') {
      document.getElementById('rh-juz').value = latest.juz || 30;
      updateSuratDropdownH();
      setTimeout(() => {
        const suratEl = document.getElementById('rh-surat');
        if (suratEl && latest.surat) suratEl.value = latest.surat;
        updateAyatMaxH();
        
        const mx = getAyatCount(latest.juz || 30, latest.surat);
        const nextAyat = Math.min((latest.ayat_sampai || 0) + 1, mx || 1); // Tambah 1 ayat

        const dariEl = document.getElementById('rh-ayat-dari');
        const sampaiEl = document.getElementById('rh-ayat-sampai');
        if (dariEl) dariEl.value = nextAyat;
        if (sampaiEl) sampaiEl.value = nextAyat;
      }, 50);
    }
  } else {
    const student = getStudents().find(s => s.__backendId === studentId);
    if (student) {
       if (prefix === 'ri') {
         document.getElementById('ri-jilid').value = student.iqro_jilid || 1;
         document.getElementById('ri-hal').value = student.iqro_halaman || 1;
       } else if (prefix === 'rh') {
         if (student.target_juz && !student.target_hafalan_surat) {
           document.getElementById('rh-juz').value = student.target_juz;
           updateSuratDropdownH();
         } else if (student.target_hafalan_surat) {
           let foundJuz = 30;
           for (let j = 1; j <= 30; j++) {
             if (quranData[j] && quranData[j].find(x => x.name === student.target_hafalan_surat)) {
               foundJuz = j; break;
             }
           }
           document.getElementById('rh-juz').value = foundJuz;
           updateSuratDropdownH();
           setTimeout(() => {
             const sEl = document.getElementById('rh-surat');
             if(sEl) sEl.value = student.target_hafalan_surat;
             updateAyatMaxH();
             const dariEl = document.getElementById('rh-ayat-dari');
             const sampaiEl = document.getElementById('rh-ayat-sampai');
             if (dariEl) dariEl.value = student.target_hafalan_ayat_dari || 1;
             if (sampaiEl) sampaiEl.value = student.target_hafalan_ayat_sampai || 1;
           }, 50);
         }
       } else if (prefix === 'rq') {
         document.getElementById('rq-juz').value = 1;
         updateQuranSuratDropdown();
         setTimeout(() => {
            const dariEl = document.getElementById('rq-ayat-dari');
            const sampaiEl = document.getElementById('rq-ayat-sampai');
            if(dariEl) dariEl.value = 1;
            if(sampaiEl) sampaiEl.value = 1;
         }, 50);
       }
    }
  }
}

document.addEventListener('mousedown', function(e) {
  ['ri', 'rq', 'rh', 'edit'].forEach(prefix => {
    const dropdown = document.getElementById(`dropdown-${prefix}-student`);
    const searchInput = document.getElementById(`search-${prefix}-student`);
    if (dropdown && !dropdown.contains(e.target) && e.target !== searchInput) {
      dropdown.classList.add('hidden');
    }
  });
});
