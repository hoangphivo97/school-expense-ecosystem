import { Directive, ElementRef, Renderer2, ViewContainerRef, ComponentRef, effect, inject, input } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Directive({
  selector: '[seLoading]',
  standalone: true,
})
export class LoadingDirective {
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private spinnerRef?: ComponentRef<MatProgressSpinner>;

  // Reactive input signal accepting the loading state value
  loading = input<boolean>(false, { alias: 'seLoading' });

  constructor() {
    /**
     * Declarative effect listener driving DOM mutations automatically 
     * based on the reactive state boundary changes.
     */
    effect(() => {
      if (this.loading()) {
        this.enableLoadingState();
      } else {
        this.disableLoadingState();
      }
    });
  }

  private enableLoadingState(): void {
    const targetElement = this.elementRef.nativeElement;

    // Apply layout containment and blurring effect classes
    this.renderer.addClass(targetElement, 'position-relative');
    this.renderer.addClass(targetElement, 'loading-container-blurred');

    // Dynamically spawn the native Angular Material progress spinner component
    this.spinnerRef = this.viewContainerRef.createComponent(MatProgressSpinner);
    this.spinnerRef.instance.diameter = 30; // Standardized clean size context
    this.spinnerRef.instance.mode = 'indeterminate';

    const spinnerHtml = this.spinnerRef.location.nativeElement;
    this.renderer.addClass(spinnerHtml, 'absolute-center-spinner');
    this.renderer.appendChild(targetElement, spinnerHtml);
  }

  private disableLoadingState(): void {
    const targetElement = this.elementRef.nativeElement;

    this.renderer.removeClass(targetElement, 'loading-container-blurred');

    if (this.spinnerRef) {
      this.spinnerRef.destroy();
      this.spinnerRef = undefined;
    }
  }
}