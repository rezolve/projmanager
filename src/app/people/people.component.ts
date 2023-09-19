import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Person } from 'src/data/person.model';
import { Task } from 'src/data/task.model';
import { PdfService } from '../pdf.service';
import { ScService } from '../sc.service';

@Component({
  selector: 'app-people',
  templateUrl: './people.component.html',
  styleUrls: ['./people.component.css']
})
export class PeopleComponent implements OnInit, AfterViewInit {
  assignColumns: string[] = ['project', 'pm', 'pc', 'hvac', 'elec', 'plmb', 'fire'];
  taskColumns: string[] = ['key', 'project', 'descript', 'startdate', 'enddate', 'daysout', 'priority'];

  private personDoc: AngularFirestoreDocument<Person>;
  person: Person = new Person();

  taskdata: MatTableDataSource<TaskObj>;
  taskCollection: AngularFirestoreCollection<Task>;
  taskObs: Observable<Task[]>;
  taskObjs: TaskObj[] = [];
  taskObjs_: TaskObj[] = [];

  highTasks: TaskObj[] = [];
  medTasks: TaskObj[] = [];
  lowTasks: TaskObj[] = [];

  assignmentdata: MatTableDataSource<AssignObj>;
  assignObjs: AssignObj[] = [];

  taskMap: Map<number, DayObj> = new Map();
  colorMap: Map<string, string> = new Map();
  twoWk = new Array(14);
  interval24Hr = 1000 * 60 * 60 * 24;

  todayDate = new Date();
  startOfDay = this.todayDate.setHours(0, 0, 0, 0);
  endOfDay = this.todayDate.setHours(23, 59, 59, 999) + (1000 * 60 * 60 * 24 * 14);

  afterViewInit: boolean = false;

  colorCnt: number = 0;
  colors: string[] = [
    "#ADFF2F",
    "#B22222",
    "#BDB76B",
    "#8FBC8F",
    "#9400D3",
    "#FFD700",
    "#FFFACD",
    "#20B2AA",
    "#FF00FF",
    "#F5FFFA",
    "#FDF5E6",
    "#98FB98",
    "#F4A460",
    "#D8BFD8",
    "#7FFF00",
    "#A9A9A9",
  ];

  @ViewChild("perscal") perscalEl: ElementRef;
  @ViewChild("cell1") cell1El: ElementRef;
  @ViewChild("cell2") cell2El: ElementRef;
  @ViewChild("cell3") cell3El: ElementRef;
  @ViewChild("cell4") cell4El: ElementRef;
  @ViewChild("cell5") cell5El: ElementRef;
  @ViewChild("cell6") cell6El: ElementRef;
  @ViewChild("cell7") cell7El: ElementRef;
  @ViewChild("cell8") cell8El: ElementRef;
  @ViewChild("cell9") cell9El: ElementRef;
  @ViewChild("cell10") cell10El: ElementRef;
  @ViewChild("cell11") cell11El: ElementRef;
  @ViewChild("cell12") cell12El: ElementRef;
  @ViewChild("cell13") cell13El: ElementRef;
  @ViewChild("cell14") cell14El: ElementRef;

  @ViewChild("title1") title1El: ElementRef;
  @ViewChild("title2") title2El: ElementRef;
  @ViewChild("title3") title3El: ElementRef;
  @ViewChild("title4") title4El: ElementRef;
  @ViewChild("title5") title5El: ElementRef;
  @ViewChild("title6") title6El: ElementRef;
  @ViewChild("title7") title7El: ElementRef;
  @ViewChild("title8") title8El: ElementRef;
  @ViewChild("title9") title9El: ElementRef;
  @ViewChild("title10") title10El: ElementRef;
  @ViewChild("title11") title11El: ElementRef;
  @ViewChild("title12") title12El: ElementRef;
  @ViewChild("title13") title13El: ElementRef;
  @ViewChild("title14") title14El: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private afs: AngularFirestore,
    private scService: ScService,
    private pdfService: PdfService,
    private datepipe: DatePipe,
    private renderer: Renderer2,
  ) {

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.personDoc = this.afs.doc<Person>('persons2/' + params['id']);
        this.personDoc.valueChanges()
          .subscribe(person => {
            if (!person) return;
            this.person = person;
            this.person.key = params['id'];
            this.scService.setPerson(this.person);

            this.taskCollection = this.afs.collection<Task>('tasks', ref => ref.where('empl_key', '==', this.scService.getPerson().key));
            this.taskCollection.snapshotChanges().pipe(
              map(actions => {
                return actions.map(a => {
                  const data = a.payload.doc.data() as Task;
                  data.key = a.payload.doc.id;
                  return { ...data };
                })
              })).subscribe(tasks => {
                this.taskObjs.length = 0;
                this.taskObjs_.length = 0;
                for (var task of tasks) {
                  if (task.empl_key != this.scService.getPerson().key) continue;

                  var validDates = false;
                  if (task.end_date >= this.startOfDay && task.end_date <= this.endOfDay) {
                    validDates = true;
                  }
                  if (task.start_date >= this.startOfDay && task.start_date <= this.endOfDay) {
                    validDates = true;
                  }
                  if (task.start_date < this.startOfDay && task.end_date > this.endOfDay) {
                    validDates = true;
                  }

                  if (validDates) {
                    var taskObj = new TaskObj();
                    taskObj.task = task;
                    taskObj.projno = this.scService.getProjectNo(task.proj_key);
                    taskObj.projname = this.scService.getProjectName(task.proj_key);
                    taskObj.name = this.scService.getPersonName(task.empl_key);
                    taskObj.startdate = this.datepipe.transform(task.start_date, 'MM/dd');
                    taskObj.enddate = this.datepipe.transform(task.end_date, 'MM/dd');
                    this.taskObjs.push(taskObj);
                  }

                }
                // console.log("taskObjs = " + this.taskObjs.length);
                // console.log("taskObjs_ = " + this.taskObjs_.length);
                this.taskdata = new MatTableDataSource(this.taskObjs);
                this.doCalendar();
              })
          });

          this.assignObjs.length = 0;
          for(var proj of this.scService.getProjects()) {
            var assignObj = null;
            if(proj.pm == this.person.key) {
              if(!assignObj) {
                assignObj = new AssignObj();
              }
              assignObj.pm = true;
            }
            if(proj.pc == this.person.key) {
              if(!assignObj) {
                assignObj = new AssignObj();
              }
              assignObj.pc = true;
            }
            if(proj.hvac == this.person.key) {
              if(!assignObj) {
                assignObj = new AssignObj();
              }
              assignObj.hvac = true;
            }
            if(proj.elec == this.person.key) {
              if(!assignObj) {
                assignObj = new AssignObj();
              }
              assignObj.elec = true;
            }
            if(proj.plmb == this.person.key) {
              if(!assignObj) {
                assignObj = new AssignObj();
              }
              assignObj.plmb = true;
            }
            if(proj.fire == this.person.key) {
              if(!assignObj) {
                assignObj = new AssignObj();
              }
              assignObj.fire = true;
            }
            if(assignObj) {
              assignObj.project = proj.project_no + " " + this.scService.getProjectName(proj.key);
              this.assignObjs.push(assignObj);
              console.log("assignObj!!!! " + assignObj.project);
            } else {
              console.log("assignObj = null, length = " + this.assignObjs.length);
            }
            this.assignmentdata = new MatTableDataSource(this.assignObjs);
          }
      }
    });
  }
  doCalendar() {
    var date1 = this.datepipe.transform(new Date().getTime() + (0 * 1000 * 60 * 60 * 24), 'EEEEEE MM/dd/yyy');
    var date2 = this.datepipe.transform(new Date().getTime() + (1 * 1000 * 60 * 60 * 24), 'EEEEEE MM/dd/yyy');
    var date3 = this.datepipe.transform(new Date().getTime() + (2 * 1000 * 60 * 60 * 24), 'EEEEEE MM/dd/yyy');
    var date4 = this.datepipe.transform(new Date().getTime() + (3 * 1000 * 60 * 60 * 24), 'EEEEEE MM/dd/yyy');
    var date5 = this.datepipe.transform(new Date().getTime() + (4 * 1000 * 60 * 60 * 24), 'EEEEEE MM/dd/yyy');
    var date6 = this.datepipe.transform(new Date().getTime() + (5 * 1000 * 60 * 60 * 24), 'EEEEEE MM/dd/yyy');
    var date7 = this.datepipe.transform(new Date().getTime() + (6 * 1000 * 60 * 60 * 24), 'EEEEEE MM/dd/yyy');
    var date8 = this.datepipe.transform(new Date().getTime() + (7 * 1000 * 60 * 60 * 24), 'EEEEEE MM/dd/yyy');
    var date9 = this.datepipe.transform(new Date().getTime() + (8 * 1000 * 60 * 60 * 24), 'EEEEEE MM/dd/yyy');
    var date10 = this.datepipe.transform(new Date().getTime() + (9 * 1000 * 60 * 60 * 24), 'EEEEEE MM/dd/yyy');
    var date11 = this.datepipe.transform(new Date().getTime() + (10 * 1000 * 60 * 60 * 24), 'EEEEEE MM/dd/yyy');
    var date12 = this.datepipe.transform(new Date().getTime() + (11 * 1000 * 60 * 60 * 24), 'EEEEEE MM/dd/yyy');
    var date13 = this.datepipe.transform(new Date().getTime() + (12 * 1000 * 60 * 60 * 24), 'EEEEEE MM/dd/yyy');
    var date14 = this.datepipe.transform(new Date().getTime() + (13 * 1000 * 60 * 60 * 24), 'EEEEEE MM/dd/yyy');

    this.renderer.setProperty(this.title1El.nativeElement, 'innerHTML', date1);
    this.renderer.setProperty(this.title2El.nativeElement, 'innerHTML', date2);
    this.renderer.setProperty(this.title3El.nativeElement, 'innerHTML', date3);
    this.renderer.setProperty(this.title4El.nativeElement, 'innerHTML', date4);
    this.renderer.setProperty(this.title5El.nativeElement, 'innerHTML', date5);
    this.renderer.setProperty(this.title6El.nativeElement, 'innerHTML', date6);
    this.renderer.setProperty(this.title7El.nativeElement, 'innerHTML', date7);
    this.renderer.setProperty(this.title8El.nativeElement, 'innerHTML', date8);
    this.renderer.setProperty(this.title9El.nativeElement, 'innerHTML', date9);
    this.renderer.setProperty(this.title10El.nativeElement, 'innerHTML', date10);
    this.renderer.setProperty(this.title11El.nativeElement, 'innerHTML', date11);
    this.renderer.setProperty(this.title12El.nativeElement, 'innerHTML', date12);
    this.renderer.setProperty(this.title13El.nativeElement, 'innerHTML', date13);
    this.renderer.setProperty(this.title14El.nativeElement, 'innerHTML', date14);

    this.taskMap.clear();

    this.highTasks.length = 0;
    this.medTasks.length = 0;
    this.lowTasks.length = 0;

    // console.log("startOfDay = " +  this.datepipe.transform(startOfDay, 'MM/dd/yyy hh:mm:ss'));
    // console.log("endOfDay = " +  this.datepipe.transform(endOfDay, 'MM/dd/yyy hh:mm:ss'));
    // console.log("taskObjs.length = " + this.taskObjs.length);

    for (var taskObj of this.taskObjs) {
      // console.log("taskObj.task.est_hours = " + taskObj.task.est_hours);
      taskObj.task.start_date = new Date(taskObj.task.start_date).setHours(0, 0, 0, 0);
      taskObj.task.end_date = new Date(taskObj.task.end_date).setHours(23, 59, 59, 999);
      // console.log("task.start_date = " +  this.datepipe.transform(taskObj.task.start_date, 'MM/dd/yyy hh:mm:ss'));
      // console.log("task.end_date = " +  this.datepipe.transform(taskObj.task.end_date, 'MM/dd/yyy hh:mm:ss'));
      var isPerson = false;
      if (taskObj.task.empl_key == this.scService.getPerson().key) {
        isPerson = true;
      }
      var validDates = false;
      if (taskObj.task.end_date >= this.startOfDay && taskObj.task.end_date <= this.endOfDay) {
        validDates = true;
      }
      if (taskObj.task.start_date >= this.startOfDay && taskObj.task.start_date <= this.endOfDay) {
        validDates = true;
      }
      if (taskObj.task.start_date < this.startOfDay && taskObj.task.end_date > this.endOfDay) {
        validDates = true;
      }
      if (isPerson) {
        // console.log("isPerson = " + taskObj.projname);
      }
      if (isPerson && validDates) {
        if (taskObj.task.priority === "High") {
          this.highTasks.push(taskObj);
        } else if (taskObj.task.priority === "Medium") {
          this.medTasks.push(taskObj);
        } else {
          this.lowTasks.push(taskObj);
        }
      } else {
      }
    }

    this.highTasks.sort((a, b) => a.task.end_date - b.task.end_date || Number(a.projname) - Number(b.projname));
    this.medTasks.sort((a, b) => a.task.end_date - b.task.end_date || Number(a.projname) - Number(b.projname));
    this.lowTasks.sort((a, b) => a.task.end_date - b.task.end_date || Number(a.projname) - Number(b.projname));

    // this.highTasks.sort((a, b) => (Number(a.task.end_date) > Number(b.task.end_date)) ? 1 : -1);
    // this.medTasks.sort((a, b) => (Number(a.task.end_date) > Number(b.task.end_date)) ? 1 : -1);
    // this.lowTasks.sort((a, b) => (Number(a.task.end_date) > Number(b.task.end_date)) ? 1 : -1);

    this.doHighTasks();
    this.doMediumTasks();
    this.doLowTasks();

    // console.log("hightTasks.length = " + highTasks.length)

    for (var i = 0; i < 14; i++) {
      var theDay = new Date().setHours(0, 0, 0, 0) + (i * (1000 * 60 * 60 * 24));
      var dayObj = this.taskMap.get(theDay)
      var theText = "";
      if (dayObj && dayObj.hrTasks.length > 0) {
        // console.log("i = " + i + ", " + dayObj.hrTasks.length);
        for (var j = 0; j < dayObj.hrTasks.length; j++) {
          // console.log("task.proj_key = " + dayObj.hrTasks[j].task.proj_key);
          theText = "<div style='height: 7.25px; background-color: " + this.colorMap.get(dayObj.hrTasks[j].task.proj_key) + "; font-size: 12px; border: 0px solid red';>" + "" + "</div>" + theText;
        }
        if (i == 0) {
          this.renderer.setProperty(this.cell1El.nativeElement, 'innerHTML', theText);
        } else if (i == 1) {
          this.renderer.setProperty(this.cell2El.nativeElement, 'innerHTML', theText);
        } else if (i == 2) {
          this.renderer.setProperty(this.cell3El.nativeElement, 'innerHTML', theText);
        } else if (i == 3) {
          this.renderer.setProperty(this.cell4El.nativeElement, 'innerHTML', theText);
        } else if (i == 4) {
          this.renderer.setProperty(this.cell5El.nativeElement, 'innerHTML', theText);
        } else if (i == 5) {
          this.renderer.setProperty(this.cell6El.nativeElement, 'innerHTML', theText);
        } else if (i == 6) {
          this.renderer.setProperty(this.cell7El.nativeElement, 'innerHTML', theText);
        } else if (i == 7) {
          this.renderer.setProperty(this.cell8El.nativeElement, 'innerHTML', theText);
        } else if (i == 8) {
          this.renderer.setProperty(this.cell9El.nativeElement, 'innerHTML', theText);
        } else if (i == 9) {
          this.renderer.setProperty(this.cell10El.nativeElement, 'innerHTML', theText);
        } else if (i == 10) {
          this.renderer.setProperty(this.cell11El.nativeElement, 'innerHTML', theText);
        } else if (i == 11) {
          this.renderer.setProperty(this.cell12El.nativeElement, 'innerHTML', theText);
        } else if (i == 12) {
          this.renderer.setProperty(this.cell13El.nativeElement, 'innerHTML', theText);
        } else if (i == 13) {
          this.renderer.setProperty(this.cell14El.nativeElement, 'innerHTML', theText);
        }
      }
    }
    this.perscalEl.nativeElement.style.display = 'block';
  }

  testIt() {
    window.alert("Clicked it!");
  }

  doHighTasks() {
    for (var taskObj of this.highTasks) {
      let startDayOfTask = new Date(taskObj.task.start_date).setHours(0, 0, 0, 0);
      let endDayOfTask = new Date(taskObj.task.end_date).setHours(23, 59, 59, 999);

      let noDaysTask = this.getNumberOfDaysInTask(startDayOfTask, endDayOfTask);

      // console.log("noDaysTask = " + noDaysTask);
      let hrsDay = Math.ceil((taskObj.task.est_hours / noDaysTask));
      let hoursLeft = taskObj.task.est_hours;

      // console.log("noDaysTask = " + noDaysTask);
      // console.log("Estimated Hours in Task = " + taskObj.task.est_hours);
      // console.log("No Days in Task = " + noDaysTask);
      //console.log("Hrs / day required = " + Math.ceil((taskObj.task.est_hours / noDaysTask)));
      var i = 0;
      this.offset = 0;
      var dayObj: DayObj;
      while (hoursLeft > 0) {
        // console.log("about to find dayObj for project = " + taskObj.projname);
        var dayHrs = 0;

        dayObj = this.getDayObjForDay(startDayOfTask + (i * this.interval24Hr), dayHrs);
        dayHrs = 8 - dayObj.hrTasks.length;

        if (dayHrs > hoursLeft) {
          dayHrs = hoursLeft;
        }
        // console.log("project = " + taskObj.projname + ", dayHrs = " + dayHrs);
        for (var j = 0; j < dayHrs; j++) {
          if (hoursLeft == 0) {
            break;
          }
          var tObj = new TaskObj();
          tObj.projname = taskObj.projname;
          tObj.projno = taskObj.projno;
          tObj.task = new Task();
          tObj.task.proj_key = taskObj.task.proj_key;
          tObj.task.key = taskObj.task.key;
          tObj.task.est_hours = taskObj.task.est_hours;
          dayObj.hrTasks.push(tObj);
          hoursLeft--;
        }

        // console.log("taskMap.size = " + taskMap.size);
        // console.log("dayObj = " + dayObj.hrTasks.length);
        i++;
        // console.log("dayObj now contains " + dayObj.hrTasks.length + " hour tasks!!!!");
      }
      var daysLate = (dayObj.date - endDayOfTask) / this.interval24Hr;
      for (var tObj of this.taskObjs) {
        if (tObj.task.key == taskObj.task.key) {
          if(!isNaN(daysLate))
            tObj.daysout = Math.ceil(daysLate).toString();
          if (!this.colorMap.get(tObj.task.proj_key)) {
            this.colorMap.set(tObj.task.proj_key, this.colors[this.colorCnt++]);
          }
          tObj.color = this.colorMap.get(tObj.task.proj_key);
          // console.log("High It's a match!!!!!!!!!!!!!!!!!!!!!!");
          break;
        }
      }
      console.log("taskObj.task.start_date = " + Number(Number(taskObj.task.start_date) + Number(daysLate * this.interval24Hr)));
      console.log("this.startOfDay = " + this.startOfDay);
      if(Number(Number(taskObj.task.end_date) + Number(daysLate * this.interval24Hr)) >= this.startOfDay) {
        this.taskObjs_.push(taskObj);
      }
      // console.log("Finish Date = " + this.datepipe.transform(dayObj.date, "MM/dd/yyyy"));
      // console.log("Project " + taskObj.projname + " is " + daysLate + " Days late.");
    }
  }

  doMediumTasks() {
    for (var taskObj of this.medTasks) {
      let startDayOfTask = new Date(taskObj.task.start_date).setHours(0, 0, 0, 0);
      let endDayOfTask = new Date(taskObj.task.end_date).setHours(23, 59, 59, 999);

      let hoursLeft = taskObj.task.est_hours;

      // console.log("noDaysTask = " + noDaysTask);
      // console.log("Estimated Hours in Task = " + taskObj.task.est_hours);
      // console.log("No Days in Task = " + noDaysTask);
      //console.log("Hrs / day required = " + Math.ceil((taskObj.task.est_hours / noDaysTask)));
      var i: number = 0;
      this.offset = 0;
      while (hoursLeft > 0) {
        var dayHrs = 0;

        // console.log("i count = " + i);
        var dayObj = this.getDayObjForDay(startDayOfTask + (i * this.interval24Hr), dayHrs);
        dayHrs = 8 - dayObj.hrTasks.length;

        var noDaysLeft = Math.floor((endDayOfTask - (startDayOfTask + ((i+1) * this.interval24Hr)))/this.interval24Hr);
       
        var hrsDay = Math.ceil((hoursLeft / noDaysLeft));
      
        var num1: number = startDayOfTask;
        var num2: number = (i+1) * this.interval24Hr;
        var num3: number = num1 + num2;
        
        if (dayHrs > hoursLeft) {
          dayHrs = hoursLeft;
        }

        // if (noDaysLeft>0 && hrsDay<dayHrs) {
        //   dayHrs = hrsDay;
        // }
        // console.log("dayHrs = " + dayHrs);
        if(taskObj.task.max_hour_day && taskObj.task.max_hour_day>=2 && taskObj.task.max_hour_day<=8) {
          if(dayHrs>taskObj.task.max_hour_day) {
            if(taskObj.task.max_hour_day<=hoursLeft) {
              dayHrs = taskObj.task.max_hour_day;
            }
          }
        }

        // console.log("project = " + taskObj.projname + ", dayHrs = " + dayHrs);
        for (var j = 0; j < dayHrs; j++) {
          if (hoursLeft == 0) {
            break;
          }
          var tObj = new TaskObj();
          tObj.projname = taskObj.projname;
          tObj.projno = taskObj.projno;
          tObj.task = new Task();
          tObj.task.key = taskObj.task.key;
          tObj.task.est_hours = taskObj.task.est_hours;
          tObj.task.proj_key = taskObj.task.proj_key;
          dayObj.hrTasks.push(tObj);
          hoursLeft--;
        }

        // console.log("taskMap.size = " + taskMap.size);
        // console.log("dayObj = " + dayObj.hrTasks.length);
        i++;
        // console.log("dayObj now contains " + dayObj.hrTasks.length + " hour tasks!!!!");
      }
      var daysLate = (dayObj.date - endDayOfTask) / this.interval24Hr;
      // console.log("Finish Date = " + this.datepipe.transform(dayObj.date, "MM/dd/yyyy"));
      for (var tObj of this.taskObjs) {
        if (tObj.task.key == taskObj.task.key) {
          if(!isNaN(daysLate))
          tObj.daysout = Math.ceil(daysLate).toString();
          if (!this.colorMap.get(tObj.task.proj_key)) {
            this.colorMap.set(tObj.task.proj_key, this.colors[this.colorCnt++]);
          }
          tObj.color = this.colorMap.get(tObj.task.proj_key);
          break;
        }
      }
      // console.log("taskObj.task.start_date = " + Number(Number(taskObj.task.start_date) + Number(daysLate * this.interval24Hr)));
      // console.log("this.startOfDay = " + this.startOfDay);
      if(Number(Number(taskObj.task.end_date) + Number(daysLate * this.interval24Hr)) >= this.startOfDay) {
        this.taskObjs_.push(taskObj);
      }
    }
  }

  doLowTasks() {
    for (var taskObj of this.lowTasks) {
      let startDayOfTask = new Date(taskObj.task.start_date).setHours(0, 0, 0, 0);
      let endDayOfTask = new Date(taskObj.task.end_date).setHours(23, 59, 59, 999);

      let noDaysTask = this.getNumberOfDaysInTask(startDayOfTask, endDayOfTask);

      // console.log("noDaysTask = " + noDaysTask);
      let hrsDay = Math.ceil((taskObj.task.est_hours / noDaysTask));
      let hoursLeft = taskObj.task.est_hours;

      // console.log("noDaysTask = " + noDaysTask);
      // console.log("Estimated Hours in Task = " + taskObj.task.est_hours);
      // console.log("No Days in Task = " + noDaysTask);
      //console.log("Hrs / day required = " + Math.ceil((taskObj.task.est_hours / noDaysTask)));
      var i = 0;
      this.offset = 0;
      while (hoursLeft > 0) {
        // console.log("about to find dayObj for project = " + taskObj.projname);

        var dayHrs = 0;

        var dayObj = this.getDayObjForDay(startDayOfTask + (i * this.interval24Hr), dayHrs);
        dayHrs = 8 - dayObj.hrTasks.length;

        if (dayHrs > hoursLeft) {
          dayHrs = hoursLeft;
        }

        // console.log("project = " + taskObj.projname + ", dayHrs = " + dayHrs);
        for (var j = 0; j < dayHrs; j++) {
          if (hoursLeft == 0) {
            break;
          }
          var tObj = new TaskObj();
          tObj.projname = taskObj.projname;
          tObj.projno = taskObj.projno;
          tObj.task = new Task();
          tObj.task.key = taskObj.task.key;
          tObj.task.est_hours = taskObj.task.est_hours;
          tObj.task.proj_key = taskObj.task.proj_key;
          dayObj.hrTasks.push(tObj);
          hoursLeft--;
        }

        // console.log("taskMap.size = " + taskMap.size);
        // console.log("dayObj = " + dayObj.hrTasks.length);
        i++;
        // console.log("dayObj now contains " + dayObj.hrTasks.length + " hour tasks!!!!");
      }
      var daysLate = (dayObj.date - endDayOfTask) / this.interval24Hr;
      // console.log("Finish Date = " + this.datepipe.transform(dayObj.date, "MM/dd/yyyy"));
      for (var tObj of this.taskObjs) {
        if (tObj.task.key == taskObj.task.key) {
          if(!isNaN(daysLate))
            tObj.daysout = Math.ceil(daysLate).toString();
          if (!this.colorMap.get(tObj.task.proj_key)) {
            this.colorMap.set(tObj.task.proj_key, this.colors[this.colorCnt++]);
          }
          tObj.color = this.colorMap.get(tObj.task.proj_key);
          break;
        }
      }
      // console.log("taskObj.task.start_date = " + Number(Number(taskObj.task.start_date) + Number(daysLate * this.interval24Hr)));
      // console.log("this.startOfDay = " + this.startOfDay);
      if(Number(Number(taskObj.task.end_date) + Number(daysLate * this.interval24Hr)) >= this.startOfDay) {
        this.taskObjs_.push(taskObj);
      }
    }
  }

  offset: number;
  getDayObjForDay(preferredDate: number, dayHrs: number): DayObj {
    // console.log("getDayObjForDay preferredDate = " + preferredDate);
    // console.log("preferredDate = " + this.datepipe.transform(preferredDate, "MM/dd/yyyy"));
    var dayObj: DayObj;
    while (!dayObj) {
      var dayOfTask = new Date(preferredDate + (this.offset * this.interval24Hr));
      if (dayOfTask.getDay() == 0) {
        this.offset = this.offset + 1;
      }
      if (dayOfTask.getDay() == 6) {
        this.offset = this.offset + 2;
      }
      // Christmas Eve
      if (dayOfTask.getMonth() == 11 && dayOfTask.getDate() == 24) {
        this.offset = this.offset + 2;
        var dayOfTask = new Date(preferredDate + (this.offset * this.interval24Hr));
        if (dayOfTask.getDay() == 0) {
          this.offset = this.offset + 1;
        }
        if (dayOfTask.getDay() == 6) {
          this.offset = this.offset + 2;
        }
      }
      // Christmas
      if (dayOfTask.getMonth() == 11 && dayOfTask.getDate() == 25) {
        this.offset++;
        var dayOfTask = new Date(preferredDate + (this.offset * this.interval24Hr));
        if (dayOfTask.getDay() == 0) {
          this.offset = this.offset + 1;
        }
        if (dayOfTask.getDay() == 6) {
          this.offset = this.offset + 2;
        }
      }
      // New Years Day
      if (dayOfTask.getMonth() == 0 && dayOfTask.getDate() == 1) {
        this.offset++;
        var dayOfTask = new Date(preferredDate + (this.offset * this.interval24Hr));
        if (dayOfTask.getDay() == 0) {
          this.offset = this.offset + 1;
        }
        if (dayOfTask.getDay() == 6) {
          this.offset = this.offset + 2;
        }
      }
      var dObj = this.taskMap.get(preferredDate + (this.offset * this.interval24Hr));
      if (!dObj) {
        // console.log("not found, creating new dayObj!")
        dObj = new DayObj();
        dObj.date = (preferredDate + (this.offset * this.interval24Hr));
        this.taskMap.set(preferredDate + (this.offset * this.interval24Hr), dObj);
        dayObj = dObj;
      } else {
        // console.log("found, dayObj contains " + dObj.hrTasks.length + " hour tasks, so far.");
        if (8 - dObj.hrTasks.length >= dayHrs) {
          dayObj = dObj;
        } else {
          this.offset++;
        }
      }
      // console.log("dObj.hrTasks.length = " + dObj.hrTasks.length);
    }
    // console.log("returning " + this.datepipe.transform(dayObj.date, "MM/dd/yyyy"));
    return dayObj;
  }

  getNumberOfDaysInTask(startDayOfTask: number, endDayOfTask: number): number {
    let noDaysTask = 0;
    for (var startDate = startDayOfTask; startDate <= endDayOfTask; startDate = startDate + this.interval24Hr) {
      var dayOfTask = new Date(startDate);
      if (dayOfTask.getDay() == 0) {
        continue;
      } else if (dayOfTask.getDay() == 6) {
        continue;
      }
      noDaysTask++;
    }
    return noDaysTask;
  }

  pdfIt() {
    console.log("pc() value");
    this.pdfService.pdfIt_Cal();
  }

  // getRandomColor(): string {
  //   return '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
  // }

  ngAfterViewInit(): void {
    
  }

  ngOnInit(): void {
  }

}

class DayObj {
  hrTasks: TaskObj[] = [];
  date: number;
}

class TaskObj {
  task: Task;
  name: string;
  projno: string;
  projname: string;
  startdate: string;
  enddate: string;
  daysout: string;
  color: string;

  constructor() {
  }
}

class AssignObj {
  proj: string;
  pm: boolean = false;
  pc: boolean = false;
  hvac: boolean = false;
  elec: boolean = false;
  plmb: boolean = false;
  fire: boolean = false;
  
  constructor() {
  }
}