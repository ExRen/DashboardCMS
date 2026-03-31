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

// ==========================================
// MEDIA PLANS
// ==========================================
export async function getMediaPlans(options = {}) {
  const { limit = 1000, offset = 0, bulan, year, kategori, pic, status, officeId } = options
  
  let query = supabase
    .from('media_plans')
    .select(`
      *,
      offices(name)
    `)
  
  if (officeId) {
    query = query.eq('office_id', officeId)
  }

  query = query
    .order('scheduled_date', { ascending: true })
    .range(offset, offset + limit - 1)
  
  if (bulan) {
    query = query.eq('bulan', bulan)
  }
  
  if (year) {
    query = query.eq('year', year)
  }
  
  if (kategori) {
    query = query.eq('kategori', kategori)
  }
  
  if (pic) {
    query = query.eq('pic', pic)
  }
  
  if (status) {
    query = query.eq('status', status)
  }

  if (officeId) {
    query = query.eq('office_id', officeId)
  }
  
  const { data, error } = await query
  return { data, error }
}

export async function createMediaPlan(mediaPlan) {
  const { data, error } = await supabase
    .from('media_plans')
    .insert([mediaPlan])
    .select()
  
  return { data: data?.[0], error }
}

export async function updateMediaPlan(id, updates) {
  const { data, error } = await supabase
    .from('media_plans')
    .update(updates)
    .eq('id', id)
    .select()
  
  return { data: data?.[0], error }
}

export async function deleteMediaPlan(id) {
  const { error } = await supabase
    .from('media_plans')
    .delete()
    .eq('id', id)
  
  return { error }
}

export async function bulkCreateMediaPlans(mediaPlans) {
  const { data, error } = await supabase
    .from('media_plans')
    .insert(mediaPlans)
    .select()
  
  return { data, error }
}

export async function bulkUpdateMediaPlans(ids, updates) {
  const { data, error } = await supabase
    .from('media_plans')
    .update(updates)
    .in('id', ids)
    .select()
  
  return { data, error }
}

// ==========================================
// SOCIAL POSTS (CABANG)
// DB Schema: judul, tanggal_posting, caption, tagar, kategori, link_posting, likes, comments
// ==========================================
export async function getSocialPosts(options = {}) {
  const { limit = 100, offset = 0, kategori, officeId } = options
  
  let query = supabase
    .from('social_posts')
    .select(`
      *,
      offices(name)
    `)
    .order('tanggal_posting', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (kategori) {
    query = query.eq('kategori', kategori)
  }

  if (officeId) {
    query = query.eq('office_id', officeId)
  }
  
  const { data, error } = await query
  return { data, error }
}

export async function createSocialPost(post) {
  const { data, error } = await supabase
    .from('social_posts')
    .insert([post])
    .select()
  
  return { data: data?.[0], error }
}

export async function updateSocialPost(id, updates) {
  const { data, error } = await supabase
    .from('social_posts')
    .update(updates)
    .eq('id', id)
    .select()
  
  return { data: data?.[0], error }
}

export async function deleteSocialPost(id) {
  const { error } = await supabase
    .from('social_posts')
    .delete()
    .eq('id', id)
  
  return { error }
}

// ==========================================
// PEMBERITAAN (NEWS)
// ==========================================
export async function getNewsPlans(options = {}) {
  const { limit = 100, offset = 0, officeId } = options
  
  let query = supabase
    .from('news_plans')
    .select(`*, offices(name)`)
    .order('tanggal', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (officeId) query = query.eq('office_id', officeId)
  
  const { data, error } = await query
  return { data, error }
}

export async function createNewsPlan(item) {
  const { data, error } = await supabase.from('news_plans').insert([item]).select()
  return { data: data?.[0], error }
}

export async function updateNewsPlan(id, updates) {
  const { data, error } = await supabase.from('news_plans').update(updates).eq('id', id).select()
  return { data: data?.[0], error }
}

export async function deleteNewsPlan(id) {
  const { error } = await supabase.from('news_plans').delete().eq('id', id)
  return { error }
}

export async function getNewsMonitoring(options = {}) {
  const { limit = 100, offset = 0, officeId, sentiment } = options
  
  let query = supabase
    .from('news_monitoring')
    .select(`*, offices(name)`)
    .order('tanggal', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (officeId) query = query.eq('office_id', officeId)
  if (sentiment) query = query.eq('tone', sentiment)
  
  const { data, error } = await query
  return { data, error }
}

export async function createNewsMonitoring(item) {
  const { data, error } = await supabase.from('news_monitoring').insert([item]).select()
  return { data: data?.[0], error }
}

export async function updateNewsMonitoring(id, updates) {
  const { data, error } = await supabase.from('news_monitoring').update(updates).eq('id', id).select()
  return { data: data?.[0], error }
}

export async function deleteNewsMonitoring(id) {
  const { error } = await supabase.from('news_monitoring').delete().eq('id', id)
  return { error }
}

// ==========================================
// ASET KOMUNIKASI
// ==========================================
export async function getAssets(options = {}) {
  const { limit = 100, offset = 0, officeId, category } = options
  
  let query = supabase
    .from('assets')
    .select(`*, offices(name)`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (officeId) query = query.eq('office_id', officeId)
  if (category) query = query.eq('category', category)
  
  const { data, error } = await query
  return { data, error }
}

export async function createAsset(item) {
  const { data, error } = await supabase.from('assets').insert([item]).select()
  return { data: data?.[0], error }
}

export async function updateAsset(id, updates) {
  const { data, error } = await supabase.from('assets').update(updates).eq('id', id).select()
  return { data: data?.[0], error }
}

export async function deleteAsset(id) {
  const { error } = await supabase.from('assets').delete().eq('id', id)
  return { error }
}
