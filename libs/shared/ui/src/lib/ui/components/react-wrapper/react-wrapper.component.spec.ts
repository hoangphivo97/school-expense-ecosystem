import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactWrapperComponent } from './react-wrapper.component';

jest.mock('@module-federation/runtime', () => ({
  loadRemote: jest.fn().mockResolvedValue({
    default: () => null 
  }),
}));

describe('ReactWrapperComponent', () => {
  let component: ReactWrapperComponent;
  let fixture: ComponentFixture<ReactWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactWrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReactWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
