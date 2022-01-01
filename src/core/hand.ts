
import { Card } from "./card";
import * as assert from 'assert';
import { CardRank, CARDS_PER_HAND, CARD_RANKS, Suit, SUITS } from "./common";
const pad = require('utils-pad-string');

export class Hand {
  private _allCards: Card[] = [];
  private _played: Card[] = [];
  private _unplayed: Card[] = [];

  dealCard(card: Card): void {
    assert(this._allCards.length < CARDS_PER_HAND);
    this._allCards.push(card);
    if (this._allCards.length === CARDS_PER_HAND) {
      this._allCards.sort((a, b) => {
        if (a.rank === b.rank) {
          return SUITS.indexOf(b.suit) - SUITS.indexOf(a.suit);
        } else {
          return CARD_RANKS.indexOf(b.rank) - CARD_RANKS.indexOf(a.rank);
        }
      });
      this._unplayed = [...this._allCards];
    }
  }

  playCard(card: Card): void {
    for (let i = 0; i < this._unplayed.length; i++) {
      const c = this._unplayed[i];
      if (c.isEqual(card)) {
        this._unplayed.splice(i, 1);
        this._played.push(c);
        return;
      }
    }
    assert("No matching unplayed card");
  }

  get cards(): Card[] {
    return this._allCards;
  }

  getEligibleToPlay(lead: Suit | null): Card[] {
    const result: Card[] = [];
    for (const crd of this._unplayed) {
      if (crd.suit === lead) {
        result.push(crd);
      }
    }
    if (result.length === 0) {
      return [...this._unplayed];
    }
    return result;
  }

  ensureEligibleToPlay(card: Card, lead: Suit | null): Card {
    const inSuit = lead ? this.getCardsBySuit(lead, true) : [];
    for (const c of this._unplayed) {
      if (card.isEqual(c)) {
        if (!lead || lead === c.suit || inSuit.length === 0) {
          return c;
        } else {
          throw new Error("This card is not eligible to be played");
        }
      }
    }
    throw new Error("This card is not available");
  }


  getAvailableSuits(): Suit[] {
    const result = new Set<Suit>();
    for (const card of this._unplayed) {
      result.add(card.suit);
    }
    return Array.from(result);
  }

  get highCardPoints(): number {
    let total = 0;
    for (const card of this.cards) {
      switch (card.rank) {
        case 'A':
          total += 4;
          break;
        case 'K':
          total += 3;
          break;
        case 'Q':
          total += 2;
          break;
        case 'J':
          total += 1;
          break;
        default:
          break;
      }
    }
    return total;
  }

  getCardsBySuit(suit: Suit, availableOnly: boolean): Card[] {
    let result: Card[] = [];
    const candidates = availableOnly ? this._unplayed : this._allCards;
    for (const card of candidates) {
      if (card.suit === suit) {
        result.push(card);
      }
    }
    return result;
  }

  getStoppedSuits(includeVoid: boolean): Set<Suit> {
    const result = new Set<Suit>();
    for (const suit of SUITS) {
      if (this.hasStopper(suit, includeVoid)) {
        result.add(suit);
      }
    }
    return result;
  }

  getWellStoppedSuits(includeVoid: boolean): Set<Suit> {
    const result = new Set<Suit>();
    for (const suit of SUITS) {
      if (this.isWellStopped(suit, includeVoid)) {
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

  hasStopper(suit: Suit, includeVoid: boolean): boolean {
    if (includeVoid) {
      const cards = this.getCardsBySuit(suit, false);
      if (cards.length === 0) {
        return true;
      }
    }
    return this.cardsInclude(suit, 1, 'A') ||
      this.cardsInclude(suit, 2, 'K') ||
      this.cardsInclude(suit, 3, 'Q') ||
      this.cardsInclude(suit, 4, 'J') ||
      this.getCardsBySuit(suit, false).length > 4;
  }

  isWellStopped(suit: Suit, includeVoid: boolean): boolean {
    if (includeVoid) {
      const cards = this.getCardsBySuit(suit, false);
      if (cards.length === 0) {
        return true;
      }
    }
    return this.cardsInclude(suit, 2, 'A', 'K') ||
      this.cardsInclude(suit, 3, 'A', 'Q') ||
      this.cardsInclude(suit, 4, 'A', 'J', 'T') ||
      this.cardsInclude(suit, 3, 'K', 'Q') ||
      this.cardsInclude(suit, 4, 'Q', 'J') ||
      this.getCardsBySuit(suit, false).length > 4;
  }

  hasFirstRoundStopper(suit: Suit, includeVoid: boolean): boolean {
    if (includeVoid) {
      const cards = this.getCardsBySuit(suit, false);
      if (cards.length === 0) {
        return true;
      }
    }
    return this.cardsInclude(suit, 1, 'A');
  }

  hasFirstOrSecondRoundStopper(suit: Suit, includeVoid: boolean): boolean {
    if (includeVoid) {
      const cards = this.getCardsBySuit(suit, false);
      if (cards.length === 0) {
        return true;
      }
    }
    return this.cardsInclude(suit, 1, 'A') || this.cardsInclude(suit, 2, 'K');
  }

  cardsInclude(suit: Suit, minCount: number, ...ranks: CardRank[]): boolean {
    const cards = this.getCardsBySuit(suit, false);
    if (cards.length < minCount) {
      return false;
    }
    for (const r of ranks) {
      let found = false;
      for (const c of cards) {
        if (c.rank === r) {
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  }

  get totalPoints(): number {
    let shortnessPoints = 0;
    let lengthPoints = 0;
    for (const suit of SUITS) {
      const cards = this.getCardsBySuit(suit, false);
      if (cards.length < 3) {
        shortnessPoints += 3 - cards.length;
      } else if (cards.length >= 5) {
        lengthPoints += cards.length - 4;
      }
    }
    return this.highCardPoints + Math.max(shortnessPoints, lengthPoints);
  }

  toString(): string {
    const partial = this._unplayed.length > 0 && this._unplayed.length < CARDS_PER_HAND;
    const result: string[] = [];
    for (let i = 0; i < SUITS.length; i++) {
      const suit = SUITS[SUITS.length - 1 - i];
      let row = suit + ': ';
      const cards = this.getCardsBySuit(suit, partial);
      if (cards.length === 0) {
        row += '-';
      } else {
        cards.forEach((card) => { row += card.rank });
        row += ' ';
      }
      const padded = pad(row, 11);
      result.push(padded);
    }
    const cards = result.join(' ');
    return cards + (partial ? '' : (` ${this.highCardPoints < 10 ? ' ' : ''}(${this.highCardPoints})  `));
  }
}