import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Note } from 'src/data/note.model';
import { ScService } from '../sc.service';


@Component({
  selector: 'app-noteslist',
  templateUrl: './noteslist.component.html',
  styleUrls: ['./noteslist.component.css']
})
export class NoteslistComponent implements OnInit {
  displayedColumns: string[] = ['proj', 'note', 'createdate'];
  dataSource: MatTableDataSource<NoteObj>;
  noteCollection: AngularFirestoreCollection<Note>;
  noteObs: Observable<Note[]>;
  notes: Note[] = [];
  noteObjs: NoteObj[] = [];

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private afs: AngularFirestore,
    private scService: ScService,
    private router: Router,
    private route: ActivatedRoute,
    private datepipe: DatePipe,
  ) {
    this.dataSource = new MatTableDataSource(this.noteObjs);
    this.noteCollection = this.afs.collection<Note>('notes', ref => {
      return ref;
    });
    this.noteCollection.snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as Note;
          data.key = a.payload.doc.id;
          return { ...data };
        })
      })).subscribe(notes_ => {
        this.notes.length = 0;
        for (var note_ of notes_) {
          if (this.scService.getCurrUser().personFilter) {
            for (var filter_ of this.scService.getCurrUser().personFilter) {
              if (note_.empl_key == filter_) {
                this.notes.push(note_);
              }
            }
          } else {
            this.notes.push(note_);
          }
        }
        this.sortNotes(this.notes);
        this.scService.setNotes(this.notes);
        this.popNoteObjs();
        this.dataSource.sort = this.sort;
      })
  }
  sortNotes(notes: Note[]) {
    notes.sort((a, b) => (Number(a.created_date) > Number(b.created_date)) ? 1 : -1);
  }

  popNoteObjs() {
    this.noteObjs.length = 0;
    var i = 0;
    for (var note of this.notes) {
      var noteObj = new NoteObj();
      noteObj.note = note;
      var proj = this.scService.getProjectByKey(note.proj_key);
      if(proj) 
      noteObj.projname = proj.project_no + " " + proj.project_name
      noteObj.createddate = this.datepipe.transform(note.created_date, "M/d/yy h:mm a");
      this.noteObjs[i] = noteObj;
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

  ngAfterViewInit() {
  }

  ngOnInit() {
  }

}

class NoteObj {
  note: Note;
  projname: string;
  createddate: string;

  constructor() {
  }
}
