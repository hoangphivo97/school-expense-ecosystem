import { Injectable } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
  // Override `format` method to display date in DD/MM/YYYY format
  override format(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Override `parse` method to correctly parse DD/MM/YYYY format
  override parse(value: unknown): Date | null {
    if (typeof value === 'string' && value.length === 10) {
      const [day, month, year] = value.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
    return super.parse(value);
  }
}

export function tsToMs(ts: Timestamp): number {
  if (!ts) return NaN;
  // Firestore Timestamp instance
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  // Plain object {seconds, nanoseconds}
  if (typeof ts.seconds === 'number')
    return ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6);
  return NaN;
}

export function tsToDate(ts: Timestamp): Date | null {
  const ms = tsToMs(ts);
  return isNaN(ms) ? null : new Date(ms);
}
