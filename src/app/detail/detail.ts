import { Component, OnInit } from '@angular/core';
import { DataService, Item } from '../services/data.service';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs';

@Component({
  selector: 'app-detail',
  imports: [],
  templateUrl: './detail.html',
  styleUrl: './detail.scss'
})
export class Detail implements OnInit {
  details: Item | undefined;
  loading = true;
  
  constructor(
    private dataService: DataService,
    private route: ActivatedRoute, 
  ) {}

  ngOnInit() {
    const itemId = parseInt(this.route.snapshot.paramMap.get('id')!, 10);
    this.dataService.getData().pipe(take(1)).subscribe((res: Item[]) => {
      this.details = res.find(d => d.id === itemId);
    });
  }
}
