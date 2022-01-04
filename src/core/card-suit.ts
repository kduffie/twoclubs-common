import { Card } from "./card";
import { CardRank, CARD_RANKS, Suit } from "./common";
import * as assert from 'assert';

export class CardSuit {
  private _suit: Suit;
  private _ranks: CardRank[] = [];

  constructor(suit: Suit) {
    this._suit = suit;
  }

  get suit(): Suit {
    return this._suit;
  }

  get ranks(): CardRank[] {
    return Array.from(this._ranks);
  }

  clone(): CardSuit {
    const result = new CardSuit(this._suit);
    for (const rank of this.ranks) {
      result.add(new Card(rank, this.suit));
    }
    return result;
  }

  add(card: Card): void {
    assert(card.suit === this.suit);
    assert(this._ranks.indexOf(card.rank) < 0);
    this._ranks.push(card.rank);
    this.sort();
  }

  private sort(): void {
    this._ranks.sort((a, b) => {
      return CARD_RANKS.indexOf(b) - CARD_RANKS.indexOf(a);
    });
  }


  remove(card: Card): boolean {
    assert(card.suit === this.suit);
    const index = this._ranks.indexOf(card.rank);
    if (index < 0) {
      return false;
    }
    this._ranks.splice(index, 1);
    return true;
  }

  hasCard(card: Card): boolean {
    assert(card.suit === this.suit);
    return this.includes(card.rank);
  }

  clear(): void {
    this._ranks = [];
  }

  get cards(): Card[] {
    const result: Card[] = [];
    for (const r of this._ranks) {
      result.push(new Card(r, this.suit));
    }
    return result;
  }

  get highCardPoints(): number {
    let result = 0;
    for (const r of this._ranks) {
      switch (r) {
        case 'A':
          result += 4;
          break;
        case 'K':
          result += 3;
          break;
        case 'Q':
          result += 2;
          break;
        case 'J':
          result += 1;
      }
    }
    return result;
  }

  get distributionPoints(): number {
    let result = 0;
    switch (this.length) {
      case 2:
        result += 1;
        break;
      case 1:
        result += 2;
        break;
      case 0:
        result += 3;
        break;
    }
    return result;
  }

  get totalPoints(): number {
    return this.highCardPoints + this.distributionPoints;
  }

  get length(): number {
    return this._ranks.length;
  }

  get lowestCard(): Card | null {
    if (this._ranks.length === 0) {
      return null;
    }
    return new Card(this._ranks[this._ranks.length - 1], this.suit);
  }

  get highestCard(): Card | null {
    if (this._ranks.length === 0) {
      return null;
    }
    return new Card(this._ranks[0], this.suit);
  }

  getHighestCardToCover(card: Card): Card | null {
    assert(card.suit === this.suit);
    if (this._ranks.length === 0) {
      return null;
    }
    if (CARD_RANKS.indexOf(this._ranks[0]) > CARD_RANKS.indexOf(card.rank)) {
      return new Card(this._ranks[0], this.suit);
    }
    return null;
  }

  getMinimumCardtToCover(card: Card): Card | null {
    assert(card.suit === this.suit);
    for (let i = 0; i < this._ranks.length; i++) {
      if (CARD_RANKS.indexOf(this._ranks[this._ranks.length - 1 - i]) > CARD_RANKS.indexOf(card.rank)) {
        return new Card(this._ranks[this._ranks.length - 1 - i], this.suit);
      }
    }
    return null;
  }

  isBetter(other: CardSuit): number {
    if (this.length > other.length) {
      return 1;
    } else if (this.length < other.length) {
      return -1
    } else {
      return this.highCardPoints - other.highCardPoints;
    }
  }

  isStopped(): boolean {
    const l = this.length;
    return l >= 5 || this.includes('A') ||
      (this.includes('K') && l >= 2) ||
      (this.includes('Q') && l >= 3) ||
      (this.includes('J') && l >= 4);
  }

  isWellStopped(): boolean {
    const l = this.length;
    return l >= 6 || this.includes('A', 'K') ||
      (this.includes('A', 'Q') && l >= 3) ||
      (this.includes('A', 'J') && l >= 4) ||
      (this.includes('K', 'Q') && l >= 4) ||
      (this.includes('K', 'J') && l >= 4) ||
      (this.includes('Q', 'J') && l >= 4) ||
      (this.includes('A') && l >= 5) ||
      (this.includes('K') && l >= 5) ||
      (this.includes('Q') && l >= 5) ||
      (this.includes('J') && l >= 5);
  }

  hasFirstRoundStopper(includeVoid: boolean): boolean {
    if (includeVoid && this.length === 0) {
      return true;
    }
    return this.includes('A');
  }

  hasFirstOrSecondRoundStopper(includeVoid: boolean): boolean {
    if (includeVoid && this.length < 2) {
      return true;
    }
    return this.includes('A') || (this.length >= 2 && this.includes('K'));
  }

  includes(...ranks: CardRank[]): boolean {
    if (ranks.length === 0) {
      return true;
    }
    for (const r of ranks) {
      if (this._ranks.indexOf(r) < 0) {
        return false;
      }
    }
    return true;
  }

  toString(): string {
    let result = this.suit + ': ';
    if (this._ranks.length === 0) {
      result += '-';
    } else {
      for (const r of this._ranks) {
        result += r;
      }
    }
    return result;
  }
}
