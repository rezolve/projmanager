import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Note } from 'src/data/note.model';
import { Person } from 'src/data/person.model';
import { ScService } from '../sc.service';

declare var PDFDocument: any;
declare var blobStream: any;

@Injectable({
    providedIn: 'root'
})
export class PersonNotePDF {
    
    persons: Person[] = [];
    notes: Note[] =[];
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

        this.repObjs = [];

        this.getTheData(doc);

    }

    private doIt(doc: any) {
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
            repObj.notes.sort((a, b) => (Number(a.created_date) > Number(b.created_date)) ? -1 : 1);

            for (var note of repObj.notes) {
                var noteRowHeight = this.getNoteRowHeight(doc, note);

                if (y + noteRowHeight > 540) {
                    doc.addPage({ layout: "landscape", margin: 0 });
                    this.doHeader1(doc);
                    y = 100;
                    doc.fontSize(10).text(this.getPersonByKey(repObj.empl_key).first_name, 55, y + 2, {width: 180 });
                    doc.fontSize(10).text(this.getPersonByKey(repObj.empl_key).last_name, 110, y + 2, { width: 180 });
                    doc.rect(x, y, 690, empRowHeight).lineWidth(.5).stroke();
                    y = y + empRowHeight + 2;
                }

                if(note.proj_key && this.scs.getProjectByKey(note.proj_key)) {
                    doc.fontSize(10).text(this.scs.getProjectByKey(note.proj_key).project_no, x + 7, y + 2, { width: 80 }).stroke();
                    doc.fontSize(10).text(this.scs.getProjectByKey(note.proj_key).project_name, x + 67, y + 2, { width: 125 }).stroke();
                }

                doc.fontSize(10).text(note.thenote, x + 225, y + 2, { width: 240 }).stroke();
                doc.fontSize(10).text(this.datepipe.transform(note.created_date, 'MM/dd/yyyy'), x + 515, y + 2).stroke();
                y = y + noteRowHeight;
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
            .text('Smith Miller Associates', 45, 35, { underline: false });

        doc.fontSize(10)
            .fillColor('black')
            .text('PRINTED: ' + this.datepipe.transform(new Date().getTime(), 'MM/dd/yyyy h:mm:ss a'), 45, 582, { underline: false });
        doc.fontSize(22)
            .text('Notes Report', 490, 40, { underline: true });

        // doc.fontSize(18)
        //     .text(this.start + " - " + this.end, 508, 72, { underline: false });

        doc.fontSize(22)
            .text('', 50, 71);
    }

    filterPerson(person: Person): boolean {
        if(person.key==this.scs.getCurrUser().key) {
            return true;
        }
        return false;
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
            console.log("persons.length = " + this.persons.length);
            this.persons.sort((a, b) => (a.last_name > b.last_name) ? 1 : -1);

            this.afs.firestore.collection("notes").where('empl_key', '==', this.scs.getCurrUser().key)
                .get()
                .then(querySnapshot => {
                    querySnapshot.forEach(doc => {
                        // console.log("Here I am!");
                        var note = doc.data() as Note;
                        this.notes.push(note);
                    });
                    this.notes.sort((a, b) => (Number(b.created_date) > Number(a.created_date)) ? 1 : -1);
                    this.processPersons(doc);
                })


        });
    }

    processPersons(doc: any) {
        for (var person of this.persons) {
            var repObj = new RepObj1();
            repObj.empl_key = person.key;

            for (var note of this.notes) {
                repObj.notes.push(note);
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
    getNoteRowHeight(doc: any, note: Note) {
        var r = 0;
        var projno = 0;
        var projname = 0;

        if (note.proj_key && this.scs.getProjectByKey(note.proj_key)) {
            projno = doc.fontSize(10).heightOfString(this.scs.getProjectByKey(note.proj_key).project_no, { width: 80 });
            projname = doc.fontSize(10).heightOfString(this.scs.getProjectByKey(note.proj_key).project_name, { width: 125 });
        }
        var noteTheNote = doc.fontSize(10).heightOfString(note.thenote, { width: 240 });
        var createddate = doc.fontSize(10).heightOfString(this.datepipe.transform(note.created_date, 'MM/dd/yyyy'), { width: 60 });
       
        if (projno > r) {
            r = projno;
        }
        if (projname > r) {
            r = projname;
        }
        if (noteTheNote > r) {
            r = noteTheNote;
        }
        if (createddate > r) {
            r = createddate;
        }
        return r;
    }
}


class RepObj1 {
    empl_key: string;
    notes: Note[] = [];
    height: number;
}
