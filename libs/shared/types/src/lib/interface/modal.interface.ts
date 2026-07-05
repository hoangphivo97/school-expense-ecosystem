import { ErrorResponse } from "./auth.interface";

export interface DialogData <T = unknown>{
  title: string;
  action: DialogActionEnum;
  isSuccess: boolean;
  data?: T;
  content: DialogContent;
}

export enum DialogActionEnum {
  Create,
  Edit,
  Delete,
  Settings,
  Cancel,
  Register,
  Detail
}

export interface DialogError extends ErrorResponse{
  title: string;
  hint?: string;
}

interface DialogContent {
  message: string;
}

export interface ConfirmDialogData {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  icon?: string;
}
