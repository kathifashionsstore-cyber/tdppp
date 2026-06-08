import { format, isWithinInterval } from 'date-fns';
import { toDate } from './helpers';

export const formatDate = (value, pattern = 'dd MMM yyyy') => {
  const date = toDate(value);
  return date ? format(date, pattern) : '';
};

export const isActiveDateRange = (startDate, endDate, now = new Date()) => {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start && !end) return true;
  if (start && !end) return now >= start;
  if (!start && end) return now <= end;
  return isWithinInterval(now, { start, end });
};
