import { BidWithSeat } from "./bid";
import { SEATS } from "./common";
const pad = require('utils-pad-string');

export class Auction {
  private _bids: BidWithSeat[];

  constructor(bids: BidWithSeat[]) {
    this._bids = bids;
  }
  get bids(): BidWithSeat[] {
    return [...this._bids];
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