import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FileStorageService {
  // Thư mục gốc chứa toàn bộ dữ liệu upload trên VPS/Local
  private readonly baseUploadPath = path.join(process.cwd(), 'uploads');

  constructor() {
    // Khởi tạo các thư mục lõi nếu chưa tồn tại
    this.ensureDirectoryExists(path.join(this.baseUploadPath, 'temp'));
    this.ensureDirectoryExists(path.join(this.baseUploadPath, 'expenses'));
  }

  /**
   * Di chuyển các file minh chứng từ thư mục tạm sang thư mục chính thức của đơn chi phí
   */
  async commitFiles(tempUrls: string[], expenseId: string): Promise<string[]> {
    const committedUrls: string[] = [];
    const targetDir = path.join(this.baseUploadPath, 'expenses', expenseId);
    await this.ensureDirectoryExists(targetDir);

    for (const url of tempUrls) {
      // Trích xuất tên file từ URL (Ví dụ: http://localhost:3000/uploads/temp/uuid-file.pdf -> uuid-file.pdf)
      const fileName = path.basename(url);
      const sourcePath = path.join(this.baseUploadPath, 'temp', fileName);
      const targetPath = path.join(targetDir, fileName);

      try {
        // Kiểm tra xem file tạm có thực sự tồn tại trước khi di chuyển
        await fs.access(sourcePath);
        await fs.rename(sourcePath, targetPath);
        
        // Trả về URL cấu trúc mới chính thức
        committedUrls.push(`/uploads/expenses/${expenseId}/${fileName}`);
      } catch (error) {
        // Nếu file không có ở temp (có thể do đã lưu từ trước hoặc lỗi), giữ nguyên URL cũ
        committedUrls.push(url);
      }
    }

    return committedUrls;
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new InternalServerErrorException('Infrastructure Failure: Cannot initialize upload directories.');
    }
  }
}