
import { Card } from "./card";
import * as assert from 'assert';
import { CARDS_PER_HAND, Suit, SUITS } from "./common";

export class Hand {
  private _cards: Card[] = [];

  dealCard(card: Card): void {
    assert(this._cards.length < CARDS_PER_HAND);
    this._cards.push(card);
    this._cards.sort((a, b) => {
      return b.index - a.index;
    });
  }
  get cards(): Card[] {
    return this._cards;
  }

  getCardsBySuit(suit: Suit): Card[] {
    const result: Card[] = [];
    for (const c of this._cards) {
      if (c.suit === suit) {
        result.push(c);
      }
    }
    return result;
  }

  toString(): string {
    const result: string[] = [];
    for (let i = 0; i < SUITS.length; i++) {
      const suit = SUITS[SUITS.length - 1 - i];
      let row = suit + ': ';
      const cards = this.getCardsBySuit(suit);
      if (cards.length === 0) {
        row += '-';
      } else {
        cards.forEach((card) => { row += card.rank });
      }
      result.push(row);
    }
    return result.join('\n');
  }
}