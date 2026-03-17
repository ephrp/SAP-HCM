import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Inject,
  PLATFORM_ID,
} from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements AfterViewInit {

  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  stats = {
    totalEmployees: 24,
    pendingLeaves: 3,
    trainingHours: 128,
    departments: 5,
  };

  animated = {
    totalEmployees: 0,
    pendingLeaves: 0,
    trainingHours: 0,
    departments: 0,
  };

  showVideo = false;

  ngAfterViewInit(): void {

    if (!this.isBrowser) return;

    requestAnimationFrame(() => {
      this.animateAll();
    });

  }

  private animateAll(): void {

    this.animateValue('totalEmployees', this.stats.totalEmployees, 800);
    this.animateValue('pendingLeaves', this.stats.pendingLeaves, 700);
    this.animateValue('trainingHours', this.stats.trainingHours, 900);
    this.animateValue('departments', this.stats.departments, 700);

  }

  private animateValue(
    key: keyof typeof this.animated,
    target: number,
    duration: number
  ): void {

    const start = performance.now();

    const animate = (time: number) => {

      const progress = Math.min((time - start) / duration, 1);

      const eased = 1 - Math.pow(1 - progress, 3);

      this.animated[key] = Math.floor(eased * target);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.animated[key] = target;
      }

    };

    requestAnimationFrame(animate);

  }

  openVideo(): void {
    this.showVideo = true;
    if (this.isBrowser) document.body.style.overflow = 'hidden';
  }

  closeVideo(): void {
    this.showVideo = false;
    if (this.isBrowser) document.body.style.overflow = '';
  }

}
