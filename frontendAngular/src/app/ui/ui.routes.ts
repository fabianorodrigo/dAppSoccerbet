import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GamesHomeComponent } from './games/games-home/games-home.component';
// Components
import { ErrorComponent } from './components/error/error.component';
import { HomeComponent } from './home/home.component';
import { CurrentAccountResolver, OwnerGuard } from '../core';
import { BettokenHomeComponent } from './bettoken/bettoken-home/bettoken-home.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  {
    path: 'token',
    component: BettokenHomeComponent,
  },
  {
    path: 'adminBetToken',
    component: BettokenHomeComponent,
    canActivate: [OwnerGuard],
  },
  { path: 'games', component: GamesHomeComponent },
  {
    path: 'adminGames',
    component: GamesHomeComponent,
    canActivate: [OwnerGuard],
  },
  //{ path: 'account', component: AccountComponent},
  { path: '404', component: ErrorComponent },
  { path: '**', redirectTo: '/404' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UiRoutingModule {}
