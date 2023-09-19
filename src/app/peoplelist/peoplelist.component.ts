import { Component, OnInit } from '@angular/core';

import {ViewChild} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { Observable } from 'rxjs';
import { Person } from 'src/data/person.model';
import { map } from 'rxjs/operators';
import { ScService } from '../sc.service';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-peoplelist',
  templateUrl: './peoplelist.component.html',
  styleUrls: ['./peoplelist.component.css']
})
export class PeoplelistComponent implements OnInit {
  displayedColumns: string[] = ['first_name', 'last_name', 'initials', 'email'];
  dataSource: MatTableDataSource<Person>;
  personCollection: AngularFirestoreCollection<Person>;
  personObs: Observable<Person[]>;
  people: Person[] = [];
  
  @ViewChild(MatSort, {static: false}) sort: MatSort;

  constructor(
    private afs: AngularFirestore,
    private scService: ScService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    
  }
  sortPeople(people: Person[]) {
    people.sort((a, b) => (a.last_name > b.last_name) ? 1 : -1);
  }

  applyFilter(event: Event) {
    console.log("applyFilter");
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  personClick(event: Event, person: Person) {
    console.log("clicked! key = " + person.email);
    this.scService.setPerson(person);
  }

  ngAfterViewInit() {
    this.personCollection = this.afs.collection<Person>('persons2', ref => {
      return ref;
    });
    this.personCollection.snapshotChanges().pipe(
      map (actions => {
      return actions.map(a => {
        const data = a.payload.doc.data() as Person;
        data.key = a.payload.doc.id;
        return { ...data};
      })
    })).subscribe(people => {
      this.people.length = 0;
      for(var peop of people) {
        if(this.scService.getCurrUser().personFilter) {
          for(var key of this.scService.getCurrUser().personFilter) {
            if(key==peop.key) {
              this.people.push(peop);
            }
          }
        } else {
          this.people.push(peop);
        }
      }
      this.sortPeople(this.people);
      this.dataSource = new MatTableDataSource(this.people);
      this.dataSource.sort = this.sort;
    })
  }

  ngOnInit() {
  }

}

