import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Deliverable } from 'src/data/deliverable.model';
import { Task } from 'src/data/task.model';
import { ScService } from '../sc.service';

@Component({
  selector: 'app-tasklist',
  templateUrl: './tasklist.component.html',
  styleUrls: ['./tasklist.component.css']
})
export class TasklistComponent implements OnInit {
  displayedColumns: string[] = ['projno', 'projname', 'assigned', 'startdate', 'enddate'];
  dataSource: MatTableDataSource<TaskObj>;
  taskCollection: AngularFirestoreCollection<Task>;
  taskObs: Observable<Task[]>;
  tasks: Task[] = [];
  taskObjs: TaskObj[] = [];
  
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private afs: AngularFirestore,
    private scService: ScService,
    private router: Router,
    private route: ActivatedRoute,
    private datepipe: DatePipe,
  ) {
    this.dataSource = new MatTableDataSource(this.taskObjs);
    this.taskCollection = this.afs.collection<Task>('tasks', ref => {
      return ref;
    });
    this.taskCollection.snapshotChanges().pipe(
      map (actions => {
      return actions.map(a => {
        const data = a.payload.doc.data() as Task;
        data.key = a.payload.doc.id;
        return { ...data};
      })
    })).subscribe(tasks_ => {
      this.tasks.length = 0;
      for(var task_ of tasks_) {
        if(this.scService.getCurrUser().personFilter) {
          for(var filter_ of this.scService.getCurrUser().personFilter) {
            if(task_.empl_key==filter_) {
              this.tasks.push(task_);
            }
          }
        } else {
          this.tasks.push(task_);
        }
      }
      this.sortTasks(this.tasks);
      this.scService.setTasks(this.tasks);
      this.popTaskObjs();
      this.dataSource.sort = this.sort;
    })
  }
  sortTasks(tasks: Task[]) {
    tasks.sort((a, b) => (Number(a.end_date) > Number(b.end_date)) ? 1 : -1);
  }

  popTaskObjs() {
    this.taskObjs.length = 0;
    var i = 0;
    for(var task of this.tasks) {
      var taskObj = new TaskObj();
      taskObj.task = task;
      taskObj.projno = this.scService.getProjectNo(task.proj_key);
      taskObj.projname = this.scService.getProjectName(task.proj_key);
      taskObj.name = this.scService.getPersonName(task.empl_key);
      taskObj.startdate = this.datepipe.transform(task.start_date, 'MM/dd/yyy');
      taskObj.enddate = this.datepipe.transform(task.end_date, 'MM/dd/yyy');
      this.taskObjs[i] = taskObj;
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

class TaskObj {
  task: Task;
  name: string;
  projno: string;
  projname: string;
  startdate: string
  enddate: string;

  constructor() {
  }
}
