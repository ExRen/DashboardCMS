/**
 * Script untuk Import Data 2024 ke Supabase
 * Kolom menggunakan nama yang SAMA PERSIS dengan tabel database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://hlyzczgogofbmqzmiffs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhseXpjemdvZ29mYm1xem1pZmZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI0ODQzMywiZXhwIjoyMDgwODI0NDMzfQ.XFkdmvfjsSx5RKEmo5P8mbVDMIwoMD92sWXWNfRALpo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  
  return result;
}

async function importCommando2024() {
  console.log('========================================');
  console.log('🚀 IMPORT 2024 DATA ke commando_contents');
  console.log('========================================');
  
  const csvFile = 'CMS 2024.csv';
  const filePath = path.join(__dirname, csvFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File tidak ditemukan: ${csvFile}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  console.log(`📊 Total baris: ${lines.length}`);
  
  // Header line
  // NO,TANGGAL,JUDUL KONTEN,JENIS KONTEN,KATEGORI DALAM AGSET BUMN,JENIS MEDIA PLAN,AKTUALISASI,MEDIA,Jenis Konten,HIGHLIGHT/CAPTIONS,LINK,CREATOR,PROCESS,KETERANGAN/JENIS KONTEN
  
  const commandoData = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') continue;
    
    const cols = parseCSVLine(line);
    
    const judulKonten = cols[2];
    if (!judulKonten || judulKonten.trim() === '' || judulKonten.length < 3) continue;
    if (judulKonten.toUpperCase() === 'JUDUL KONTEN') continue;
    
    const record = {
      "NO": parseInt(cols[0]) || null,
      "TANGGAL": cols[1]?.substring(0, 100) || null,
      "JUDUL KONTEN": judulKonten.substring(0, 500),
      "JENIS KONTEN": cols[3]?.substring(0, 200) || null,
      "KATEGORI DALAM AGSET BUMN": cols[4]?.substring(0, 200) || null,
      "JENIS MEDIA PLAN": cols[5]?.substring(0, 200) || null,
      "AKTUALISASI": cols[6]?.substring(0, 100) || null,
      "MEDIA": cols[7]?.substring(0, 100) || null,
      "Jenis Konten": cols[8]?.substring(0, 200) || null,
      "HIGHLIGHT/CAPTIONS": cols[9]?.substring(0, 2000) || null,
      "LINK": cols[10]?.substring(0, 500) || null,
      "CREATOR": cols[11]?.substring(0, 100) || null,
      "PROCESS": cols[12]?.substring(0, 200) || null,
      "KETERANGAN/JENIS KONTEN": cols[13]?.substring(0, 500) || null,
      "year": 2024  // Set year to 2024!
    };
    
    commandoData.push(record);
  }
  
  console.log(`📝 Data valid: ${commandoData.length}`);
  
  if (commandoData.length === 0) {
    console.log('❌ Tidak ada data untuk diimport');
    return;
  }
  
  // Insert in batches
  const BATCH_SIZE = 50;
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < commandoData.length; i += BATCH_SIZE) {
    const batch = commandoData.slice(i, i + BATCH_SIZE);
    
    const { data, error } = await supabase
      .from('commando_contents')
      .insert(batch)
      .select();
    
    if (error) {
      console.error(`❌ Error batch ${i}-${i+BATCH_SIZE}:`, error.message);
      errors += batch.length;
    } else {
      inserted += data.length;
      console.log(`✅ Imported ${inserted}/${commandoData.length}`);
    }
  }
  
  console.log('========================================');
  console.log(`📊 HASIL: ✅ ${inserted} | ❌ ${errors}`);
  console.log('========================================');
}

importCommando2024()
  .then(() => {
    console.log('\n🎉 Import selesai!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
