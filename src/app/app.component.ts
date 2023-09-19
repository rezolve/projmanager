import { DatePipe } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Person } from 'src/data/person.model';
import { Project } from 'src/data/project.model';
import { PdfService } from './pdf.service';
import { ScService } from './sc.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'projectmanager';
  @ViewChild("namein", { read: ElementRef, static: false }) nameEl: ElementRef;
  @ViewChild("pwin", { read: ElementRef, static: false }) pwEl: ElementRef;

  constructor(
    public afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private scService: ScService,
    private pdfService: PdfService,
    private route: ActivatedRoute,
    private router: Router,
    private datepipe: DatePipe,
  ) {
    this.afAuth.onAuthStateChanged((auth) => {
      if (auth == null) {
        // console.log("auth.email = " + auth.email);

        var person: Observable<Person>;
        this.afs.firestore.collection("persons2").where('email', '==', 'dedelstein@projmanager.net') //auth.email)
          .get()
          .then(querySnapshot => {
            querySnapshot.forEach(doc => {
              // console.log("Here I am!");
              var person = doc.data() as Person;
              person.key = doc.id;
              this.scService.setCurrUser(person);
            });
          })

          var personsCollection: AngularFirestoreCollection<Person>;
          personsCollection = this.afs.collection<Person>('persons2', ref => {
            return ref;
          });
          personsCollection.snapshotChanges().pipe(
            map(actions => {
              return actions.map(a => {
                const data = a.payload.doc.data() as Person;
                data.key = a.payload.doc.id;
                return { ...data };
              })
            })).subscribe(persons => {
              this.scService.setPersons(persons);
            })
            this.router.navigate(['/']);
      } else {
        console.log("auth == null!");
      }
      // 
    });

    this.route.params.subscribe(params => {
      console.log("Here!");
    });

  }

  login() {
    // window.alert("login()! email = " + this.nameEl.nativeElement.value + ", pw = " + this.pwEl.nativeElement.value);
    this.afAuth.signInWithEmailAndPassword(this.nameEl.nativeElement.value, this.pwEl.nativeElement.value)
      .then(value => {
        // window.alert(value.user.email);
        // console.log('Nice, it worked!');
        this.router.navigate(['/']);
        // if (this.scService.getDeviceType() != "unknown") {
        //   this.router.navigate(['/mobilemain']);
        // } else {
        //   this.router.navigate(['/mainwin']);
        // }

      })
      .catch(err => {
        console.log('Something went wrong: ', err.message);
      });
  }

  validEmail(email: string): boolean {
    let EMAIL_REGEXP = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
    if (email != "" && (email.length <= 5 || !EMAIL_REGEXP.test(email))) {
      return false;
    }
    return true;
  }

  resetPassword() {
    this.afAuth.sendPasswordResetEmail(this.nameEl.nativeElement.value).then(function () {
      window.alert('email sent!');
    }).catch(function (error) {
      console.error("Problem sending password reset email! error = " + error);
    });
  }

  projects() {
    this.router.navigate(['projects']);
  }

  people() {
    this.router.navigate(['people']);
  }

  deliverables() {
    this.router.navigate(['deliverables']);
  }

  tasks() {
    this.router.navigate(['tasks']);
  }

  notes() {
    this.router.navigate(['notes']);
  }

  addEntity() {
    var currNav = this.router.url;
    if(this.router.url==="/projects" || this.router.url==="/") {
      console.log("addEntity() projects = " + currNav);
      this.addProject();
    } else if (this.router.url.includes("/project/")) {
      console.log("addEntity() project = " + currNav);
      this.addProject();
    } else if (this.router.url==="/people") {
      console.log("addEntity() people = " + currNav);
    } else if (this.router.url.includes("/people/")) {
      console.log("addEntity() people = " + currNav);
    } else if (this.router.url===("/deliverables")) {
      console.log("addEntity() deliverables = " + currNav);
      this.addDeliverable();
    } else if (this.router.url.includes("/deliverable/")) {
      console.log("addEntity() deliverable = " + currNav);
      this.addDeliverable();
    } else if (this.router.url==="/tasks") {
      console.log("addEntity() tasks = " + currNav);
      this.addTask();
    } else if (this.router.url.includes("/task/")) {
      console.log("addEntity() task = " + currNav);
      this.addTask();
    } else if (this.router.url===("/notes")) {
      console.log("addEntity() notes = " + currNav);
      this.addNote();
    } else if (this.router.url.includes("/note/")) {
      console.log("addEntity() note = " + currNav);
      this.addNote();
    } else {
      console.log("addEntity() = " + currNav);
    }
  }

  delEntity() {
    var currNav = this.router.url;
    if(this.router.url==="/projects" || this.router.url==="/") {
      console.log("delEntity() projects = " + currNav);
      this.delProject();
    } else if (this.router.url.includes("/project/")) {
      console.log("delEntity() project = " + currNav);
      this.delProject();
    } else if (this.router.url==="/people") {
      console.log("delEntity() people = " + currNav);
    } else if (this.router.url.includes("/people/")) {
      console.log("delEntity() people = " + currNav);
    } else if (this.router.url===("/deliverables")) {
      console.log("delEntity() deliverables = " + currNav);
      this.delDeliverable();
    } else if (this.router.url.includes("/deliverable/")) {
      console.log("delEntity() deliverable = " + currNav);
      this.delDeliverable();
    } else if (this.router.url==="/tasks") {
      console.log("delEntity() tasks = " + currNav);
      this.delTask();
    } else if (this.router.url.includes("/task/")) {
      console.log("delEntity() task = " + currNav);
      this.delTask();
    } else if (this.router.url===("/notes")) {
      console.log("delEntity() notes = " + currNav);
      this.delNote();
    } else if (this.router.url.includes("/note/")) {
      console.log("delEntity() note = " + currNav);
      this.delNote();
    } else {
      console.log("delEntity() = " + currNav);
    }
  }

  addProject() {
    console.log("add project()");
    this.afs.collection("projects").add({
      project_name: "New Project",
    })
      .then(docRef => {
        console.log("Project written with ID: ", docRef.id);
        this.router.navigate(['project/' + docRef.id]);
      })
      .catch(error => {
        console.error("Error adding project: ", error);
      });
  }

  delProject() {
    console.log("del project");
    history.back();
    if (this.scService.getProject() != null) {
      this.afs.collection('projects').doc(this.scService.getProject().key).delete().then(arg => {
        console.log("Project succesfully deleted!");
      }).catch(error => {
        console.error("Error removing document: ", error);
      })
    }
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

  delDeliverable() {
    console.log("del Deliverable");
    history.back();
    if (this.scService.getDeliverable() != null) {
      this.afs.collection('deliverables').doc(this.scService.getDeliverable().key).delete().then(arg => {
        console.log("Deliverable succesfully deleted!");
      }).catch(error => {
        console.error("Error removing document: ", error);
      })
    }
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
      if(!this.scService.getProject()) {
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

  delTask() {
    console.log("del Task");
    history.back();
    if (this.scService.getTask() != null) {
      this.afs.collection('tasks').doc(this.scService.getTask().key).delete().then(arg => {
        console.log("Task succesfully deleted!");
      }).catch(error => {
        console.error("Error removing task: ", error);
      })
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

  delNote() {
    console.log("del Note");
    history.back();
    if (this.scService.getNote() != null) {
      this.afs.collection('notes').doc(this.scService.getNote().key).delete().then(arg => {
        console.log("Note succesfully deleted!");
      }).catch(error => {
        console.error("Error removing task: ", error);
      })
    }
  }

  test() {
    // var projectsCollection: AngularFirestoreCollection<Project>;

    // projectsCollection = this.afs.collection<Project>('projects', ref => {
    //   return ref;
    // });
    // projectsCollection.ref.get().then(querySnapshot => {
    //   querySnapshot.forEach(doc => {
    //     var project = doc.data() as Project;

    //     var pic = this.scService.getPersonByInitials(project.pic);
    //     var pm = this.scService.getPersonByInitials(project.pm);
    //     var pc = this.scService.getPersonByInitials(project.pc);
    //     var hvac = this.scService.getPersonByInitials(project.hvac);
    //     var fire = this.scService.getPersonByInitials(project.fire);
    //     var plmb = this.scService.getPersonByInitials(project.plmb);
    //     var elec = this.scService.getPersonByInitials(project.elec);
        
    //     if(pic) {
    //       project.pic = pic.key;
    //       console.log("pic = " + project.pic);
    //     } else {
    //       console.log("pic is null");
    //     }
        
    //     if(pm) {
    //       project.pm = pm.key;
    //       console.log("pm = " + project.pm);
    //     } else {
    //       console.log("pm is null");
    //     }
    //     if(pc) {
    //       project.pc = pc.key;
    //       console.log("pc = " + project.pc);
    //     } else {
    //       console.log("pc is null");
    //     }
    //     if(hvac) {
    //       project.hvac = hvac.key;
    //       console.log("hvac = " + project.hvac);
    //     } else {
    //       console.log("hvac is null");
    //     }
    //     if(fire) {
    //       project.fire = fire.key;
    //       console.log("fire = " + project.fire);
    //     } else {
    //       console.log("fire is null");
    //     }
    //     if(plmb) {
    //       project.plmb = plmb.key;
    //       console.log("plmb = " + project.plmb);
    //     } else {
    //       console.log("plmb is null");
    //     }
    //     if(elec) {
    //       project.elec = elec.key;
    //       console.log("elec = " + project.elec);
    //     } else {
    //       console.log("elec is null");
    //     }
    //     this.afs.doc("projects/" + project.key).update(project);

    //   })
    // });
  }

  logout() {
    this.afAuth.signOut();
  }

  pdfIt() {
    console.log("pdfIt()");
    this.pdfService.pdfIt();
  }

  pdfCal() {
    console.log("pdfCall()");
    this.pdfService.pdfIt_CalAll();
  }

  pdfStaff() {
    console.log("pdfIt()");
    this.pdfService.pdfIt_Person();
  }

  pdfNotes() {
    console.log("pdfNotes()");
    this.pdfService.pdfIt_Notes();
  }

  settings() {
    this.router.navigate(['settings']);
  }

  ngOnInit() {
  }
}
