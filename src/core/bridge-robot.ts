import { Bid } from "./bid";
import { Card } from "./card";
import { BidContext, PlayContext, Seat } from "./common";
import { ConventionCard } from "./convention-card";
import { Hand } from "./hand";
import { BridgeBidder, BridgeCardPlayer, BridgePlayer, BridgePlayerBase } from "./player";

export class BridgeRobot extends BridgePlayerBase {
  private _bidder: BridgeBidder;
  private _player: BridgeCardPlayer;

  constructor(bidder: BridgeBidder, player: BridgeCardPlayer) {
    super();
    this._bidder = bidder;
    this._player = player;
  }

  get seat(): Seat {
    return super.seat;
  }

  set seat(value: Seat) {
    super.seat = value;
    this._bidder.seat = value;
    this._player.seat = value;
  }

  get conventionCard(): ConventionCard {
    return this._bidder.conventionCard;
  }

  async bid(context: BidContext, hand: Hand): Promise<Bid> {
    return this._bidder.bid(context, hand);
  }

  async playFromDummy(context: PlayContext, dummy: Hand, hand: Hand): Promise<Card> {
    return this._player.playFromDummy(context, dummy, hand);
  }

  async play(context: PlayContext, hand: Hand, dummy: Hand | null): Promise<Card> {
    return this._player.play(context, hand, dummy);
  }
}
