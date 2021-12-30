import { Board } from "./board";
import { getFollowingSeat, Seat, SEATS, Partnership, getPartnershipBySeat } from "./common";
import { Play } from "./play";
import * as assert from 'assert';

export class Trick {
  private _board: Board;
  private _plays: Play[] = [];
  private _winningIndex = -1;

  constructor(board: Board) {
    this._board = board;
  }

  get plays(): Play[] {
    return this._plays;
  }

  get winner(): Play | null {
    if (this._winningIndex < 0) {
      return null;
    }
    return this.plays[this._winningIndex];
  }

  get winningPartnership(): Partnership {
    assert(this.winner);
    return getPartnershipBySeat(this.winner.by);
  }

  playCard(play: Play): Play | null {
    this.plays.push(play);
    if (this.plays.length > 0) {
      assert(play.by === getFollowingSeat(this.plays[this.plays.length - 1].by));
    }
    if (this.plays.length === SEATS.length) {
      return this.determineWinner();
    } else {
      return null;
    }
  }

  getNextPlayer(): Seat {
    assert(this.plays.length > 0);
    return getFollowingSeat(this.plays[this.plays.length - 1].by);
  }

  private determineWinner(): Play {
    assert(this._board.contract);
    let winningIndex = 0;
    for (let i = 1; i < SEATS.length; i++) {
      if (this.plays[i].isBetter(this.plays[winningIndex].card, this._board.contract?.strain)) {
        winningIndex = i;
      }
    }
    return this.plays[winningIndex];
  }
}