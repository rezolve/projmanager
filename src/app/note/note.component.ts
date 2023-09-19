import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Note } from 'src/data/note.model';
import { Project } from 'src/data/project.model';
import { ScService } from '../sc.service';

@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.css']
})
export class NoteComponent implements OnInit {
  projControl = new FormControl();
 
  private noteDoc: AngularFirestoreDocument<Note>;
  note: Note = new Note();
  noteObj: NoteObj = new NoteObj;
  projectsObj: ProjObj[] = [];
  filteredProjects: Observable<ProjObj[]>;
  createddate: FormControl = new FormControl(new Date());
 
  constructor(
    private afs: AngularFirestore,
    private scService: ScService,
    private route: ActivatedRoute,
    private datepipe: DatePipe,
  ) {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.noteDoc = this.afs.doc<Note>('notes/' + params['id']);
        this.noteDoc.valueChanges()
          .subscribe(note => {
            if(!note) return;
            this.note = note;
            this.note.key = params['id'];
            this.scService.setNote(this.note);
            this.noteObj.note = this.note;
            this.noteObj.proj = this.scService.getProjectNo(this.note.proj_key) + " " + this.scService.getProjectName(this.note.proj_key);
            this.noteObj.created_date = this.datepipe.transform(this.note.created_date, 'M/d/yy, h:mm a');
            this.createddate = new FormControl(new Date(this.note.created_date));
          });
      }
    });
  }

  proj(proj: string) {
    console.log("proj value = " + proj);
    for(var projObj of this.projectsObj) {
      if(proj.substring(0,6) == projObj.project.project_no) {
        this.note.proj_key = projObj.project.key;
        this.noteObj.proj = this.scService.getProjectNo(projObj.project.key) + " " + this.scService.getProjectName(projObj.project.key);
        this.noteDoc.update(this.note);
      }
    }
  }
  private filterProjects(value: string): ProjObj[] {
    const filterValue = value.toLowerCase();
    console.log("filter value = " + filterValue);
    if(!filterValue) 
      return this.projectsObj;
    else 
      return this.projectsObj.filter(option => (option.project.project_no.toLowerCase().includes(filterValue) || option.name.toLowerCase().includes(filterValue)));
  }
  theNote(value: string) {
    this.note.thenote = value;
    this.noteDoc.update(this.note);
  }
  createdDate(value: string) {
    console.log("createddate = " + value);
    var date = new Date(value);
    console.log("date.ts = " + date.getTime());
    this.note.created_date = date.getTime();
    this.noteDoc.update(this.note);
  }
  privacy(event: any) {
    console.log("privacy value = " + event.value);
    this.note.isprivate = event.value;
    this.noteDoc.update(this.note);
  }
  compareIsprivate(o1: any, o2: any): boolean {
    o1 = String(o1);
    o2 = String(o2);
    return o1 === o2;
  }
  ngOnInit(): void {
    console.log("populating! size = " + this.scService.getPersons().length);
    this.projectsObj.length = 0;
    for(var project of this.scService.getProjects()) {
      var projObj = new ProjObj();
      projObj.project = project;
      projObj.name = project.project_no + " " + project.project_name;
      this.projectsObj.push(projObj);
    }
    this.projectsObj.sort((a, b) => (a.project.project_no > b.project.project_no) ? 1 : -1);
    this.filteredProjects = this.projControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterProjects(value))
      );
  }
}

class NoteObj {
  note: Note = new Note();
  proj: string;
  created_date: string;
 
  constructor() {
  }
}

class ProjObj {
  project: Project;
  name: string;
 
  constructor() {
  }
}