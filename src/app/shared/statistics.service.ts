import {Injectable} from '@angular/core';
import {db} from './database';
import {createHistogram} from "./utilities";

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {


  async updatePlayerStatsById(id: number) {

    const histogram = createHistogram();
    const rolls = await db.rolls.where({playerId: id}).toArray();
    const totalRolls = rolls.length;
    const robberRolls = rolls.filter(roll => roll.isRobber).length;
    for (const roll of rolls) {
      histogram[roll.total] += 1;
    }

    const gameList = await db.games
      .filter(x => x.roster.filter(x => x.id === id).length > 0)
      .toArray();

    const gamesPlayed = gameList.length;

    let fastestWinSeconds = 0;
    let gamesWon = 0;
    let wonGames = gameList.filter(x => x.winnerId === id);
    gamesWon = wonGames.length;
    fastestWinSeconds = Math.min(...wonGames.map(x => x.duration).values());
    const secondsPlayed = gameList.filter(x => x.completedOn).map(x => x.duration).reduce((a, b) => a + b);
    let lastPlayed = gameList.reverse().at(0)?.createdOn;

    // win streak calculation
    let currentStreak = 0;
    let longestWinsStreak = 0;
    gameList.forEach(game => {
      if (game.winnerId !== id) {
        if (longestWinsStreak < currentStreak) {
          longestWinsStreak = currentStreak;
        }
        currentStreak = 0;
      } else {
        currentStreak++;
      }
    });
    if (longestWinsStreak < currentStreak) {
      longestWinsStreak = currentStreak;
    }

    const changes = {histogram, lastPlayed, gamesPlayed, gamesWon, secondsPlayed, robberRolls, totalRolls, fastestWinSeconds, longestWinsStreak};
    await db.players.update(id, changes);
  }

}
