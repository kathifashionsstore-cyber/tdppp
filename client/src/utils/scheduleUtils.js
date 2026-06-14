import { toDate } from './helpers';

export const startOfDay = (value) => {
  const date = toDate(value) || new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const isSameDay = (left, right) => startOfDay(left).getTime() === startOfDay(right).getTime();

export const selectTodaySchedule = (schedules = [], now = new Date()) => schedules
  .map((item) => ({ ...item, date: toDate(item.date) || new Date() }))
  .find((item) => isSameDay(item.date, now));

export const parseTimeToMinutes = (value = '') => {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return null;
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridian = match[3];
  if (meridian === 'pm' && hours < 12) hours += 12;
  if (meridian === 'am' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return (hours * 60) + minutes;
};

export const inferEntryMinutes = (entries = []) => {
  let lastMinutes = -1;
  return entries.map((entry) => {
    const raw = parseTimeToMinutes(entry.time);
    if (raw == null) return null;
    let minutes = raw;
    if (!/am|pm/i.test(entry.time || '')) {
      while (minutes <= lastMinutes && minutes + 720 < 1440) minutes += 720;
    }
    lastMinutes = Math.max(lastMinutes, minutes);
    return minutes;
  });
};

export const getLiveEntries = (schedule, now = new Date()) => {
  const entries = [...(schedule?.entries || [])].sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
  const scheduleDate = toDate(schedule?.date) || now;
  const isToday = isSameDay(scheduleDate, now);
  const isPast = startOfDay(scheduleDate) < startOfDay(now);
  const isFuture = startOfDay(scheduleDate) > startOfDay(now);
  const nowMinutes = (now.getHours() * 60) + now.getMinutes();
  const entryMinutes = inferEntryMinutes(entries);
  const currentIndex = entryMinutes.reduce((active, minutes, index) => (
    minutes != null && minutes <= nowMinutes ? index : active
  ), -1);

  return entries.map((entry, index) => {
    let liveStatus = 'upcoming';
    if (isPast || (isToday && index < currentIndex)) liveStatus = 'completed';
    else if (!isFuture && isToday && index === currentIndex) liveStatus = 'in-progress';
    return { ...entry, liveStatus };
  });
};

export const getCurrentEntryIndex = (entries = []) => {
  const activeIndex = entries.findIndex((entry) => entry.liveStatus === 'in-progress');
  if (activeIndex >= 0) return activeIndex;
  const completedIndexes = entries
    .map((entry, index) => (entry.liveStatus === 'completed' ? index : -1))
    .filter((index) => index >= 0);
  if (completedIndexes.length) return completedIndexes[completedIndexes.length - 1];
  return entries.length ? 0 : -1;
};

export const formatCountdown = (seconds = 0) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

export const normalizeTvPhoto = (photo, entry = {}) => {
  if (!photo) return null;
  if (typeof photo === 'string') {
    return {
      url: photo,
      caption: entry.activity_te || entry.activity_en || entry.activity || '',
      time: entry.time || ''
    };
  }
  const url = photo.url || photo.imageUrl || photo.displayUrl || photo.thumbUrl || '';
  if (!url) return null;
  return {
    ...photo,
    url,
    caption: photo.caption || entry.activity_te || entry.activity_en || entry.activity || '',
    time: photo.time || entry.time || ''
  };
};

export const getEntryTvPhotos = (entry = {}) => (entry.tvPhotos || [])
  .map((photo) => normalizeTvPhoto(photo, entry))
  .filter(Boolean);

export const selectTvPhotoSet = (entries = [], fallbackPhotos = []) => {
  const activeIndex = entries.findIndex((entry) => entry.liveStatus === 'in-progress');
  if (activeIndex >= 0) {
    const activePhotos = getEntryTvPhotos(entries[activeIndex]);
    if (activePhotos.length) return { photos: activePhotos, sourceEntry: entries[activeIndex], source: 'current' };
  }

  for (let index = Math.max(activeIndex, entries.length - 1); index >= 0; index -= 1) {
    const entry = entries[index];
    if (!['completed', 'in-progress'].includes(entry?.liveStatus)) continue;
    const photos = getEntryTvPhotos(entry);
    if (photos.length) return { photos, sourceEntry: entry, source: 'recent' };
  }

  return { photos: fallbackPhotos, sourceEntry: entries[getCurrentEntryIndex(entries)] || null, source: 'fallback' };
};
