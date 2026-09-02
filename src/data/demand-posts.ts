import type { DemandPost } from '../pages/DemandSquare'

const STORAGE_KEY = 'gewuyuku-demands-published'

export function loadPublishedPosts(): DemandPost[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addPublishedPost(post: DemandPost) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([post, ...loadPublishedPosts()]))
}
