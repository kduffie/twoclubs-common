import { Card } from "./card";
import { CardRank, CARD_RANKS, getCardsInSuit, sortCards, Suit, SUITS } from "./common";
const pad = require('utils-pad-string');
import * as assert from 'assert';

export class CardSet {
  private _suits = new Map<Suit, Card[]>();

  constructor(cards?: Card[]) {
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
    let cs = this._suits.get(card.suit);
    if (!cs) {
      cs = [];
      this._suits.set(card.suit, cs);
    }
    cs.push(card);
    sortCards(cs);
  }


  remove(card: Card): Card | null {
    const cs = this._suits.get(card.suit);
    if (cs) {
      for (let i = 0; i < cs.length; i++) {
        if (cs[i].rank === card.rank) {
          const result = cs[i];
          cs.splice(i, 1);
          if (cs.length === 0) {
            this._suits.delete(card.suit);
          }
          return result;
        }
      }
    }
    return null;
  }

  clear(): void {
    this._suits.clear();
  }

  get cards(): Card[] {
    const result: Card[] = [];
    for (const cs of this._suits.values()) {
      result.push(...cs);
    }
    sortCards(result);
    return result;
  }

  get suit(): Suit {
    assert(this._suits.size === 1);
    return Array.from(this._suits.keys())[0];
  }

  get highCardPoints(): number {
    let result = 0;
    for (const suit of this._suits.keys()) {
      result += this.getHighCardPointsInSuit(suit);
    }
    return result;
  }

  get totalPoints(): number {
    let result = 0;
    for (const suit of SUITS) {
      result += this.getHighCardPointsInSuit(suit);
    }
    return result;
  }

  find(card: Card): Card | null {
    const cs = this._suits.get(card.suit);
    if (cs) {
      for (const c of cs) {
        if (c.rank === card.rank) {
          return c;
        }
      }
    }
    return null;
  }

  get length(): number {
    let result = 0;
    for (const cs of this._suits.values()) {
      result += cs.length;
    }
    return result;
  }

  getHighCardPointsInSuit(suit: Suit): number {
    let result = 0;
    const cs = this._suits.get(suit);
    if (cs) {
      for (const card of cs) {
        switch (card.rank) {
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
    }
    return result;
  }
  getTotalPointsInSuit(suit: Suit): number {
    const cs = this._suits.get(suit) || [];
    switch (cs.length) {
      case 0:
        return 3;
      case 1:
        return 2;
      case 2:
        return 1;
      default:
        return 0;
    }
  }

  get suits(): Set<Suit> {
    return new Set(this._suits.keys());
  }

  getSuitsExcept(suit: Suit): Set<Suit> {
    const result = this.suits;
    this.suits.delete(suit);
    return result;
  }

  hasNtDistribution(): boolean {
    let doubletonFound = false;
    for (const suit of SUITS) {
      const cs = this._suits.get(suit) || [];
      if (cs.length < 2) {
        return false;
      } else if (cs.length === 2) {
        if (doubletonFound) {
          return false;
        } else {
          doubletonFound = true;
        }
      }
    }
    return true;
  }

  getLength(suit: Suit): number {
    return (this._suits.get(suit) || []).length;
  }

  getCardsInSuit(suit: Suit): CardSet {
    const result = [... this._suits.get(suit) || []];
    return new CardSet(result);
  }

  getLowestCardInSuit(suit: Suit): Card | null {
    const cs = this._suits.get(suit);
    if (cs && cs.length > 0) {
      return cs[cs.length - 1];
    } else {
      return null;
    }
  }

  getLowestCardInAnySuit(): Card {
    let lowest: Card | null = null;
    for (const cs of this._suits.values()) {
      if (!lowest || CARD_RANKS.indexOf(cs[cs.length - 1].rank) < CARD_RANKS.indexOf(lowest.rank)) {
        lowest = cs[cs.length - 1];
      }
    }
    assert(lowest);
    return lowest;
  }

  getLowestCardInAnySuitExcept(suit: Suit): Card | null {
    let lowest: Card | null = null;
    for (const suit of this._suits.keys()) {
      if (suit !== suit) {
        const cs = this._suits.get(suit)!;
        if (!lowest || CARD_RANKS.indexOf(cs[cs.length - 1].rank) < CARD_RANKS.indexOf(lowest.rank)) {
          lowest = cs[cs.length - 1];
        }
      }
    }
    return lowest;
  }

  getHighestCardInSuit(suit: Suit): Card | null {
    const cs = this._suits.get(suit);
    if (cs && cs.length > 0) {
      return cs[0];
    }
    return null;
  }

  getHighestCardToCover(card: Card): Card | null {
    const cs = this._suits.get(card.suit);
    if (cs && cs.length > 0) {
      if (CARD_RANKS.indexOf(cs[0].rank) > CARD_RANKS.indexOf(card.rank)) {
        return cs[0];
      }
    }
    return null;
  }

  getMinimumCardtToCover(card: Card): Card | null {
    const cs = this._suits.get(card.suit);
    if (cs) {
      for (let i = 0; i < cs.length; i++) {
        if (CARD_RANKS.indexOf(cs[cs.length - 1 - i].rank) > CARD_RANKS.indexOf(card.rank)) {
          return cs[cs.length - 1 - i];
        }
      }
    }
    return null;
  }

  isVoid(suit: Suit): boolean {
    return this.getLength(suit) === 0;
  }

  isBetter(other: CardSet): number {
    if (this.length > other.length) {
      return 1;
    } else if (this.length < other.length) {
      return -1
    } else {
      return this.highCardPoints - other.highCardPoints;
    }
  }

  getStoppedSuits(): Set<Suit> {
    const result = new Set<Suit>();
    for (const suit of this._suits.keys()) {
      if (this.isStopped(suit)) {
        result.add(suit);
      }
    }
    return result;
  }

  getWellStoppedSuits(): Set<Suit> {
    const result = new Set<Suit>();
    for (const suit of this._suits.keys()) {
      if (this.isWellStopped(suit)) {
        result.add(suit);
      }
    }
    return result;
  }

  isStopped(suit: Suit): boolean {
    const l = this.length;
    return l >= 5 || this.includes(suit, 'A') ||
      (this.includes(suit, 'K') && l >= 2) ||
      (this.includes(suit, 'Q') && l >= 3) ||
      (this.includes(suit, 'J') && l >= 4);
  }

  isWellStopped(suit: Suit): boolean {
    const l = this.length;
    return l >= 6 || this.includes(suit, 'A', 'K') ||
      (this.includes(suit, 'A', 'Q') && l >= 3) ||
      (this.includes(suit, 'A', 'J') && l >= 4) ||
      (this.includes(suit, 'K', 'Q') && l >= 4) ||
      (this.includes(suit, 'K', 'J') && l >= 4) ||
      (this.includes(suit, 'Q', 'J') && l >= 4) ||
      (this.includes(suit, 'A') && l >= 5) ||
      (this.includes(suit, 'K') && l >= 5) ||
      (this.includes(suit, 'Q') && l >= 5) ||
      (this.includes(suit, 'J') && l >= 5);
  }

  hasFirstRoundStopper(suit: Suit, includeVoid: boolean): boolean {
    return this.includes(suit, 'A');
  }

  hasFirstOrSecondRoundStopper(suit: Suit, includeVoid: boolean): boolean {
    return this.includes(suit, 'A') || (this.length > 1 && this.includes(suit, 'K'));
  }

  includes(suit: Suit, ...ranks: CardRank[]): boolean {
    if (ranks.length === 0) {
      return true;
    }
    const cs = this._suits.get(suit);
    if (!cs) {
      return false;
    }
    for (const card of cs) {
      if (ranks.indexOf(card.rank) < 0) {
        return false;
      }
    }
    return true;
  }

  getFirstRoundStoppedSuits(includeVoid: boolean): Set<Suit> {
    const result = new Set<Suit>();
    for (const suit of SUITS) {
      if (this.hasFirstRoundStopper(suit, includeVoid)) {
        result.add(suit);
      }
    }
    return result;
  }

  getFirstOrSecondRoundStoppedSuits(includeVoid: boolean): Set<Suit> {
    const result = new Set<Suit>();
    for (const suit of SUITS) {
      if (this.hasFirstOrSecondRoundStopper(suit, includeVoid)) {
        result.add(suit);
      }
    }
    return result;
  }

  getBestSuit(): CardSet {
    const major = this.getBestMajorSuit();
    const minor = this.getBestMinorSuit();
    if (major.isBetter(minor)) {
      return major;
    } else {
      return minor;
    }
  }

  getBestMajorSuit(): CardSet {
    const spades = this.getCardsInSuit('S');
    const hearts = this.getCardsInSuit('H');
    if (hearts.isBetter(spades)) {
      return hearts;
    } else {
      return spades;
    }
  }

  getBestMinorSuit(): CardSet {
    const clubs = this.getCardsInSuit('C');
    const diamonds = this.getCardsInSuit('D');
    if (diamonds.isBetter(clubs)) {
      return diamonds;
    } else {
      return clubs;
    }
  }

  toString(includePoints?: boolean, allSuits?: boolean): string {
    const result: string[] = [];
    for (let i = 0; i < SUITS.length; i++) {
      const suit = SUITS[SUITS.length - 1 - i];
      const cards = this._suits.get(suit) || [];
      if (allSuits || cards.length > 0) {
        let row = suit + ': ';
        if (cards.length === 0) {
          row += '-';
        } else {
          cards.forEach((card) => { row += card.rank });
          row += ' ';
        }
        const padded = pad(row, 11);
        result.push(padded);
      }
    }
    const cards = result.join(' ');
    return cards + (includePoints ? (` ${this.highCardPoints < 10 ? ' ' : ''}(${this.highCardPoints} ${this.totalPoints < 10 ? ' ' : ''}${this.totalPoints})  `) : '');
  }

}
