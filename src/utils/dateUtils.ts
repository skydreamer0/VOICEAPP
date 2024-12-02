export function getTaiwanDateTime(): Date {
  try {
    // 使用更可靠的方式取得台灣時間
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 8)); // UTC+8
  } catch (error) {
    console.warn('取得台灣時間失敗，使用系統時間');
    return new Date();
  }
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    console.warn('無效的日期:', date);
    return '無效日期';
  }
  return d.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

export function formatTime(date: Date): string {
  if (isNaN(date.getTime())) {
    console.warn('無效的日期:', date);
    return '無效時間';
  }
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    console.warn('無效的日期時間:', date);
    return '無效日期時間';
  }
  return `${formatDate(d)} ${formatTime(d)}`;
}

export function getRelativeTimeString(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    console.warn('無效的日期:', date);
    return '無效日期';
  }
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return '剛剛';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} 分鐘前`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} 小時前`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} 天前`;
  }
  
  return formatDate(d);
}

export function formatAudioDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

export function isToday(date: string | Date): boolean {
  const d = new Date(date);
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

export function isThisWeek(date: string | Date): boolean {
  const d = new Date(date);
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const weekEnd = new Date(now.setDate(now.getDate() + 6));
  return d >= weekStart && d <= weekEnd;
}

export function isValidDate(date: string | Date | undefined): boolean {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime()) && d.getTime() > 0;
} 