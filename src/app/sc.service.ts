import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Deliverable } from 'src/data/deliverable.model';
import { Note } from 'src/data/note.model';
import { Person } from 'src/data/person.model';
import { Project } from 'src/data/project.model';
import { Task } from 'src/data/task.model';

@Injectable({
  providedIn: 'root'
})
export class ScService {
  private projects: Project[] = [];
  private project: Project;
  private persons: Person[] = [];
  private person: Person;
  private note: Note;
  private notes: Note[] = [];
  private curruser: Person;
  private deliverables: Deliverable[] = [];
  private deliverable: Deliverable;
  private tasks: Task[] = [];
  private task: Task;

  private pdfPersons: Person[] = [];
  private pdfProjects: Project[] = [];
  private pdfDeliverables: Deliverable[] = [];
  private pdfTasks: Task[] = [];

  constructor(private datepipe: DatePipe,) { }

  getPersons(): Person[] {
    return this.persons;
  }

  setPersons(persons :Person[]) {
    this.persons = persons;
  }

  getPersonName(key: string) {
    for(var person of this.persons) {
      if(person.key == key) {
        return person.first_name + " " + person.last_name;
      }
    }
  }

  getPerson() {
    return this.person;
  }

  getPersonByKey(key: string) {
    for(var person of this.persons) {
      if(person.key == key) {
        return person;
      }
    }
  }

  getPersonByInitials(initials: string) {
    if(!initials) {
      return;
    }
    for(var person of this.persons) {
      if(initials.length>2) {
        initials == initials.substring(0,2);
      }
      if(person.initials == initials) {
        return person;
      }
    }
  }

  setPerson(person: Person) {
    this.person = person;
  }

  getCurrUser() {
    return this.curruser;
  }

  setCurrUser(person: Person) {
    this.curruser = person;
  }

  setProjects(projects :Project[]) {
    this.projects = projects;
  }

  getProjects(): Project[] {
    return this.projects;
  }

  getNotes(): Note[] {
    return this.notes;
  }

  setNotes(notes: Note[]) {
    this.notes = notes;
  }

  getNote(): Note {
    return this.note;
  }

  setNote(note: Note) {
    this.note = note;
  }

  setPdfPersons(pdfPersons: Person[]) {
    this.pdfPersons = pdfPersons;
  }

  getPdfPersons() {
    return this.pdfPersons;
  }

  setPdfProjects(pdfProjects: Project[]) {
    this.pdfProjects = pdfProjects;
  }

  getPdfProjects() {
    return this.pdfProjects;
  }

  setPdfDeliverables(pdfDeliverables: Deliverable[]) {
    this.pdfDeliverables = pdfDeliverables;
  }

  getPdfDeliverables() {
    return this.pdfDeliverables;
  }

  setPdfTasks(pdfTasks: Task[]) {
    this.pdfTasks = pdfTasks;
  }

  getPdfTasks() {
    return this.pdfTasks;
  }

  getProjectNo(key: string) {
    for(var proj of this.projects) {
      if(proj.key == key) {
        return proj.project_no;
      }
    }
  }

  getProjectName(key: string) {
    for(var proj of this.projects) {
      if(proj.key == key) {
        return proj.project_name;
      }
    }
  }

  getProjectComments(key: string) {
    for(var proj of this.projects) {
      if(proj.key == key) {
        //return proj.comments.replace(/\s/g, "");
        return proj.comments;
      }
    }
  }

  getProjectDueDate(key: string) {
    for(var proj of this.projects) {
      if(proj.key == key) {
        return this.datepipe.transform(proj.duedate, 'MM/dd/yyyy')
      }
    }
  }

  getProjectByKey(key: string) {
    for(var proj of this.projects) {
      if(proj.key == key) {
        return proj;
      }
    }
  }

  getProject() {
    return this.project;
  }

  setProject(project: Project) {
    this.project = project;
  }

  setDeliverables(deliverables :Deliverable[]) {
    this.deliverables = deliverables;
  }

  getDeliverables(): Deliverable[] {
    return this.deliverables;
  }

  getDeliverable() {
    return this.deliverable;
  }

  setDeliverable(deliverable: Deliverable) {
    this.deliverable = deliverable;
  }

  setTasks(tasks :Task[]) {
    this.tasks = tasks;
  }

  getTasks(): Task[] {
    return this.tasks;
  }

  getTask() {
    return this.task;
  }

  setTask(task: Task) {
    this.task = task;
  }
}
