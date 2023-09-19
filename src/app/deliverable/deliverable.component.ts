import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Deliverable } from 'src/data/deliverable.model';
import { ScService } from '../sc.service';

@Component({
  selector: 'app-deliverable',
  templateUrl: './deliverable.component.html',
  styleUrls: ['./deliverable.component.css']
})
export class DeliverableComponent implements OnInit {
  private deliverableDoc: AngularFirestoreDocument<Deliverable>;
  deliverable: Deliverable = new Deliverable();
  delivObj: DelObj = new DelObj;
  date: FormControl = new FormControl(new Date());

  constructor(
    private afs: AngularFirestore,
    private scService: ScService,
    private route: ActivatedRoute,
  ) {
    this.route.params.subscribe(params => {
      console.log("Here!");
      if (params['id']) {
        console.log("id = " + params['id']);
        this.deliverableDoc = this.afs.doc<Deliverable>('deliverables/' + params['id']);
        this.deliverableDoc.valueChanges()
          .subscribe(deliverable => {
            if(!deliverable) return;
            this.deliverable = deliverable;
            this.deliverable.key = params['id'];
            console.log('deliverable.key=' + this.deliverable.key);
            this.scService.setDeliverable(this.deliverable);
            this.delivObj.deliverable = this.deliverable;
            this.delivObj.projno = this.scService.getProjectNo(this.deliverable.proj_key);
            this.delivObj.projname = this.scService.getProjectName(this.deliverable.proj_key);
            this.date = new FormControl(new Date(this.deliverable.due_date));
          });
      }
    });
  }
  description(value: string) {
    console.log("description value = " + value);
    this.deliverable.description = value;
    this.deliverableDoc.update(this.deliverable);
  }
  duedate(value: string) {
    console.log("duedate = " + value);
    var date = new Date(value);
    console.log("date.ts = " + date.getTime());
    this.deliverable.due_date = date.getTime();
    this.deliverableDoc.update(this.deliverable);
  }
  isMilestone(value: string) {
    console.log("isMilestone = " + value);
    if(value) {
      this.deliverable.is_milestone = true;
    } else {
      this.deliverable.is_milestone = false;
    }
    this.deliverableDoc.update(this.deliverable);
  }
  ngOnInit(): void {
  }

}

class DelObj {
  deliverable: Deliverable = new Deliverable();
  name: string;
  projno: string;
  projname: string;
  duedate: string;
  ismilestone: boolean;
  
  constructor() {
  }

}