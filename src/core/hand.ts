
import { Card } from "./card";
import * as assert from 'assert';
import { CardRank, cardsInclude, CARDS_PER_HAND, CARD_RANKS, sortCards, Suit, SUITS } from "./common";
const pad = require('utils-pad-string');

export class Hand {
  private _allCards = new Map<Suit, Map<string, Card>>();
  private _played = new Map<Suit, Map<string, Card>>();
  private _unplayed = new Map<Suit, Map<string, Card>>();

  dealCard(card: Card): void {
    assert(this._allCards.size < CARDS_PER_HAND && this._unplayed.size < CARDS_PER_HAND);
    if (!this._allCards.has(card.suit)) {
      this._allCards.set(card.suit, new Map<string, Card>());
      this._unplayed.set(card.suit, new Map<string, Card>())
      this._played.set(card.suit, new Map<string, Card>())
    }
    this._allCards.get(card.suit)!.set(card.name, card);
    this._unplayed.get(card.suit)!.set(card.name, card);
    this._played.clear();
  }


  playCard(card: Card): void {
    const match = this._unplayed.get(card.suit)?.get(card.name);
    assert(match, "This card is not available to be played");
    this._unplayed.get(card.suit)?.delete(match.name);
    this._played.get(card.suit)?.set(match.name, match);
  }

  getAllCardsInSuit(suit: Suit): Card[] {
    const result = Array.from(this._allCards.get(suit)?.values() || []);
    sortCards(result);
    return result;
  }

  getUnplayedCardsInSuit(suit: Suit): Card[] {
    const result = Array.from(this._unplayed.get(suit)?.values() || []);
    sortCards(result);
    return result;
  }

  get allCards(): Card[] {
    const result: Card[] = [];
    for (const suit of this._allCards.values()) {
      for (const card of suit.values()) {
        result.push(card);
      }
    }
    sortCards(result);
    return result;
  }

  get unplayedCards(): Card[] {
    const result: Card[] = [];
    for (const suit of this._unplayed.values()) {
      for (const card of suit.values()) {
        result.push(card);
      }
    }
    sortCards(result);
    return result;
  }

  getEligibleToPlay(lead: Suit | null): Card[] {
    if (lead) {
      const cardsInSuit = this.getUnplayedCardsInSuit(lead);
      if (cardsInSuit.length > 0) {
        return cardsInSuit;
      }
    }
    return this.unplayedCards;
  }

  ensureEligibleToPlay(card: Card, lead: Suit | null): Card {
    const inSuit = lead ? this.getUnplayedCardsInSuit(lead) : [];
    if (inSuit.length > 0) {
      const c = cardsInclude(inSuit, card);
      assert(c, "This card is not eligible to be played");
      return c;
    } else {
      for (const suit of this._unplayed.values()) {
        const c = suit.get(card.name);
        if (c) {
          return c;
        }
      }
    }
    throw new Error("This card is not eligible to be played");
  }

  getHighestCardIfHigherThan(suit: Suit, card: Card): Card | null {
    const cards = this.getUnplayedCardsInSuit(suit);
    if (cards.length > 0 && cards[0].isBetter(card, 'N')) {
      return cards[0];
    }
    return null;
  }

  getLowestCardHigherThan(suit: Suit, card: Card): Card | null {
    const cards = this.getUnplayedCardsInSuit(suit);
    for (let i = 0; i < cards.length; i++) {
      if (cards[cards.length - 1 - i].isBetter(card, 'N')) {
        return cards[cards.length - 1 - i];
      }
    }
    return null;
  }

  getLowestCard(suit: Suit): Card | null {
    const cards = this.getUnplayedCardsInSuit(suit);
    if (cards.length > 0) {
      return cards[cards.length - 1];
    }
    return null;
  }

  getAvailableSuits(): Suit[] {
    const result: Suit[] = [];
    for (const [suit, cards] of this._unplayed.entries()) {
      if (cards.size > 0) {
        result.push(suit);
      }
    }
    return result;
  }

  isVoid(suit: Suit): boolean {
    return (this._allCards.get(suit)?.size || 0) === 0;
  }

  get highCardPoints(): number {
    let total = 0;
    for (const card of this.allCards) {
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

  getStoppedSuits(includeVoid: boolean): Set<Suit> {
    const result = new Set<Suit>();
    for (const suit of this._allCards.keys()) {
      if (this.hasStopper(suit, includeVoid)) {
        result.add(suit);
      }
    }
    return result;
  }

  getWellStoppedSuits(includeVoid: boolean): Set<Suit> {
    const result = new Set<Suit>();
    for (const suit of this._allCards.keys()) {
      if (this.isWellStopped(suit, includeVoid)) {
        result.add(suit);
      }
    }
    return result;
  }

  getFirstRoundStoppedSuits(includeVoid: boolean): Set<Suit> {
    const result = new Set<Suit>();
    for (const suit of this._allCards.keys()) {
      if (this.hasFirstRoundStopper(suit, includeVoid)) {
        result.add(suit);
      }
    }
    return result;
  }

  getFirstOrSecondRoundStoppedSuits(includeVoid: boolean): Set<Suit> {
    const result = new Set<Suit>();
    for (const suit of this._allCards.keys()) {
      if (this.hasFirstOrSecondRoundStopper(suit, includeVoid)) {
        result.add(suit);
      }
    }
    return result;
  }

  hasStopper(suit: Suit, includeVoid: boolean): boolean {
    if (includeVoid && this.isVoid(suit)) {
      return true;
    }
    const cardsInSuit = this.getAllCardsInSuit(suit);
    return this.cardsInclude(cardsInSuit, 1, 'A') ||
      this.cardsInclude(cardsInSuit, 2, 'K') ||
      this.cardsInclude(cardsInSuit, 3, 'Q') ||
      this.cardsInclude(cardsInSuit, 4, 'J') ||
      cardsInSuit.length > 4;
  }

  isWellStopped(suit: Suit, includeVoid: boolean): boolean {
    if (includeVoid && this.isVoid(suit)) {
      return true;
    }
    const cardsInSuit = this.getAllCardsInSuit(suit);
    return this.cardsInclude(cardsInSuit, 2, 'A', 'K') ||
      this.cardsInclude(cardsInSuit, 3, 'A', 'Q') ||
      this.cardsInclude(cardsInSuit, 4, 'A', 'J', 'T') ||
      this.cardsInclude(cardsInSuit, 3, 'K', 'Q') ||
      this.cardsInclude(cardsInSuit, 4, 'Q', 'J') ||
      cardsInSuit.length > 4;
  }

  hasFirstRoundStopper(suit: Suit, includeVoid: boolean): boolean {
    if (includeVoid && this.isVoid(suit)) {
      return true;
    }
    const cardsInSuit = this.getAllCardsInSuit(suit);
    return this.cardsInclude(cardsInSuit, 1, 'A');
  }

  hasFirstOrSecondRoundStopper(suit: Suit, includeVoid: boolean): boolean {
    if (includeVoid && this.isVoid(suit)) {
      return true;
    }
    const cardsInSuit = this.getAllCardsInSuit(suit);
    return this.cardsInclude(cardsInSuit, 1, 'A') || this.cardsInclude(cardsInSuit, 2, 'K');
  }

  cardsInclude(cards: Card[], minCount: number, ...ranks: CardRank[]): boolean {
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
    for (const suit of this._allCards.keys()) {
      const cards = this.getAllCardsInSuit(suit);
      if (cards.length < 3) {
        shortnessPoints += 3 - cards.length;
      } else if (cards.length >= 5) {
        lengthPoints += cards.length - 4;
      }
    }
    return this.highCardPoints + Math.max(shortnessPoints, lengthPoints);
  }

  hasNtDistribution(): boolean {
    let doubletons = 0;
    for (const suit of this._allCards.keys()) {
      const cards = this.getAllCardsInSuit(suit);
      if (cards.length < 2) {
        return false;
      }
      if (cards.length === 2) {
        doubletons++;
        if (doubletons > 1) {
          return false;
        }
      }
    }
    return true;
  }

  getBestPreemptSuit(): Card[] {
    const bestSuit = this.getBestSuit();
    if (bestSuit.length > 6) {
      return bestSuit;
    }
    if (bestSuit.length === 6 && bestSuit[0].suit !== 'C') {
      return bestSuit;
    }
    return [];
  }

  getBestSuit(): Card[] {
    const major = this.getBestMajorSuit();
    const minor = this.getBestMinorSuit();
    const diff = this.compareSuits(major, minor);
    if (diff < 0) {
      return minor;
    } else {
      return major;
    }

  }

  compareSuits(suit1: Card[], suit2: Card[]): number {
    if (suit1.length > suit2.length) {
      return 1;
    } else if (suit1.length < suit2.length) {
      return -1;
    }
    const hcp1 = this.getHcpFromCards(suit1);
    const hcp2 = this.getHcpFromCards(suit2);
    if (hcp1 > hcp2) {
      return 1;
    } else if (hcp1 < hcp2) {
      return -1;
    }
    for (let i = 0; i < Math.min(suit1.length, suit2.length); i++) {
      const diff = CARD_RANKS.indexOf(suit1[i].rank) - CARD_RANKS.indexOf(suit2[i].rank);
      if (diff !== 0) {
        return diff;
      }
    }
    return 0;
  }

  getHcpFromCards(cards: Card[]): number {
    let result = 0;
    for (const card of cards) {
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
          break;
      }
    }
    return result;
  }

  getBestMajorSuit(): Card[] {
    const spades = this.getAllCardsInSuit('S');
    const hearts = this.getAllCardsInSuit('H');
    const diff = this.compareSuits(spades, hearts);
    if (diff < 0) {
      return hearts;
    } else {
      return spades;
    }
  }

  getBestMinorSuit(): Card[] {
    const diamonds = this.getAllCardsInSuit('D');
    const clubs = this.getAllCardsInSuit('C');
    const diff = this.compareSuits(diamonds, clubs);
    if (diff < 0) {
      return clubs;
    } else {
      return diamonds;
    }
  }

  get numberUnplayed(): number {
    let result = 0;
    for (const suit of this._unplayed.values()) {
      result += suit.size;
    }
    return result;
  }

  toString(): string {
    const unplayed = this.numberUnplayed;
    const partial = unplayed > 0 && unplayed < CARDS_PER_HAND;
    const result: string[] = [];
    for (let i = 0; i < SUITS.length; i++) {
      const suit = SUITS[SUITS.length - 1 - i];
      let row = suit + ': ';
      const cards = partial ? this.getUnplayedCardsInSuit(suit) : this.getAllCardsInSuit(suit);
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
    return cards + (partial ? '' : (` ${this.highCardPoints < 10 ? ' ' : ''}(${this.highCardPoints} ${this.totalPoints < 10 ? ' ' : ''}${this.totalPoints})  `));
  }
}