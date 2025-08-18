import { NgModule } from '@angular/core';
import { NoPreloading, RouterModule, Routes } from '@angular/router';

import { NoteComponent } from './note/note.component';
import { AppComponent } from './app.component';

const routes: Routes = [
  { 
    path: 'note',
    loadChildren: () => import('./note/note.module').then(m => m.NoteModule)
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: NoPreloading })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
