import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGamesHomeComponent } from './admin-games/admin-games-home/admin-games-home.component';
// Components
import { ErrorComponent } from './components/error/error.component';
import { GamesComponent } from './games/games.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  //{ path: 'money', component: TransactionComponent },
  { path: 'home', component: HomeComponent },
  { path: 'games', component: GamesComponent },
  { path: 'adminGames', component: AdminGamesHomeComponent },
  //{ path: 'account', component: AccountComponent},
  { path: '404', component: ErrorComponent },
  { path: '**', redirectTo: '/404' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UiRoutingModule {}
