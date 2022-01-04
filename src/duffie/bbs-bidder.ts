import { Hand } from "../core/hand";
import { BidContext, BoardContext, getPartnerBySeat, getSeatPreceding, Seat, STRAINS, SUITS } from "../core/common";
import { ConventionCard, SimpleConventionCard } from "../core/convention-card";
import { BridgeBidder } from "../core/player";
import { Bid, BidWithSeat } from "../core/bid";
import * as assert from 'assert';
import { Card } from "../core/card";
import { open } from "fs";

export class BbsBidder implements BridgeBidder {
  private _mseat: Seat = 'N';
  private _conventionCard: ConventionCard = new SimpleConventionCard('bbs');

  get conventionCard(): ConventionCard {
    return this._conventionCard;
  }

  get seat(): Seat {
    return this._mseat;
  }

  set seat(value: Seat) {
    this._mseat = value;
  }

  acceptConventions(conventionCard: ConventionCard): boolean {
    if (conventionCard.approach === 'bbs') {
      this._conventionCard = conventionCard;
      return true;
    }
    return false;
  }

  async startBoard(context: BoardContext): Promise<void> {
    // noop
  }

  async bid(context: BidContext, hand: Hand): Promise<Bid> {
    let result: Bid | null = null;
    const myBids = context.auction.getBidsBySeat(this.seat, true);
    const partnerBids = context.auction.getBidsBySeat(getPartnerBySeat(this.seat), false);
    if (myBids.length === 0 && (partnerBids.length === 0 || (partnerBids.length === 1 && partnerBids[0].type === 'pass'))) {
      // First opportunity to bid when partner has not yet bid, or has passed
      result = this.getOpeningBid(context, hand);
    } else if ((myBids.length === 0 || (myBids.length === 1 && myBids[0].type === 'pass')) && partnerBids.length === 1 && partnerBids[0].type === 'normal') {
      // I haven't bid or passed, so partner's non-pass will be treated as an effective opening bid.  I will respond.
      result = this.getFirstResponse(context, hand, partnerBids[0]);
    } else if (myBids.length === 1 && myBids[0].type === 'normal' && partnerBids.length > 0 && partnerBids[partnerBids.length - 1].type === 'normal') {
      // I offered an "opening" bid and my partner has responded, so I will check for possible additional bid
      result = this.getSubsequentResponse(context, hand, partnerBids.length > 0 ? partnerBids[partnerBids.length - 1] : null, myBids[0]);
    }
    if (result && result.isLarger(context.auction.lastNormalBid)) {
      return result;
    }
    return new Bid('pass');
  }

  private getOpeningBid(context: BidContext, hand: Hand): Bid {
    const bestMajor = hand.getBestMajorSuit();
    const bestMinor = hand.getBestMinorSuit();
    const bestSuit = hand.getBestSuit();
    if (hand.highCardPoints >= 23 && hand.hasNtDistribution() && hand.getWellStoppedSuits(false).size == 4) {
      return new Bid('normal', 3, 'N');
    } else if (hand.totalPoints >= 25 && bestMajor.length >= 7) {
      return new Bid('normal', 4, bestMajor[0].suit);
    } else if (hand.totalPoints >= 27 && bestMinor.length >= 8) {
      return new Bid('normal', 5, bestMinor[0].suit);
    } else if (hand.highCardPoints >= 19 && hand.hasNtDistribution()) {
      return new Bid('normal', 2, 'N');
    } else if (hand.highCardPoints >= 14 && hand.hasNtDistribution()) {
      return new Bid('normal', 1, 'N');
    } else if (hand.totalPoints >= 13 && bestSuit.length >= 5) {
      const preferredSuit = bestMajor.length >= 5 ? bestMajor : bestMinor;
      if (hand.totalPoints >= 19) {
        return new Bid('normal', 3, preferredSuit[0].suit);
      } else if (hand.totalPoints >= 16) {
        return new Bid('normal', 2, preferredSuit[0].suit);
      } else {
        return new Bid('normal', 1, preferredSuit[0].suit);
      }
    } else if (hand.totalPoints >= 13) {
      return new Bid('normal', 1, bestSuit[0].suit);
    }
    return new Bid('pass');
  }

  private getFirstResponse(context: BidContext, hand: Hand, opening: BidWithSeat): Bid {
    if (opening.isGameBonusApplicable()) {
      return new Bid('pass');
    }
    switch (opening.strain) {
      case 'N':
        return this.getFirstResponseToNT(context, hand, opening);
      case 'H':
      case 'S':
        return this.getFirstResponseToMajor(context, hand, opening);
      case 'C':
      case 'D':
        return this.getFirstResponseToMinor(context, hand, opening);
    }
  }

  private getFirstResponseToNT(context: BidContext, hand: Hand, opening: BidWithSeat): Bid {
    const partnerMinHCP = opening.count === 2 ? 19 : 14;
    const combined = partnerMinHCP + hand.highCardPoints;
    if (combined >= 24) {
      return new Bid('normal', 3, 'N');
    } else {
      const bestSuit = hand.getBestSuit();
      if (bestSuit.length >= 6) {
        return new Bid('normal', 3, bestSuit[0].suit);
      }
    }
    return new Bid('pass');
  }

  private getFirstResponseToMajor(context: BidContext, hand: Hand, opening: BidWithSeat): Bid {
    assert(opening.strain !== 'N');
    const mySuit = hand.getAllCardsInSuit(opening.strain);
    const partnerMinTotal = opening.count === 3 ? 19 : (opening.count === 2 ? 16 : 13);
    const combinedPoints = partnerMinTotal + hand.totalPoints;
    const combinedHCP = partnerMinTotal + hand.highCardPoints;
    if (mySuit.length >= 3 && combinedPoints >= 24) {
      return new Bid('normal', 4, opening.strain);
    } else if (combinedHCP >= 24 && hand.hasNtDistribution) {
      return new Bid('normal', 3, 'N');
    }
    return new Bid('pass');
  }

  private getFirstResponseToMinor(context: BidContext, hand: Hand, opening: BidWithSeat): Bid {
    assert(opening.strain !== 'N');
    const partnerMinTotal = opening.count === 3 ? 19 : (opening.count === 2 ? 16 : 13);
    const combined = partnerMinTotal + hand.totalPoints;
    if (combined >= 24) {
      const bestMajor = hand.getBestMajorSuit();
      if (bestMajor.length >= 5) {
        return new Bid('normal', 3, bestMajor[0].suit);
      } else {
        return new Bid('normal', 3, 'N');
      }
    }
    return new Bid('pass');
  }


  private getSubsequentResponse(context: BidContext, hand: Hand, partnersResponse: BidWithSeat | null, myOpening: BidWithSeat): Bid {
    if (!partnersResponse) {
      return new Bid('pass');
    }
    switch (myOpening.strain) {
      case 'N':
        return this.getSubsequentResponseInNT(context, hand, partnersResponse, myOpening);
      case 'C':
      case 'D':
        return this.getSubsequentResponseInMinor(context, hand, partnersResponse, myOpening);
    }
    return new Bid('pass');
  }

  private getSubsequentResponseInNT(context: BidContext, hand: Hand, partnersResponse: BidWithSeat, myOpening: BidWithSeat): Bid {
    const mySuit = partnersResponse.strain !== 'N' ? hand.getAllCardsInSuit(partnersResponse.strain) : [];
    switch (partnersResponse.strain) {
      case 'H':
      case 'S':
        if (mySuit.length >= 2) {
          return new Bid('normal', 4, partnersResponse.strain);
        }
        break;
      case 'C':
      case 'D':
        if (mySuit.length >= 3) {
          return new Bid('normal', 3, 'N');
        }
        break;
    }
    return new Bid('pass');
  }

  private getSubsequentResponseInMinor(context: BidContext, hand: Hand, partnersResponse: BidWithSeat, myOpening: BidWithSeat): Bid {
    const mySuit = partnersResponse.strain !== 'N' ? hand.getAllCardsInSuit(partnersResponse.strain) : [];
    switch (partnersResponse.strain) {
      case 'H':
      case 'S':
        if (mySuit.length >= 3) {
          return new Bid('normal', 4, partnersResponse.strain);
        } else {
          return new Bid('normal', 3, 'N');
        }
    }
    return new Bid('pass');
  }
}