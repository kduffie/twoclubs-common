import { CardRank, CARD_RANKS, Suit, SUITS } from "./common";

export class Card {
  private _rank: CardRank;
  private _suit: Suit;
  private _index: number;
  constructor(index: number) {
    if (index < 0 || index >= CARD_RANKS.length * SUITS.length) {
      throw new Error("Invalid card index");
    }
    this._index = Math.floor(index);
    this._suit = SUITS[Math.floor(index / CARD_RANKS.length)];
    this._rank = CARD_RANKS[Math.floor(index) % CARD_RANKS.length];
  }

  get rank(): CardRank {
    return this._rank;
  }
  get suit(): Suit {
    return this._suit;
  }

  get index(): number {
    return this._index;
  }

  isEqual(other: Card): boolean {
    return other.suit === this.suit && other.rank === this.rank;
  }

  compareTo(other: Card): number {
    if (other.rank === this.rank) {
      if (other.suit === this.suit) {
        return 0;
      } else {
        return SUITS.indexOf(this.suit) - SUITS.indexOf(other.suit);
      }
    } else {
      return CARD_RANKS.indexOf(this.rank) - CARD_RANKS.indexOf(this.rank);
    }
  }
}