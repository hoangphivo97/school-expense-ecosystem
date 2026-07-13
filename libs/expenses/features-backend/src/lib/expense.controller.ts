/// <reference types="multer" />
import { Controller, Get, Post, Put, Body, Param, Query, Req, UseGuards, BadRequestException, ForbiddenException, UseInterceptors, ParseFilePipe, UploadedFile, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { ExpenseBackendService, StorageProvider } from '@school-expense-ecosystem/expenses/data-access-backend';
import { JwtAuthGuard, RolesGuard } from '@school-expense-ecosystem/shared/guards-backend';
import { AuditAction } from '@school-expense-ecosystem/expenses/types';
import { Request } from 'express';
import { AuthenticatedUser, Role, UserType } from '@school-expense-ecosystem/shared/types';
import { CreateExpenseDto, UpdateExpenseDto } from '@school-expense-ecosystem/expenses/data-access-backend';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExpenseCapGuard, ExpenseReviewGuard } from '@school-expense-ecosystem/expense/guards-backend';


interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
@Controller('expenses')
@UseGuards(RolesGuard)
export class ExpenseController {
  constructor(private readonly expenseBackendService: ExpenseBackendService,
    private readonly storageProvider: StorageProvider
  ) { }

  @Get()
  async getExpenses(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('pageToken') pageToken?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('searchTerm') searchTerm?: string
  ) {
    const userId = req.user.uid;
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const filterYear = year ? parseInt(year, 10) : undefined;
    const filterMonth = month ? parseInt(month, 10) : undefined;

    return this.expenseBackendService.getPaginatedExpenses(userId, {
      limit: parsedLimit,
      pageToken,
      year: filterYear,
      month: filterMonth,
      searchTerm: searchTerm || undefined
    });
  }

  @Get('analytics')
  async getAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query('year') year?: string,
    @Query('month') month?: string
  ) {

    const { role, facultyId } = req.user;
    const filterYear = year ? parseInt(year, 10) : undefined;
    const filterMonth = month ? parseInt(month, 10) : undefined;

    return this.expenseBackendService.getExpenseAnalytics({
      role,
      facultyId,
      year: filterYear,
      month: filterMonth
    });
  }

  @Get('years')
  async getAvailableYears(@Req() req: AuthenticatedRequest) {
    return this.expenseBackendService.getUserAvailableYears(req.user.uid);
  }

  @Post()
  @UseGuards(ExpenseCapGuard)
  async createExpense(@Req() req: AuthenticatedRequest, @Body() dto: CreateExpenseDto) {
    return this.expenseBackendService.createExpense(req.user, dto);
  }

  // @Put(':id')
  // async updateExpense(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateExpenseDto) {
  //   if (req.user.role === Role.LEVEL_3_USER && req.user.userType === UserType.STUDENT && dto.amount && dto.amount > 2000) {
  //     throw new BadRequestException('Security Breach: Student expense claims are strictly capped at 2,000 TWD.');
  //   }
  //   return this.expenseBackendService.updateExpense(id, req.user.uid, req.user, dto);
  // }

  @Post(':id/review')
  @UseGuards(ExpenseReviewGuard)
  async reviewExpense(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { action: AuditAction; reason?: string }
  ) {
    if (!body.action || !Object.values(AuditAction).includes(body.action)) {
      throw new BadRequestException('Invalid workflow action');
    }

    return this.expenseBackendService.reviewExpense(id, req.user, body.action, body.reason);
  }

  @Post('upload-proof')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadProof(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
            message: 'Security Breach: File size exceeds the maximum allowed limit of 5MB.'
          }),
          new FileTypeValidator({
            fileType: /(image\/jpeg|image\/png|application\/pdf)$/
          }),
        ],
      }),
    ) file: Express.Multer.File,
    @Req() req: any
  ) {
    const fileUrl = await this.storageProvider.uploadTemp(file);


    return { url: fileUrl };
  }
}