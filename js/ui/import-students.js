// ============ IMPORT SISWA CSV/EXCEL ============

// Kolom template yang wajib ada
const IMPORT_COLUMNS = ['name','grade','kelas','nis','password','iqro_jilid','iqro_halaman','target_juz','target_hafalan_surat','target_hafalan_ayat_dari','target_hafalan_ayat_sampai'];
let importedRows = []; // Baris hasil parsing

function downloadStudentTemplate() {
  const header = 'name,grade,kelas,nis,password,iqro_jilid,iqro_halaman,target_juz,target_hafalan_surat,target_hafalan_ayat_dari,target_hafalan_ayat_sampai';
  const example1 = 'Ahmad Fauzi,Grade 1,1 A,120101,123456,1,10,30,,,'; 
  const example2 = 'Siti Aisyah,Grade 2,2 A,120202,123456,2,45,,An-Nas,1,6';
  const notes = [
    '# PETUNJUK PENGISIAN:',
    '# - name        : Nama lengkap siswa (WAJIB)',
    '# - grade       : Tingkat kelas, contoh: Grade 1 / Grade 2 / ... / Grade 6 (WAJIB)',
    '# - kelas       : Nama kelas, harus sesuai dengan kelas yang ada di sistem (WAJIB)',
    '# - nis         : Nomor Induk Siswa untuk login siswa (opsional)',
    '# - password    : Kata sandi login siswa (opsional, default: 123456 jika kosong)',
    '# - iqro_jilid  : Angka 1-6 (target iqro jilid)',
    '# - iqro_halaman: Angka 1-120 (target halaman iqro)',
    '# - target_juz  : Angka 1-30, ISI HANYA JIKA target hafalan berdasarkan juz (kosongkan jika pakai surat)',
    '# - target_hafalan_surat  : Nama surat, ISI HANYA JIKA target berdasarkan surat (contoh: An-Nas)',
    '# - target_hafalan_ayat_dari : Nomor ayat awal',
    '# - target_hafalan_ayat_sampai: Nomor ayat akhir',
    '# Hapus baris-baris komentar (#) sebelum diimport!'
  ].join('\n');
  const csv = notes + '\n' + header + '\n' + example1 + '\n' + example2;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_import_siswa.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Template CSV berhasil diunduh!');
}

function showImportStudents() {
  const modal = document.getElementById('student-modal');
  modal.classList.remove('hidden');
  importedRows = [];
  modal.innerHTML = `
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 md:p-6">
    <div class="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col fade-in" style="max-height:92vh">
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-blue-700 flex justify-between items-center shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <i data-lucide="file-spreadsheet" class="w-5 h-5 text-white"></i>
          </div>
          <div>
            <h3 class="font-bold text-lg text-white">Import Siswa dari CSV / Excel</h3>
            <p class="text-blue-100 text-xs mt-0.5">Data siswa akan diunggah langsung ke Supabase, UUID dibuat otomatis</p>
          </div>
        </div>
        <button onclick="closeStudentModal()" class="text-white/70 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>

      <!-- Step 1: Upload zona -->
      <div id="import-step-upload" class="p-6 flex-1 overflow-y-auto">
        
        <!-- Info box -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex gap-3">
          <i data-lucide="info" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5"></i>
          <div class="text-sm text-blue-800">
            <p class="font-bold mb-1">Format yang didukung: .csv dan .xlsx (Excel)</p>
            <p>Baris pertama file harus berisi <strong>nama kolom header</strong>. Kolom wajib: <code class="bg-blue-100 px-1 rounded">name</code>, <code class="bg-blue-100 px-1 rounded">grade</code>, <code class="bg-blue-100 px-1 rounded">kelas</code>.</p>
            <p class="mt-1">Belum punya template? <button onclick="downloadStudentTemplate()" class="text-blue-600 font-bold underline hover:text-blue-800">Unduh template CSV</button> terlebih dahulu.</p>
          </div>
        </div>

        <!-- Drop zone -->
        <div id="import-drop-zone" class="import-drop-zone flex flex-col items-center justify-center gap-3 py-12 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition"
             onclick="document.getElementById('import-file-input').click()"
             ondragover="event.preventDefault();this.classList.add('dragover')"
             ondragleave="this.classList.remove('dragover')"
             ondrop="handleImportDrop(event)">
          <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
            <i data-lucide="upload-cloud" class="w-8 h-8 text-blue-500"></i>
          </div>
          <div class="text-center">
            <p class="font-bold text-slate-700">Klik atau seret file ke sini</p>
            <p class="text-sm text-slate-400 mt-1">Mendukung file .csv dan .xlsx (Excel)</p>
          </div>
          <input type="file" id="import-file-input" accept=".csv,.xlsx,.xls" class="hidden" onchange="handleImportFile(this.files[0])">
        </div>

        <div id="import-file-status" class="hidden mt-4 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <i data-lucide="file-check" class="w-5 h-5 text-emerald-500 shrink-0"></i>
          <span id="import-file-name" class="text-sm font-semibold text-slate-700 flex-1 truncate"></span>
          <button onclick="clearImportFile()" class="text-slate-400 hover:text-red-500"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
      </div>

      <!-- Step 2: Preview tabel -->
      <div id="import-step-preview" class="hidden flex-1 overflow-y-auto">
        <div class="px-6 pt-4 pb-2 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
          <div>
            <h4 class="font-bold text-slate-800">Preview Data</h4>
            <p id="import-preview-summary" class="text-xs text-slate-500 mt-0.5"></p>
          </div>
          <button onclick="clearImportFile()" class="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 font-medium">
            <i data-lucide="refresh-ccw" class="w-3 h-3"></i> Ganti File
          </button>
        </div>
        <div class="overflow-x-auto">
          <table id="import-preview-table" class="import-preview-table w-full text-sm min-w-[700px]">
            <thead>
              <tr>
                <th class="px-4 py-3 text-left">#</th>
                <th class="px-4 py-3 text-left">Status</th>
                <th class="px-4 py-3 text-left">Nama</th>
                <th class="px-4 py-3 text-left">Grade</th>
                <th class="px-4 py-3 text-left">Kelas</th>
                <th class="px-4 py-3 text-left">Iqro Jilid</th>
                <th class="px-4 py-3 text-left">Iqro Hal</th>
                <th class="px-4 py-3 text-left">Target Juz</th>
                <th class="px-4 py-3 text-left">Target Surat</th>
                <th class="px-4 py-3 text-left">Ayat</th>
                <th class="px-4 py-3 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody id="import-preview-body"></tbody>
          </table>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0">
        <div id="import-progress-bar" class="hidden w-full sm:w-2/3">
          <div class="flex justify-between text-xs text-slate-600 font-semibold mb-1">
            <span>Mengimpor data...</span>
            <span id="import-progress-text">0 / 0</span>
          </div>
          <div class="w-full bg-slate-200 rounded-full h-2">
            <div id="import-progress-fill" class="h-2 rounded-full bg-blue-500 transition-all" style="width:0%"></div>
          </div>
        </div>
        <div id="import-footer-btns" class="flex gap-3 w-full sm:w-auto justify-end">
          <button onclick="closeStudentModal()" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition border border-slate-300">Batal</button>
          <button id="import-submit-btn" onclick="doImportStudents()" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition hidden flex items-center gap-2">
            <i data-lucide="upload" class="w-4 h-4"></i>
            <span id="import-submit-label">Simpan ke Database</span>
          </button>
        </div>
      </div>

    </div>
  </div>`;
  if(window.lucide) lucide.createIcons();
}

function handleImportDrop(event) {
  event.preventDefault();
  document.getElementById('import-drop-zone').classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  if (file) handleImportFile(file);
}

function handleImportFile(file) {
  if (!file) return;
  const allowedTypes = ['.csv', '.xlsx', '.xls'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedTypes.includes(ext)) {
    showToast('Format file tidak didukung. Gunakan .csv atau .xlsx', 'error');
    return;
  }

  document.getElementById('import-file-status').classList.remove('hidden');
  document.getElementById('import-file-name').textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let rows = [];
      if (ext === '.csv') {
        rows = parseCSV(e.target.result);
      } else {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        rows = jsonData;
      }
      showImportPreview(rows, file.name);
    } catch(err) {
      showToast('Gagal membaca file: ' + err.message, 'error');
      console.error(err);
    }
  };
  if (ext === '.csv') {
    reader.readAsText(file, 'UTF-8');
  } else {
    reader.readAsArrayBuffer(file);
  }
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'));
  if (lines.length < 2) throw new Error('File CSV kosong atau tidak ada data.');
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\"']/g,''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = [];
    let inQuote = false, cur = '';
    for (let c of line) {
      if (c === '"') { inQuote = !inQuote; }
      else if (c === ',' && !inQuote) { vals.push(cur.trim()); cur = ''; }
      else cur += c;
    }
    vals.push(cur.trim());
    
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (vals[idx] || '').trim(); });
    rows.push(obj);
  }
  return rows;
}

function validateImportRow(row, idx) {
  const errors = [];
  const validGrades = Object.keys(getGradeKelasMap());
  const validClasses = getAllClassesFlat();

  if (!row.name || !String(row.name).trim()) errors.push('Nama kosong');
  if (!row.grade || !String(row.grade).trim()) errors.push('Grade kosong');
  else if (!validGrades.includes(String(row.grade).trim())) errors.push(`Grade "${row.grade}" tidak ada di sistem`);
  if (!row.kelas || !String(row.kelas).trim()) errors.push('Kelas kosong');
  else if (!validClasses.includes(String(row.kelas).trim())) errors.push(`Kelas "${row.kelas}" tidak ditemukan`);
  return errors;
}

function showImportPreview(rows, fileName) {
  importedRows = rows;
  let okCount = 0, errCount = 0;
  const tbody = [];

  rows.forEach((row, idx) => {
    const errors = validateImportRow(row, idx);
    const isOk = errors.length === 0;
    if (isOk) okCount++; else errCount++;

    const targetAyat = row.target_hafalan_surat 
      ? `${row.target_hafalan_ayat_dari||'-'} - ${row.target_hafalan_ayat_sampai||'-'}`
      : '-';

    tbody.push(`
      <tr class="${isOk ? 'row-ok' : 'row-error'} border-b border-slate-100 hover:opacity-80 transition">
        <td class="px-4 py-2.5 text-slate-400 font-mono">${idx+1}</td>
        <td class="px-4 py-2.5"><span class="${isOk ? 'badge-ok' : 'badge-err'}">${isOk ? '✓ OK' : '✗ Error'}</span></td>
        <td class="px-4 py-2.5 font-semibold">${escHtml(row.name||'-')}</td>
        <td class="px-4 py-2.5">${escHtml(row.grade||'-')}</td>
        <td class="px-4 py-2.5">${escHtml(row.kelas||'-')}</td>
        <td class="px-4 py-2.5">${row.iqro_jilid||'-'}</td>
        <td class="px-4 py-2.5">${row.iqro_halaman||'-'}</td>
        <td class="px-4 py-2.5">${row.target_juz||'-'}</td>
        <td class="px-4 py-2.5 max-w-[120px] truncate" title="${escHtml(row.target_hafalan_surat||'')}">${escHtml(row.target_hafalan_surat||'-')}</td>
        <td class="px-4 py-2.5">${targetAyat}</td>
        <td class="px-4 py-2.5 text-xs ${isOk ? 'text-emerald-600' : 'text-red-600'}">${isOk ? 'Siap diimpor' : errors.join('; ')}</td>
      </tr>`);
  });

  document.getElementById('import-step-upload').classList.add('hidden');
  const previewEl = document.getElementById('import-step-preview');
  previewEl.classList.remove('hidden');
  document.getElementById('import-preview-body').innerHTML = tbody.join('');
  document.getElementById('import-preview-summary').textContent = 
    `Total: ${rows.length} baris  |  ✓ Siap: ${okCount}  |  ✗ Error: ${errCount}`;

  const btn = document.getElementById('import-submit-btn');
  document.getElementById('import-submit-label').textContent = `Simpan ${okCount} Siswa ke Database`;
  if (okCount > 0) { btn.classList.remove('hidden'); } else { btn.classList.add('hidden'); }
  if(window.lucide) lucide.createIcons();
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function clearImportFile() {
  importedRows = [];
  const uploadEl = document.getElementById('import-step-upload');
  const previewEl = document.getElementById('import-step-preview');
  const statusEl = document.getElementById('import-file-status');
  const fileInput = document.getElementById('import-file-input');
  if (uploadEl) uploadEl.classList.remove('hidden');
  if (previewEl) previewEl.classList.add('hidden');
  if (statusEl) statusEl.classList.add('hidden');
  if (fileInput) fileInput.value = '';
  document.getElementById('import-submit-btn').classList.add('hidden');
}

async function doImportStudents() {
  if (!importedRows.length) return;
  const validRows = importedRows.filter((r, i) => validateImportRow(r, i).length === 0);
  if (!validRows.length) { showToast('Tidak ada baris valid untuk diimpor', 'error'); return; }

  const progressBar = document.getElementById('import-progress-bar');
  const progressFill = document.getElementById('import-progress-fill');
  const progressText = document.getElementById('import-progress-text');
  const submitBtn = document.getElementById('import-submit-btn');
  
  progressBar.classList.remove('hidden');
  submitBtn.disabled = true;
  submitBtn.classList.add('opacity-50', 'cursor-not-allowed');

  let success = 0, failed = 0;
  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    const pct = Math.round(((i+1) / validRows.length) * 100);
    progressFill.style.width = pct + '%';
    progressText.textContent = `${i+1} / ${validRows.length}`;
    
    const hafalanSurat = String(row.target_hafalan_surat || '').trim();
    const targetJuz = parseInt(row.target_juz) || 0;

    const payload = {
      type: 'student',
      name: String(row.name).trim(),
      grade: String(row.grade).trim(),
      kelas: String(row.kelas).trim(),
      nis: row.nis ? String(row.nis).trim() : '',
      password: row.password ? String(row.password).trim() : '',
      iqro_jilid: parseInt(row.iqro_jilid) || 1,
      iqro_halaman: parseInt(row.iqro_halaman) || 1,
      target_juz: hafalanSurat ? 0 : (targetJuz || 30),
      target_hafalan_surat: hafalanSurat || '',
      target_hafalan_ayat_dari: hafalanSurat ? (parseInt(row.target_hafalan_ayat_dari) || 1) : 0,
      target_hafalan_ayat_sampai: hafalanSurat ? (parseInt(row.target_hafalan_ayat_sampai) || 1) : 0,
      email:'',role:'',juz:0,surat:'',ayat_dari:0,ayat_sampai:0,
      status:'',tanggal:'',student_id:'',report_type:'',subject:'',
      nip:'',phone:'',address:'',specialization:'',
      target_iqro_jilid:0,target_iqro_halaman:0,target_hafalan_juz:0,
      target_surat_awal:'',target_surat_akhir:'',target_ayat_awal:0,
      target_ayat_akhir:0,standar_ketuntasan:0,setting_kelas:0
    };

    const result = await window.dataSdk.create(payload, true);
    if (result.isOk) success++; else failed++;

    await new Promise(res => setTimeout(res, 50));
  }

  await window.dataSdk.fetchAll();

  progressFill.style.width = '100%';
  progressText.textContent = `Selesai!`;
  
  showToast(`Import selesai: ${success} berhasil, ${failed} gagal`, failed > 0 ? 'warning' : 'success');

  setTimeout(() => {
    closeStudentModal();
    renderPage();
  }, 1500);
}
