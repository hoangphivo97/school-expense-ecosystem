import { Directive, inject, input } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { NotificationService } from '../services/notification-service/notification.service';

@Directive({
  selector: '[seCopyToClipboard]',
  standalone: true,
  host: {
    '(click)': 'onClick($event)',
    '[style.cursor]': '"pointer"',
  },
})
export class CopyToClipboardDirective {
  private readonly clipboard = inject(Clipboard);
  private readonly notify = inject(NotificationService);

  readonly seCopyToClipboard = input.required<string>();
  readonly copySuccessKey = input<string>('shared.notifications.copiedToClipboard');

  protected onClick(event: MouseEvent): void {
    event.stopPropagation();
    const value = this.seCopyToClipboard();

    if (value && this.clipboard.copy(value)) {
      this.notify.success(this.copySuccessKey());
    }
  }
}