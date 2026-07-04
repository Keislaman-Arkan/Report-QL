// ============ TEACHERS ============
function renderTeachers(el) {
  const isVisitor = currentUser.role === 'visitor';
  const teachers = getTeachers();
  el.innerHTML = `
  <div class="fade-in max-w-7xl mx-auto">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Data Guru</h2>
      ${!isVisitor?`<button onclick="showAddTeacher()" class="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"><i data-lucide="plus" class="w-4 h-4"></i>Tambah Guru</button>`:''}
    </div>
    <div id="teacher-modal" class="hidden relative z-[100]"></div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${teachers.length ? teachers.map(t => `
        <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-100 card-hover flex items-start gap-4">
          <div class="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center shrink-0"><i data-lucide="user" class="w-6 h-6 text-emerald-600"></i></div>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-slate-800 truncate">${t.name}</h4>
            <p class="text-xs text-slate-500 mt-1 truncate">NIP: ${t.nip||'-'}</p>
            <p class="text-xs text-emerald-600 font-medium mt-1">${t.specialization||'Guru'}</p>
          </div>
          ${!isVisitor?`<button onclick="deleteTeacher('${t.__backendId}')" class="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition shrink-0"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`:''}
        </div>
      `).join('') : '<div class="col-span-full py-12 text-center text-slate-400">Belum ada data guru</div>'}
    </div>
  </div>`;
}

function showAddTeacher() { 
  const modal = document.getElementById('teacher-modal'); modal.classList.remove('hidden');
  modal.innerHTML = `<div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"><div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl fade-in"><h3 class="font-bold text-lg text-slate-800 mb-4">Tambah Guru</h3><div class="space-y-3"><div><label class="text-sm font-semibold text-slate-600">Nama</label><input id="t-name" class="w-full mt-1 px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"></div><div><label class="text-sm font-semibold text-slate-600">NIP</label><input id="t-nip" class="w-full mt-1 px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"></div><div><label class="text-sm font-semibold text-slate-600">No. Telepon</label><input id="t-phone" class="w-full mt-1 px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"></div><div><label class="text-sm font-semibold text-slate-600">Spesialisasi</label><input id="t-spec" class="w-full mt-1 px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Hafalan / Iqro'"></div></div><div class="flex gap-2 mt-6"><button onclick="document.getElementById('teacher-modal').classList.add('hidden')" class="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl text-sm font-semibold text-slate-700">Batal</button><button onclick="saveTeacher()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-emerald-200">Simpan</button></div></div></div>`;
}

async function saveTeacher() {
  const name = document.getElementById('t-name').value;
  if(!name) return;
  await window.dataSdk.create({
    type:'teacher',name,
    nip:document.getElementById('t-nip').value,
    phone:document.getElementById('t-phone').value,
    specialization:document.getElementById('t-spec').value,
    email:'',password:'',role:'',kelas:0,target_juz:0,iqro_jilid:0,iqro_halaman:0,juz:0,surat:'',ayat_dari:0,ayat_sampai:0,status:'',tanggal:'',student_id:'',report_type:'',subject:'',address:'',target_iqro_jilid:0,target_iqro_halaman:0,target_hafalan_juz:0,target_surat_awal:'',target_surat_akhir:'',target_ayat_awal:0,target_ayat_akhir:0,standar_ketuntasan:0,setting_kelas:0
  });
  showToast('Guru ditambahkan');
  document.getElementById('teacher-modal').classList.add('hidden');
  renderPage();
}

async function deleteTeacher(id) {
  const item = allData.find(d=>d.__backendId===id);
  if(item) {
    await window.dataSdk.delete(item);
    showToast('Data guru dihapus');
  }
  renderPage();
}
