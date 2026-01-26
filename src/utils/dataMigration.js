/**
 * Data Migration Utility
 * Unify Sessions, Bookmarks, Collections data structures
 */

const DATA_VERSION = '2.0.0'

function generateId(prefix = 'item') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Migrate single tab/bookmark item
 * name -> title, pinned -> isPinned, favorite -> isFavorite
 */
export function migrateTabItem(tab) {
  if (!tab) return tab

  return {
    id: tab.id || generateId('tab'),
    title: tab.title || tab.name || '',
    url: tab.url || '',
    favIconUrl: tab.favIconUrl || '',
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

  return false
}

export { DATA_VERSION }
