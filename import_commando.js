/**
 * Script untuk Import Data COMMANDO CSV ke Supabase
 * Dashboard CMS ASABRI - Updated untuk schema baru
 * 
 * CARA PENGGUNAAN:
 * 1. Jalankan 005_drop_recreate_commando.sql di Supabase SQL Editor
 * 2. Jalankan: node import_commando.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ==========================================
// KONFIGURASI
// ==========================================
const SUPABASE_URL = 'https://hlyzczgogofbmqzmiffs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhseXpjemdvZ29mYm1xem1pZmZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI0ODQzMywiZXhwIjoyMDgwODI0NDMzfQ.XFkdmvfjsSx5RKEmo5P8mbVDMIwoMD92sWXWNfRALpo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// PARSING FUNCTIONS
// ==========================================

function parseIndonesianDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const months = {
    'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
    'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
    'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
  };
  
  const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = months[match[2]] || '01';
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  return null;
}

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

// ==========================================
// MAIN IMPORT FUNCTION
// Kolom CSV:
// 0: NO
// 1: TANGGAL  
// 2: JUDUL KONTEN
// 3: JENIS KONTEN (Hari Besar Nasional, dll)
// 4: KATEGORI DALAM AGSET BUMN
// 5: JENIS MEDIA PLAN
// 6: AKTUALISASI
// 7: MEDIA
// 8: Jenis Konten (format: Infografis, Video, dll)
// 9: HEADLINE/CAPTION/ORIE
// 10: LINK
// 11: CREATOR
// 12: PROCESS
// 13: KETERANGAN/JENIS KONTEN
// ==========================================

async function importCommando(csvFile, year) {
  console.log(`\n📂 Membaca file: ${csvFile}`);
  
  const filePath = path.join(__dirname, csvFile);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File tidak ditemukan: ${csvFile}`);
    return { inserted: 0, errors: 0 };
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  console.log(`📊 Total baris: ${lines.length}`);
  
  // Find header row
  let headerIndex = 0;
  for (let i = 0; i < 10; i++) {
    if (lines[i]?.toUpperCase().includes('NO') && lines[i]?.toUpperCase().includes('TANGGAL')) {
      headerIndex = i;
      break;
    }
  }
  
  console.log(`📌 Header di baris: ${headerIndex}`);
  
  // Parse data
  const commandoData = [];
  
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '' || line.trim() === ','.repeat(13)) continue;
    
    const cols = parseCSVLine(line);
    
    // Skip empty rows or header-like rows
    const judulKonten = cols[2];
    if (!judulKonten || judulKonten.trim() === '' || judulKonten.length < 3) continue;
    if (judulKonten.toUpperCase() === 'JUDUL KONTEN') continue;
    
    const record = {
      no: parseInt(cols[0]) || null,
      tanggal: parseIndonesianDate(cols[1]),
      judul_konten: judulKonten.substring(0, 500),
      jenis_konten: cols[3]?.substring(0, 100) || null,
      kategori_agset: cols[4]?.substring(0, 100) || null,
      jenis_media_plan: cols[5]?.substring(0, 100) || null,
      aktualisasi: cols[6]?.substring(0, 50) || null,
      media: cols[7]?.substring(0, 100) || null,
      format_konten: cols[8]?.substring(0, 100) || null,
      headline_caption: cols[9]?.substring(0, 2000) || null,
      link: cols[10]?.substring(0, 500) || null,
      creator: cols[11]?.substring(0, 100) || null,
      process: cols[12]?.substring(0, 100) || null,
      keterangan: cols[13]?.substring(0, 500) || null,
      year: year
    };
    
    commandoData.push(record);
  }
  
  console.log(`📝 Data valid: ${commandoData.length}`);
  
  if (commandoData.length === 0) {
    return { inserted: 0, errors: 0 };
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
  
  return { inserted, errors };
}

// ==========================================
// RUN SCRIPT
// ==========================================

async function main() {
  console.log('========================================');
  console.log('🚀 COMMANDO CSV IMPORT SCRIPT');
  console.log('========================================');
  
  // Import 2025 data
  const result2025 = await importCommando('CMS 2025.csv', 2025);
  
  // Import 2024 data
  const result2024 = await importCommando('CMS 2024.csv', 2024);
  
  console.log('\n========================================');
  console.log('📊 HASIL IMPORT:');
  console.log(`   2025: ✅ ${result2025.inserted} | ❌ ${result2025.errors}`);
  console.log(`   2024: ✅ ${result2024.inserted} | ❌ ${result2024.errors}`);
  console.log('========================================');
}

main()
  .then(() => {
    console.log('\n🎉 Import selesai!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
