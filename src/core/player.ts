import { Board } from "./board";
import { Seat } from "./common";
import { Trick } from "./trick";

export interface Player {
  seat: Seat;
  play: (board: Board, trick: Trick) => void;
}

export abstract class PlayerImpl implements Player {
  private _seat: Seat;

  constructor(seat: Seat) {
    this._seat = seat;
  }

  get seat(): Seat {
    return this._seat;
  }

  abstract play(board: Board, trick: Trick): void;
}