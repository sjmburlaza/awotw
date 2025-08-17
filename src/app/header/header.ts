import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  isNightMode = false;

  constructor( private router: Router ) {}

  goToHomePage() {
    this.router.navigate(['/home']);
  }

  goToQuizPage() {
    this.router.navigate(['/quiz']);
  }
}
