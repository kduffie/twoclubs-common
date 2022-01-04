import { Bid } from "./bid";
import { Card } from "./card";
import { BidContext, BoardContext, FinalBoardContext, PlayContext, randomlySelect, Seat } from "./common";
import { ConventionCard, SimpleConventionCard } from "./convention-card";
import { Hand } from "./hand";


export interface BridgeBidder {
  seat: Seat;
  conventionCard: ConventionCard;
  acceptConventions(conventionCard: ConventionCard): boolean;
  startBoard: (context: BoardContext) => Promise<void>;
  bid: (context: BidContext, hand: Hand) => Promise<Bid>;

}

export interface BridgeCardPlayer {
  seat: Seat;
  startPlay: (context: PlayContext) => Promise<void>;
  play: (context: PlayContext, hand: Hand, dummy: Hand | null) => Promise<Card>;
  playFromDummy(context: PlayContext, dummy: Hand, hand: Hand): Promise<Card>;
  finishPlay: (context: FinalBoardContext) => Promise<void>;
}

export interface BridgePlayer extends BridgeBidder, BridgeCardPlayer {
  seat: Seat;
}

export class BridgePlayerBase implements BridgePlayer {
  protected _seat: Seat = 'N';
  protected _conventionCard = new SimpleConventionCard('none');

  get seat(): Seat {
    return this._seat;
  }

  set seat(value: Seat) {
    this._seat = value;
  }

  async startBoard(context: BoardContext): Promise<void> {
    // available for derived implementation
  }

  async bid(context: BidContext, hand: Hand): Promise<Bid> {
    return new Bid('pass');
  }

  async startPlay(context: PlayContext): Promise<void> {
    // available for derived implementation
  }

  async playFromDummy(context: PlayContext, dummy: Hand, hand: Hand): Promise<Card> {
    const cards = dummy.getEligibleToPlay(context.playCurrentTrick.getLeadSuit());
    return randomlySelect(cards);
  }

  async play(context: PlayContext, hand: Hand, dummy: Hand | null): Promise<Card> {
    const cards = hand.getEligibleToPlay(context.playCurrentTrick.getLeadSuit());
    return randomlySelect(cards);
  }

  async finishPlay(context: FinalBoardContext): Promise<void> {
    // available for derived implementation
  }

  get conventionCard(): ConventionCard {
    return this._conventionCard;
  }

  acceptConventions(conventionCard: ConventionCard): boolean {
    return conventionCard.approach === 'none';
  }
}