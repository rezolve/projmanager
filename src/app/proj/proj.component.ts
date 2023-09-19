import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Deliverable } from 'src/data/deliverable.model';
import { Note } from 'src/data/note.model';
import { Person } from 'src/data/person.model';
import { Project } from 'src/data/project.model';
import { Task } from 'src/data/task.model';
import { ScService } from '../sc.service';

@Component({
  selector: 'app-proj',
  templateUrl: './proj.component.html',
  styleUrls: ['./proj.component.css']
})
export class ProjComponent implements OnInit {
  picControl = new FormControl();
  picFiltered: Observable<Person[]>;

  pmControl = new FormControl();
  pmFiltered: Observable<Person[]>;

  pcControl = new FormControl();
  pcFiltered: Observable<Person[]>;

  hvacControl = new FormControl();
  hvacFiltered: Observable<Person[]>;

  elecControl = new FormControl();
  elecFiltered: Observable<Person[]>;

  plmbControl = new FormControl();
  plmbFiltered: Observable<Person[]>;

  fireControl = new FormControl();
  fireFiltered: Observable<Person[]>;

  people: Person[] = [];

  picPerson: Person = new Person();
  pmPerson: Person = new Person();
  pcPerson: Person = new Person();
  hvacPerson: Person = new Person();
  elecPerson: Person = new Person();
  plmbPerson: Person = new Person();
  firePerson: Person = new Person();

  startdate: FormControl = new FormControl(new Date());
  enddate: FormControl = new FormControl(new Date());

  delivColumns: string[] = ['descript', 'duedate', 'ismilestone'];
  taskColumns: string[] = ['descript', 'assigned', 'estimate', 'startdate', 'enddate', 'priority'];
  noteColumns: string[] = ['thenote', 'name', 'createddate'];

  delivdata: MatTableDataSource<DelObj>;
  taskdata: MatTableDataSource<TaskObj>;
  notedata: MatTableDataSource<NoteObj>;

  private projectDoc: AngularFirestoreDocument<Project>;
  project: Project = new Project();

  taskCollection: AngularFirestoreCollection<Task>;
  taskObs: Observable<Task[]>;
  taskObjs: TaskObj[] = [];

  deliverableCollection: AngularFirestoreCollection<Deliverable>;
  deliverableObs: Observable<Deliverable[]>;
  deliverableObjs: DelObj[] = [];

  noteCollection: AngularFirestoreCollection<Note>;
  noteObs: Observable<Note[]>;
  noteObjs: NoteObj[] = [];

  constructor(
    private afs: AngularFirestore,
    private scService: ScService,
    private route: ActivatedRoute,
    private datepipe: DatePipe,
    private router: Router,
  ) {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.projectDoc = this.afs.doc<Project>('projects/' + params['id']);
        this.projectDoc.valueChanges()
          .subscribe(project => {
            if (!project) return;
            this.project = project;
            this.project.key = params['id'];
            console.log('project.key=' + this.project.key);
            this.scService.setProject(this.project);
            if (project) {
              console.log("pic = " + project.pic);
              if (this.scService.getPersonByKey(project.pic))
                this.picPerson = this.scService.getPersonByKey(project.pic);
              if (this.scService.getPersonByKey(project.pm))
                this.pmPerson = this.scService.getPersonByKey(project.pm);
              if (this.scService.getPersonByKey(project.pc))
                this.pcPerson = this.scService.getPersonByKey(project.pc);
              if (this.scService.getPersonByKey(project.hvac))
                this.hvacPerson = this.scService.getPersonByKey(project.hvac);
              if (this.scService.getPersonByKey(project.fire))
                this.firePerson = this.scService.getPersonByKey(project.fire);
              if (this.scService.getPersonByKey(project.plmb))
                this.plmbPerson = this.scService.getPersonByKey(project.plmb);
              if (this.scService.getPersonByKey(project.elec))
                this.elecPerson = this.scService.getPersonByKey(project.elec);
              console.log("startdate = " + project.startdate);
              console.log("enddate = " + project.finishdate);
              this.startdate = new FormControl(new Date(project.startdate));
              this.enddate = new FormControl(new Date(project.finishdate));
            }
          });
        this.deliverableCollection = this.afs.collection<Deliverable>('deliverables', ref => {
          return ref;
        });
        this.deliverableCollection.snapshotChanges().pipe(
          map(actions => {
            return actions.map(a => {
              const data = a.payload.doc.data() as Deliverable;
              data.key = a.payload.doc.id;
              return { ...data };
            })
          })).subscribe(deliverables => {
            this.deliverableObjs = [];
            for (var deliv of deliverables) {
              if (deliv.proj_key != this.scService.getProject().key) continue;
              var delObj = new DelObj();
              delObj.deliverable = deliv;
              delObj.duedate = this.datepipe.transform(deliv.due_date, 'MM/dd/yyy');
              this.deliverableObjs.push(delObj);
            }
            console.log("deliverables.length = " + this.deliverableObjs.length);
            this.delivdata = new MatTableDataSource(this.deliverableObjs);
          })
        this.taskCollection = this.afs.collection<Task>('tasks', ref => {
          return ref;
        });
        this.taskCollection.snapshotChanges().pipe(
          map(actions => {
            return actions.map(a => {
              const data = a.payload.doc.data() as Task;
              data.key = a.payload.doc.id;
              return { ...data };
            })
          })).subscribe(tasks => {
            this.taskObjs = [];
            for (var task of tasks) {
              if (task.proj_key != this.scService.getProject().key) continue;
              var taskObj = new TaskObj();
              taskObj.task = task;
              taskObj.name = this.scService.getPersonName(task.empl_key);
              taskObj.startdate = this.datepipe.transform(task.start_date, 'MM/dd/yyy');
              taskObj.enddate = this.datepipe.transform(task.end_date, 'MM/dd/yyy');
              this.taskObjs.push(taskObj);
            }
            this.taskdata = new MatTableDataSource(this.taskObjs);
          })
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
            })).subscribe(notes => {
              this.noteObjs = [];
              for (var note of notes) {
                if (note.proj_key != this.scService.getProject().key) continue;
                var noteObj = new NoteObj();
                noteObj.note = note;
                noteObj.name = this.scService.getPersonByKey(note.empl_key).initials;
                noteObj.created = this.datepipe.transform(note.created_date, 'MM/dd/yyy');
                this.noteObjs.push(noteObj);
              }
              this.notedata = new MatTableDataSource(this.noteObjs);
            })
      }
    });
  }
  addDeliverable() {
    console.log("add Deliverable")
    if (!this.scService.getProject()) return;
    this.afs.collection("deliverables").add({
      proj_key: this.scService.getProject().key,
      name: "New Deliverable",
      priority: "Medium",
    })
      .then(docRef => {
        console.log("Deliverable written with ID: ", docRef.id);
        this.router.navigate(['deliverable/' + docRef.id]);
      })
      .catch(error => {
        console.error("Error adding deliverable: ", error);
      });
  }
  addTask() {
    console.log("add Task " + this.router.url);
    if (this.router.url.indexOf("people") >= 0) {
      this.afs.collection("tasks").add({
        empl_key: this.scService.getCurrUser().key,
        name: "New Task",
        description: "New Task",
        priority: "Medium",
      })
        .then(docRef => {
          console.log("Task written with ID: ", docRef.id);
          this.router.navigate(['task/' + docRef.id]);
        })
        .catch(error => {
          console.error("Error adding task: ", error);
        });

    } else {
      if (!this.scService.getProject()) {
        return;
      }
      this.afs.collection("tasks").add({
        proj_key: this.scService.getProject().key,
        name: "New Task",
        priority: "Medium",
      })
        .then(docRef => {
          console.log("Task written with ID: ", docRef.id);
          this.router.navigate(['task/' + docRef.id]);
        })
        .catch(error => {
          console.error("Error adding task: ", error);
        });
    }
  }
  addNote() {
    console.log("add Note " + this.router.url);
    var pKey = ""
    if(this.scService.getProject()) {
      pKey = this.scService.getProject().key;
    }
    this.afs.collection("notes").add({
      proj_key: pKey,
      empl_key: this.scService.getCurrUser().key,
      thenote: "New Note",
      created_date: new Date().getTime(),
      isprivate: false,
    })
      .then(docRef => {
        console.log("Note written with ID: ", docRef.id);
        this.router.navigate(['note/' + docRef.id]);
      })
      .catch(error => {
        console.error("Error adding task: ", error);
      });
  }
  orderNo(value: string) {
    console.log("orderNo() value = " + value);
    this.project.todd_no = value;
    this.projectDoc.update(this.project);
  }
  projNo(value: string) {
    console.log("projNo() value = " + value);
    this.project.project_no = value;
    this.projectDoc.update(this.project);
  }
  projName(value: string) {
    console.log("projName() value = " + value);
    this.project.project_name = value;
    this.projectDoc.update(this.project);
  }
  client(value: string) {
    console.log("client() value = " + value);
    this.project.client = value;
    this.projectDoc.update(this.project);
  }
  picUpdate(value: string) {
    console.log("pic() value = " + value);
    this.project.pic = value;
    this.projectDoc.update(this.project);
  }
  picBlur(event: any) {
    console.log("picBlur() value = " + event.target.value);
    if(event.target.value.trim().length==0) {
      this.project.pic = "";
      this.projectDoc.update(this.project);
    } else if (this.scService.getPersonByKey(event.target.value)) {
        this.picPerson = this.scService.getPersonByKey(event.target.value);
        this.picControl.setValue(this.picPerson.initials);
    }
  }
  pmUpdate(value: string) {
    console.log("pm() value = " + value);
    this.project.pm = value;
    this.projectDoc.update(this.project);
  }
  pmBlur(event: any) {
    console.log("pmBlur() value = " + event.target.value);
    if(event.target.value.trim().length==0) {
      this.project.pm = "";
      this.projectDoc.update(this.project);
    } else if (this.scService.getPersonByKey(event.target.value)) {
      this.pmPerson = this.scService.getPersonByKey(event.target.value);
      this.pmControl.setValue(this.picPerson.initials);
  }
  }
  pcUpdate(value: string) {
    console.log("pc() value = " + value);
    this.project.pc = value;
    this.projectDoc.update(this.project);
  }
  pcBlur(event: any) {
    console.log("pcBlur() value = " + event.target.value);
    if(event.target.value.trim().length==0) {
      this.project.pc = "";
      this.projectDoc.update(this.project);
    } else if (this.scService.getPersonByKey(event.target.value)) {
      this.pcPerson = this.scService.getPersonByKey(event.target.value);
      this.pcControl.setValue(this.picPerson.initials);
  }
  }
  hvacUpdate(value: string) {
    console.log("hvac() value = " + value);
    this.project.hvac = value;
    this.projectDoc.update(this.project);
  }
  hvacBlur(event: any) {
    console.log("hvacBlur() value = " + event.target.value);
    if(event.target.value.trim().length==0) {
      this.project.hvac = "";
      this.projectDoc.update(this.project);
    } else if (this.scService.getPersonByKey(event.target.value)) {
      this.hvacPerson = this.scService.getPersonByKey(event.target.value);
      this.hvacControl.setValue(this.picPerson.initials);
  }
  }
  fireUpdate(value: string) {
    console.log("fire() value = " + value);
    this.project.fire = value;
    this.projectDoc.update(this.project);
  }
  fireBlur(event: any) {
    console.log("fireBlur() value = " + event.target.value);
    if(event.target.value.trim().length==0) {
      this.project.fire = "";
      this.projectDoc.update(this.project);
    } else if (this.scService.getPersonByKey(event.target.value)) {
      this.firePerson = this.scService.getPersonByKey(event.target.value);
      this.fireControl.setValue(this.picPerson.initials);
  }
  }
  plmbUpdate(value: string) {
    console.log("plumb() value = " + value);
    this.project.plmb = value;
    this.projectDoc.update(this.project);
  }
  plmbBlur(event: any) {
    console.log("plmbBlur() value = " + event.target.value);
    if(event.target.value.trim().length==0) {
      this.project.plmb = "";
      this.projectDoc.update(this.project);
    } else if (this.scService.getPersonByKey(event.target.value)) {
      this.plmbPerson = this.scService.getPersonByKey(event.target.value);
      this.plmbControl.setValue(this.picPerson.initials);
  }
  }
  elecUpdate(value: string) {
    console.log("elec() value = " + value);
    this.project.elec = value;
    this.projectDoc.update(this.project);
  }
  elecBlur(event: any) {
    console.log("elecBlur() value = " + event.target.value);
    if(event.target.value.trim().length==0) {
      this.project.elec = "";
      this.projectDoc.update(this.project);
    } else if (this.scService.getPersonByKey(event.target.value)) {
      this.elecPerson = this.scService.getPersonByKey(event.target.value);
      this.elecControl.setValue(this.picPerson.initials);
  }
  }
  revit(value: string) {
    console.log("revit() value = " + value);
    this.project.revit = value;
    this.projectDoc.update(this.project);
  }
  spec(value: string) {
    console.log("spec() value = " + value);
    this.project.spec = value;
    this.projectDoc.update(this.project);
  }
  start(value: string) {
    console.log("start() value = " + value);
    var date = new Date(value);
    this.project.startdate = date.getTime();
    console.log("startdate = " + this.project.startdate);
    this.projectDoc.update(this.project);
  }
  finish(value: string) {
    console.log("finish() value = " + value);
    var date = new Date(value);
    this.project.finishdate = date.getTime();
    this.projectDoc.update(this.project);
  }
  comments(value: string) {
    console.log("comments() value = " + value);
    this.project.comments = value;
    this.projectDoc.update(this.project);
  }
  status(value: string) {
    console.log("status() value = " + value);
    this.project.status = value;
    this.projectDoc.update(this.project);
  }
  private filterPeopleByName(value: string): Person[] {
    const filterValue = value.toLowerCase();
    return this.people.filter(option => (option.first_name + " " + option.last_name).toLowerCase().includes(filterValue));
  }
  ngOnInit(): void {
    if (window.innerWidth < 600) {
      this.delivColumns = ['descript'];
      this.taskColumns = ['descript'];
    }
    this.people.length = 0;
    for (var person of this.scService.getPersons()) {
      this.people.push(person);
    }
    this.picFiltered = this.picControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterPeopleByName(value))
      );
    this.pmFiltered = this.pmControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterPeopleByName(value))
      );
    this.pcFiltered = this.pcControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterPeopleByName(value))
      );
    this.hvacFiltered = this.hvacControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterPeopleByName(value))
      );
    this.elecFiltered = this.elecControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterPeopleByName(value))
      );
    this.plmbFiltered = this.plmbControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterPeopleByName(value))
      );
    this.fireFiltered = this.fireControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterPeopleByName(value))
      );
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

class TaskObj {
  task: Task;
  name: string;
  projno: string;
  projname: string;
  startdate: string;
  enddate: string;
  duedate: string;

  constructor() {
  }
}

class NoteObj {
  note: Note;
  name: string;
  created: string;

  constructor() {
  }
}