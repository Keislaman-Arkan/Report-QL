// ============ SESSION & NAV ============
function saveSession() { localStorage.setItem('ikasi_session_v2', JSON.stringify(currentUser)); }
function loadSession() {
  const s = localStorage.getItem('ikasi_session_v2');
  if (s) { currentUser = JSON.parse(s); return true; }
  return false;
}
function clearSession() { localStorage.removeItem('ikasi_session_v2'); currentUser = null; }

async function refreshAndGoHome() {
  showToast('Menyegarkan data...', 'success');
  if (window.dataSdk.fetchAll) await window.dataSdk.fetchAll();
  navigate('dashboard');
}

function navigate(page) { 
  currentPage = page; 
  if (window.innerWidth < 768 && isSidebarOpen) toggleSidebar();
  renderPage(); 
}

function toggleSidebar() {
  isSidebarOpen = !isSidebarOpen;
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (isSidebarOpen) {
    sidebar.classList.remove('-translate-x-full');
    backdrop.classList.remove('hidden');
  } else {
    sidebar.classList.add('-translate-x-full');
    backdrop.classList.add('hidden');
  }
}

function updateSidebarActiveState() {
  document.querySelectorAll('.sidebar-item').forEach(el => {
    if (el.dataset.page === currentPage) {
      el.classList.add('active', 'text-white');
      el.classList.remove('text-emerald-100', 'border-transparent');
      el.style.borderLeftColor = '#34d399';
    } else {
      el.classList.remove('active', 'text-white');
      el.classList.add('text-emerald-100');
      el.style.borderLeftColor = 'transparent';
    }
  });
}


/**
 * Validasi sesi terhadap database Supabase untuk mencegah Role Spoofing di localStorage
 */
async function validateAndLoadSession() {
  const s = localStorage.getItem('ikasi_session_v2');
  if (!s) {
    currentUser = null;
    return false;
  }
  try {
    const parsed = JSON.parse(s);
    if (!parsed || !parsed.id || !parsed.role) {
      clearSession();
      return false;
    }
    
    if (!supabaseClient) {
      currentUser = parsed;
      return true;
    }
    
    if (parsed.role === 'student') {
      const { data, error } = await supabaseClient
        .from('students')
        .select('id, name, grade, kelas, nis')
        .eq('id', parsed.id)
        .maybeSingle();
      if (error || !data) {
        clearSession();
        return false;
      }
      currentUser = { name: data.name, role: 'student', id: data.id, kelas: data.kelas, grade: data.grade };
      saveSession();
      return true;
    } else {
      const { data, error } = await supabaseClient
        .from('users')
        .select('id, name, email, role')
        .eq('id', parsed.id)
        .maybeSingle();
      if (error || !data) {
        clearSession();
        return false;
      }
      // Penting: Role selalu diambil dari database resmi untuk mencegah manipulasi localStorage
      currentUser = { name: data.name, role: data.role, id: data.id, email: data.email };
      saveSession();
      return true;
    }
  } catch (e) {
    clearSession();
    return false;
  }
}
window.validateAndLoadSession = validateAndLoadSession;

/**
 * Modal universal untuk mengubah kata sandi bagi SEMUA ROLE (Admin, Guru, Siswa)
 */
function showAccountPasswordModal() {
  if (!currentUser) return;
  const existing = document.getElementById('account-password-modal');
  if (existing) existing.remove();

  const roleLabel = currentUser.role === 'admin' ? 'Administrator' : currentUser.role === 'guru' ? 'Guru' : 'Siswa';

  const modal = document.createElement('div');
  modal.id = 'account-password-modal';
  modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 fade-in space-y-4">
      <div class="flex justify-between items-center pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <i data-lucide="key" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="font-bold text-base text-slate-800">Ubah Kata Sandi Akun</h3>
            <p class="text-xs text-slate-500">${escapeHtml(currentUser.name)} (${roleLabel})</p>
          </div>
        </div>
        <button onclick="document.getElementById('account-password-modal').remove()" class="text-slate-400 hover:text-slate-600 p-1"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      
      <div class="space-y-3.5">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Kata Sandi Saat Ini</label>
          <input id="acc-pwd-old" type="password" class="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Masukkan kata sandi lama Anda">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Kata Sandi Baru</label>
          <input id="acc-pwd-new" type="password" class="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Minimal 6 karakter">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Konfirmasi Kata Sandi Baru</label>
          <input id="acc-pwd-confirm" type="password" class="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Ulangi kata sandi baru">
        </div>
      </div>
      
      <p id="acc-pwd-error" class="text-rose-600 text-xs font-medium hidden bg-rose-50 p-2.5 rounded-lg border border-rose-200"></p>
      
      <div class="flex gap-3 pt-2">
        <button onclick="document.getElementById('account-password-modal').remove()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition">Batal</button>
        <button id="acc-pwd-submit-btn" onclick="saveAccountPassword()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-emerald-200 transition">Simpan Sandi Baru</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  if (window.lucide) lucide.createIcons();
}
window.showAccountPasswordModal = showAccountPasswordModal;
window.showChangePasswordModal = showAccountPasswordModal; // Kompatibilitas mundur

async function saveAccountPassword() {
  const oldPwd = document.getElementById('acc-pwd-old').value;
  const newPwd = document.getElementById('acc-pwd-new').value;
  const confirmPwd = document.getElementById('acc-pwd-confirm').value;
  const errorEl = document.getElementById('acc-pwd-error');
  const btn = document.getElementById('acc-pwd-submit-btn');
  
  errorEl.classList.add('hidden');
  
  if (!oldPwd || !newPwd || !confirmPwd) {
    errorEl.textContent = 'Harap isi semua kolom kata sandi';
    errorEl.classList.remove('hidden');
    return;
  }
  
  if (newPwd.length < 6) {
    errorEl.textContent = 'Kata sandi baru minimal harus 6 karakter';
    errorEl.classList.remove('hidden');
    return;
  }
  
  if (newPwd !== confirmPwd) {
    errorEl.textContent = 'Konfirmasi kata sandi baru tidak cocok';
    errorEl.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  try {
    const isStudent = currentUser.role === 'student';
    let record = null;
    let expectedOld = '';

    if (isStudent) {
      record = allData.find(d => d.type === 'student' && d.__backendId === currentUser.id);
      if (!record && supabaseClient) {
        const { data } = await supabaseClient.from('students').select('*').eq('id', currentUser.id).maybeSingle();
        record = data;
      }
      if (!record) throw new Error('Data santri/siswa tidak ditemukan');
      expectedOld = record.password || record.nis || '123456';
    } else {
      record = allData.find(d => (d.type === 'user' || d.type === 'teacher') && d.__backendId === currentUser.id);
      if (!record && supabaseClient) {
        const { data } = await supabaseClient.from('users').select('*').eq('id', currentUser.id).maybeSingle();
        record = data;
      }
      if (!record) throw new Error('Data profil pengguna tidak ditemukan');
      expectedOld = record.password || '';
    }

    const isMatch = await verifyPassword(oldPwd, expectedOld);
    if (!isMatch) {
      errorEl.textContent = 'Kata sandi saat ini (lama) tidak sesuai';
      errorEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Simpan Sandi Baru';
      return;
    }

    const hashed = await hashPassword(newPwd);

    if (isStudent) {
      if (supabaseClient) {
        const { error } = await supabaseClient.from('students').update({ password: hashed }).eq('id', currentUser.id);
        if (error) throw error;
      }
      if (record) record.password = hashed;
    } else {
      if (supabaseClient) {
        const { error } = await supabaseClient.from('users').update({ password: hashed }).eq('id', currentUser.id);
        if (error) throw error;
      }
      if (record) record.password = hashed;
    }

    showToast('Kata sandi Anda berhasil diperbarui!', 'success');
    const modalEl = document.getElementById('account-password-modal');
    if (modalEl) modalEl.remove();
  } catch (err) {
    console.error('Save password error:', err);
    errorEl.textContent = err.message || 'Gagal menyimpan kata sandi ke database';
    errorEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Simpan Sandi Baru';
  }
}
window.saveAccountPassword = saveAccountPassword;
