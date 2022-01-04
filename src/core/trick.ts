import { Board } from "./board";
import { getSeatFollowing, Seat, SEATS, Partnership, getPartnershipBySeat, Suit } from "./common";
import { Play } from "./play";
import * as assert from 'assert';

export class Trick {
  private _board: Board;
  private _leader: Seat;
  private _plays: Play[] = [];
  private _winningIndex = -1;

  constructor(board: Board, leader: Seat) {
    this._board = board;
    this._leader = leader;
  }

  get plays(): Play[] {
    return this._plays;
  }

  get leader(): Seat {
    return this._leader;
  }

  get winner(): Play | null {
    if (this._winningIndex < 0) {
      return null;
    }
    return this.plays[this._winningIndex];
  }

  get winningPartnership(): Partnership | null {
    if (!this.winner) {
      return null;
    }
    return getPartnershipBySeat(this.winner.by);
  }

  playCard(play: Play): Play | null {
    if (this.plays.length === 0) {
      assert(play.by === this._leader);
    } else {
      assert(play.by === getSeatFollowing(this.plays[this.plays.length - 1].by));
    }
    this.plays.push(play);
    if (this.plays.length === SEATS.length) {
      return this.determineWinner();
    } else {
      return null;
    }
  }

  getLeadSuit(): Suit | null {
    if (this.plays.length === 0) {
      return null;
    }
    return this.plays[0].card.suit;
  }

  getNextPlayer(): Seat {
    assert(this.plays.length > 0);
    if (this.winner) {
      return this.winner.by;
    }
    return getSeatFollowing(this.plays[this.plays.length - 1].by);
  }

  private determineWinner(): Play {
    assert(this._board.contract);
    assert(this.plays.length === SEATS.length);
    let winningIndex = 0;
    for (let i = 1; i < this.plays.length; i++) {
      if (this.plays[i].card.isBetter(this.plays[winningIndex].card, this._board.contract.strain)) {
        winningIndex = i;
      }
    }
    this._winningIndex = winningIndex;
    return this.plays[this._winningIndex];
  }

  getCurrentBest(): Play | null {
    assert(this._board.contract);
    if (this.plays.length === 0) {
      return null;
    }
    let bestIndex = 0;
    for (let i = 1; i < this.plays.length; i++) {
      if (this.plays[i].card.isBetter(this.plays[bestIndex].card, this._board.contract.strain)) {
        bestIndex = i;
      }
    }
    return this.plays[bestIndex];
  }

  toString(): string {
    const result: string[] = [];
    for (const p of this.plays) {
      result.push(p.toString());
    }
    return result.join('  ') + (this._winningIndex >= 0 ? `   won by ${this.plays[this._winningIndex].by}` : '');
  }
}