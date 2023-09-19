import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Person } from 'src/data/person.model';
import { ScService } from '../sc.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  displayedColumns: string[] = ['check', 'first_name', 'last_name', 'initials', 'email'];
  dataSource: MatTableDataSource<FilterObj>;
  personCollection: AngularFirestoreCollection<Person>;
  personObs: Observable<Person[]>;
  filter: FilterObj[] = [];

  @ViewChild(MatSort, {static: false}) sort: MatSort;

  constructor(
    private afs: AngularFirestore,
    private route: ActivatedRoute,
    private scs: ScService,
  ) {
    this.route.params.subscribe(params => {
      // console.log("Here I am!");
      this.personCollection = this.afs.collection<Person>('persons2', ref => {
        return ref;
      });
      this.personCollection.snapshotChanges().pipe(
        map(actions => {
          return actions.map(a => {
            const data = a.payload.doc.data() as Person;
            data.key = a.payload.doc.id;
            return { ...data };
          })
        })).subscribe(people => {
          people.sort((a, b) => (a.last_name > b.last_name) ? 1 : -1);
          this.filter.length = 0;
          for(var person_ of people) {
            var filterObj = new FilterObj();
            filterObj.person = person_;
            filterObj.filtered = false;
            this.filter.push(filterObj);
            if(this.scs.getCurrUser().personFilter) {
              filterObj.filtered = false;
              for(var filter_ of this.scs.getCurrUser().personFilter) {
                if(filter_==person_.key) {
                  // console.log("setting filter on " + this.scs.getPersonName(person_.key) + " to true!");
                  filterObj.filtered = true;
                  break;
                }
              }
            } else {
              filterObj.filtered = true;
            }
          }
          this.dataSource = new MatTableDataSource(this.filter);
          this.dataSource.sort = this.sort;
        })
    });
  }

  updateChecked(personKey: string, event: any) {
    // console.log("updateChecked()! key,vale=" + personKey + ", " + event.checked);
    var person = this.scs.getCurrUser();
    if(person.personFilter) {
      // console.log("personFilter exists! length = " + person.personFilter.length);
    } else {
      console.log("personFilter does not exist!");
      person.personFilter = new Array<string>();
    }
    
    if(event.checked) {
      // console.log("adding a filter item!")
      person.personFilter.push(personKey);
    } else {
      console.log("removing a filter item!");
      var filter_ = new Array<string>();
      for(var fItem of person.personFilter) {
        // console.log("fItem, personKey = " + fItem + ", " + personKey);
        if(fItem!=personKey) {
          filter_.push(fItem);
        }
      }
      person.personFilter = filter_;
    }
    var personDoc: AngularFirestoreDocument<Person>;
    personDoc = this.afs.doc<Person>('persons2/' + person.key);
    // console.log("personFilter.length = " + person.personFilter.length);
    personDoc.update(person);
  }

  ngOnInit(): void {
  }

}

class FilterObj {
  person: Person;
  filtered: boolean;
 
  constructor() {
  }
}
