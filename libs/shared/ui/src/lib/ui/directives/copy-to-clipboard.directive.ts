import { Directive, inject, input } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { NotificationService } from '@school-expense-ecosystem/shared/ui';

@Directive({
  selector: '[copyToClipboard]',
  standalone: true,
  host: {
    '(click)': 'onClick($event)',
    '[style.cursor]': '"pointer"',
  },
})
export class CopyToClipboardDirective {
  private readonly clipboard = inject(Clipboard);
  private readonly notify = inject(NotificationService);

  readonly text = input.required<string>({ alias: 'copyToClipboard' });
  readonly successKey = input<string>('shared.notifications.copiedToClipboard', {
    alias: 'copySuccessKey',
  });

  protected onClick(event: MouseEvent): void {
    event.stopPropagation();
    const value = this.text();

    if (value && this.clipboard.copy(value)) {
      this.notify.success(this.successKey());
    }
  }
}