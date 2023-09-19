import { Component, OnInit } from '@angular/core';

import {ViewChild} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { Observable } from 'rxjs';
import { Project } from 'src/data/project.model';
import { map } from 'rxjs/operators';
import { ScService } from '../sc.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Deliverable } from 'src/data/deliverable.model';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-deliverlist',
  templateUrl: './deliverlist.component.html',
  styleUrls: ['./deliverlist.component.css']
})
export class DeliverlistComponent implements OnInit {
  displayedColumns: string[] = ['projno', 'project', 'name', 'duedate', 'ismilestone'];
  dataSource: MatTableDataSource<DelObj>;
  deliverableCollection: AngularFirestoreCollection<Deliverable>;
  deliverableObs: Observable<Deliverable[]>;
  deliverables: Deliverable[] = [];
  delobjs: DelObj[] = [];
  
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private afs: AngularFirestore,
    private scService: ScService,
    private router: Router,
    private route: ActivatedRoute,
    private datepipe: DatePipe,
  ) {
    this.deliverableCollection = this.afs.collection<Deliverable>('deliverables', ref => {
      return ref;
    });
    this.deliverableCollection.snapshotChanges().pipe(
      map (actions => {
      return actions.map(a => {
        const data = a.payload.doc.data() as Deliverable;
        data.key = a.payload.doc.id;
        return { ...data};
      })
    })).subscribe(deliverables => {
      this.deliverables = deliverables;
      this.sortDeliverables(this.deliverables);
      this.scService.setDeliverables(this.deliverables);
      this.popDelivObjs();
      this.dataSource = new MatTableDataSource(this.delobjs);
      this.dataSource.sort = this.sort;
    })
  }
  sortDeliverables(deliverables: Deliverable[]) {
    deliverables.sort((a, b) => (Number(a.due_date) > Number(b.due_date)) ? 1 : -1);
  }

  popDelivObjs() {
    console.log("popDelivObjs");
    this.delobjs = [];
    var i = 0;
    for(var del of this.deliverables) {
      var delObj = new DelObj();
      delObj.deliverable = del;
      delObj.projno = this.scService.getProjectNo(del.proj_key);
      delObj.projname = this.scService.getProjectName(del.proj_key);
      delObj.duedate = this.datepipe.transform(del.due_date, 'MM/dd/yyy');
      this.delobjs[i] = delObj;
      i++;
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  deliverableClick(event: Event, deliverable: Deliverable) {
    console.log("clicked! key = " + deliverable.description);
    this.scService.setDeliverable(deliverable);
  }

  ngAfterViewInit() {
  }

  ngOnInit() {
  }

}

class DelObj {
  deliverable: Deliverable;
  name: string;
  projno: string;
  projname: string;
  duedate: string;
  ismilestone: boolean;
  
  constructor() {
  }

}
