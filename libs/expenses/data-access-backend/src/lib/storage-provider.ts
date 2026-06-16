/// <reference types="multer" />
import { Injectable } from '@nestjs/common';

export abstract class StorageProvider {
  /**
   * Lưu file vào thư mục tạm (temp) khi người dùng vừa chọn file từ giao diện
   */
  abstract uploadTemp(file: Express.Multer.File): Promise<string>;

  /**
   * Chuyển file từ thư mục tạm (temp) sang thư mục chính thức (uploaded) khi đơn được duyệt/save
   */
  abstract commitFiles(tempUrls: string[], expenseId: string): Promise<string[]>;
}