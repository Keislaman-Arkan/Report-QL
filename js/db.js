const dbUrl = window.SUPABASE_URL || localStorage.getItem('SUPABASE_URL') || '';
const dbKey = window.SUPABASE_ANON_KEY || localStorage.getItem('SUPABASE_ANON_KEY') || '';
let supabaseClient = null;
if (dbUrl && dbKey && !dbUrl.includes('MASUKKAN_') && !dbKey.includes('MASUKKAN_')) {
  supabaseClient = window.supabase.createClient(dbUrl, dbKey);
}

window.elementSdk = {
  init: function(config) { if (config && config.onConfigChange) config.onConfigChange(config.defaultConfig || {}); },
  setConfig: function(cfg) {}
};

window.dataSdk = {
  init: async function(handler) {
    window._dataHandler = handler;
    if (supabaseClient) {
      await this.fetchAll();
    }
    return { isOk: true };
  },
  
  fetchAll: async function() {
    if (!supabaseClient) return;
    try {
      const [usersRes, studentsRes, reportsRes, settingsRes] = await Promise.all([
        supabaseClient.from('users').select('*'),
        supabaseClient.from('students').select('*'),
        supabaseClient.from('reports').select('*'),
        supabaseClient.from('settings').select('*')
      ]);

      let combinedData = [];
      if (usersRes.data) usersRes.data.forEach(u => combinedData.push({...u, __backendId: u.id, type: u.role === 'guru' ? 'teacher' : 'user'}));
      if (studentsRes.data) studentsRes.data.forEach(s => combinedData.push({...s, __backendId: s.id, type: 'student'}));
      if (reportsRes.data) reportsRes.data.forEach(r => combinedData.push({...r, __backendId: r.id, type: 'report'}));
      if (settingsRes.data) settingsRes.data.forEach(set => combinedData.push({...set, __backendId: set.id, type: 'setting'}));
      
      if(window._dataHandler) window._dataHandler.onDataChanged(combinedData);
    } catch (e) {
      console.error("Gagal mengambil data dari Supabase", e);
    }
  },

  create: async function(data, skipFetch = false) {
    if (!supabaseClient) return { isOk: false };
    let table = '', payload = {};
    if (data.type === 'student') {
      table = 'students';
      payload = { name: data.name, grade: data.grade, kelas: data.kelas, nis: data.nis, password: data.password, class_updated_at: data.class_updated_at, iqro_jilid: data.iqro_jilid, iqro_halaman: data.iqro_halaman, target_juz: data.target_juz, target_hafalan_surat: data.target_hafalan_surat, target_hafalan_ayat_dari: data.target_hafalan_ayat_dari, target_hafalan_ayat_sampai: data.target_hafalan_ayat_sampai };
    } else if (data.type === 'report') {
      table = 'reports';
      payload = { student_id: data.student_id, report_type: data.report_type, tanggal: data.tanggal, status: data.status, iqro_jilid: data.iqro_jilid, iqro_halaman: data.iqro_halaman, juz: data.juz, surat: data.surat, ayat_dari: data.ayat_dari, ayat_sampai: data.ayat_sampai, catatan: data.catatan };
    } else if (data.type === 'teacher' || data.type === 'user') {
      table = 'users';
      payload = { name: data.name, email: data.email, password: data.password, role: data.role, nip: data.nip, phone: data.phone, specialization: data.specialization };
    } else if (data.type === 'setting') {
      table = 'settings';
      payload = { subject: data.subject, data: data.data };
    }
    const { error } = await supabaseClient.from(table).insert([payload]);
    if (!error && !skipFetch) await this.fetchAll();
    return { isOk: !error };
  },

  update: async function(data, skipFetch = false) {
    if (!supabaseClient) return { isOk: false };
    let table = '', payload = {};
    if (data.type === 'student') {
      table = 'students';
      payload = { name: data.name, grade: data.grade, kelas: data.kelas, nis: data.nis, password: data.password, class_updated_at: data.class_updated_at, iqro_jilid: data.iqro_jilid, iqro_halaman: data.iqro_halaman, target_juz: data.target_juz, target_hafalan_surat: data.target_hafalan_surat, target_hafalan_ayat_dari: data.target_hafalan_ayat_dari, target_hafalan_ayat_sampai: data.target_hafalan_ayat_sampai };
    } else if (data.type === 'teacher' || data.type === 'user') {
      table = 'users';
      payload = { name: data.name, email: data.email, password: data.password, role: data.role, nip: data.nip, phone: data.phone, specialization: data.specialization };
    } else if (data.type === 'setting') {
      table = 'settings';
      payload = { data: data.data }; 
    }
    const { error } = await supabaseClient.from(table).update(payload).eq('id', data.__backendId);
    if (!error && !skipFetch) await this.fetchAll();
    return { isOk: !error };
  },

  delete: async function(data, skipFetch = false) {
    if (!supabaseClient) return { isOk: false };
    let table = '';
    if (data.type === 'student') table = 'students';
    else if (data.type === 'report') table = 'reports';
    else if (data.type === 'teacher' || data.type === 'user') table = 'users';
    else if (data.type === 'setting') table = 'settings';
    const { error } = await supabaseClient.from(table).delete().eq('id', data.__backendId);
    if (!error && !skipFetch) await this.fetchAll();
    return { isOk: !error };
  }
};
