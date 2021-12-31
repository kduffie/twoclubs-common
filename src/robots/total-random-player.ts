import { PlayerImpl } from "../core/player";
import { Seat } from "../core/common";
import { Board } from "../core/board";
import { Trick } from "../core/trick";
import { assert } from "console";
import * as shuffle from "shuffle-array";
import { Play } from "../core/play";

export class TotalRandomPlayer extends PlayerImpl {
  constructor(seat: Seat) {
    super(seat);
  }

  play(board: Board, trick: Trick): void {
    const hand = board.getHand(this.seat);
    assert(hand);
    const cards = hand.getEligibleToPlay(trick.plays.length > 0 ? trick.plays[0].card.suit : undefined);
    assert(cards.length > 0);
    const selected = shuffle.pick(cards);
    const play = new Play(this.seat, Array.isArray(selected) ? selected[0] : selected);
    board.playCard(play);
  }
}