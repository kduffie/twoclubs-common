import { Bid, BidWithSeat } from "./bid";
import { getPartnerBySeat, Seat, SEATS } from "./common";
const pad = require('utils-pad-string');

export class Auction {
  private _bids: BidWithSeat[];

  constructor(bids: BidWithSeat[]) {
    this._bids = bids;
  }
  get bids(): BidWithSeat[] {
    return [...this._bids];
  }

  getBidsBySeat(seat: Seat): BidWithSeat[] {
    const result: BidWithSeat[] = [];
    for (const b of this.bids) {
      if (b.by === seat) {
        result.push(b);
      }
    }
    return result;
  }

  getPartnerBids(mySeat: Seat): BidWithSeat[] {
    const partnerSeat = getPartnerBySeat(mySeat);
    return this.getBidsBySeat(partnerSeat);
  }

  get lastBid(): BidWithSeat | null {
    if (this.bids.length === 0) {
      return null;
    }
    return this.bids[this.bids.length - 1];
  }

  get lastNormalBid(): BidWithSeat | null {
    for (let i = 0; i < this._bids.length; i++) {
      if (this._bids[this._bids.length - 1 - i].type === 'normal') {
        return this._bids[this._bids.length - 1 - i];
      }
    }
    return null;
  }

  get numberOfPasses(): number {
    let count = 0;
    for (let i = 0; i < this._bids.length; i++) {
      if (this._bids[this._bids.length - 1 - i].type === 'pass') {
        count++;
      } else {
        return count;
      }
    }
    return count;
  }

  get openingBid(): BidWithSeat | null {
    for (const bid of this._bids) {
      if (bid.type === 'normal') {
        return bid;
      }
    }
    return null;
  }

  toString(): string {
    if (this._bids.length === 0) {
      return 'No bids as yet';
    }
    const rows: string[] = [];
    rows.push(`   N     E     S     W`);
    let column = SEATS.indexOf(this._bids[0].by);
    let row = ''
    for (let i = 0; i < column; i++) {
      row += pad(' ', 6);
    }
    for (const bid of this._bids) {
      row += pad(' ' + bid.toString(false), 6)
      if (++column >= 4) {
        rows.push(row);
        row = '';
        column = 0;
      }
    }
    return rows.join('\n');
  }
}