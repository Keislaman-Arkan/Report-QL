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
            <input id="login-pass" type="password" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Default: 123456">
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

function handleLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  if (!user || !pass) { showLoginError('Harap isi semua field'); return; }
  
  if (isStudentLoginMode) {
    const students = getStudents();
    const found = students.find(s => 
      (s.nis === user || s.name.toLowerCase() === user.toLowerCase()) && 
      (s.password === pass || (!s.password && (pass === '123456' || pass === s.nis)))
    );
    if (found) {
      currentUser = { name: found.name, role: 'student', id: found.__backendId, kelas: found.kelas, grade: found.grade };
      saveSession();
      render();
      return;
    }
    showLoginError('NIS / Nama atau password salah');
    return;
  }
  
  const allAccounts = allData.filter(d => d.type === 'user' || d.type === 'teacher');
  const found = allAccounts.find(u => (u.name === user || u.email === user) && u.password === pass);
  
  if (found) { currentUser = { name: found.name, role: found.role, id: found.__backendId }; saveSession(); render(); return; }
  if (user === 'admin' && pass === 'admin123') { currentUser = { name: 'Admin', role: 'admin', id: 'default' }; saveSession(); render(); return; }
  showLoginError('Username atau password salah');
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
    { id: 'report-bacaan', icon: 'book', label: 'Laporan Bacaan' },
    { id: 'report-hafalan', icon: 'bookmark', label: 'Laporan Hafalan' },
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
    <button onclick="toggleSidebar()" class="p-2 bg-emerald-700 rounded-lg hover:bg-emerald-600"><i data-lucide="menu" class="w-6 h-6"></i></button>
  </header>

  <!-- Sidebar Backdrop (Mobile) -->
  <div id="sidebar-backdrop" onclick="toggleSidebar()" class="fixed inset-0 bg-black/50 z-40 hidden md:hidden"></div>

  <!-- Sidebar -->
  <aside id="sidebar" class="fixed md:static inset-y-0 left-0 w-64 bg-gradient-to-b from-emerald-800 to-emerald-900 text-white flex flex-col h-full transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out z-50 shadow-2xl md:shadow-none pt-[env(safe-area-inset-top)] md:pt-0 pb-[env(safe-area-inset-bottom)]">
    <div class="p-5 border-b border-emerald-700 hidden md:block cursor-pointer hover:bg-emerald-800/50 transition" onclick="refreshAndGoHome()">
      <h1 class="font-bold text-lg flex items-center gap-2"><i data-lucide="book-open" class="w-5 h-5 text-emerald-300"></i> Qur'an Learning</h1>
      <p class="text-emerald-300 text-xs mt-1 ml-7">${currentUser.name} (${currentUser.role})</p>
    </div>
    <div class="p-5 border-b border-emerald-700 md:hidden flex justify-between items-center">
       <div>
         <p class="font-semibold">${currentUser.name}</p>
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

function renderPage() {
  const main = document.getElementById('main-content');
  if (!main) return;
  
  const adminPages = ['settings', 'user-management', 'guru-account'];
  if (adminPages.includes(currentPage) && currentUser.role !== 'admin') {
    currentPage = 'dashboard'; 
  }

  window.scrollTo(0,0);
  updateSidebarActiveState();

  switch(currentPage) {
    case 'dashboard': renderDashboard(main); break;
    case 'students': renderStudents(main); break;
    case 'teachers': renderTeachers(main); break;
    case 'report-bacaan': renderReportBacaan(main); break;
    case 'report-hafalan': renderReportHafalan(main); break;
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
  
  await window.dataSdk.init({ onDataChanged(data) { allData = data; if (currentUser) renderPage(); if(window.lucide) lucide.createIcons(); } });
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
