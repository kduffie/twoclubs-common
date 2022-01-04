
import { Card } from "./card";
import * as assert from 'assert';
import { CardRank, cardsInclude, CARDS_PER_HAND, CARD_RANKS, sortCards, Suit, SUITS } from "./common";
import { CardSet } from "./card-set";
const pad = require('utils-pad-string');

export class Hand {
  private _allCards = new CardSet();
  private _played = new CardSet();
  private _unplayed = new CardSet();

  dealCard(card: Card): void {
    assert(this._allCards.length < CARDS_PER_HAND && this._unplayed.length < CARDS_PER_HAND);
    this._played.clear();
    this._allCards.add(card);
    this._unplayed.add(card);
  }

  playCard(card: Card): void {
    const c = this._unplayed.remove(card);
    assert(c);
    this._played.add(c);
  }

  get allCards(): CardSet {
    return this._allCards.clone();
  }

  get unplayedCards(): CardSet {
    return this._unplayed.clone();
  }

  get highCardPoints(): number {
    return this._allCards.highCardPoints;
  }

  get totalPoints(): number {
    return this._allCards.totalPoints;
  }

  getAllCardsInSuit(suit: Suit): CardSet {
    return this._allCards.getCardsInSuit(suit);
  }

  getBestMajorSuit(): CardSet {
    return this._allCards.getBestMajorSuit();
  }

  getBestMinorSuit(): CardSet {
    return this._allCards.getBestMinorSuit();
  }

  getBestSuit(): CardSet {
    return this._allCards.getBestSuit();
  }

  hasNtDistribution(): boolean {
    return this._allCards.hasNtDistribution();
  }

  getEligibleToPlay(lead: Suit | null): CardSet {
    if (lead) {
      return this._unplayed.getCardsInSuit(lead);
    } else {
      return this.unplayedCards;
    }
  }

  ensureEligibleToPlay(card: Card, lead: Suit | null): Card {
    if (lead && this.unplayedCards.isVoid(lead)) {
      const c = this.unplayedCards.find(card);
      assert(c);
      return c;
    }
    const result = this.unplayedCards.find(card);
    assert(result);
    return result;
  }

  toString(): string {
    const unplayed = this._unplayed.length;
    const partial = unplayed > 0 && unplayed < CARDS_PER_HAND;
    return partial ? this._unplayed.toString(false, true) : this._allCards.toString(true, true);
  }
}