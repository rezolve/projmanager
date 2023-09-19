import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith} from 'rxjs/operators';
import { Person } from 'src/data/person.model';
import { Project } from 'src/data/project.model';
import { Task } from 'src/data/task.model';
import { ScService } from '../sc.service';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css']
})
export class TaskComponent implements OnInit {
  projNoControl = new FormControl();
  projNameControl = new FormControl();
  private taskDoc: AngularFirestoreDocument<Task>;
  task: Task = new Task();
  taskObj: TaskObj = new TaskObj;
  personsObj: PersonObj[] = [];
  projectsObj: ProjObj[] = [];
  filteredProjects1: Observable<ProjObj[]>;
  filteredProjects2: Observable<ProjObj[]>;
  priorities: string[] = ['High','Medium','Low'];
  startdate: FormControl = new FormControl(new Date());
  enddate: FormControl = new FormControl(new Date());
 
  constructor(
    private afs: AngularFirestore,
    private scService: ScService,
    private route: ActivatedRoute,
  ) {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.taskDoc = this.afs.doc<Task>('tasks/' + params['id']);
        this.taskDoc.valueChanges()
          .subscribe(task => {
            if(!task) return;
            this.task = task;
            this.task.key = params['id'];
            this.scService.setTask(this.task);
            this.taskObj.task = this.task;
            this.taskObj.projno = this.scService.getProjectNo(this.task.proj_key);
            this.taskObj.projname = this.scService.getProjectName(this.task.proj_key);
            this.taskObj.name = this.scService.getPersonName(this.task.empl_key);
            // console.log("taskObj.projno = " + this.taskObj.projno);
            // console.log("taskObj.projname = " + this.taskObj.projname);
            // console.log("taskObj.name = " + this.taskObj.name);
            this.startdate = new FormControl(new Date(this.task.start_date));
            this.enddate = new FormControl(new Date(this.task.end_date));
          });
      }
    });
  }

  projNo(projNo: string) {
    console.log("projNo value = " + projNo);
    for(var projObj of this.projectsObj) {
      if(projNo == projObj.project.project_no) {
        this.task.proj_key = projObj.project.key;
        this.taskObj.projno = this.scService.getProjectNo(projObj.project.key);
        this.taskObj.projname = this.scService.getProjectName(projObj.project.key);
        this.taskDoc.update(this.task);
      }
    }
  }
  private filterProjectsByNo(value: string): ProjObj[] {
    const filterValue = value.toLowerCase();
    console.log("filter value = " + filterValue);
    return this.projectsObj.filter(option => option.project.project_no.toLowerCase().includes(filterValue));
  }
  private filterProjectsByName(value: string): ProjObj[] {
    const filterValue = value.toLowerCase();
    console.log("filter value = " + filterValue);
    return this.projectsObj.filter(option => option.name.toLowerCase().includes(filterValue));
  }
  projName(projName: string) {
    console.log("projName value = " + projName);
    for(var projObj of this.projectsObj) {
      if(projName == projObj.name) {
        this.task.proj_key = projObj.project.key;
        this.taskObj.projno = this.scService.getProjectNo(projObj.project.key);
        this.taskObj.projname = this.scService.getProjectName(projObj.project.key);
        this.taskDoc.update(this.task);
      }
    }
  }
  description(value: string) {
    console.log("description value = " + value);
    this.task.description = value;
    this.taskDoc.update(this.task);
  }
  assigned(event: any) {
    console.log("assign value = " + event.value);
    for(var personObj of this.personsObj) {
      if(event.value == (personObj.person.first_name + " " + personObj.person.last_name)) {
        this.task.empl_key = personObj.person.key;
        this.taskObj.name = event.value;
        this.taskDoc.update(this.task);
      }
    }
  }
  hours(value: string) {
    console.log("hours value = " + value);
    this.task.est_hours = Number(value);
    this.taskDoc.update(this.task);
  }
  maxHours(value: string) {
    console.log("maxHours value = " + value);
    this.task.max_hour_day = Number(value);
    this.taskDoc.update(this.task);
  }
  startDate(value: string) {
    console.log("duedate = " + value);
    var date = new Date(value);
    console.log("date.ts = " + date.getTime());
    this.task.start_date = date.getTime();
    this.taskDoc.update(this.task);
  }
  endDate(value: string) {
    console.log("duedate = " + value);
    var date = new Date(value);
    console.log("date.ts = " + date.getTime());
    this.task.end_date = date.getTime();
    this.taskDoc.update(this.task);
  }
  priority(event: any) {
    console.log("priority value = " + event.value);
    this.task.priority = event.value;
    this.taskDoc.update(this.task);
  }
  ngOnInit(): void {
    console.log("populating! size = " + this.scService.getPersons().length);
    this.personsObj.length = 0;
    if(this.scService.getCurrUser().personFilter) {
      for(var key of this.scService.getCurrUser().personFilter) {
        var person = this.scService.getPersonByKey(key);
        var personObj = new PersonObj();
        personObj.person = person;
        personObj.name = person.first_name + " " + person.last_name;
        this.personsObj.push(personObj);
      }
    } else {
      for(var person of this.scService.getPersons()) {
        var personObj = new PersonObj();
        personObj.person = person;
        personObj.name = person.first_name + " " + person.last_name;
        this.personsObj.push(personObj);
      }
    }
   
    this.projectsObj.length = 0;
    for(var project of this.scService.getProjects()) {
      var projObj = new ProjObj();
      projObj.project = project;
      projObj.name = this.scService.getProjectName(project.key);
      this.projectsObj.push(projObj);
    }
    this.projectsObj.sort((a, b) => (a.project.project_no > b.project.project_no) ? 1 : -1);
    this.filteredProjects1 = this.projNoControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterProjectsByNo(value))
      );
    this.filteredProjects2 = this.projNameControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filterProjectsByName(value))
      );
      
  }

}

class TaskObj {
  task: Task = new Task();
  name: string;
  assigned: string;
  projno: string;
  projname: string;
  duedate: number;
  ismilestone: boolean;
  
  constructor() {
  }
}

class PersonObj {
  person: Person;
  name: string;
 
  constructor() {
  }
}

class ProjObj {
  project: Project;
  name: string;
 
  constructor() {
  }
}


