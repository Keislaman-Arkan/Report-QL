#!/bin/bash
# Script ini dijalankan otomatis oleh Vercel saat proses build/deploy.
# Membuat file js/supabase-config.js dari Environment Variables yang aman.

cat > js/supabase-config.js << EOF
window.SUPABASE_URL = "$SUPABASE_URL";
window.SUPABASE_ANON_KEY = "$SUPABASE_ANON_KEY";
EOF

echo "✅ js/supabase-config.js berhasil dibuat dari Environment Variables"
