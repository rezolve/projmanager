import { DatePipe } from '@angular/common';
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

export class PersonCalAllPDF {
    projects: Project[] = [];
    deliverables: Deliverable[] = [];
    persons: Person[] = [];
    tasks: Task[] = [];
    taskObjs: TaskObj[] = [];
    twoweeks: number = 1209600000;
    pageHt: number = 800;
    pageWh: number = 600;
    startdate: number;
    enddate: number;
    start: string;
    end: string;

    highTasks: TaskObj[] = [];
    medTasks: TaskObj[] = [];
    lowTasks: TaskObj[] = [];

    offset: number;
    interval24Hr = 1000 * 60 * 60 * 24;

    todayDate = new Date();
    startOfDay = this.todayDate.setHours(0, 0, 0, 0);
    endOfDay = this.todayDate.setHours(23, 59, 59, 999) + (1000 * 60 * 60 * 24 * 14);

    taskMap: Map<number, DayObj> = new Map();
    colorMap: Map<string, string> = new Map();
    colorCnt: number = 0;
    colors: string[] = [
        "#A9A9A9",
        "#ADFF2F",
        "#F4A460",
        "#B22222",
        "#BDB76B",
        "#8FBC8F",
        "#9400D3",
        "#FFD700",
        "#FFFACD",
        "#20B2AA",
        "#FF00FF",
        "#ADF0CE",
        "#FDF5E6",
        "#98FB98",
        "#D8BFD8",
        "#7FFF00",
    ];


    constructor(
        private datepipe: DatePipe,
        private afs: AngularFirestore,
        private scs: ScService,
    ) { }

    public async pdfIt() {

        const doc = new PDFDocument({
            layout: "portrait",
            margin: 0,
            autoFirstPage: false,
        });

        this.startdate = new Date().setHours(0, 0, 0, 0);
        this.enddate = new Date().setHours(23, 59, 59, 999) + this.twoweeks;
        this.start = this.datepipe.transform(this.startdate, 'MM/dd/yyyy');
        this.end = this.datepipe.transform(this.enddate, 'MM/dd/yyyy');

        this.persons = [];
        this.projects = [];
        this.deliverables = [];
        this.tasks = [];
        this.taskObjs = [];

        if (this.scs.getCurrUser() && this.scs.getCurrUser().personFilter) {
            for (var key of this.scs.getCurrUser().personFilter) {
                this.persons.push(this.scs.getPersonByKey(key));
            }
            this.persons.sort((a, b) => (a.last_name > b.last_name) ? 1 : -1);
            for (var person of this.persons) {
                await this.getTheData(person, doc);
            }
        } else {
            return;
        }

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

    private async doIt(key: string, doc: any) {
        doc.addPage({ layout: "portrait", margin: 0 });
        this.doHeader1(key, doc);
        this.doCalOutline(doc);

        var y = 25;
        var x = 50;

        this.taskMap.clear();
        this.highTasks.length = 0;
        this.medTasks.length = 0;
        this.lowTasks.length = 0;

        for (var taskObj of this.taskObjs) {
            // console.log("taskObj.task.est_hours = " + taskObj.task.est_hours);
            taskObj.task.start_date = new Date(taskObj.task.start_date).setHours(0, 0, 0, 0);
            taskObj.task.end_date = new Date(taskObj.task.end_date).setHours(23, 59, 59, 999);
            // console.log("task.start_date = " +  this.datepipe.transform(taskObj.task.start_date, 'MM/dd/yyy hh:mm:ss'));
            // console.log("task.end_date = " +  this.datepipe.transform(taskObj.task.end_date, 'MM/dd/yyy hh:mm:ss'));
            var isPerson = false;
            if (taskObj.task.empl_key == key) {
                isPerson = true;
            }
            var validDates = false;
            if (taskObj.task.end_date >= this.startdate && taskObj.task.end_date <= this.enddate) {
                validDates = true;
            }
            if (taskObj.task.start_date >= this.startdate && taskObj.task.start_date <= this.enddate) {
                validDates = true;
            }
            if (taskObj.task.start_date < this.startdate && taskObj.task.end_date > this.enddate) {
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

        for (var i = 0; i < 14; i++) {
            var theDay = new Date().setHours(0, 0, 0, 0) + (i * (1000 * 60 * 60 * 24));
            var dayObj = this.taskMap.get(theDay)
            // console.log("Here! 1");
            if (dayObj && dayObj.hrTasks.length > 0) {
                for (var j = 0; j < dayObj.hrTasks.length; j++) {
                    var color = this.colorMap.get(dayObj.hrTasks[j].task.proj_key);
                    var offset = j * 10;
                    if (i == 0) {
                        // console.log("Here! 2");
                        var y_ = 166 - offset;
                        doc.rect(36, y_, 75, 13).strokeOpacity(0).fillAndStroke(color, "red");
                    } else if (i == 1) {
                        var y_ = 166 - offset;
                        doc.rect(113, y_, 75, 13).strokeOpacity(0).fillAndStroke(color, "red");
                        // doc.fontSize(8).fillColor('black').text(color, 113, y_);
                    } else if (i == 2) {
                        // console.log("Here! 2");
                        var y_ = 166 - offset;
                        doc.rect(190, y_, 75, 13).strokeOpacity(0).fillAndStroke(color, "red");
                        // doc.fontSize(8).fillColor('black').text(color, 190, y_);
                    } else if (i == 3) {
                        // console.log("Here! 2");
                        var y_ = 166 - offset;
                        doc.rect(267, y_, 75, 13).strokeOpacity(0).fillAndStroke(color, "red");
                    } else if (i == 4) {
                        // console.log("Here! 2");
                        var y_ = 166 - offset;
                        doc.rect(344, y_, 75, 13).strokeOpacity(0).fillAndStroke(color, "red");
                    } else if (i == 5) {
                        // console.log("Here! 2");
                        var y_ = 166 - offset;
                        doc.rect(421, y_, 75, 13).strokeOpacity(0).fillAndStroke(color, "red");
                    } else if (i == 6) {
                        // console.log("Here! 2");
                        var y_ = 166 - offset;
                        doc.rect(498, y_, 75, 13).strokeOpacity(0).fillAndStroke(color, "red");
                    } else if (i == 7) {
                        // console.log("Here! 2");
                        var y_ = 286 - offset;
                        doc.rect(36, y_, 75, 13).strokeOpacity(0).fillAndStroke(color, "red");
                    } else if (i == 8) {
                        // console.log("Here! 2");
                        var y_ = 286 - offset;
                        doc.rect(113, y_, 75, 13).strokeOpacity(0).fillAndStroke(color, "red");
                    } else if (i == 9) {
                        // console.log("Here! 2");
                        var y_ = 286 - offset;
                        doc.rect(190, y_, 75, 13).strokeOpacity(0).fillAndStroke(color, "red");
                    } else if (i == 10) {
                        // console.log("Here! 2");
                        var y_ = 286 - offset;
                        doc.rect(267, y_, 75, 13).strokeOpacity(0).fillAndStroke(color, "red");
                    } else if (i == 11) {
                        // console.log("Here! 2");
                        var y_ = 286 - offset;
                        doc.rect(344, y_, 75, 13).strokeOpacity(0).fillAndStroke(color, "red");
                    } else if (i == 12) {
                        // console.log("Here! 2");
                        var y_ = 286 - offset;
                        doc.rect(421, y_, 75, 13).strokeOpacity(0).fillAndStroke(color, "red");
                    } else if (i == 13) {
                        // console.log("Here! 2");
                        var y_ = 286 - offset;
                        doc.rect(498, y_, 75, 13).strokeOpacity(0).fillAndStroke(color, "red");
                    }
                }
            }
        }

        doc.fontSize(14).fillColor("black").text('Tasks', 35, 320).stroke();

        doc.fontSize(10).fillColor("black").text('Key', 40, 345).stroke();
        doc.fontSize(10).fillColor("black").text('Project', 90, 345).stroke();
        doc.fontSize(10).fillColor("black").text('Description', 180, 345).stroke();
        doc.fontSize(10).fillColor("black").text('Est Hrs', 385, 340, { width: 30, align: 'center' }).stroke();
        doc.fontSize(10).fillColor("black").text('Days Out', 413, 340, { width: 40, align: 'center' }).stroke();
        doc.fontSize(10).fillColor("black").text('Start Date', 450, 340, { width: 40, align: 'center' }).stroke();
        doc.fontSize(10).fillColor("black").text('End Date', 497, 340, { width: 40, align: 'center' }).stroke();
        doc.fontSize(10).fillColor("black").text('Priority', 540, 345).stroke();

        doc.strokeOpacity(.8).lineWidth(1).moveTo(35, 365).lineTo(577, 365).stroke("black");
        doc.strokeOpacity(.8).lineWidth(1).moveTo(35, 367).lineTo(577, 367).stroke("black");

        var tcnt = 0;
        var off_ = 35;
        for (var tObj of this.highTasks) {
            var y_ = 370 + (tcnt++ * off_);
            doc.rect(38, y_, 20, 20).strokeOpacity(0).fillAndStroke(tObj.color, "red");
            doc.fontSize(10).fillColor("black").text(tObj.projno + "-" + tObj.projname, 70, y_, { width: 100 }).stroke();
            doc.fontSize(10).fillColor("black").text(tObj.task.description, 160, y_, { width: 240 }).stroke();
            doc.fontSize(10).fillColor("black").text(tObj.task.est_hours, 375, y_, { width: 50, align: 'center' }).stroke();
            doc.fontSize(10).fillColor("black").text(tObj.daysout, 411, y_, { width: 40, align: 'center' }).stroke();
            doc.fontSize(8).fillColor("black").text(tObj.startdate, 442, y_, { width: 50, align: 'center' }).stroke();
            doc.fontSize(8).fillColor("black").text(tObj.enddate, 490, y_, { width: 50, align: 'center' }).stroke();
            doc.fontSize(10).fillColor("black").text(tObj.task.priority, 545, y_).stroke();
        }
        for (var tObj of this.medTasks) {
            var y_ = 370 + (tcnt++ * off_);
            doc.rect(38, y_, 20, 20).strokeOpacity(0).fillAndStroke(tObj.color, "red");
            doc.fontSize(10).fillColor("black").text(tObj.projno + "-" + tObj.projname, 70, y_, { width: 100 }).stroke();
            doc.fontSize(10).fillColor("black").text(tObj.task.description, 160, y_, { width: 240 }).stroke();
            doc.fontSize(10).fillColor("black").text(tObj.task.est_hours, 375, y_, { width: 50, align: 'center' }).stroke();
            doc.fontSize(10).fillColor("black").text(tObj.daysout, 411, y_, { width: 40, align: 'center' }).stroke();
            doc.fontSize(8).fillColor("black").text(tObj.startdate, 442, y_, { width: 50, align: 'center' }).stroke();
            doc.fontSize(8).fillColor("black").text(tObj.enddate, 490, y_, { width: 50, align: 'center' }).stroke();
            doc.fontSize(10).fillColor("black").text(tObj.task.priority, 545, y_).stroke();
        }
        for (var tObj of this.lowTasks) {
            var y_ = 370 + (tcnt++ * off_);
            doc.rect(38, y_, 20, 20).strokeOpacity(0).fillAndStroke(tObj.color, "red");
            doc.fontSize(10).fillColor("black").text(tObj.projno + "-" + tObj.projname, 70, y_, { width: 100 }).stroke();
            doc.fontSize(10).fillColor("black").text(tObj.task.description, 160, y_, { width: 240 }).stroke();
            doc.fontSize(10).fillColor("black").text(tObj.task.est_hours, 375, y_, { width: 50, align: 'center' }).stroke();
            doc.fontSize(10).fillColor("black").text(tObj.daysout, 411, y_, { width: 40, align: 'center' }).stroke();
            doc.fontSize(8).fillColor("black").text(tObj.startdate, 442, y_, { width: 50, align: 'center' }).stroke();
            doc.fontSize(8).fillColor("black").text(tObj.enddate, 490, y_, { width: 50, align: 'center' }).stroke();
            doc.fontSize(10).fillColor("black").text(tObj.task.priority, 545, y_).stroke();
        }

    }

    doCalOutline(doc: any) {
        doc.rect(35, 80, 77, 100).stroke();
        doc.rect(112, 80, 77, 100).stroke();
        doc.rect(189, 80, 77, 100).stroke();
        doc.rect(266, 80, 77, 100).stroke();
        doc.rect(343, 80, 77, 100).stroke();
        doc.rect(420, 80, 77, 100).stroke();
        doc.rect(497, 80, 77, 100).stroke();

        doc.rect(35, 200, 77, 100).stroke();
        doc.rect(112, 200, 77, 100).stroke();
        doc.rect(189, 200, 77, 100).stroke();
        doc.rect(266, 200, 77, 100).stroke();
        doc.rect(343, 200, 77, 100).stroke();
        doc.rect(420, 200, 77, 100).stroke();
        doc.rect(497, 200, 77, 100).stroke();

        var date1 = this.datepipe.transform(new Date().getTime() + (0 * 1000 * 60 * 60 * 24), 'EEE MM/dd/yyy');
        var date2 = this.datepipe.transform(new Date().getTime() + (1 * 1000 * 60 * 60 * 24), 'EEE MM/dd/yyy');
        var date3 = this.datepipe.transform(new Date().getTime() + (2 * 1000 * 60 * 60 * 24), 'EEE MM/dd/yyy');
        var date4 = this.datepipe.transform(new Date().getTime() + (3 * 1000 * 60 * 60 * 24), 'EEE MM/dd/yyy');
        var date5 = this.datepipe.transform(new Date().getTime() + (4 * 1000 * 60 * 60 * 24), 'EEE MM/dd/yyy');
        var date6 = this.datepipe.transform(new Date().getTime() + (5 * 1000 * 60 * 60 * 24), 'EEE MM/dd/yyy');
        var date7 = this.datepipe.transform(new Date().getTime() + (6 * 1000 * 60 * 60 * 24), 'EEE MM/dd/yyy');
        var date8 = this.datepipe.transform(new Date().getTime() + (7 * 1000 * 60 * 60 * 24), 'EEE MM/dd/yyy');
        var date9 = this.datepipe.transform(new Date().getTime() + (8 * 1000 * 60 * 60 * 24), 'EEE MM/dd/yyy');
        var date10 = this.datepipe.transform(new Date().getTime() + (9 * 1000 * 60 * 60 * 24), 'EEE MM/dd/yyy');
        var date11 = this.datepipe.transform(new Date().getTime() + (10 * 1000 * 60 * 60 * 24), 'EEE MM/dd/yyy');
        var date12 = this.datepipe.transform(new Date().getTime() + (11 * 1000 * 60 * 60 * 24), 'EEE MM/dd/yyy');
        var date13 = this.datepipe.transform(new Date().getTime() + (12 * 1000 * 60 * 60 * 24), 'EEE MM/dd/yyy');
        var date14 = this.datepipe.transform(new Date().getTime() + (13 * 1000 * 60 * 60 * 24), 'EEE MM/dd/yyy');

        doc.fontSize(8).fillColor('black').text(date1, 37, 82);
        doc.fontSize(8).fillColor('black').text(date2, 114, 82);
        doc.fontSize(8).fillColor('black').text(date3, 191, 82);
        doc.fontSize(8).fillColor('black').text(date4, 268, 82);
        doc.fontSize(8).fillColor('black').text(date5, 345, 82);
        doc.fontSize(8).fillColor('black').text(date6, 422, 82);
        doc.fontSize(8).fillColor('black').text(date7, 499, 82);

        doc.fontSize(8).fillColor('black').text(date8, 37, 202);
        doc.fontSize(8).fillColor('black').text(date9, 114, 202);
        doc.fontSize(8).fillColor('black').text(date10, 191, 202);
        doc.fontSize(8).fillColor('black').text(date11, 268, 202);
        doc.fontSize(8).fillColor('black').text(date12, 345, 202);
        doc.fontSize(8).fillColor('black').text(date13, 422, 202);
        doc.fontSize(8).fillColor('black').text(date14, 499, 202);

    }

    doHeader1(key: string, doc: any) {
        doc.fontSize(14)
            .fillColor('red')
            .text('Smith Miller Associates', 35, 35, { underline: false });

        doc.fontSize(10)
            .fillColor('black')
            .text('PRINTED: ' + this.datepipe.transform(new Date().getTime(), 'MM/dd/yyyy h:mm:ss a'), 45, 755, { underline: false });
        doc.fontSize(14)
            .text('2-Week Calendar', 460, 35, { underline: false });

        var personName: string = this.scs.getPersonName(key);
        var nameWidth = doc.fontSize(18).widthOfString(personName);
        doc.fontSize(18).text(personName, (306 - (nameWidth / 2)), 35, { underline: false });

        // doc.fontSize(18)
        //     .text(this.start + " - " + this.end, 508, 72, { underline: false });

        doc.fontSize(22)
            .text('', 50, 71);
    }

    doHighTasks() {
        var taskObjs_: TaskObj[] = [];
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
            if (validDates) {
                taskObjs_.push(taskObj);
            }
        }
        this.highTasks = taskObjs_;
    }

    doMediumTasks() {
        var taskObjs_: TaskObj[] = [];
        for (var taskObj of this.medTasks) {
            let startDayOfTask = new Date(taskObj.task.start_date).setHours(0, 0, 0, 0);
            let endDayOfTask = new Date(taskObj.task.end_date).setHours(23, 59, 59, 999);

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

                var noDaysLeft = Math.floor((endDayOfTask - (startDayOfTask + ((i + 1) * this.interval24Hr))) / this.interval24Hr);
                // console.log("hrsLeft = " + hoursLeft);
                // console.log("noDaysLeft = " + noDaysLeft);

                var hrsDay = Math.ceil((hoursLeft / noDaysLeft));
                // console.log("hrsDay = " + hrsDay);

                if (dayHrs > hoursLeft) {
                    dayHrs = hoursLeft;
                }

                // if (noDaysLeft > 0 && hrsDay < dayHrs) {
                //     dayHrs = hrsDay;
                // }
                // console.log("project = " + taskObj.projname + ", dayHrs = " + dayHrs);

                if (taskObj.task.max_hour_day && taskObj.task.max_hour_day >= 2 && taskObj.task.max_hour_day <= 8) {
                    if (dayHrs > taskObj.task.max_hour_day) {
                        if (taskObj.task.max_hour_day <= hoursLeft) {
                            dayHrs = taskObj.task.max_hour_day;
                        }
                    }
                }

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
            if (validDates) {
                taskObjs_.push(taskObj);
            }
        }
        this.medTasks = taskObjs_;
    }

    doLowTasks() {
        var taskObjs_: TaskObj[] = [];
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
            if (validDates) {
                taskObjs_.push(taskObj);
            }
        }
        this.lowTasks = taskObjs_;
    }

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

    async getTheData(person: Person, doc: any) {
        this.tasks.length = 0;
        var taskCollection = this.afs.collection<Task>('tasks', ref => ref.where('empl_key', '==', person.key));
        await taskCollection.ref.get().then(async (querySnapshot) => {
            querySnapshot.forEach(doc => {
                var task = doc.data() as Task;
                this.tasks.push(task);
            });
            this.tasks.sort((a, b) => (String(a.priority) > String(b.priority)) ? 1 : -1);
            this.taskObjs.length = 0;
            for (var task of this.tasks) {
                if (task.empl_key != person.key) continue;
                var taskObj = new TaskObj();
                taskObj.task = task;
                if (task.proj_key) {
                    taskObj.projno = this.scs.getProjectNo(task.proj_key);
                    taskObj.projname = this.scs.getProjectName(task.proj_key);
                    taskObj.name = this.scs.getPersonName(task.empl_key);
                }
                taskObj.startdate = this.datepipe.transform(task.start_date, 'MM/dd/yyy');
                taskObj.enddate = this.datepipe.transform(task.end_date, 'MM/dd/yyy');
                this.taskObjs.push(taskObj);
            }
            this.doIt(person.key, doc);
        });

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