/**
 * Script untuk Import Data CSV ke Supabase
 * Dashboard CMS ASABRI
 * 
 * CARA PENGGUNAAN:
 * 1. Install dependencies: npm install @supabase/supabase-js csv-parser
 * 2. Edit SUPABASE_URL dan SUPABASE_KEY di bawah
 * 3. Jalankan: node import_csv.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ==========================================
// KONFIGURASI - EDIT BAGIAN INI
// ==========================================
const SUPABASE_URL = 'https://hlyzczgogofbmqzmiffs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhseXpjemdvZ29mYm1xem1pZmZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI0ODQzMywiZXhwIjoyMDgwODI0NDMzfQ.XFkdmvfjsSx5RKEmo5P8mbVDMIwoMD92sWXWNfRALpo'; // Gunakan service_role key untuk bypass RLS
const CSV_FILE = path.join(__dirname, 'CMS Pusat 2025(SIARAN PERS 2025).csv');

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
  
  // Format: "Kamis, 13 Februari 2025"
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
    } else if (char === ';' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

// ==========================================
// MAIN IMPORT FUNCTION
// ==========================================

async function importCSV() {
  console.log('📂 Membaca file CSV...');
  
  // Read file
  const content = fs.readFileSync(CSV_FILE, 'utf-8');
  const lines = content.split('\n');
  
  console.log(`📊 Total baris: ${lines.length}`);
  
  // Get categories mapping
  const { data: categories } = await supabase.from('categories').select('id, name');
  const categoryMap = {};
  categories?.forEach(cat => {
    categoryMap[cat.name.toLowerCase()] = cat.id;
  });
  
  console.log(`📁 Kategori tersedia: ${Object.keys(categoryMap).length}`);
  
  // Parse data starting from line 18 (index 17, after header)
  const pressReleases = [];
  
  for (let i = 17; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '' || line.startsWith(';;;;;')) continue;
    
    const columns = parseCSVLine(line);
    
    // Skip if no title
    const title = columns[3];
    if (!title || title.trim() === '') continue;
    
    const record = {
      number: parseInt(columns[0]) || null,
      official_number: columns[1] || null,
      publish_date: parseIndonesianDate(columns[2]),
      title: title.trim(),
      category_id: null,
      media_plan: columns[6] || null,
      scope: columns[7] || null,
      website_url: columns[8] || null,
      folder_path: columns[9] || null,
      process_status: 'Completed',
      notes: columns[13] || null
    };
    
    // Map category
    const categoryName = (columns[4] || '').toLowerCase();
    if (categoryName && categoryMap[categoryName]) {
      record.category_id = categoryMap[categoryName];
    }
    
    pressReleases.push(record);
  }
  
  console.log(`📝 Data valid untuk import: ${pressReleases.length}`);
  
  // Insert in batches
  const BATCH_SIZE = 50;
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < pressReleases.length; i += BATCH_SIZE) {
    const batch = pressReleases.slice(i, i + BATCH_SIZE);
    
    const { data, error } = await supabase
      .from('press_releases')
      .insert(batch)
      .select();
    
    if (error) {
      console.error(`❌ Error batch ${i}-${i+BATCH_SIZE}:`, error.message);
      errors += batch.length;
    } else {
      inserted += data.length;
      console.log(`✅ Imported ${inserted}/${pressReleases.length}`);
    }
  }
  
  console.log('\n========================================');
  console.log('📊 HASIL IMPORT:');
  console.log(`   ✅ Berhasil: ${inserted}`);
  console.log(`   ❌ Gagal: ${errors}`);
  console.log('========================================');
}

// ==========================================
// RUN SCRIPT
// ==========================================

importCSV()
  .then(() => {
    console.log('\n🎉 Import selesai!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
