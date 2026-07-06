import { Injectable } from '@nestjs/common';
import { StorageProvider } from './storage-provider';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class LocalStorageAdapter implements StorageProvider {
  private readonly baseDir = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureDir(path.join(this.baseDir, 'temp'));
    this.ensureDir(path.join(this.baseDir, 'uploaded'));
  }

  async uploadTemp(file: Express.Multer.File): Promise<string> {
    const fileName = `${randomUUID()}${path.extname(file.originalname)}`;
    const targetPath = path.join(this.baseDir, 'temp', fileName);
    
    await fs.writeFile(targetPath, file.buffer);
    
    return `/uploads/temp/${fileName}`;
  }

  async commitFiles(tempUrls: string[], expenseId: string): Promise<string[]> {
    const finalUrls: string[] = [];
    const targetDir = path.join(this.baseDir, 'uploaded', expenseId);
    await this.ensureDir(targetDir);

    for (const url of tempUrls) {
      const fileName = path.basename(url);
      const sourcePath = path.join(this.baseDir, 'temp', fileName);
      const targetPath = path.join(targetDir, fileName);

      try {
        await fs.access(sourcePath);
        await fs.rename(sourcePath, targetPath); 
        finalUrls.push(`/uploads/uploaded/${expenseId}/${fileName}`);
      } catch {
        finalUrls.push(url); 
      }
    }
    return finalUrls;
  }

  private async ensureDir(dirPath: string) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}