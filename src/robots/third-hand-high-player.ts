import { PlayerImpl } from "../core/player";
import { Seat, SUITS, getCardsInSuit, Strain, getParnershipBySeat, getPartnershipBySeat } from "../core/common";
import { Board } from "../core/board";
import { Trick } from "../core/trick";
import * as shuffle from "shuffle-array";
import { Play } from "../core/play";
import { Card } from "../core/card";
import * as assert from 'assert';

export class ThirdHandHighPlayer extends PlayerImpl {
  constructor(seat: Seat) {
    super(seat);
  }

  play(board: Board, trick: Trick): void {
    assert(board.contract);
    const hand = board.getHand(this.seat);
    assert(hand);
    const eligibleCards = hand.getEligibleToPlay(trick.plays.length > 0 ? trick.plays[0].card.suit : undefined);
    assert(eligibleCards.length > 0);
    const leadSuit = trick.getLeadSuit();
    let selectedCard: Card | null = null;
    if (leadSuit) {
      const followingSuit = getCardsInSuit(eligibleCards, leadSuit);
      if (followingSuit.length > 0 && trick.plays.length === 2) {
        selectedCard = this.selectCardToCoverHigh(trick, followingSuit, board.contract.strain);
      } else if (followingSuit.length > 0 && trick.plays.length === 3) {
        selectedCard = this.selectCardToCoverLow(trick, followingSuit, board.contract.strain);
      } else if (followingSuit.length > 0) {
        selectedCard = this.selectLowestCard(eligibleCards, board.contract.strain);
      } else if (trick.plays.length >= 3 && board.contract.strain !== 'N' && leadSuit !== board.contract.strain) {
        const trumpCards = getCardsInSuit(eligibleCards, board.contract.strain);
        if (trumpCards.length > 0) {
          selectedCard = this.selectCardToCoverLow(trick, trumpCards, board.contract.strain);
        } else {
          selectedCard = this.selectLowestCard(eligibleCards, board.contract.strain);
        }
      } else {
        selectedCard = this.selectLowestCard(eligibleCards, board.contract.strain);
      }
    } else {
      const availableSuits = hand.getAvailableSuits();
      assert(availableSuits.length > 0);
      const suit = availableSuits[Math.floor(Math.random() * availableSuits.length)];
      const fromSuit = getCardsInSuit(eligibleCards, suit);
      assert(fromSuit.length > 0);
      selectedCard = this.selectLowestCard(fromSuit, board.contract.strain);
    }
    const play = new Play(this.seat, selectedCard);
    board.playCard(play);
  }

  private selectCardToCoverLow(trick: Trick, candidates: Card[], trump: Strain): Card {
    let result: Card | null = null;
    const currentBest = trick.getCurrentBest();
    if (currentBest && getPartnershipBySeat(currentBest.by) !== getParnershipBySeat(this.seat)) {
      for (const card of candidates) {
        if (card.isBetter(currentBest.card, trump)) {
          if (!result || result.isBetter(card, trump)) {
            result = card;
          }
        }
      }
    }
    if (result) {
      return result;
    } else {
      return this.selectLowestCard(candidates, trump);
    }
  }

  private selectCardToCoverHigh(trick: Trick, candidates: Card[], trump: Strain): Card {
    let result: Card | null = null;
    const currentBest = trick.getCurrentBest();
    if (currentBest && getPartnershipBySeat(currentBest.by) !== getParnershipBySeat(this.seat)) {
      for (const card of candidates) {
        if (card.isBetter(currentBest.card, trump)) {
          if (!result || card.isBetter(result, trump)) {
            result = card;
          }
        }
      }
    }
    if (result) {
      return result;
    } else {
      return this.selectLowestCard(candidates, trump);
    }
  }

  private selectLowestCard(candidates: Card[], trump: Strain): Card {
    assert(candidates.length > 0);
    let result: Card | null = null;
    for (const card of candidates) {
      if (card.suit !== trump) {
        if (result) {
          if (result.rank > card.rank) {
            result = card;
          }
        } else {
          result = card;
        }
      }
    }
    if (!result) {
      result = this.selectLowestCard(candidates, 'N');
    }
    assert(result);
    return result;
  }
}