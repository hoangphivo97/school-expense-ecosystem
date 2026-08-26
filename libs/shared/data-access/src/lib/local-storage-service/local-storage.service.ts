import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {

  setItem(key: string, value: unknown): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error saving ${key} to localStorage`, error);
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const serializedValue = localStorage.getItem(key);
      return serializedValue ? (JSON.parse(serializedValue) as T) : null;
    } catch (error) {
      console.error(`Error get ${key} to localStorage`, error);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error remove ${key} to localStorage`, error);
    }
  }

  //Clear ALL localStorage data
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error(`Error cleaing localStorage`, error);
    }
  }
}
