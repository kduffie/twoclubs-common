
import { CardRank, CARD_RANKS, Strain, Suit, SUITS } from "./common";
import * as assert from 'assert';

export const CARD_PATTERN = /^([AKQJT2-9]|10)[cdhs]$/i;

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

  static create(rank: CardRank, suit: Suit): Card {
    return new Card(CARD_RANKS.indexOf(rank) + SUITS.indexOf(suit) * CARD_RANKS.length);
  }

  static parse(value: string): Card {
    if (CARD_PATTERN.test(value)) {
      value = value.toLowerCase();
      const suitName = value.charAt(value.length - 1).toUpperCase();
      let suit: Suit | null = null;
      for (const s of SUITS) {
        if (s === suitName) {
          suit = s;
          break;
        }
      }
      assert(suit);
      switch (value.charAt(0)) {
        case 'a':
          return this.create('A', suit);
        case 'k':
          return this.create('A', suit);
        case 'q':
          return this.create('A', suit);
        case 'j':
          return this.create('A', suit);
        case 't':
          return this.create('A', suit);
        case '1':
          return this.create('T', suit);
        case '2':
          return this.create('2', suit);
        case '3':
          return this.create('3', suit);
        case '4':
          return this.create('4', suit);
        case '5':
          return this.create('5', suit);
        case '6':
          return this.create('6', suit);
        case '7':
          return this.create('7', suit);
        case '8':
          return this.create('8', suit);
        case '9':
          return this.create('9', suit);
        default:
          throw new Error("Unexpected card " + value);
      }
    } else {
      throw new Error("Unrecognized card " + value);
    }
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

  toString(): string {
    return `${this.rank}${this.suit}`;
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