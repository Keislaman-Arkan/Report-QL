// ============ DATA & STATE ============
let allData = [];
let currentUser = null;
let currentPage = 'dashboard';
let isSidebarOpen = false;

// Filter State untuk Laporan
let reportFilterType = '';
let reportFilterGrade = '';
let reportFilterClass = '';

function getSuratByJuz(juz) { return quranData[juz] || []; }
function getAyatCount(juz, surat) { const s = getSuratByJuz(juz).find(x => x.name === surat); return s ? s.ayat : 0; }

// --- Database Helpers ---
function getStudents() { return allData.filter(d => d.type === 'student'); }
function getTeachers() { return allData.filter(d => d.type === 'teacher'); }
function getReports() { return allData.filter(d => d.type === 'report'); }
function getUsers() { return allData.filter(d => d.type === 'user'); }

function getLatestStudentStatus(reportsList) {
  const latest = {};
  const sortedReports = [...reportsList].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
  sortedReports.forEach(r => {
    latest[r.student_id] = r;
  });
  return Object.values(latest);
}

// --- LOGIC PENILAIAN "TUNTAS" TARGET ---
function getBacaanScore(type, jilid, hal) {
  if (type === 'quran') return 999999;
  return (parseInt(jilid) || 1) * 1000 + (parseInt(hal) || 1);
}

function getJuzRank(j) {
  if(j===30) return 1; if(j===29) return 2; if(j===28) return 3;
  if(j===27) return 4; if(j===26) return 5; return j + 5; 
}

function getHafalanScore(juz, surat, ayat) {
   const suratIndex = hafalanProgressPath.indexOf(surat);
   if (suratIndex === -1) return 0;
   return (suratIndex * 1000) + (parseInt(ayat) || 1);
}

function calculateTuntasMetrics(studentsList, reportsList) {
  let tuntasBacaan = 0; let tuntasHafalan = 0;
  let evaluatedBacaan = 0; let evaluatedHafalan = 0;

  studentsList.forEach(student => {
    const grade = student.grade;
    const stReports = reportsList.filter(r => r.student_id === student.__backendId);
    
    const bacaanReports = stReports.filter(r => r.report_type === 'iqro' || r.report_type === 'quran').sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));
    const hafalanReports = stReports.filter(r => r.report_type === 'hafalan').sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));

    const tIqro = allData.find(x => x.type === 'setting' && x.subject === `iqro_target_${grade}`)?.data || {target_iqro_jilid:1, target_iqro_halaman:120};
    const tHafalan = allData.find(x => x.type === 'setting' && x.subject === `hafalan_target_${grade}`)?.data || {target_hafalan_juz:30, target_surat_awal:'', target_ayat_akhir:1};

    const targetBacaanScore = getBacaanScore('iqro', tIqro.target_iqro_jilid, tIqro.target_iqro_halaman);
    const targetHafalanScore = getHafalanScore(tHafalan.target_hafalan_juz, tHafalan.target_surat_awal, tHafalan.target_ayat_akhir);

    if (bacaanReports.length > 0) {
       evaluatedBacaan++;
       const latest = bacaanReports[0];
       if (getBacaanScore(latest.report_type, latest.iqro_jilid, latest.iqro_halaman) >= targetBacaanScore) tuntasBacaan++;
    }
    if (hafalanReports.length > 0) {
       evaluatedHafalan++;
       const latest = hafalanReports[0];
       if (getHafalanScore(latest.juz, latest.surat, latest.ayat_sampai) >= targetHafalanScore) tuntasHafalan++;
    }
  });

  return { tuntasBacaan, tuntasHafalan, evaluatedBacaan, evaluatedHafalan };
}

function getGradeKelasMap() {
  const setting = allData.find(x => x.type === 'setting' && x.subject === 'grade_kelas_map');
  let parsed = null;
  if (setting && setting.data) {
    try { parsed = typeof setting.data === 'string' ? JSON.parse(setting.data) : setting.data; } catch(e){}
  }
  return parsed || {
    "Grade 1": ["1 A", "1 B"], "Grade 2": ["2 A"], "Grade 3": ["3 A"], 
    "Grade 4": ["4 A"], "Grade 5": ["5 A"], "Grade 6": ["6 A"]
  };
}

async function saveGradeKelasMap(mapObj) {
  let setting = allData.find(x => x.type === 'setting' && x.subject === 'grade_kelas_map');
  if (setting) {
    setting.data = mapObj; 
    await window.dataSdk.update(setting);
  } else {
    await window.dataSdk.create({ type: 'setting', subject: 'grade_kelas_map', data: mapObj, name:'',email:'',password:'',role:'',kelas:0,target_juz:0,iqro_jilid:0,iqro_halaman:0,juz:0,surat:'',ayat_dari:0,ayat_sampai:0,status:'',tanggal:'',student_id:'',report_type:'',nip:'',phone:'',address:'',specialization:'',setting_kelas:0,target_iqro_jilid:0,target_iqro_halaman:0,target_hafalan_juz:0,target_surat_awal:'',target_surat_akhir:'',target_ayat_awal:0,target_ayat_akhir:0,standar_ketuntasan:0,setting_kelas:0 });
  }
}

function getAllClassesFlat() {
  const map = getGradeKelasMap();
  let list = [];
  Object.values(map).forEach(classes => { list = list.concat(classes); });
  return list;
}

function today() { return new Date().toISOString().split('T')[0]; }

function showToast(msg, type='success') {
  const colors = { success: 'bg-emerald-500', error: 'bg-red-500', warning: 'bg-amber-500' };
  const div = document.createElement('div');
  div.className = `toast fixed top-4 right-4 ${colors[type]} text-white px-5 py-3 rounded-lg shadow-lg z-50 font-medium`;
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

function isStudentPromoteEnabled() {
  const s = allData.find(x => x.type === 'setting' && x.subject === 'allow_student_promote');
  return s ? !!s.data?.enabled : false;
}
