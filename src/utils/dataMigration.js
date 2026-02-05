/**
 * Data Migration Utility
 * Unify Sessions, Bookmarks, Collections data structures
 * v2.1.0: favIconUrl -> domain migration
 */

const DATA_VERSION = '2.1.0'

function generateId(prefix = 'item') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Extract domain from URL
 */
function extractDomainFromUrl(url) {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return ''
  }
}

/**
 * Migrate single tab/bookmark item
 * name -> title, pinned -> isPinned, favorite -> isFavorite
 * favIconUrl -> domain (v2.1.0)
 */
export function migrateTabItem(tab) {
  if (!tab) return tab

  // Extract domain from URL or favIconUrl
  let domain = tab.domain
  if (!domain && tab.url) {
    domain = extractDomainFromUrl(tab.url)
  }

  return {
    id: tab.id || generateId('tab'),
    title: tab.title || tab.name || '',
    url: tab.url || '',
    domain: domain || '',
    description: tab.description || '',
    tags: tab.tags || [],
    sourceGroup: tab.sourceGroup || '',
    createdAt: tab.createdAt || Date.now(),
    visitCount: tab.visitCount || 0,
    isPinned: tab.isPinned ?? tab.pinned ?? false,
    isFavorite: tab.isFavorite ?? tab.favorite ?? false,
    groupId: tab.groupId,
  }
}

/**
 * Migrate category data (for bookmarks 3-level structure)
 * name -> title, bookmarks -> tabs
 */
export function migrateCategory(category) {
  if (!category) return category

  const migrated = {
    id: category.id || generateId('cat'),
    title: category.title || category.name || '',
    icon: category.icon || '',
    color: category.color || '#3b82f6',
  }

  if (category.children && Array.isArray(category.children)) {
    migrated.children = category.children.map((child) => migrateCategory(child))
  }

  const items = category.tabs || category.bookmarks || []
  if (items.length > 0) {
    migrated.tabs = items.map((item) => migrateTabItem(item))
  } else {
    migrated.tabs = []
  }

  return migrated
}

/**
 * Migrate bookmarks store data
 */
export function migrateBookmarksData(data) {
  if (!data) return data

  if (data._version === DATA_VERSION) {
    return data
  }

  console.log('[Migration] Starting bookmarks data migration...')

  const migrated = {
    bookmarks: [],
    pinnedBookmarks: [],
    favoriteBookmarks: [],
    _version: DATA_VERSION,
    lastUpdated: Date.now(),
  }

  if (data.bookmarks && Array.isArray(data.bookmarks)) {
    migrated.bookmarks = data.bookmarks.map((cat) => migrateCategory(cat))
  }

  if (data.pinnedBookmarks && Array.isArray(data.pinnedBookmarks)) {
    migrated.pinnedBookmarks = data.pinnedBookmarks.map((tab) => migrateTabItem(tab))
  }

  if (data.favoriteBookmarks && Array.isArray(data.favoriteBookmarks)) {
    migrated.favoriteBookmarks = data.favoriteBookmarks.map((tab) => migrateTabItem(tab))
  }

  console.log('[Migration] Bookmarks data migration completed')
  return migrated
}

/**
 * Migrate collection data
 * name -> title, pinned -> isPinned
 */
export function migrateCollection(collection) {
  if (!collection) return collection

  return {
    id: collection.id || generateId('collection'),
    title: collection.title || collection.name || '',
    color: collection.color || 'blue',
    icon: collection.icon || '',
    createdAt: collection.createdAt || Date.now(),
    updatedAt: collection.updatedAt || Date.now(),
    isPinned: collection.isPinned ?? collection.pinned ?? false,
    tabs: (collection.tabs || []).map((tab) => migrateTabItem(tab)),
  }
}

/**
 * Migrate collections list data
 */
export function migrateCollectionsData(collections) {
  if (!collections || !Array.isArray(collections)) {
    return []
  }

  const needsMigrationCheck = collections.some((c) => c.name && !c.title)

  if (!needsMigrationCheck) {
    return collections.map((c) => ({
      ...c,
      isPinned: c.isPinned ?? c.pinned ?? false,
      tabs: (c.tabs || []).map((tab) => migrateTabItem(tab)),
    }))
  }

  console.log('[Migration] Starting collections data migration...')
  const migrated = collections.map((collection) => migrateCollection(collection))
  console.log('[Migration] Collections data migration completed')

  return migrated
}

/**
 * Check if data needs migration
 */
export function needsMigration(data, type = 'bookmarks') {
  if (!data) return false

  if (type === 'bookmarks') {
    if (data._version === DATA_VERSION) return false
    if (data.bookmarks && data.bookmarks.length > 0) {
      const firstCat = data.bookmarks[0]
      return firstCat.name !== undefined || firstCat.bookmarks !== undefined
    }
  }

  if (type === 'collections') {
    if (Array.isArray(data) && data.length > 0) {
      return data.some((c) => c.name !== undefined || c.pinned !== undefined)
    }
  }

  if (type === 'sessions') {
    if (Array.isArray(data) && data.length > 0) {
      // Check if any tab has favIconUrl instead of domain
      return data.some((session) => {
        if (session.tabs && session.tabs.length > 0) {
          return session.tabs.some((tab) => tab.favIconUrl !== undefined && tab.domain === undefined)
        }
        return false
      })
    }
  }

  return false
}

/**
 * Migrate session tab item (simpler structure)
 * favIconUrl -> domain
 */
export function migrateSessionTab(tab) {
  if (!tab) return tab

  let domain = tab.domain
  if (!domain && tab.url) {
    domain = extractDomainFromUrl(tab.url)
  }

  return {
    url: tab.url || '',
    title: tab.title || '',
    domain: domain || '',
    groupId: tab.groupId,
  }
}

/**
 * Migrate sessions data (tabGroups from background.js)
 * favIconUrl -> domain for all tabs
 */
export function migrateSessionsData(sessions) {
  if (!sessions || !Array.isArray(sessions)) {
    return []
  }

  // Check if migration is needed
  const needsMigrationCheck = sessions.some((session) => {
    if (session.tabs && session.tabs.length > 0) {
      return session.tabs.some((tab) => tab.favIconUrl !== undefined && tab.domain === undefined)
    }
    return false
  })

  if (!needsMigrationCheck) {
    return sessions
  }

  console.log('[Migration] Starting sessions data migration (favIconUrl -> domain)...')

  const migrated = sessions.map((session) => ({
    ...session,
    tabs: (session.tabs || []).map((tab) => migrateSessionTab(tab)),
  }))

  console.log('[Migration] Sessions data migration completed')
  return migrated
}

export { DATA_VERSION }
