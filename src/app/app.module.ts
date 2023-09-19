import { DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DeliverableComponent } from './deliverable/deliverable.component';
import { DeliverlistComponent } from './deliverlist/deliverlist.component';
import { NoteComponent } from './note/note.component';
import { NoteslistComponent } from './noteslist/noteslist.component';
import { PeopleComponent } from './people/people.component';
import { PeoplelistComponent } from './peoplelist/peoplelist.component';
import { ProjComponent } from './proj/proj.component';
import { ProjlistComponent } from './projlist/projlist.component';
import { ScService } from './sc.service';
import { SettingsComponent } from './settings/settings.component';
import { TaskComponent } from './task/task.component';
import { TasklistComponent } from './tasklist/tasklist.component';

const routes: Routes = [
  {path: 'deliverables', component: DeliverlistComponent},
  {path: 'deliverable/:id', component: DeliverableComponent},
  {path: 'tasks', component: TasklistComponent},
  {path: 'task/:id', component: TaskComponent},
  {path: 'project/:id', component: ProjComponent},
  {path: 'project', component: ProjComponent},
  {path: 'projects', component: ProjlistComponent},
  {path: 'people', component: PeoplelistComponent},
  {path: 'people/:id', component: PeopleComponent},
  {path: 'notes', component: NoteslistComponent},
  {path: 'note/:id', component: NoteComponent},
  {path: 'settings', component: SettingsComponent},
  {path: '',component: ProjlistComponent},
];

@NgModule({
  declarations: [
    AppComponent,
    ProjlistComponent,
    ProjComponent,
    DeliverlistComponent,
    TasklistComponent,
    DeliverableComponent,
    TaskComponent,
    PeoplelistComponent,
    PeopleComponent,
    SettingsComponent,
    NoteslistComponent,
    NoteComponent,
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatPaginatorModule,
    MatTableModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatIconModule,
    MatToolbarModule,
    MatListModule, 
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSortModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatAutocompleteModule,
    RouterModule.forRoot(
      routes, { enableTracing: false }
    ),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
  ],
  providers: [
    ScService,
    DatePipe
  ],
  bootstrap: [AppComponent]
})

export class AppModule { }
