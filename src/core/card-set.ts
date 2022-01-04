import { Card } from "./card";
import { CardRank, CARD_RANKS, getCardsInSuit, sortCards, Suit, SUITS, SUITS_REVERSE } from "./common";
const pad = require('utils-pad-string');
import * as assert from 'assert';
import { CardSuit } from "./card-suit";

export class CardSet {
  private _suits = new Map<Suit, CardSuit>();

  constructor(cards?: Card[]) {
    for (const suit of SUITS) {
      this._suits.set(suit, new CardSuit(suit));
    }
    if (cards) {
      for (const card of cards) {
        this.add(card);
      }
    }
  }

  clone(): CardSet {
    return new CardSet(this.cards);
  }

  add(card: Card): void {
    this._suits.get(card.suit)!.add(card);
  }

  remove(card: Card): boolean {
    return this._suits.get(card.suit)!.remove(card);
  }

  clear(): void {
    for (const suit of SUITS) {
      this._suits.get(suit)!.clear();
    }
  }

  get cards(): Card[] {
    const result: Card[] = [];
    for (const suit of SUITS_REVERSE) {
      result.push(... this._suits.get(suit)!.cards);
    }
    return result;
  }

  getSuit(suit: Suit): CardSuit {
    return this._suits.get(suit)!;
  }

  get highCardPoints(): number {
    let result = 0;
    for (const s of this._suits.values()) {
      result += s.highCardPoints
    }
    return result;
  }

  get distributionPoints(): number {
    let result = 0;
    for (const s of this._suits.values()) {
      result += s.distributionPoints;
    }
    return result;
  }

  get totalPoints(): number {
    let result = 0;
    for (const s of this._suits.values()) {
      result += s.totalPoints;
    }
    return result;
  }

  hasCard(card: Card): boolean {
    const s = this._suits.get(card.suit)!;
    return s.hasCard(card);
  }

  get length(): number {
    let result = 0;
    for (const s of this._suits.values()) {
      result += s.length;
    }
    return result;
  }

  getAvailableSuits(except?: Suit): Set<Suit> {
    const result = new Set<Suit>();
    for (const s of this._suits.values()) {
      if (!except || s.suit !== except) {
        if (s.length > 0) {
          result.add(s.suit);
        }
      }
    }
    return result;
  }

  hasNtDistribution(): boolean {
    let doubletonFound = false;
    for (const s of this._suits.values()) {
      if (s.length < 2) {
        return false;
      } else if (s.length === 2) {
        if (doubletonFound) {
          return false;
        } else {
          doubletonFound = true;
        }
      }
    }
    return true;
  }

  getLowestCard(suit?: Suit): Card | null {
    let lowest: Card | null = null;
    for (const s of this._suits.values()) {
      if (s.suit !== suit) {
        const slowest = s.lowestCard;
        if (slowest && (!lowest || slowest.rank < lowest.rank)) {
          lowest = slowest;
        }
      }
    }
    return lowest;
  }

  getStoppedSuits(): Set<Suit> {
    const result = new Set<Suit>();
    for (const s of this._suits.values()) {
      if (s.isStopped()) {
        result.add(s.suit);
      }
    }
    return result;
  }

  getWellStoppedSuits(): Set<Suit> {
    const result = new Set<Suit>();
    for (const s of this._suits.values()) {
      if (s.isWellStopped()) {
        result.add(s.suit);
      }
    }
    return result;
  }


  getFirstRoundStoppedSuits(includeVoid: boolean): Set<Suit> {
    const result = new Set<Suit>();
    for (const s of this._suits.values()) {
      if (s.hasFirstRoundStopper(includeVoid)) {
        result.add(s.suit);
      }
    }
    return result;
  }

  getFirstOrSecondRoundStoppedSuits(includeVoid: boolean): Set<Suit> {
    const result = new Set<Suit>();
    for (const s of this._suits.values()) {
      if (s.hasFirstOrSecondRoundStopper(includeVoid)) {
        result.add(s.suit);
      }
    }
    return result;
  }

  getBestSuit(): CardSuit {
    const major = this.getBestMajorSuit();
    const minor = this.getBestMinorSuit();
    if (major.isBetter(minor)) {
      return major;
    } else {
      return minor;
    }
  }

  getBestMajorSuit(): CardSuit {
    const spades = this.getSuit('S');
    const hearts = this.getSuit('H');
    if (hearts.isBetter(spades)) {
      return hearts;
    } else {
      return spades;
    }
  }

  getBestMinorSuit(): CardSuit {
    const clubs = this.getSuit('C');
    const diamonds = this.getSuit('D');
    if (diamonds.isBetter(clubs)) {
      return diamonds;
    } else {
      return clubs;
    }
  }

  toString(includePoints?: boolean): string {
    const result: string[] = [];
    for (const suit of SUITS_REVERSE) {
      const s = this._suits.get(suit)!;
      const padded = pad(s.toString(), 11);
      result.push(padded);
    }
    const cards = result.join(' ');
    return cards + (includePoints ? (` ${this.highCardPoints < 10 ? ' ' : ''}(${this.highCardPoints} ${this.totalPoints < 10 ? ' ' : ''}${this.totalPoints})  `) : '');
  }

}
