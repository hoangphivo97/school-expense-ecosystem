import { Pipe, PipeTransform } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

@Pipe({
  name: 'formError',
  standalone: true,
  pure: true
})
export class FormErrorPipe implements PipeTransform {
  transform(errors: ValidationErrors | null | undefined, customMessages?: Record<string, string>): string {
    if (!errors) return '';

    const firstErrorKey = Object.keys(errors)[0];

    if (customMessages && customMessages[firstErrorKey]) {
      return customMessages[firstErrorKey];
    }

    // (System Default)
    const defaultMessages: Record<string, string> = {
      required: 'This field is required.',
      minlength: `Must be at least ${errors['minlength']?.requiredLength} characters.`,
      maxlength: `Cannot exceed ${errors['maxlength']?.requiredLength} characters.`,
      pattern: 'Invalid format.'
    };

    return defaultMessages[firstErrorKey] || 'Invalid field value.';
  }
}