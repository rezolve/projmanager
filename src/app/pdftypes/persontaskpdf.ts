import { DatePipe } from '@angular/common';
import { fn } from '@angular/compiler/src/output/output_ast';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Deliverable } from 'src/data/deliverable.model';
import { Person } from 'src/data/person.model';
import { Project } from 'src/data/project.model';
import { Task } from 'src/data/task.model';
import { ScService } from '../sc.service';

declare var PDFDocument: any;
declare var blobStream: any;

@Injectable({
    providedIn: 'root'
})
export class PersonTaskPDF {
    projects: Project[] = [];
    deliverables: Deliverable[] = [];
    persons: Person[] = [];
    tasks: Task[] = [];
    repObjs: RepObj1[] = [];
    twoweeks: number = 1209600000;
    pageHt: number = 800;
    pageWh: number = 600;
    start: string;
    end: string;

    constructor(
        private datepipe: DatePipe,
        private afs: AngularFirestore,
        private scs: ScService,
    ) { }

    public async pdfIt() {

        const doc = new PDFDocument({
            margin: 0,
            autoFirstPage: false,
        });

        this.start = this.datepipe.transform(new Date().getTime(), 'MM/dd/yyyy');
        this.end = this.datepipe.transform(new Date().getTime() + this.twoweeks, 'MM/dd/yyyy');

        this.persons = [];
        this.projects = [];
        this.deliverables = [];
        this.tasks = [];
        this.repObjs = [];

        this.getTheData(doc);

    }

    private doIt(doc: any) {
        if (this.projects.length == 0) {
            this.pdfIt();
            return;
        }

        doc.addPage({ layout: "landscape", margin: 0 });
        this.doHeader1(doc);

        var y = doc.y + 7;
        for (var repObj of this.repObjs) {
            var x = 50;
           
            var empRowHeight = this.getEmployeeRowHeight(doc, repObj);
            if (y + empRowHeight > 540) {
                doc.addPage({ layout: "landscape", margin: 0 });
                this.doHeader1(doc);
                y = 100;
            }

            doc.fontSize(10).text(this.getPersonByKey(repObj.empl_key).first_name, 55, y + 2, {width: 180 });
            doc.fontSize(10).text(this.getPersonByKey(repObj.empl_key).last_name, 110, y + 2, { width: 180 });
            doc.rect(x, y, 690, empRowHeight).lineWidth(.5).stroke();
            y = y + empRowHeight + 2;

            // repObj.tasks.sort((a, b) => (String(a.priority) > String(b.priority)) ? 1 : -1);
            repObj.tasks.sort((a, b) => (Number(b.end_date) > Number(a.end_date)) ? -1 : 1);

            for (var task of repObj.tasks) {
                if(task.end_date<new Date().getTime() || !task.end_date) {
                    continue;
                } 
                var taskRowHeight = this.getTaskRowHeight(doc, task);

                if (y + taskRowHeight > 540) {
                    doc.addPage({ layout: "landscape", margin: 0 });
                    this.doHeader1(doc);
                    y = 100;
                    doc.fontSize(10).text(this.getPersonByKey(repObj.empl_key).first_name, 55, y + 2, {width: 180 });
                    doc.fontSize(10).text(this.getPersonByKey(repObj.empl_key).last_name, 110, y + 2, { width: 180 });
                    doc.rect(x, y, 690, empRowHeight).lineWidth(.5).stroke();
                    y = y + empRowHeight + 2;
                }

                if(task.proj_key) {
                    doc.fontSize(10).text(this.getProjectByKey(task.proj_key).project_no, x + 7, y + 2, { width: 80 }).stroke();
                    doc.fontSize(10).text(this.getProjectByKey(task.proj_key).project_name, x + 67, y + 2, { width: 125 }).stroke();
                }

                doc.fontSize(10).text(task.description, x + 225, y + 2, { width: 240 }).stroke();
                doc.fontSize(10).text(task.est_hours, x + 490, y + 2).stroke();
                doc.fontSize(10).text(this.datepipe.transform(task.start_date, 'MM/dd/yyyy'), x + 515, y + 2).stroke();
                doc.fontSize(10).text(this.datepipe.transform(task.end_date, 'MM/dd/yyyy'), x + 575, y + 2).stroke();
                doc.fontSize(10).text(task.priority, x + 640, y + 2).stroke();
                y = y + taskRowHeight;
            }

            y = y + 2;
        }

        // doc.fontSize(10)
        //     .text('Page 1 of 2', 675, 575, { underline: false });

        var stream = doc.pipe(blobStream())
        doc.end();
        stream.on("finish", () => {
            var url = stream.toBlobURL('application/pdf');
            var blob = stream.toBlob('application/pdf');

            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                console.log("here");
                window.navigator.msSaveOrOpenBlob(blob, "test.pdf");
            } else {
                window.open(url, "test.pdf");
            }
        });
    }

    doHeader1(doc: any) {
        doc.fontSize(24)
            .fillColor('red')
            .text('Project Manager App', 45, 35, { underline: false });

        doc.fontSize(10)
            .fillColor('black')
            .text('PRINTED: ' + this.datepipe.transform(new Date().getTime(), 'MM/dd/yyyy h:mm:ss a'), 45, 582, { underline: false });
        doc.fontSize(22)
            .text('Personnel Task Report', 490, 40, { underline: true });

        // doc.fontSize(18)
        //     .text(this.start + " - " + this.end, 508, 72, { underline: false });

        doc.fontSize(22)
            .text('', 50, 71);
    }

    filterPerson(person: Person): boolean {
        if(!this.scs.getCurrUser().personFilter) {
            return true;
        } else {
            for(var person_ of this.scs.getCurrUser().personFilter) {
                if(person_==person.key) {
                    return true;
                }
            }
            return false;
        }
    }

    getTheData(doc: any) {
        var personsCollection = this.afs.collection<Person>('persons2', ref => {
            return ref;
        });
        personsCollection.ref.get().then(querySnapshot => {
            querySnapshot.forEach(doc => {
                var person = doc.data() as Person;
                person.key = doc.id;
                if (this.filterPerson(person)) {
                    this.persons.push(person);
                }
            });
            this.persons.sort((a, b) => (a.last_name > b.last_name) ? 1 : -1);
            var projectsCollection = this.afs.collection<Project>('projects', ref => {
                return ref;
            });
            projectsCollection.ref.get().then(querySnapshot => {
                querySnapshot.forEach(doc => {
                    var project = doc.data() as Project;
                    this.projects.push(project);
                });
                this.projects.sort((a, b) => (Number(a.duedate) > Number(b.duedate)) ? 1 : -1);

                var deliverablesCollection = this.afs.collection<Deliverable>('deliverables', ref => {
                    return ref;
                });
                deliverablesCollection.ref.get().then(querySnapshot => {
                    querySnapshot.forEach(doc => {
                        var deliverable = doc.data() as Deliverable;
                        this.deliverables.push(deliverable);
                    });
                    this.deliverables.sort((a, b) => (Number(a.due_date) > Number(b.due_date)) ? 1 : -1);

                    var tasksCollection = this.afs.collection<Task>('tasks', ref => {
                        return ref;
                    });
                    tasksCollection.ref.get().then(querySnapshot => {
                        querySnapshot.forEach(doc => {
                            var task = doc.data() as Task;
                            this.tasks.push(task);
                        });
                        this.processPersons(doc);
                    });
                });
            });
        });
    }

    processPersons(doc: any) {
        for (var person of this.persons) {
            var repObj = new RepObj1();
            repObj.empl_key = person.key;

            for (var task of this.tasks) {
                if (task.empl_key == repObj.empl_key) {
                    repObj.tasks.push(task);
                }
            }
            this.repObjs.push(repObj);
        }
        this.doIt(doc);
    }
    getPersonByKey(key: string) {
        for (var pers of this.persons) {
            if (pers.key == key) {
                return pers;
            }
        }
    }
    getProjectByKey(key: string) {
        for (var proj of this.projects) {
            if (proj.key == key) {
                return proj;
            }
        }
    }
    getEmployeeRowHeight(doc: any, repObj: RepObj1) {
        // doc.fontSize(10).text(this.getPersonByKey(repObj.empl_key).first_name, 55, y + 2, {width: 180 });
        // doc.fontSize(10).text(this.getPersonByKey(repObj.empl_key).last_name, 110, y + 2, { width: 180 });
        
        var fnameHeight = doc.fontSize(10).heightOfString(this.getPersonByKey(repObj.empl_key).first_name, { width: 180 });
        var lnameHeight = doc.fontSize(10).heightOfString(this.getPersonByKey(repObj.empl_key).last_name, { width: 180 });

        if(fnameHeight>lnameHeight) {
            return fnameHeight;
        } else {
            return lnameHeight;
        }
    }
    getTaskRowHeight(doc: any, task: Task) {
        var r = 0;
        var projno = 0;
        var projname = 0;

        if (task.proj_key) {
            projno = doc.fontSize(10).heightOfString(this.getProjectByKey(task.proj_key).project_no, { width: 80 });
            projname = doc.fontSize(10).heightOfString(this.getProjectByKey(task.proj_key).project_name, { width: 125 });
        }
        var taskdescript = doc.fontSize(10).heightOfString(task.description, { width: 240 });
        var taskhours = doc.fontSize(10).heightOfString(task.est_hours, { width: 25 });
        var startdate = doc.fontSize(10).heightOfString(this.datepipe.transform(task.start_date, 'MM/dd/yyyy'), { width: 60 });
        var enddate = doc.fontSize(10).heightOfString(this.datepipe.transform(task.end_date, 'MM/dd/yyyy'), { width: 60 });
        var priority = doc.fontSize(10).heightOfString(task.priority, { width: 100 });

        if (projno > r) {
            r = projno;
        }
        if (projname > r) {
            r = projname;
        }
        if (taskdescript > r) {
            r = taskdescript;
        }
        if (taskhours > r) {
            r = taskhours;
        }
        if (startdate > r) {
            r = startdate;
        }
        if (enddate > r) {
            r = enddate;
        }
        if (priority > r) {
            r = priority;
        }
        return r;
    }
}


class RepObj1 {
    empl_key: string;
    deliverables: Deliverable[] = [];
    tasks: Task[] = [];
    height: number;
}
