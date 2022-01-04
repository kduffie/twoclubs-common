import { Hand } from "../core/hand";
import { FinalBoardContext, PlayContext, randomlySelect, Seat } from "../core/common";
import { BridgeCardPlayer } from "../core/player";
import { Card } from "../core/card";
import * as assert from 'assert';

export class RandomPlayer implements BridgeCardPlayer {
  private _mseat: Seat = 'N';

  get seat(): Seat {
    return this._mseat;
  }
  set seat(value: Seat) {
    this._mseat = value;
  }

  async startPlay(context: PlayContext): Promise<void> {
    // noop
  }

  async play(context: PlayContext, hand: Hand, dummy: Hand | null): Promise<Card> {
    let eligible = hand.getEligibleToPlay(context.playCurrentTrick.getLeadSuit());
    if (eligible.length === 0) {
      eligible = hand.unplayed;
    }
    return randomlySelect(eligible.cards, context.randomGenerator);
  }
  async playFromDummy(context: PlayContext, dummy: Hand, hand: Hand): Promise<Card> {
    let eligible = dummy.getEligibleToPlay(context.playCurrentTrick.getLeadSuit());
    if (eligible.length === 0) {
      eligible = hand.unplayed;
    }
    return randomlySelect(eligible.cards, context.randomGenerator);
  }

  async finishPlay(context: FinalBoardContext): Promise<void> {
    // noop
  }
}