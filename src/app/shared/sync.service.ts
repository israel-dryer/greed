import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  writeBatch,
  deleteDoc,
  query,
  Unsubscribe
} from 'firebase/firestore';
import { firestore } from './firebase';
import { AuthService } from './auth.service';
import { db } from './database';
import { GreedGame, Player, Turn, Settings } from './types';

const APP_PREFIX = 'greed';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private readonly authService = inject(AuthService);
  private unsubscribers: Unsubscribe[] = [];

  private getUserCollection(collectionName: string) {
    const uid = this.authService.getUserId();
    if (!uid) throw new Error('User not authenticated');
    // Path: users/{uid}/{app}-{collection} e.g. users/abc123/greed-players
    return collection(firestore, 'users', uid, `${APP_PREFIX}-${collectionName}`);
  }

  // Remove undefined values recursively (Firestore doesn't accept undefined)
  private cleanForFirestore(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanForFirestore(item));
    }
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.cleanForFirestore(value);
        }
      }
      return cleaned;
    }
    return obj;
  }

  async syncToCloud(): Promise<void> {
    const uid = this.authService.getUserId();
    if (!uid) return;

    const batch = writeBatch(firestore);

    // Sync players
    const players = await db.players.toArray();
    for (const player of players) {
      const docRef = doc(this.getUserCollection('players'), String(player.id));
      batch.set(docRef, this.cleanForFirestore(player));
    }

    // Sync games
    const games = await db.games.toArray();
    for (const game of games) {
      const docRef = doc(this.getUserCollection('games'), String(game.id));
      batch.set(docRef, this.cleanForFirestore(game));
    }

    // Sync turns
    const turns = await db.turns.toArray();
    for (const turn of turns) {
      const docRef = doc(this.getUserCollection('turns'), String(turn.id));
      batch.set(docRef, this.cleanForFirestore(turn));
    }

    // Sync settings
    const settings = await db.settings.get(1);
    if (settings) {
      const docRef = doc(this.getUserCollection('settings'), '1');
      batch.set(docRef, this.cleanForFirestore(settings));
    }

    await batch.commit();
    console.log('Data synced to cloud');
  }

  async syncFromCloud(): Promise<void> {
    const uid = this.authService.getUserId();
    if (!uid) return;

    // Fetch players
    const playersSnapshot = await getDocs(query(this.getUserCollection('players')));
    const cloudPlayers: Player[] = [];
    playersSnapshot.forEach(doc => {
      cloudPlayers.push(doc.data() as Player);
    });

    // Fetch games
    const gamesSnapshot = await getDocs(query(this.getUserCollection('games')));
    const cloudGames: GreedGame[] = [];
    gamesSnapshot.forEach(doc => {
      cloudGames.push(doc.data() as GreedGame);
    });

    // Fetch turns
    const turnsSnapshot = await getDocs(query(this.getUserCollection('turns')));
    const cloudTurns: Turn[] = [];
    turnsSnapshot.forEach(doc => {
      cloudTurns.push(doc.data() as Turn);
    });

    // Fetch settings
    const settingsSnapshot = await getDocs(query(this.getUserCollection('settings')));
    let cloudSettings: Settings | null = null;
    settingsSnapshot.forEach(doc => {
      cloudSettings = doc.data() as Settings;
    });

    // Merge with local data (cloud wins for now - simple strategy)
    if (cloudPlayers.length > 0) {
      await db.players.clear();
      await db.players.bulkPut(cloudPlayers);
    }

    if (cloudGames.length > 0) {
      await db.games.clear();
      await db.games.bulkPut(cloudGames);
    }

    if (cloudTurns.length > 0) {
      await db.turns.clear();
      await db.turns.bulkPut(cloudTurns);
    }

    if (cloudSettings) {
      await db.settings.put(cloudSettings, 1);
    }

    console.log('Data synced from cloud');
  }

  async deleteCloudData(): Promise<void> {
    const uid = this.authService.getUserId();
    if (!uid) return;

    // Delete all user data from Firestore
    const collections = ['players', 'games', 'turns', 'settings'];

    for (const collectionName of collections) {
      const snapshot = await getDocs(this.getUserCollection(collectionName));
      for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref);
      }
    }

    console.log('Cloud data deleted');
  }

  // Call this when user logs in
  async onUserLogin(): Promise<void> {
    // First sync from cloud to get any existing data
    await this.syncFromCloud();
    // Then sync local data to cloud (merges new local data)
    await this.syncToCloud();
  }

  // Call this when user logs out
  onUserLogout(): void {
    // Unsubscribe from any real-time listeners
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}
