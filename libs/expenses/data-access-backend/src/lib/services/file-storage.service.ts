import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FileStorageService {
  private readonly baseUploadPath = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureDirectoryExists(path.join(this.baseUploadPath, 'temp'));
    this.ensureDirectoryExists(path.join(this.baseUploadPath, 'expenses'));
  }

  async commitFiles(tempUrls: string[], expenseId: string): Promise<string[]> {
    const committedUrls: string[] = [];
    const targetDir = path.join(this.baseUploadPath, 'expenses', expenseId);
    await this.ensureDirectoryExists(targetDir);

    for (const url of tempUrls) {
      const fileName = path.basename(url);
      const sourcePath = path.join(this.baseUploadPath, 'temp', fileName);
      const targetPath = path.join(targetDir, fileName);

      try {
        await fs.access(sourcePath);
        await fs.rename(sourcePath, targetPath);
        
        committedUrls.push(`/uploads/expenses/${expenseId}/${fileName}`);
      } catch{
        committedUrls.push(url);
      }
    }

    return committedUrls;
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch {
      throw new InternalServerErrorException('Infrastructure Failure: Cannot initialize upload directories.');
    }
  }
}