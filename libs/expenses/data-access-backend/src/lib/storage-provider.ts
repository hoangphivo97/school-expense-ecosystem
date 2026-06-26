/// <reference types="multer" />

export abstract class StorageProvider {

  abstract uploadTemp(file: Express.Multer.File): Promise<string>;

  abstract commitFiles(tempUrls: string[], expenseId: string): Promise<string[]>;
}