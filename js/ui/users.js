// ============ USER MANAGEMENT ============
function renderUserManagement(el) {
  const users = getUsers();
  el.innerHTML = `
  <div class="fade-in max-w-7xl mx-auto">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Manajemen Akses Sistem</h2>
      <button onclick="showAddUser()" class="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm"><i data-lucide="plus" class="w-4 h-4"></i>Tambah Akses</button>
    </div>
    <div id="user-modal" class="hidden relative z-[100]"></div>
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto w-full">
        <table class="w-full text-sm min-w-[600px]">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="text-left px-5 py-4 font-semibold text-slate-600">Nama Lengkap</th>
              <th class="text-left px-5 py-4 font-semibold text-slate-600">Username / Email</th>
              <th class="text-left px-5 py-4 font-semibold text-slate-600">Hak Akses (Role)</th>
              <th class="text-center px-5 py-4 font-semibold text-slate-600">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr class="hover:bg-slate-50/50 transition">
              <td class="px-5 py-3 font-semibold text-slate-800">Administrator Utama</td>
              <td class="px-5 py-3 text-slate-500">admin</td>
              <td class="px-5 py-3"><span class="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">Admin</span></td>
              <td class="px-5 py-3 text-center text-slate-400 text-xs italic">Default System</td>
            </tr>
            ${users.map(u => `
              <tr class="hover:bg-slate-50/50 transition">
                <td class="px-5 py-3 font-medium text-slate-700">${u.name}</td>
                <td class="px-5 py-3 text-slate-500">${u.email||'-'}</td>
                <td class="px-5 py-3"><span class="px-3 py-1 rounded-full text-xs font-bold ${u.role==='admin'?'bg-purple-100 text-purple-700':u.role==='guru'?'bg-blue-100 text-blue-700':'bg-slate-100 text-slate-700'}">${u.role.toUpperCase()}</span></td>
                <td class="px-5 py-3 flex justify-center">
                  <button onclick="deleteUser('${u.__backendId}')" class="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function showAddUser() {
  const modal = document.getElementById('user-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl fade-in">
      <h3 class="font-bold text-lg text-slate-800 mb-5">Berikan Akses Sistem Baru</h3>
      <div class="space-y-4">
        <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Nama Pengguna</label><input id="u-name" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="Contoh: Budi Santoso"></div>
        <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Username / Email (Untuk Login)</label><input id="u-email" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="Contoh: budi123"></div>
        <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Password</label><input id="u-pass" type="password" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="Masukkan password kuat"></div>
        <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Hak Akses (Role)</label><select id="u-role" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"><option value="guru">Guru (Terbatas)</option><option value="admin">Admin (Akses Penuh)</option></select></div>
      </div>
      <div class="flex gap-3 mt-6">
        <button onclick="document.getElementById('user-modal').classList.add('hidden')" class="flex-1 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition">Batal</button>
        <button onclick="saveUser()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-emerald-200 transition">Simpan Akses</button>
      </div>
    </div>
  </div>`;
  if(window.lucide) lucide.createIcons();
}

async function saveUser() {
  const name = document.getElementById('u-name').value.trim();
  const pass = document.getElementById('u-pass').value;
  if (!name || !pass) { showToast('Nama dan Password wajib diisi','error'); return; }
  if (allData.length >= 999) { showToast('Batas data tercapai','warning'); return; }
  const r = await window.dataSdk.create({
    type:'user',name,email:document.getElementById('u-email').value,password:pass,role:document.getElementById('u-role').value,
    kelas:0,target_juz:0,iqro_jilid:0,iqro_halaman:0,juz:0,surat:'',ayat_dari:0,ayat_sampai:0,status:'',tanggal:'',student_id:'',report_type:'',subject:'',nip:'',phone:'',address:'',specialization:'',target_iqro_jilid:0,target_iqro_halaman:0,target_hafalan_juz:0,target_surat_awal:'',target_surat_akhir:'',target_ayat_awal:0,target_ayat_akhir:0,standar_ketuntasan:0,setting_kelas:0
  });
  if(r.isOk){showToast('Hak akses berhasil ditambahkan');document.getElementById('user-modal').classList.add('hidden'); renderPage();}
  else showToast('Gagal menambahkan','error');
}

async function deleteUser(id) {
  const item = allData.find(d=>d.__backendId===id);
  if(item){await window.dataSdk.delete(item);showToast('Akses pengguna dicabut'); renderPage();}
}

// ============ GURU ACCOUNT MANAGEMENT ============
function renderGuruAccount(el) {
  const gurus = getTeachers();
  el.innerHTML = `
  <div class="fade-in max-w-7xl mx-auto">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Kelola Akun Guru</h2>
      <button onclick="showAddGuruAccount()" class="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm"><i data-lucide="plus" class="w-4 h-4"></i>Buat Akun Guru</button>
    </div>
    <div id="guru-account-modal" class="hidden relative z-[100]"></div>
    
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto w-full">
        <table class="w-full text-sm min-w-[650px]">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="text-left px-5 py-4 font-semibold text-slate-600">Nama Guru</th>
              <th class="text-left px-5 py-4 font-semibold text-slate-600">Username Login</th>
              <th class="text-left px-5 py-4 font-semibold text-slate-600">Status Akun</th>
              <th class="text-center px-5 py-4 font-semibold text-slate-600">Tindakan Khusus</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            ${gurus.length ? gurus.map(g => `
              <tr class="hover:bg-slate-50/50 transition">
                <td class="px-5 py-3 font-semibold text-slate-800">${g.name}</td>
                <td class="px-5 py-3 text-slate-600"><code class="bg-slate-100 px-3 py-1.5 rounded-lg text-xs border border-slate-200">${g.email || g.name}</code></td>
                <td class="px-5 py-3"><span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><i data-lucide="check" class="w-3 h-3 inline mr-1"></i>Aktif</span></td>
                <td class="px-5 py-3 flex justify-center gap-2">
                  <button onclick="editGuruAccount('${g.__backendId}')" title="Edit Detail" class="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition"><i data-lucide="edit" class="w-4 h-4"></i></button>
                  <button onclick="resetGuruPassword('${g.__backendId}')" title="Reset Password" class="p-2 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-amber-600 transition"><i data-lucide="key" class="w-4 h-4"></i></button>
                  <button onclick="confirmDeleteGuruAccount('${g.__backendId}')" title="Hapus Akun" class="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="4" class="px-5 py-12 text-center text-slate-400">Belum ada akun guru yang didaftarkan.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
  if(window.lucide) lucide.createIcons();
}

function showAddGuruAccount() {
  const modal = document.getElementById('guru-account-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl fade-in">
      <h3 class="font-bold text-lg text-slate-800 mb-5">Pendaftaran Akun Guru Baru</h3>
      <div class="space-y-4">
        <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Nama Lengkap Guru</label><input id="ga-name" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="Sesuai dengan nama asli"></div>
        <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Sandi (Password) Login</label><input id="ga-password" type="password" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="Buatkan sandi sementara"></div>
      </div>
      <div class="flex gap-3 mt-6">
        <button onclick="closeGuruAccountModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition">Batal</button>
        <button onclick="saveGuruAccount()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-emerald-200 transition">Buat Akun</button>
      </div>
    </div>
  </div>`;
  if(window.lucide) lucide.createIcons();
}

function closeGuruAccountModal() { document.getElementById('guru-account-modal').classList.add('hidden'); }

async function saveGuruAccount() {
  const name = document.getElementById('ga-name').value.trim();
  const password = document.getElementById('ga-password').value;
  if (!name || !password) { showToast('Nama dan sandi wajib diisi', 'error'); return; }
  if (allData.length >= 999) { showToast('Batas data tercapai', 'warning'); return; }
  
  const r = await window.dataSdk.create({
    type: 'teacher',
    name,
    email: name.toLowerCase().replace(/\s+/g, ''),
    password,
    nip: '', phone: '', specialization: '', address: '', role: 'guru',
    kelas: 0, target_juz: 0, iqro_jilid: 0, iqro_halaman: 0, juz: 0, surat: '', ayat_dari: 0, ayat_sampai: 0, status: '', tanggal: '', student_id: '', report_type: '', subject: '', target_iqro_jilid: 0, target_iqro_halaman: 0, target_hafalan_juz: 0, target_surat_awal: '', target_surat_akhir: '', target_ayat_awal: 0, target_ayat_akhir: 0, standar_ketuntasan: 0, setting_kelas: 0
  });
  
  if (r.isOk) { showToast('Akun guru berhasil dibuat. Username otomatis menyesuaikan nama.'); closeGuruAccountModal(); renderPage(); } 
  else showToast('Gagal membuat akun', 'error');
}

function editGuruAccount(id) {
  const guru = allData.find(d => d.__backendId === id);
  if (!guru) return;
  
  const modal = document.getElementById('guru-account-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl fade-in">
      <h3 class="font-bold text-lg text-slate-800 mb-5">Edit Identitas Guru</h3>
      <div class="space-y-4">
        <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Nama Lengkap</label><input id="ga-name" value="${guru.name}" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"></div>
        <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Ubah Sandi</label><input id="ga-password" type="password" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="(Kosongkan jika tidak ingin diubah)"></div>
      </div>
      <div class="flex gap-3 mt-6">
        <button onclick="closeGuruAccountModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition">Batal</button>
        <button onclick="updateGuruAccount('${id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-emerald-200 transition">Simpan Perubahan</button>
      </div>
    </div>
  </div>`;
}

async function updateGuruAccount(id) {
  const guru = allData.find(d => d.__backendId === id);
  if (!guru) return;
  
  const name = document.getElementById('ga-name').value.trim();
  const password = document.getElementById('ga-password').value;
  if (!name) { showToast('Nama wajib diisi', 'error'); return; }
  
  guru.name = name;
  if (password) guru.password = password;
  
  const r = await window.dataSdk.update(guru);
  if (r.isOk) { showToast('Data guru berhasil diperbarui'); closeGuruAccountModal(); renderPage(); } 
  else showToast('Gagal menyimpan perubahan', 'error');
}

async function resetGuruPassword(id) {
  const guru = allData.find(d => d.__backendId === id);
  if (!guru) return;
  
  const modal = document.getElementById('guru-account-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl fade-in">
      <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4"><i data-lucide="key" class="w-6 h-6 text-amber-600"></i></div>
      <h3 class="font-bold text-lg text-slate-800 mb-1">Reset Password Paksa</h3>
      <p class="text-sm text-slate-500 mb-5">Anda akan mereset sandi login untuk guru <strong>${guru.name}</strong>.</p>
      
      <div class="space-y-4">
        <div><label class="block text-sm font-semibold text-slate-700 mb-1.5">Sandi Baru</label><input id="ga-new-password" type="password" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="Ketikkan sandi baru"></div>
      </div>
      <div class="flex gap-3 mt-6">
        <button onclick="closeGuruAccountModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition">Batal</button>
        <button onclick="confirmResetPassword('${id}')" class="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-amber-200 transition">Ganti Sandi</button>
      </div>
    </div>
  </div>`;
  if(window.lucide) lucide.createIcons();
}

async function confirmResetPassword(id) {
  const guru = allData.find(d => d.__backendId === id);
  if (!guru) return;
  
  const newPassword = document.getElementById('ga-new-password').value;
  if (!newPassword) { showToast('Mohon masukkan sandi baru', 'error'); return; }
  
  guru.password = newPassword;
  const r = await window.dataSdk.update(guru);
  if (r.isOk) { showToast(`Sandi untuk ${guru.name} berhasil direset`); closeGuruAccountModal(); renderPage(); } 
  else showToast('Gagal mereset sandi', 'error');
}

let pendingDeleteGuruId = null;
function confirmDeleteGuruAccount(id) {
  pendingDeleteGuruId = id;
  const guru = allData.find(d => d.__backendId === id);
  if (!guru) return;
  
  const modal = document.getElementById('guru-account-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center fade-in">
      <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><i data-lucide="user-x" class="w-8 h-8 text-red-500"></i></div>
      <h3 class="font-bold text-xl text-slate-800 mb-2">Hapus Akun Guru?</h3>
      <p class="text-sm text-slate-500 mb-1">Aksi ini akan menghapus permanen akses login atas nama:</p>
      <p class="font-bold text-slate-700 text-lg mb-6">${guru.name}</p>
      <div class="flex gap-3">
        <button onclick="closeGuruAccountModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-sm font-semibold transition">Kembali</button>
        <button onclick="doDeleteGuruAccount()" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-semibold shadow-md shadow-red-200 transition">Ya, Hapus</button>
      </div>
    </div>
  </div>`;
  if(window.lucide) lucide.createIcons();
}

async function doDeleteGuruAccount() {
  const guru = allData.find(d => d.__backendId === pendingDeleteGuruId);
  if (guru) {
    const r = await window.dataSdk.delete(guru);
    if (r.isOk) { showToast(`Akun guru ${guru.name} dihapus dari sistem`); renderPage(); }
    else showToast('Gagal menghapus', 'error');
  }
  closeGuruAccountModal();
}
