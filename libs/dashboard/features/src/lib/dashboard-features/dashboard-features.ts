import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'lib-dashboard-features',
  imports: [RouterLink, MatTooltipModule],
  templateUrl: './dashboard-features.html',
  styleUrl: './dashboard-features.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {


}
