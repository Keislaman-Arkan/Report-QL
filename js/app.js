// ============ RENDER ENGINE ============
let isStudentLoginMode = false;

function render() {
  const app = document.getElementById('app');
  if (!currentUser) { 
    app.className = "h-full w-full overflow-auto";
    renderLogin(app); 
  } else if (currentUser.role === 'student') {
    app.className = "h-full w-full overflow-y-auto bg-slate-50";
    renderStudentDashboard(app);
  } else { 
    app.className = "h-full w-full flex flex-col md:flex-row overflow-hidden bg-slate-50";
    renderMain(app); 
  }
  if(window.lucide) lucide.createIcons();
}

function renderLogin(app) {
  app.innerHTML = `
  <div class="h-full w-full flex items-center justify-center bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
    <div class="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-md fade-in">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><i data-lucide="book-open" class="w-8 h-8 text-emerald-600"></i></div>
        <h1 class="text-2xl font-bold text-slate-800">Qur'an Learning</h1>
        <p class="text-slate-500 mt-1">Sistem Manajemen Pembelajaran Al-Qur'an</p>
      </div>
      <div id="login-form">
        ${isStudentLoginMode ? `
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-700 mb-1">NIS / Nama Siswa</label>
            <input id="login-user" type="text" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Masukkan NIS atau Nama Anda">
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-slate-700 mb-1">Kata Sandi</label>
            <input id="login-pass" type="password" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Masukkan Kata Sandi">
          </div>
          <button onclick="handleLogin()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition">Masuk sebagai Siswa</button>
          <button onclick="isStudentLoginMode=false;render()" class="w-full mt-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg transition">Masuk sebagai Guru / Admin</button>
        ` : `
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-700 mb-1">Username / Email</label>
            <input id="login-user" type="text" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Masukkan username">
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input id="login-pass" type="password" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Masukkan password">
          </div>
          <button onclick="handleLogin()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition">Masuk</button>
          <button onclick="isStudentLoginMode=true;render()" class="w-full mt-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg transition">Masuk sebagai Siswa</button>
        `}
        <p id="login-error" class="text-red-500 text-sm mt-3 hidden"></p>
      </div>
    </div>
  </div>`;
}


async function handleLogin() {
  const userRaw = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  if (!userRaw || !pass) { showLoginError('Harap isi semua kolom'); return; }
  
  // Sanitasi input pengguna untuk mencegah manipulasi filter PostgREST (SEC-AUD-04)
  const user = userRaw.replace(/["\\]/g, '').trim();
  if (!user) { showLoginError('Karakter tidak valid pada NIS / Username'); return; }
  
  const submitBtn = document.querySelector('#login-form button');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="inline-flex items-center gap-2">Memverifikasi...</span>';
  }

  try {
    if (!supabaseClient) {
      showLoginError('Koneksi database belum terhubung');
      return;
    }

    if (isStudentLoginMode) {
      // Query hanya siswa yang cocok berdasarkan NIS atau nama (tanpa unduh seluruh tabel)
      const { data: students, error } = await supabaseClient
        .from('students')
        .select('*')
        .or(`nis.eq."${user}",name.ilike."${user}"`);

      if (error) {
        console.error("Login error:", error);
        showLoginError('Terjadi kesalahan saat memeriksa akun');
        return;
      }

      let matchedStudent = null;
      if (students && students.length > 0) {
        for (const s of students) {
          const expected = s.password || s.nis || '123456';
          const isMatch = await verifyPassword(pass, expected);
          if (isMatch) {
            matchedStudent = s;
            // Upgrade otomatis password lama ke sha256 ber-salt
            if (!s.password || !s.password.startsWith('sha256:')) {
              const newHash = await hashPassword(pass);
              await supabaseClient.from('students').update({ password: newHash }).eq('id', s.id);
            }
            break;
          }
        }
      }

      if (matchedStudent) {
        currentUser = {
          name: matchedStudent.name,
          role: 'student',
          id: matchedStudent.id,
          kelas: matchedStudent.kelas,
          grade: matchedStudent.grade
        };
        saveSession();
        // Muat data hanya setelah otentikasi valid
        await window.dataSdk.fetchAll();
        render();
        return;
      }
      showLoginError('NIS / Nama atau kata sandi salah');
      return;
    }

    // Login Guru / Admin
    const { data: users, error } = await supabaseClient
      .from('users')
      .select('*')
      .or(`name.eq."${user}",email.eq."${user}"`);

    if (error) {
      console.error("Login error:", error);
      showLoginError('Terjadi kesalahan saat memeriksa akun');
      return;
    }

    let matchedUser = null;
    if (users && users.length > 0) {
      for (const u of users) {
        const isMatch = await verifyPassword(pass, u.password);
        if (isMatch) {
          matchedUser = u;
          // Upgrade otomatis password lama ke hash aman
          if (u.password && !u.password.startsWith('sha256:')) {
            const newHash = await hashPassword(pass);
            await supabaseClient.from('users').update({ password: newHash }).eq('id', u.id);
          }
          break;
        }
      }
    }

    // Perlindungan instalasi baru: Jika database belum memiliki Admin sama sekali
    if (!matchedUser && user === 'admin' && pass === 'admin123') {
      const { data: anyAdmin } = await supabaseClient.from('users').select('id').eq('role', 'admin').limit(1);
      if (!anyAdmin || anyAdmin.length === 0) {
        showFirstTimeAdminSetupModal();
        return;
      }
    }

    if (matchedUser) {
      currentUser = {
        name: matchedUser.name,
        role: matchedUser.role,
        id: matchedUser.id,
        email: matchedUser.email
      };
      saveSession();
      // Muat data aplikasi setelah otentikasi berhasil
      await window.dataSdk.fetchAll();
      render();
      return;
    }

    showLoginError('Username / Email atau password salah');
  } catch (err) {
    console.error('Login exception:', err);
    showLoginError('Gagal memproses login');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = isStudentLoginMode ? 'Masuk sebagai Siswa' : 'Masuk';
    }
  }
}

function showFirstTimeAdminSetupModal() {
  const modal = document.createElement('div');
  modal.id = 'first-admin-modal';
  modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 fade-in space-y-4">
      <div class="text-center">
        <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-600">
          <i data-lucide="shield-alert" class="w-6 h-6"></i>
        </div>
        <h3 class="font-bold text-lg text-slate-800">Inisialisasi Admin Pertama</h3>
        <p class="text-xs text-slate-500 mt-1">Belum ada akun Administrator di database. Buat kata sandi baru yang aman untuk akun Admin Anda sekarang.</p>
      </div>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Username Admin</label>
          <input id="init-admin-user" type="text" value="admin" class="w-full px-3 py-2 border rounded-xl text-sm outline-none bg-slate-50" readonly>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
          <input id="init-admin-pass" type="password" class="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Minimal 6 karakter">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Konfirmasi Kata Sandi</label>
          <input id="init-admin-confirm" type="password" class="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ulangi kata sandi">
        </div>
      </div>
      <p id="init-admin-err" class="text-rose-600 text-xs font-medium hidden"></p>
      <div class="flex gap-2 pt-2">
        <button onclick="document.getElementById('first-admin-modal').remove()" class="flex-1 bg-slate-100 py-2.5 rounded-xl text-sm font-semibold text-slate-700">Batal</button>
        <button onclick="saveFirstTimeAdmin()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md">Simpan Admin</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  if (window.lucide) lucide.createIcons();
}

async function saveFirstTimeAdmin() {
  const pass = document.getElementById('init-admin-pass').value;
  const confirm = document.getElementById('init-admin-confirm').value;
  const errEl = document.getElementById('init-admin-err');
  
  if (!pass || pass.length < 6) {
    errEl.textContent = 'Kata sandi minimal 6 karakter';
    errEl.classList.remove('hidden');
    return;
  }
  if (pass !== confirm) {
    errEl.textContent = 'Konfirmasi kata sandi tidak cocok';
    errEl.classList.remove('hidden');
    return;
  }

  const hashed = await hashPassword(pass);
  const { data, error } = await supabaseClient.from('users').insert([{
    name: 'Admin',
    email: 'admin@quranlearning.local',
    password: hashed,
    role: 'admin',
    specialization: 'Administrator Sistem'
  }]).select().single();

  if (error) {
    errEl.textContent = 'Gagal membuat admin: ' + error.message;
    errEl.classList.remove('hidden');
    return;
  }

  currentUser = { name: data.name, role: data.role, id: data.id, email: data.email };
  saveSession();
  document.getElementById('first-admin-modal').remove();
  showToast('Akun Administrator berhasil dibuat!', 'success');
  await window.dataSdk.fetchAll();
  render();
}


function loginAsVisitor() { currentUser = { name: 'Pengunjung', role: 'visitor', id: 'visitor' }; saveSession(); render(); }
function showLoginError(msg) { const el = document.getElementById('login-error'); el.textContent = msg; el.classList.remove('hidden'); }
function handleLogout() { clearSession(); currentPage = 'dashboard'; isStudentLoginMode = false; render(); }

// ============ MAIN LAYOUT & SIDEBAR ============
function renderMain(app) {
  const isAdmin = currentUser.role === 'admin';
  
  const menuItems = [
    { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
    { id: 'students', icon: 'users', label: 'Data Siswa' },
    { id: 'teachers', icon: 'user-check', label: 'Data Guru' },
    { id: 'halaqoh', icon: 'layers', label: 'Halaqoh' },
    { id: 'report-bacaan', icon: 'book', label: 'Laporan Bacaan' },
    { id: 'report-hafalan', icon: 'bookmark', label: 'Laporan Hafalan' },
    { id: 'report-history', icon: 'history', label: 'Riwayat Laporan' },
    { id: 'reports', icon: 'file-text', label: 'Rekap Laporan' },
    { id: 'statistics', icon: 'bar-chart-2', label: 'Statistik' },
  ];
  if (isAdmin) {
    menuItems.push({ id: 'settings', icon: 'settings', label: 'Pengaturan' });
    menuItems.push({ id: 'user-management', icon: 'shield', label: 'Manajemen User' });
    menuItems.push({ id: 'guru-account', icon: 'user-cog', label: 'Akun Guru' });
  }

  app.innerHTML = `
  <!-- Mobile Header -->
  <header class="md:hidden bg-emerald-800 text-white flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] shadow-md z-40 w-full shrink-0">
    <div class="flex items-center gap-3 cursor-pointer hover:opacity-80 transition" onclick="refreshAndGoHome()">
      <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><i data-lucide="book-open" class="w-4 h-4"></i></div>
      <h1 class="font-bold text-lg">Qur'an Learning</h1>
    </div>
    
    <div class="flex items-center gap-1.5">
      <button onclick="showAccountPasswordModal()" class="p-2 bg-emerald-700/80 hover:bg-emerald-600 rounded-lg transition" title="Ubah Kata Sandi"><i data-lucide="key" class="w-5 h-5"></i></button>
      <button onclick="toggleSidebar()" class="p-2 bg-emerald-700 rounded-lg hover:bg-emerald-600"><i data-lucide="menu" class="w-6 h-6"></i></button>
    </div>
  </header>

  <!-- Sidebar Backdrop (Mobile) -->
  <div id="sidebar-backdrop" onclick="toggleSidebar()" class="fixed inset-0 bg-black/50 z-40 hidden md:hidden"></div>

  <!-- Sidebar -->
  <aside id="sidebar" class="fixed md:static inset-y-0 left-0 w-64 bg-gradient-to-b from-emerald-800 to-emerald-900 text-white flex flex-col h-full transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out z-50 shadow-2xl md:shadow-none pt-[env(safe-area-inset-top)] md:pt-0 pb-[env(safe-area-inset-bottom)]">
    <div class="p-5 border-b border-emerald-700 hidden md:block cursor-pointer hover:bg-emerald-800/50 transition" onclick="refreshAndGoHome()">
      <h1 class="font-bold text-lg flex items-center gap-2"><i data-lucide="book-open" class="w-5 h-5 text-emerald-300"></i> Qur'an Learning</h1>
      <p class="text-emerald-300 text-xs mt-1 ml-7">${escapeHtml(currentUser.name)} (${escapeHtml(currentUser.role)})</p>
    </div>
    <div class="p-5 border-b border-emerald-700 md:hidden flex justify-between items-center">
       <div>
         <p class="font-semibold">${escapeHtml(currentUser.name)}</p>
         <p class="text-emerald-300 text-xs">${currentUser.role}</p>
       </div>
       <button onclick="toggleSidebar()" class="p-1"><i data-lucide="x" class="w-6 h-6"></i></button>
    </div>
    <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
      ${menuItems.map(m => `
        <button data-page="${m.id}" onclick="navigate('${m.id}')" class="sidebar-item w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm border-l-4 border-transparent">
          <i data-lucide="${m.icon}" class="w-4 h-4"></i> ${m.label}
        </button>
      `).join('')}
    </nav>
    <div class="p-4 border-t border-emerald-700">
      <button onclick="handleLogout()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm text-emerald-200 hover:text-white hover:bg-white/10 transition">
        <i data-lucide="log-out" class="w-4 h-4"></i> Logout
      </button>
    </div>
  </aside>

  <!-- Main Content Area -->
  <main id="main-content" class="flex-1 overflow-y-auto h-full p-4 md:p-6 bg-slate-50 w-full pb-[max(1.5rem,env(safe-area-inset-bottom))]"></main>
  `;
  
  renderPage();
}

function renderPage(options = {}) {
  const main = document.getElementById('main-content');
  if (!main) return;
  
  const adminPages = ['settings', 'user-management', 'guru-account'];
  if (adminPages.includes(currentPage) && currentUser.role !== 'admin') {
    currentPage = 'dashboard'; 
  }

  if (!options.keepScroll) {
    window.scrollTo(0,0);
  }
  updateSidebarActiveState();

  switch(currentPage) {
    case 'dashboard': renderDashboard(main); break;
    case 'students': renderStudents(main); break;
    case 'teachers': renderTeachers(main); break;
    case 'halaqoh': renderHalaqoh(main, options); break;
    case 'report-bacaan': renderReportBacaan(main); break;
    case 'report-hafalan': renderReportHafalan(main); break;
    case 'report-history': renderReportHistory(main); break;
    case 'reports': renderReports(main); break;
    case 'statistics': renderStatistics(main); break;
    case 'settings': renderSettings(main); break;
    case 'user-management': renderUserManagement(main); break;
    case 'guru-account': renderGuruAccount(main); break;
    default: renderDashboard(main);
  }
  if(window.lucide) lucide.createIcons();
}

// ============ INIT ============
async function initApp() {
  window.elementSdk.init({ defaultConfig, onConfigChange: async (cfg) => { document.body.style.fontFamily = `${cfg.font_family || defaultConfig.font_family}, sans-serif`; } });
  
  const url = window.SUPABASE_URL || localStorage.getItem('SUPABASE_URL');
  const key = window.SUPABASE_ANON_KEY || localStorage.getItem('SUPABASE_ANON_KEY');
  
  if (!url || !key || url.includes('MASUKKAN_') || key.includes('MASUKKAN_')) {
    renderConfigForm();
    return;
  }
  
  await window.dataSdk.init({ 
    onDataChanged(data) { 
      allData = data; 
      if (currentUser) {
        if (currentPage === 'halaqoh' && typeof renderHalaqohContent === 'function' && document.getElementById('halaqoh-active-container')) {
          renderHalaqohContent({ animateSwitch: false });
        } else {
          renderPage({ keepScroll: true });
        }
      } 
      if(window.lucide) lucide.createIcons(); 
    } 
  });
  loadSession(); render();
}
initApp();

function renderConfigForm() {
  const app = document.getElementById('app');
  app.className = "h-full w-full flex items-center justify-center bg-slate-100 p-4";
  app.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-md fade-in">
      <div class="text-center mb-6">
        <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3"><i data-lucide="database" class="w-6 h-6 text-amber-600"></i></div>
        <h2 class="text-xl font-bold text-slate-800">Konfigurasi Database</h2>
        <p class="text-sm text-slate-500 mt-1">Supabase belum dikonfigurasi. Masukkan detail koneksi database Anda.</p>
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1">Supabase URL</label>
          <input id="cfg-url" type="text" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="https://xxxx.supabase.co">
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1">Supabase Anon Key</label>
          <input id="cfg-key" type="password" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">
        </div>
        <button onclick="saveDbConfig()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition shadow-md">Simpan Konfigurasi</button>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

function saveDbConfig() {
  const url = document.getElementById('cfg-url').value.trim();
  const key = document.getElementById('cfg-key').value.trim();
  if (!url || !key) { showToast('Harap isi semua kolom', 'error'); return; }
  
  localStorage.setItem('SUPABASE_URL', url);
  localStorage.setItem('SUPABASE_ANON_KEY', key);
  showToast('Konfigurasi disimpan! Memuat ulang...', 'success');
  setTimeout(() => window.location.reload(), 1000);
}
