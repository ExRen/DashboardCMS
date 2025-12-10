import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ==========================================
// PRESS RELEASES
// ==========================================
export async function getPressReleases(options = {}) {
  const { limit = 100, offset = 0, category, status } = options
  
  let query = supabase
    .from('press_releases')
    .select(`
      *,
      categories(name),
      offices(name, code),
      writers(name)
    `)
    .order('publish_date', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (category) {
    query = query.eq('category_id', category)
  }
  
  if (status) {
    query = query.eq('process_status', status)
  }
  
  const { data, error } = await query
  return { data, error }
}

export async function getPressReleaseStats() {
  const { data: total, error: totalError } = await supabase
    .from('press_releases')
    .select('id', { count: 'exact' })
  
  const { data: byCategory, error: catError } = await supabase
    .from('press_releases')
    .select('category_id, categories(name)')
  
  const { data: byMonth, error: monthError } = await supabase
    .from('press_releases')
    .select('publish_date')
  
  return { 
    total: total?.length || 0, 
    byCategory, 
    byMonth,
    error: totalError || catError || monthError 
  }
}

// ==========================================
// CATEGORIES
// ==========================================
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  
  return { data, error }
}

// ==========================================
// OFFICES
// ==========================================
export async function getOffices() {
  const { data, error } = await supabase
    .from('offices')
    .select('*')
    .order('name')
  
  return { data, error }
}

// ==========================================
// WRITERS
// ==========================================
export async function getWriters() {
  const { data, error } = await supabase
    .from('writers')
    .select('*')
    .order('name')
  
  return { data, error }
}

// ==========================================
// COMMANDO (Social Media Content)
// ==========================================
export async function getCommandoContents(options = {}) {
  const { limit = 100, offset = 0, contentType, platform, year } = options
  
  let query = supabase
    .from('commando_contents')
    .select(`
      *,
      content_types(name),
      media_platforms(name, icon),
      categories(name),
      writers(name)
    `)
    .order('publish_date', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (contentType) {
    query = query.eq('content_type_id', contentType)
  }
  
  if (platform) {
    query = query.eq('platform_id', platform)
  }
  
  if (year) {
    query = query.eq('year', year)
  }
  
  const { data, error } = await query
  return { data, error }
}

export async function getContentTypes() {
  const { data, error } = await supabase
    .from('content_types')
    .select('*')
    .order('name')
  
  return { data, error }
}

export async function getMediaPlatforms() {
  const { data, error } = await supabase
    .from('media_platforms')
    .select('*')
    .order('name')
  
  return { data, error }
}
