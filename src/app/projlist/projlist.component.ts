import { Component, OnInit } from '@angular/core';

import {ViewChild} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { Observable } from 'rxjs';
import { Project } from 'src/data/project.model';
import { map } from 'rxjs/operators';
import { ScService } from '../sc.service';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-projlist',
  templateUrl: './projlist.component.html',
  styleUrls: ['./projlist.component.css']
})
export class ProjlistComponent implements OnInit {
  displayedColumns: string[] = ['project_no', 'project_name', 'client', 'comments'];
  dataSource: MatTableDataSource<Project>;
  projectCollection: AngularFirestoreCollection<Project>;
  projectObs: Observable<Project[]>;
  projects: Project[] = [];
  
  @ViewChild(MatSort, {static: false}) sort: MatSort;

  constructor(
    private afs: AngularFirestore,
    private scService: ScService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    
  }
  sortProj(projects: Project[]) {
    projects.sort((a, b) => (Number(a.todd_no) > Number(b.todd_no)) ? 1 : -1);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  projectClick(event: Event, project: Project) {
    console.log("clicked! key = " + project.project_name);
    this.scService.setProject(project);
  }

  ngAfterViewInit() {
    this.projectCollection = this.afs.collection<Project>('projects', ref => {
      return ref;
    });
    this.projectCollection.snapshotChanges().pipe(
      map (actions => {
      return actions.map(a => {
        const data = a.payload.doc.data() as Project;
        data.key = a.payload.doc.id;
        return { ...data};
      })
    })).subscribe(projects => {
      this.projects = projects;
      this.sortProj(this.projects);
      this.dataSource = new MatTableDataSource(this.projects);
      this.dataSource.sort = this.sort;
      this.scService.setProjects(this.projects);
    })
  }

  ngOnInit() {
  }

}
