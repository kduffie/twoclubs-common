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

  toString(): string {
    return `${this.by}: ${this.card.toString()}`;
  }
}