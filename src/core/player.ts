import { Bid } from "./bid";
import { Card } from "./card";
import { BidContext, BoardContext, FinalBoardContext, PlayContext, randomlySelect, Seat } from "./common";
import { Hand } from "./hand";


export interface Player {
  seat: Seat;
  startBoard: (context: BoardContext) => Promise<void>;
  bid: (context: BidContext) => Promise<Bid>;
  startPlay: (context: PlayContext) => Promise<void>;
  play: (context: PlayContext, hand: Hand) => Promise<Card>;
  finishPlay: (context: FinalBoardContext) => Promise<void>
}

export type PlayerFactory = (seat: Seat) => Player;

export class PlayerBase implements Player {
  private _seat: Seat;

  constructor(seat: Seat) {
    this._seat = seat;
  }

  get seat(): Seat {
    return this._seat;
  }

  async startBoard(context: BoardContext): Promise<void> {
    // available for derived implementation
  }

  async bid(context: BidContext): Promise<Bid> {
    return new Bid('pass');
  }

  async startPlay(context: PlayContext): Promise<void> {
    // available for derived implementation
  }

  async play(context: PlayContext, hand: Hand): Promise<Card> {
    const cards = hand.getEligibleToPlay(context.playCurrentTrick.getLeadSuit());
    return randomlySelect(cards);
  }

  async finishPlay(context: FinalBoardContext): Promise<void> {
    // available for derived implementation
  }
}