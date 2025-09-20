export function getDateNumbers(date = new Date()) {
  const d = new Date(date);
  
  // Day of year (1-365/366)
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start;
  const day = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Week of year (1-53)
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  
  // Month (1-12)
  const month = d.getMonth() + 1;
  
  return { day, week, month };
}

export function validateJournalEntry({ title, content, mood_emoji, tags }) {
  const errors = [];
  
  if (!title || typeof title !== 'string') {
    errors.push('Title is required');
  } else if (title.trim().length === 0) {
    errors.push('Title cannot be empty');
  } else if (title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }
  
  if (!content || typeof content !== 'string') {
    errors.push('Content is required');
  } else if (content.trim().length === 0) {
    errors.push('Content cannot be empty');
  } else if (content.length > 5000) {
    errors.push('Content must be less than 5000 characters');
  }
  
  if (!mood_emoji || typeof mood_emoji !== 'string') {
    errors.push('Mood emoji is required');
  }
  
  if (tags && !Array.isArray(tags)) {
    errors.push('Tags must be an array');
  }
  
  if (tags && tags.some(tag => typeof tag !== 'string' || tag.length > 50)) {
    errors.push('Each tag must be a string with less than 50 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function generateSummary(content, maxLength = 100) {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  const trimmed = content.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  
  const truncated = trimmed.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  
  if (lastSentenceEnd > maxLength * 0.5) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  return truncated + '...';
}

export function calculatePoints(content, tags = []) {
  if (!content) return 0;
  
  const basePoints = 10;
  const lengthBonus = Math.min(Math.floor(content.length / 50), 30);
  const tagBonus = Math.min(tags.length * 2, 10);
  
  return basePoints + lengthBonus + tagBonus;
}

export function formatDisplayDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}

export function calculateReadingTime(content, wordsPerMinute = 200) {
  if (!content) return 0;
  
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return Math.max(1, minutes);
}

export function sanitizeTags(tagsInput) {
  if (!tagsInput) return [];
  
  let tags;
  if (typeof tagsInput === 'string') {
    tags = tagsInput.split(',').map(tag => tag.trim());
  } else if (Array.isArray(tagsInput)) {
    tags = tagsInput;
  } else {
    return [];
  }
  
  return tags
    .filter(tag => tag && tag.length > 0)
    .map(tag => tag.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim())
    .filter(tag => tag.length > 0 && tag.length <= 50)
    .slice(0, 10); // Limit to 10 tags
}

export const MOOD_EMOJIS = {
  '😊': { emoji: '😊', color: 'text-green-500', bg: 'bg-green-50', label: 'Happy' },
  '😐': { emoji: '😐', color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Neutral' },
  '😔': { emoji: '😔', color: 'text-blue-500', bg: 'bg-blue-50', label: 'Sad' },
  '😟': { emoji: '😟', color: 'text-red-500', bg: 'bg-red-50', label: 'Stressed' },
  '🧠': { emoji: '🧠', color: 'text-purple-500', bg: 'bg-purple-50', label: 'Thoughtful' },
  '❤️': { emoji: '❤️', color: 'text-red-500', bg: 'bg-red-50', label: 'Loved' },
  '✨': { emoji: '✨', color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Inspired' },
  '😴': { emoji: '😴', color: 'text-blue-500', bg: 'bg-blue-50', label: 'Tired' },
  '😤': { emoji: '😤', color: 'text-red-500', bg: 'bg-red-50', label: 'Frustrated' },
  '🤔': { emoji: '🤔', color: 'text-gray-500', bg: 'bg-gray-50', label: 'Thinking' }
};

export function getMoodData(moodEmoji) {
  return MOOD_EMOJIS[moodEmoji] || {
    emoji: moodEmoji || '😐',
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    label: 'Unknown'
  };
}