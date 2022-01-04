
import { Card } from "./card";
import * as assert from 'assert';
import { CardRank, cardsInclude, CARDS_PER_HAND, CARD_RANKS, sortCards, Suit, SUITS } from "./common";
import { CardSet } from "./card-set";
import { CardSuit } from "./card-suit";
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
    assert(this._unplayed.remove(card));
    this._played.add(card);
  }

  get allCards(): CardSet {
    return this._allCards;
  }

  get unplayed(): CardSet {
    return this._unplayed;
  }

  get played(): CardSet {
    return this._played;
  }

  getEligibleToPlay(lead: Suit | null): CardSet {
    if (lead) {
      const s = this.unplayed.getSuit(lead);
      if (s.length === 0) {
        return this.unplayed;
      } else {
        return new CardSet(s.cards);
      }
    } else {
      return this.unplayed;
    }
  }

  ensureEligibleToPlay(card: Card, lead: Suit | null): Card {
    if (!lead || !this.unplayed.getSuit(lead).includes(card.rank)) {
      assert(this.unplayed.getSuit(card.suit).includes(card.rank), "This card is not eligible to be played");
    }
    return card;
  }

  toString(): string {
    const unplayed = this._unplayed.length;
    const partial = unplayed > 0 && unplayed < CARDS_PER_HAND;
    return partial ? this._unplayed.toString(false) : this._allCards.toString(true);
  }
}