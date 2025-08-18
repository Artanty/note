import { HttpClientModule } from "@angular/common/http"
import { NgModule } from "@angular/core"
import { FormsModule, ReactiveFormsModule } from "@angular/forms"
import { BrowserModule } from "@angular/platform-browser"
import { BrowserAnimationsModule } from "@angular/platform-browser/animations"
import { BehaviorSubject } from "rxjs"
import { BusEvent, EVENT_BUS, HOST_NAME } from "typlib"
import { AppRoutingModule } from "./app-routing.module"
import { AppComponent } from "./app.component";
import { NoteModule } from "./note/note.module";

export const initBusEvent: BusEvent = {
  event: "INIT",
  from: `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}`,
  to: "",
  payload: {}
}

const eventBus$ = new BehaviorSubject(initBusEvent)

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    NoteModule
  ],
  /**
   * Эти провайдеры для standalone сборки приложения note-web
   * при mfe сборке будут работать провайдеры host'а.
   */
  providers: [
    { provide: EVENT_BUS, useValue: eventBus$ },
    { provide: HOST_NAME, useValue: 'note@web-standalone' },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {} 
