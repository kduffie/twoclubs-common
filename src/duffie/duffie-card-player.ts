import { Hand } from "../core/hand";
import { FinalBoardContext, PlayContext, randomlySelect, Seat } from "../core/common";
import { BridgeCardPlayer } from "../core/player";
import { Card } from "../core/card";

export class DuffieCardPlayer implements BridgeCardPlayer {
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
    return randomlySelect(hand.getEligibleToPlay(context.playCurrentTrick.getLeadSuit()));
  }
  async playFromDummy(context: PlayContext, dummy: Hand, hand: Hand): Promise<Card> {
    return randomlySelect(dummy.getEligibleToPlay(context.playCurrentTrick.getLeadSuit()));
  }
  async finishPlay(context: FinalBoardContext): Promise<void> {
    // noop
  }

}