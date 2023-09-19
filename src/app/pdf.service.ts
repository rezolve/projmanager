import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Deliverable } from 'src/data/deliverable.model';
import { Person } from 'src/data/person.model';
import { Project } from 'src/data/project.model';
import { Task } from 'src/data/task.model';
import { ScService } from './sc.service';
import { PersonTaskPDF } from 'src/app/pdftypes/persontaskpdf';
import { PersonCalPDF } from './pdftypes/personcalpdf';
import { PersonCalAllPDF } from './pdftypes/personcalallpdf ';
import { Note } from 'src/data/note.model';
import { PersonNotePDF } from './pdftypes/personnotepdf';

declare var PDFDocument: any;
declare var blobStream: any;

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  projects: Project[] = [];
  deliverables: Deliverable[] = [];
  persons: Person[] = [];
  tasks: Task[] = [];
  notes: Note[] = [];
  repObjs: RepObj1[] = [];
  oldRepProjs: RepObj1[] = []
  twoweeks: number = 1209600000;
  pageHt: number = 800;
  pageWh: number = 600;
  start: string;
  end: string;
  pageCnt: number;

  constructor(
    private datepipe: DatePipe,
    private afs: AngularFirestore,
    private scs: ScService,
  ) { }

  public async pdfIt_CalAll() {
    const pdfTask = new PersonCalAllPDF(this.datepipe,this.afs,this.scs).pdfIt();
  }

  public async pdfIt_Cal() {
    const pdfTask = new PersonCalPDF(this.datepipe,this.afs,this.scs).pdfIt();
  }

  public async pdfIt_Person() {
    const pdfTask = new PersonTaskPDF(this.datepipe,this.afs,this.scs).pdfIt();
  }

  public async pdfIt_Notes() {
    const pdfTask = new PersonNotePDF(this.datepipe,this.afs,this.scs).pdfIt();
  }


  public async pdfIt() {

    const doc = new PDFDocument({
      margin: 0,
      autoFirstPage: false,
      layout: "landscape",
      bufferPages: true
    });

    this.start = this.datepipe.transform(new Date().getTime(), 'MM/dd/yyyy');
    this.end = this.datepipe.transform(new Date().getTime() + this.twoweeks, 'MM/dd/yyyy');

    this.persons = [];
    this.projects = [];
    this.deliverables = [];
    this.tasks = [];
    this.notes = [];
    this.repObjs = [];
    this.oldRepProjs = [];

    this.getTheData(doc);

  }
    
  private doIt(doc: any) {
    if (this.projects.length == 0) {
      this.pdfIt();
      return;
    }
    this.pageCnt = 0;
    console.log("doIt() pdfIt()");
    doc.addPage({ layout: "landscape", margin: 0 });
    console.log("deliverables.length = " + this.deliverables.length)
    this.doHeader1(doc);

    var y = doc.y;
    var x = 50;

    for (var repObj of this.repObjs) {
      console.log("repObj.project = " + repObj.proj_key)
      var headerHght = this.getHeaderHght(doc, repObj);

      var dheight = 0;
      for (var deliverable of repObj.deliverables) {
        dheight = dheight + doc.fontSize(10).heightOfString(deliverable.description, { width: 250 });
      }

      var theight = 0;
      for (var task of repObj.tasks) {
        theight = theight + doc.fontSize(10).heightOfString(task.description, { width: 220 });
      }
      var bodyHght;
      if(dheight>theight) {
        bodyHght = dheight;
      } else {
        bodyHght = theight;
      }

      var nheight = 0;
      for (var note of repObj.notes) {
        if(note.isprivate) {
          continue;
        }
        nheight = nheight + doc.fontSize(10).heightOfString(note.thenote, { width: 500 });
      }

      if((y + headerHght + bodyHght + nheight)>550) {
        doc.addPage({ layout: "landscape", margin: 0 });
        this.doHeader1(doc);
        y = 100;
        this.pageCnt++;
      }

      doc.fontSize(10).text(this.getProjectByKey(repObj.proj_key).project_no, 55, y + 2);
      doc.fontSize(10).text(this.getProjectByKey(repObj.proj_key).project_name, 110, y + 2, { width: 180 });
      doc.rect(x, y, 235, headerHght).lineWidth(.5).stroke();

      doc.moveTo(50,y+12).lineTo(285,y+12).stroke();
      doc.moveTo(50,y+24).lineTo(285,y+24).stroke();
      doc.moveTo(50,y+36).lineTo(285,y+36).stroke();

      doc.moveTo(76.1,y+12).lineTo(76.1,y+36).stroke();
      doc.fontSize(8).text("PIC", 55.5, y+15).stroke();
      doc.moveTo(102.2,y+12).lineTo(102.2,y+36).stroke();
      doc.fontSize(8).text("PM", 83, y+15).stroke();
      doc.moveTo(128.3,y+12).lineTo(128.3,y+36).stroke();
      doc.fontSize(8).text("PC", 109.2, y+15).stroke();
      doc.moveTo(154.4,y+12).lineTo(154.4,y+36).stroke();
      doc.fontSize(8).text("MECH", 129.5, y+15).stroke();
      doc.moveTo(180.5,y+12).lineTo(180.5,y+36).stroke();
      doc.fontSize(8).text("ELEC", 156.5, y+15).stroke();
      doc.moveTo(206.6,y+12).lineTo(206.6,y+36).stroke();
      doc.fontSize(8).text("PLMB", 182.7, y+15).stroke();
      doc.moveTo(232.7,y+12).lineTo(232.7,y+36).stroke();
      doc.fontSize(8).text("FIRE", 210.2, y+15).stroke();
      doc.moveTo(258.8,y+12).lineTo(258.8,y+36).stroke();
      doc.fontSize(6).text("SPEC", 236, y+16).stroke();
      doc.fontSize(6).text("REVIT", 262, y+16).stroke();

      var proj = this.getProjectByKey(repObj.proj_key);
      if (this.scs.getPersonByKey(proj.pic))
        doc.fontSize(8).text(this.scs.getPersonByKey(proj.pic).initials, 55.5, y + 27).stroke();
      if (this.scs.getPersonByKey(proj.pm))
        doc.fontSize(8).text(this.scs.getPersonByKey(proj.pm).initials, 83, y + 27).stroke();
      if (this.scs.getPersonByKey(proj.pc))
        doc.fontSize(8).text(this.scs.getPersonByKey(proj.pc).initials, 108.2, y + 27).stroke();
      if (this.scs.getPersonByKey(proj.hvac))
        doc.fontSize(8).text(this.scs.getPersonByKey(proj.hvac).initials, 129.5, y + 27).stroke();
      if (this.scs.getPersonByKey(proj.elec))
        doc.fontSize(8).text(this.scs.getPersonByKey(proj.elec).initials, 156.5, y + 27).stroke();
      if (this.scs.getPersonByKey(proj.plmb))
        doc.fontSize(8).text(this.scs.getPersonByKey(proj.plmb).initials, 181.0, y + 27).stroke();
      if (this.scs.getPersonByKey(proj.fire))
        doc.fontSize(8).text(this.scs.getPersonByKey(proj.fire).initials, 208.2, y + 27).stroke();
      doc.fontSize(6).text(proj.spec, 235, y + 27.5).stroke();
      doc.fontSize(6).text(proj.revit, 267, y+27.5).stroke();

      // doc.moveTo(334.4,y+12).lineTo(334.4,y+36).stroke();
      doc.fontSize(10).text(this.getProjectByKey(repObj.proj_key).comments, 290, y + 2, { width: 390 });
      doc.rect(285, y, 390, headerHght)
        .lineWidth(.5)
        .stroke();
      doc.fontSize(10).text(this.datepipe.transform(this.getProjectByKey(repObj.proj_key).duedate, "MM/dd/yyyy"), 680, y + 2);
      doc.fontSize(8).text(this.getProjectByKey(repObj.proj_key).client, 680, y + 14);
      doc.rect(675, y, 65, headerHght)
        .lineWidth(.5)
        .stroke();

      y = y + headerHght;

      // 235
      doc.rect(x, y, 235, bodyHght)
        .lineWidth(.5)
        .stroke();

      var dh = y;
      for (var deliverable of repObj.deliverables) {
        var dhgt = doc.fontSize(10).heightOfString(deliverable.description, { width: 250 });
        doc.fontSize(10).text(deliverable.description, x + 10, dh + 2);
        doc.fontSize(10).text(this.datepipe.transform(deliverable.due_date, 'MM/dd/yyyy'), x + 115, dh + 2);
        doc.fontSize(10).text(deliverable.is_milestone, x + 185, dh + 2);
        dh = dh + dhgt;
      }

      var th = y;
      for (var task of repObj.tasks) {
        var thgt = doc.fontSize(10).heightOfString(task.description, { width: 220 });
        doc.fontSize(10).text(task.description, x + 240, th + 2, { width: 220 });
        doc.fontSize(10).text(this.scs.getPersonName(task.empl_key), x + 460, th + 2);
        doc.fontSize(10).text(task.est_hours, x + 550, th + 2);
        doc.fontSize(10).text(this.datepipe.transform(task.start_date, 'MM/dd/yyyy'), x + 570, th + 2);
        doc.fontSize(10).text(this.datepipe.transform(task.end_date, 'MM/dd/yyyy'), x + 630, th + 2);
        th = th + thgt;
      }

      console.log("repObj.notes.length = " + repObj.notes.length);
      var nh = y + bodyHght;
      for (var note of repObj.notes) {
        if(note.isprivate) {
          continue;
        }
        var nhgt = doc.fontSize(10).heightOfString(note.thenote, { width: 500 });
        doc.fontSize(10).text(note.thenote, 60, nh + 2, { width: 500 });
        doc.fontSize(10).text(this.scs.getPersonByKey(note.empl_key).initials, 610, nh + 2);
        doc.fontSize(10).text(this.datepipe.transform(note.created_date, 'MM/dd/yyyy'), x + 630, nh + 2);
        nh = nh + nhgt;
      }

      doc.rect(50, y, 690, bodyHght)
        .lineWidth(1)
        .stroke();

      y = y + bodyHght + nheight + 10;

    }

    for(var i = 0; i <= this.pageCnt; i++) {
      doc.switchToPage(i);
      doc.fontSize(12)
      .text('Page ' + (i+1) + ' of ' + (this.pageCnt+1), 675, 575, { underline: false });
    }

    var stream = doc.pipe(blobStream())
    doc.end();
    stream.on("finish", () => {
      var url = stream.toBlobURL('application/pdf');
      var blob = stream.toBlob('application/pdf');

      if (window.navigator && (window.navigator as any).navigator.msSaveOrOpenBlob) {
        console.log("here");
        (window.navigator as any).msSaveOrOpenBlob(blob, "test.pdf");
      } else {
        window.open(url, "test.pdf");
      }
    });
  }
  
  doHeader1(doc: any) {
    doc.fontSize(24)
      .fillColor('red')
      .text('Project Manager App', 45, 35, { underline: false });

    doc.fontSize(12)
      .fillColor('black')
      .text('PRINTED: ' + this.datepipe.transform(new Date().getTime(), 'MM/dd/yyyy h:mm:ss a'), 45, 582, { underline: false });
    doc.fontSize(22)
      .text('Two-Week Look-Ahead', 490, 40, { underline: true });

    doc.fontSize(18)
      .text(this.start + " - " + this.end, 508, 72, { underline: false });

    doc.fontSize(22)
      .text('Deliverables and Milestones', 50, 71);
  }

  getTheData(doc: any) {
    var personsCollection = this.afs.collection<Person>('persons', ref => {
      return ref;
    });
    personsCollection.ref.get().then(querySnapshot => {
      querySnapshot.forEach(doc => {
        var person = doc.data() as Person;
        this.persons.push(person);
      });
      var projectsCollection = this.afs.collection<Project>('projects', ref => {
        return ref;
      });
      projectsCollection.ref.get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
          var project = doc.data() as Project;
          if(project.project_no == "20-017") {
          console.log("project.comment = " + project.comments);
        }
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
            this.tasks.sort((a, b) => (Number(a.end_date) > Number(b.end_date)) ? 1 : -1);

            var notesCollection = this.afs.collection<Note>('notes', ref => {
              return ref;
            });
            notesCollection.ref.get().then(querySnapshot => {
              querySnapshot.forEach(doc => {
                var note = doc.data() as Note;
                this.notes.push(note);
              });
              this.notes.sort((a, b) => (Number(a.created_date) > Number(b.created_date)) ? 1 : -1);
              this.processDeliverables(doc);
            });
          });
        });
      });
    });
  }

  processDeliverables(doc: any) {
    for (var deliverable of this.deliverables) {
      var repObj = new RepObj1();
      repObj.proj_key = deliverable.proj_key;
      if(!this.scs.getProjectByKey(repObj.proj_key)) {
        continue;
      }
      var start1 = new Date().getTime() - (1000*60*60*24);
      var end1 = new Date().getTime() + this.twoweeks;
      if (deliverable.due_date > start1 && deliverable.due_date < end1) {
        var addIt = true;
        for (var r of this.repObjs) {
          if (r.proj_key == deliverable.proj_key) {
            addIt = false;
          }
        };
        if (addIt) {
          this.repObjs.push(repObj);
        }
      }
    }
    for (var deliverable of this.deliverables) {
      if (deliverable.due_date > end1) {
        var addIt = true;
        for (var r of this.oldRepProjs) {
          if (r.proj_key == deliverable.proj_key) {
            addIt = false;
          }
        };
        for (var r of this.repObjs) {
          if (r.proj_key == deliverable.proj_key) {
            addIt = false;
          }
        }
        if (addIt) {
          var rObj = new RepObj1();
          rObj.proj_key = deliverable.proj_key;
          this.oldRepProjs.push(rObj);
        }
      }
    }
    for (var repObj of this.repObjs) {
      for (var deliverable of this.deliverables) {
        if (deliverable.proj_key == repObj.proj_key) {
          repObj.deliverables.push(deliverable);
        }
      }
      for (var task of this.tasks) {
        if (task.proj_key == repObj.proj_key) {
          repObj.tasks.push(task);
        }
      }
      for (var note of this.notes) {
        if (note.proj_key == repObj.proj_key) {
          repObj.notes.push(note);
        }
      }
    }
    for (var oldRepProj of this.oldRepProjs) {
      for (var deliverable of this.deliverables) {
        if (deliverable.proj_key == oldRepProj.proj_key) {
          oldRepProj.deliverables.push(deliverable);
        }
      }
      for (var task of this.tasks) {
        if (task.proj_key == oldRepProj.proj_key) {
          oldRepProj.tasks.push(task);
        }
      }
      for (var note of this.notes) {
        if (note.proj_key == repObj.proj_key) {
          oldRepProj.notes.push(note);
        }
      }
    }
    this.doIt(doc);
  }
  getProjectByKey(key: string) {
    for(var proj of this.projects) {
      if(proj.key == key) {
        return proj;
      }
    }
  }
  getHeaderHght(doc: any, repObj: RepObj1) {
    var proj = this.getProjectByKey(repObj.proj_key);
    var projCommHgt = doc.fontSize(10).heightOfString(proj.comments, { width: 300 })
    if(projCommHgt>36) {
      return projCommHgt;
    } else {
      return 36;
    }
  }
}
class RepObj1 {
  proj_key: string;
  deliverables: Deliverable[] = [];
  tasks: Task[] = [];
  notes: Note[] = [];
}
