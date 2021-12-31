import { Card } from "./card";
import { CARD_RANKS, Seat, Strain } from "./common";

export class Play {
  private _by: Seat;
  private _card: Card;

  constructor(by: Seat, card: Card) {
    this._by = by;
    this._card = card;
  }

  get by(): Seat {
    return this._by;
  }

  get card(): Card {
    return this._card;
  }

  isBetter(other: Card, trump: Strain): boolean {
    if (other.suit === this.card.suit) {
      return CARD_RANKS.indexOf(other.rank) > CARD_RANKS.indexOf(this.card.rank);
    } else if (trump === 'N') {
      return false;
    } else {
      return other.suit === trump;
    }
  }
}