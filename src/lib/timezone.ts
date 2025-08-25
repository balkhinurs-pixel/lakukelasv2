/**
 * Timezone utilities for Indonesian (GMT+7) compliance
 * According to project specifications:
 * - Server operations should use GMT+7 (Indonesia timezone)
 * - Client display should show user's local timezone
 * - GMT+7 is the source of truth for all time calculations
 */

import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

// Indonesian timezone offset in hours
export const INDONESIA_TIMEZONE_OFFSET = 7;

/**
 * Get current Indonesian time (GMT+7)
 * This is the source of truth for all server operations
 */
export function getIndonesianTime(): Date {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const indonesianTime = new Date(utc + (INDONESIA_TIMEZONE_OFFSET * 3600000));
    return indonesianTime;
}

/**
 * Convert any date to Indonesian timezone (GMT+7)
 */
export function toIndonesianTime(date: Date): Date {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const indonesianTime = new Date(utc + (INDONESIA_TIMEZONE_OFFSET * 3600000));
    return indonesianTime;
}

/**
 * Get Indonesian day name for today (used for schedule matching)
 */
export function getIndonesianDayName(): string {
    const indonesianTime = getIndonesianTime();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return dayNames[indonesianTime.getDay()];
}

/**
 * Format date for Indonesian display
 */
export function formatIndonesianDate(date: Date, formatString: string = 'dd MMMM yyyy'): string {
    return format(toIndonesianTime(date), formatString, { locale: id });
}

/**
 * Format time for Indonesian display (24-hour format)
 */
export function formatIndonesianTime(date: Date): string {
    return format(toIndonesianTime(date), 'HH:mm', { locale: id });
}

/**
 * Format datetime for Indonesian display
 */
export function formatIndonesianDateTime(date: Date): string {
    return format(toIndonesianTime(date), 'dd MMMM yyyy HH:mm', { locale: id });
}

/**
 * Get user's local timezone for display purposes
 */
export function getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format date for user's local timezone display
 */
export function formatUserLocalDate(date: Date, formatString: string = 'dd MMMM yyyy'): string {
    return format(date, formatString, { locale: id });
}

/**
 * Format time for user's local timezone display
 */
export function formatUserLocalTime(date: Date): string {
    return format(date, 'HH:mm', { locale: id });
}

/**
 * Format datetime for user's local timezone display
 */
export function formatUserLocalDateTime(date: Date): string {
    return format(date, 'dd MMMM yyyy HH:mm', { locale: id });
}

/**
 * Get Indonesian day name from date string
 */
export function getIndonesianDayFromDate(dateString: string): string {
    const date = parseISO(dateString);
    const indonesianTime = toIndonesianTime(date);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return dayNames[indonesianTime.getDay()];
}

/**
 * Check if two dates are the same day in Indonesian timezone
 */
export function isSameDayInIndonesia(date1: Date, date2: Date): boolean {
    const indo1 = toIndonesianTime(date1);
    const indo2 = toIndonesianTime(date2);
    
    return indo1.getFullYear() === indo2.getFullYear() &&
           indo1.getMonth() === indo2.getMonth() &&
           indo1.getDate() === indo2.getDate();
}

/**
 * Get Indonesian date string in YYYY-MM-DD format
 */
export function getIndonesianDateString(date?: Date): string {
    const targetDate = date || getIndonesianTime();
    const indonesianTime = toIndonesianTime(targetDate);
    return format(indonesianTime, 'yyyy-MM-dd');
}

/**
 * Create a timestamp for database storage (always in GMT+7)
 */
export function createIndonesianTimestamp(): string {
    return getIndonesianTime().toISOString();
}

/**
 * Parse Indonesian time string to Date object
 */
export function parseIndonesianTime(timeString: string): Date {
    const today = getIndonesianTime();
    const [hours, minutes] = timeString.split(':').map(Number);
    
    const result = new Date(today);
    result.setHours(hours, minutes, 0, 0);
    
    return result;
}

/**
 * Comprehensive timezone info for debugging
 */
export function getTimezoneDebugInfo() {
    const now = new Date();
    const indonesianTime = getIndonesianTime();
    
    return {
        userLocalTime: {
            time: now.toISOString(),
            timezone: getUserTimezone(),
            dayName: format(now, 'eeee', { locale: id })
        },
        indonesianTime: {
            time: indonesianTime.toISOString(),
            timezone: 'Asia/Jakarta (GMT+7)',
            dayName: getIndonesianDayName()
        },
        comparison: {
            offsetHours: Math.floor((indonesianTime.getTime() - now.getTime()) / (1000 * 60 * 60)),
            sameDay: isSameDayInIndonesia(now, indonesianTime)
        }
    };
}