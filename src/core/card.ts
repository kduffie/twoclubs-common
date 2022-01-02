
import { CardRank, CARD_RANKS, Strain, Suit, SUITS } from "./common";
import * as assert from 'assert';

export const CARD_PATTERN = /^([AKQJT2-9]|10)[cdhs]$/i;

export class Card {
  private _rank: CardRank;
  private _suit: Suit;
  constructor(rank: CardRank, suit: Suit) {
    this._suit = suit
    this._rank = rank;
  }

  get name(): string {
    return this._rank + this._suit;
  }

  static parse(name: string): Card {
    if (CARD_PATTERN.test(name)) {
      name = name.toLowerCase();
      const suitName = name.charAt(name.length - 1).toUpperCase();
      let suit: Suit | null = null;
      for (const s of SUITS) {
        if (s === suitName) {
          suit = s;
          break;
        }
      }
      assert(suit);
      switch (name.charAt(0)) {
        case 'a':
          return new Card('A', suit);
        case 'k':
          return new Card('A', suit);
        case 'q':
          return new Card('A', suit);
        case 'j':
          return new Card('A', suit);
        case 't':
          return new Card('A', suit);
        case '1':
          assert(name.charAt(1) === '0', 'Illegal card name');
          return new Card('T', suit);
        case '2':
          return new Card('2', suit);
        case '3':
          return new Card('3', suit);
        case '4':
          return new Card('4', suit);
        case '5':
          return new Card('5', suit);
        case '6':
          return new Card('6', suit);
        case '7':
          return new Card('7', suit);
        case '8':
          return new Card('8', suit);
        case '9':
          return new Card('9', suit);
        default:
          throw new Error("Unexpected card " + name);
      }
    } else {
      throw new Error("Unrecognized card " + name);
    }
  }

  get rank(): CardRank {
    return this._rank;
  }
  get suit(): Suit {
    return this._suit;
  }

  isEqual(other: Card): boolean {
    return other.suit === this.suit && other.rank === this.rank;
  }

  toString(): string {
    return this.name;
  }

  isBetter(other: Card, trump: Strain): boolean {
    if (other.suit === this.suit) {
      return CARD_RANKS.indexOf(this.rank) > CARD_RANKS.indexOf(other.rank);
    } else if (trump === 'N') {
      return false;
    } else {
      return this.suit === trump;
    }
  }

}