
const STORAGE_KEY = 'ia_ventura_stories';
const ARCHIVE_KEY = 'ia_ventura_archive';

export const getLocalStories = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Erro ao ler LocalStorage", e);
    return [];
  }
};

export const getArchivedStories = () => {
  try {
    const data = localStorage.getItem(ARCHIVE_KEY);
    const stories = data ? JSON.parse(data) : [];
    const now = new Date();
    const validStories = stories.filter((s: any) => {
      const archivedAt = new Date(s.archived_at);
      const diffDays = (now.getTime() - archivedAt.getTime()) / (1000 * 3600 * 24);
      return diffDays < 30;
    });
    if (validStories.length !== stories.length) {
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(validStories));
    }
    return validStories;
  } catch (e) {
    return [];
  }
};

export const saveLocalStory = (story: any) => {
  const stories = getLocalStories();
  const index = stories.findIndex((s: any) => s.id === story.id);
  const updatedStory = { ...story, updated_at: new Date().toISOString() };
  if (index >= 0) { stories[index] = updatedStory; } else { stories.push(updatedStory); }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  return updatedStory;
};

export const archiveLocalStory = (id: string) => {
  const stories = getLocalStories();
  const storyToArchive = stories.find((s: any) => s.id === id);
  if (!storyToArchive) return;

  const archive = getArchivedStories();
  const archivedStory = { ...storyToArchive, archived_at: new Date().toISOString() };
  archive.push(archivedStory);
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));

  const remaining = stories.filter((s: any) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
};

export const restoreArchivedStory = (id: string) => {
  const archive = getArchivedStories();
  const storyToRestore = archive.find((s: any) => s.id === id);
  if (!storyToRestore) return;

  const { archived_at, ...originalStory } = storyToRestore;
  const stories = getLocalStories();
  stories.push(originalStory);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));

  const remainingArchive = archive.filter((s: any) => s.id !== id);
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(remainingArchive));
};

export const deletePermanentArchived = (id: string) => {
  const archive = getArchivedStories().filter((s: any) => s.id !== id);
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
};
