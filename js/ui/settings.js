// ============ SETTINGS ============
let activeSettingsTab = 'kelas-names';

function renderSettings(el) {
  const map = getGradeKelasMap();
  const grades = Object.keys(map);

  el.innerHTML = `
  <div class="fade-in max-w-7xl mx-auto">
    <h2 class="text-2xl font-bold text-slate-800 mb-6">Pengaturan Sistem</h2>
    
    <div class="flex overflow-x-auto gap-1 mb-6 border-b border-slate-200 hide-scroll">
      <button onclick="activeSettingsTab='kelas-names';renderPage()" class="shrink-0 px-5 py-3 text-sm font-semibold transition ${activeSettingsTab==='kelas-names'?'border-b-2 border-emerald-600 text-emerald-700':'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}">Manajemen Kelas</button>
      <button onclick="activeSettingsTab='targets';renderPage()" class="shrink-0 px-5 py-3 text-sm font-semibold transition ${activeSettingsTab==='targets'?'border-b-2 border-emerald-600 text-emerald-700':'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}">Target Kurikulum</button>
      <button onclick="activeSettingsTab='features';renderPage()" class="shrink-0 px-5 py-3 text-sm font-semibold transition ${activeSettingsTab==='features'?'border-b-2 border-emerald-600 text-emerald-700':'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}">Fitur Aplikasi</button>
    </div>
    
    ${activeSettingsTab==='kelas-names' ? `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        ${grades.map(gradeName => {
          const classesInGrade = map[gradeName] || [];
          return `
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 class="font-bold text-slate-800 text-lg flex items-center gap-2"><i data-lucide="layers" class="w-5 h-5 text-emerald-500"></i> ${gradeName}</h3>
              <button onclick="showAddKelasModal('${gradeName}')" class="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-3 py-1.5 rounded-lg transition">+ Tambah Kelas</button>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${classesInGrade.length > 0 ? classesInGrade.map(className => `
                <div class="flex justify-between items-center bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl">
                  <span class="font-medium text-slate-700 text-sm">${className}</span>
                  <button onclick="deleteKelasDynamic('${gradeName}', '${className}')" class="text-slate-400 hover:text-red-500 transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
              `).join('') : '<div class="col-span-full text-center text-sm text-slate-400 py-3 italic">Belum ada kelas di tingkat ini</div>'}
            </div>
          </div>
          `;
        }).join('')}
      </div>
      
      <div class="space-y-6">
        <div class="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200">
          <h3 class="font-bold text-lg mb-2">Informasi</h3>
          <p class="text-emerald-50 text-sm leading-relaxed mb-4">Tambahkan kelas secara spesifik di setiap tingkat (grade) sesuai dengan tahun ajaran berjalan. Data ini akan otomatis tampil di menu siswa dan laporan.</p>
          <div class="bg-white/20 rounded-xl p-4 flex items-center gap-4">
            <div class="text-4xl font-black">${getAllClassesFlat().length}</div>
            <div class="text-sm font-medium leading-tight">Total Kelas<br>Aktif</div>
          </div>
        </div>
      </div>
    </div>
    <div id="kelas-modal" class="hidden relative z-[100]"></div>
    ` : activeSettingsTab==='targets' ? `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2"><i data-lucide="book" class="w-5 h-5 text-emerald-500"></i> Target Iqro' Per Tingkat</h3>
        <div class="space-y-4">
          ${grades.map((gradeName, idx) => {
            const s = allData.find(x=>x.type==='setting' && x.subject===`iqro_target_${gradeName}`);
            return `<div class="flex items-center gap-3"><span class="text-sm font-medium w-24 truncate" title="${gradeName}">${gradeName}:</span><input id="set-iqro-jilid-${idx}" type="number" min="1" max="6" value="${s?.data?.target_iqro_jilid||1}" class="w-16 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"><span class="text-xs text-slate-500">Jilid</span><input id="set-iqro-hal-${idx}" type="number" min="1" max="120" value="${s?.data?.target_iqro_halaman||120}" class="w-16 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"><span class="text-xs text-slate-500">Hal</span></div>`;
          }).join('')}
        </div>
        <button onclick="saveSettingsIqro()" class="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md transition w-full">Simpan Target Iqro'</button>
      </div>

      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2"><i data-lucide="bookmark" class="w-5 h-5 text-blue-500"></i> Target Hafalan Per Tingkat</h3>
        <div id="hafalan-settings" class="space-y-4">
          ${grades.map((gradeName, idx) => {
            const s = allData.find(x=>x.type==='setting' && x.subject===`hafalan_target_${gradeName}`);
            const juz = s?.data?.target_hafalan_juz || 30;
            const surats = getSuratByJuz(juz);
            const surat = s?.data?.target_surat_awal || (surats[0]?.name || '');
            const maxAyat = getAyatCount(juz, surat);
            return `<div class="border border-slate-100 bg-slate-50/50 rounded-xl p-4">
              <p class="text-sm font-bold text-slate-700 mb-3">${gradeName}</p>
              <div class="flex items-center gap-2 flex-wrap mb-3">
                <select id="set-haf-juz-${idx}" onchange="updateSettingSuratAyat(${idx})" class="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500">${Array.from({length:30},(_,i)=>`<option value="${i+1}" ${juz==i+1?'selected':''}>Juz ${i+1}</option>`).join('')}</select>
                <select id="set-haf-surat-${idx}" onchange="updateSettingAyatMax(${idx})" class="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500">${surats.map(su=>`<option value="${su.name}" ${surat===su.name?'selected':''}>${su.name}</option>`).join('')}</select>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-slate-500 w-10">Ayat</span>
                <input id="set-haf-ayat-dari-${idx}" type="number" min="1" value="${s?.data?.target_ayat_awal||1}" class="w-16 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                <span class="text-xs text-slate-400">s/d</span>
                <input id="set-haf-ayat-sampai-${idx}" type="number" min="1" value="${s?.data?.target_ayat_akhir||maxAyat}" class="w-16 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
            </div>`;
          }).join('')}
        </div>
        <button onclick="saveSettingsHafalan()" class="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md transition w-full">Simpan Target Hafalan</button>
      </div>
    </div>
    ` : activeSettingsTab==='features' ? `
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 max-w-2xl">
      <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <i data-lucide="toggle-left" class="w-5 h-5 text-emerald-500"></i> Pengaturan Fitur Siswa
      </h3>
      
      <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div>
          <h4 class="font-bold text-slate-800 text-sm">Aktifkan Naik Kelas Mandiri oleh Siswa</h4>
          <p class="text-xs text-slate-500 mt-1 max-w-[280px] sm:max-w-md">Jika diaktifkan, siswa akan melihat tombol "Naik Kelas" di dashboard rapor mandiri mereka.</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" id="allow-student-promote" class="sr-only peer" ${isStudentPromoteEnabled() ? 'checked' : ''} onchange="toggleStudentPromoteSetting(this.checked)">
          <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>
    </div>
    ` : ''}
  </div>`;
}

function updateSettingSuratAyat(idx) {
  const juz = parseInt(document.getElementById(`set-haf-juz-${idx}`).value);
  const surats = getSuratByJuz(juz);
  const sel = document.getElementById(`set-haf-surat-${idx}`);
  sel.innerHTML = surats.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
  updateSettingAyatMax(idx);
}

function updateSettingAyatMax(idx) {
  const juz = parseInt(document.getElementById(`set-haf-juz-${idx}`).value);
  const surat = document.getElementById(`set-haf-surat-${idx}`).value;
  const max = getAyatCount(juz, surat);
  const m1 = document.getElementById(`set-haf-ayat-sampai-${idx}`);
  const m2 = document.getElementById(`set-haf-ayat-dari-${idx}`);
  if(m1) m1.max = max; 
  if(m2) m2.max = max;
  if (m1 && parseInt(m1.value) > max) m1.value = max;
}

async function saveSettingsIqro() {
  const grades = Object.keys(getGradeKelasMap());
  if (allData.length >= 999) { showToast('Batas data tercapai','warning'); return; }
  
  let operations = [];
  for (let i = 0; i < grades.length; i++) {
    const gradeName = grades[i];
    const subjectName = `iqro_target_${gradeName}`;
    const existing = allData.find(x => x.type === 'setting' && x.subject === subjectName);
    
    const targetData = {
      target_iqro_jilid: parseInt(document.getElementById(`set-iqro-jilid-${i}`).value) || 1,
      target_iqro_halaman: parseInt(document.getElementById(`set-iqro-hal-${i}`).value) || 120
    };
    
    if (existing) {
      existing.data = targetData;
      operations.push(window.dataSdk.update(existing, true));
    } else {
      operations.push(window.dataSdk.create({ type: 'setting', subject: subjectName, data: targetData, name:'',email:'',password:'',role:'',kelas:0,target_juz:0,iqro_jilid:0,iqro_halaman:0,juz:0,surat:'',ayat_dari:0,ayat_sampai:0,status:'',tanggal:'',student_id:'',report_type:'',nip:'',phone:'',address:'',specialization:'',setting_kelas:0,target_iqro_jilid:0,target_iqro_halaman:0,target_hafalan_juz:0,target_surat_awal:'',target_surat_akhir:'',target_ayat_awal:0,target_ayat_akhir:0,standar_ketuntasan:0 }, true));
    }
  }
  await Promise.all(operations);
  await window.dataSdk.fetchAll();
  showToast("Target Iqro' per tingkat berhasil disimpan");
}

async function saveSettingsHafalan() {
  const grades = Object.keys(getGradeKelasMap());
  if (allData.length >= 999) { showToast('Batas data tercapai','warning'); return; }
  
  let operations = [];
  for (let i = 0; i < grades.length; i++) {
    const gradeName = grades[i];
    const subjectName = `hafalan_target_${gradeName}`;
    const existing = allData.find(x => x.type === 'setting' && x.subject === subjectName);
    
    const targetData = {
      target_hafalan_juz: parseInt(document.getElementById(`set-haf-juz-${i}`).value) || 30,
      target_surat_awal: document.getElementById(`set-haf-surat-${i}`).value || '',
      target_ayat_awal: parseInt(document.getElementById(`set-haf-ayat-dari-${i}`).value) || 1,
      target_ayat_akhir: parseInt(document.getElementById(`set-haf-ayat-sampai-${i}`).value) || 1
    };
    
    if (existing) {
      existing.data = targetData;
      operations.push(window.dataSdk.update(existing, true));
    } else {
      operations.push(window.dataSdk.create({ type: 'setting', subject: subjectName, data: targetData, name:'',email:'',password:'',role:'',kelas:0,target_juz:0,iqro_jilid:0,iqro_halaman:0,juz:0,surat:'',ayat_dari:0,ayat_sampai:0,status:'',tanggal:'',student_id:'',report_type:'',nip:'',phone:'',address:'',specialization:'',setting_kelas:0,target_iqro_jilid:0,target_iqro_halaman:0,target_hafalan_juz:0,target_surat_awal:'',target_surat_akhir:'',target_ayat_awal:0,target_ayat_akhir:0,standar_ketuntasan:0 }, true));
    }
  }
  await Promise.all(operations);
  await window.dataSdk.fetchAll();
  showToast("Target Hafalan per tingkat berhasil disimpan");
}

function showAddKelasModal(gradeName) {
  const modal = document.getElementById('kelas-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl fade-in">
      <h3 class="font-bold text-lg text-slate-800 mb-1">Tambah Kelas Baru</h3>
      <p class="text-sm text-slate-500 mb-5">Akan ditambahkan ke: <span class="font-bold text-emerald-600">${gradeName}</span></p>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1.5">Nama Kelas</label>
          <input id="k-name" class="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Contoh: 1 Zaid, 1 Bilal">
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button onclick="closeKelasModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition">Batal</button>
        <button onclick="addKelasNameDynamic('${gradeName}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md transition">Simpan</button>
      </div>
    </div>
  </div>`;
  if(window.lucide) lucide.createIcons();
}

function closeKelasModal() { document.getElementById('kelas-modal').classList.add('hidden'); }

async function addKelasNameDynamic(gradeName) {
  const inputEl = document.getElementById('k-name');
  const className = inputEl.value.trim();
  if (!className) { showToast('Nama kelas harus diisi', 'error'); return; }
  
  const map = getGradeKelasMap();
  if (!map[gradeName]) map[gradeName] = [];
  
  if (map[gradeName].includes(className)) { 
    showToast(`Kelas ${className} sudah ada di ${gradeName}`, 'warning'); 
    return; 
  }
  
  map[gradeName].push(className);
  await saveGradeKelasMap(map);
  
  showToast(`Kelas ${className} berhasil ditambahkan`);
  closeKelasModal();
  renderPage();
}

async function deleteKelasDynamic(gradeName, className) {
  const map = getGradeKelasMap();
  if (map[gradeName]) {
    map[gradeName] = map[gradeName].filter(c => c !== className);
    await saveGradeKelasMap(map);
    showToast(`Kelas ${className} dihapus`);
    renderPage();
  }
}

async function toggleStudentPromoteSetting(checked) {
  const existing = allData.find(x => x.type === 'setting' && x.subject === 'allow_student_promote');
  if (existing) {
    existing.data = { enabled: checked };
    await window.dataSdk.update(existing);
  } else {
    await window.dataSdk.create({
      type: 'setting',
      subject: 'allow_student_promote',
      data: { enabled: checked },
      name:'',email:'',password:'',role:'',kelas:0,target_juz:0,iqro_jilid:0,iqro_halaman:0,juz:0,surat:'',ayat_dari:0,ayat_sampai:0,status:'',tanggal:'',student_id:'',report_type:'',nip:'',phone:'',address:'',specialization:'',setting_kelas:0,target_iqro_jilid:0,target_iqro_halaman:0,target_hafalan_juz:0,target_surat_awal:'',target_surat_akhir:'',target_ayat_awal:0,target_ayat_akhir:0,standar_ketuntasan:0
    });
  }
  showToast(checked ? 'Fitur Naik Kelas diaktifkan' : 'Fitur Naik Kelas dinonaktifkan', 'success');
}
