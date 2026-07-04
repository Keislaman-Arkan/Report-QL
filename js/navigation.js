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
