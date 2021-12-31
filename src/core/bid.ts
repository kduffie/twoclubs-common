import { BidType, MAX_CONTRACT_SIZE, Seat, Strain, STRAINS } from "./common";
import * as assert from 'assert';

export class Bid {
  private _type: BidType;
  private _count?: number;
  private _strain?: Strain;
  private _by: Seat;

  constructor(by: Seat, _type: BidType, count?: number, strain?: Strain,) {
    this._by = by;
    this._type = _type;
    if (_type === 'normal') {
      assert(count && count > 0 && count <= MAX_CONTRACT_SIZE)
      assert(strain);
      this._count = count;
      this._strain = strain;
    } else {
      assert(!count && !strain);
    }
  }

  get by(): Seat {
    return this._by;
  }

  get type(): BidType {
    return this._type;
  }
  get count(): number {
    assert(this._type === 'normal');
    return this._count!;
  }

  get strain(): Strain {
    assert(this._type === 'normal');
    return this._strain!;
  }


  isLegalFollowing(bids: Bid[]): boolean {
    switch (this.type) {
      case 'pass':
        return true;
      case 'normal': {
        const lastNormal = this.getLastNormalBid(bids);
        return lastNormal && this.isLarger(lastNormal) ? true : false;
      }
      case 'double': {
        if (bids.length === 0) {
          return false;
        } else {
          switch (bids[bids.length - 1].type) {
            case 'pass': {
              if (bids.length < 3) {
                return false;
              }
              if (bids[bids.length - 2].type !== 'pass') {
                return false;
              }
              return bids[bids.length - 3].type === 'normal';
            }
            case 'normal':
              return true;
            case 'double':
            case 'redouble':
              return false;
            default:
              throw new Error("Unexpected type");
          }
        }
      }
      case 'redouble': {
        if (bids.length < 2) {
          return false;
        }
        switch (bids[bids.length - 1].type) {
          case 'pass': {
            if (bids.length < 3) {
              return false;
            }
            if (bids[bids.length - 2].type !== 'pass') {
              return false;
            }
            return bids[bids.length - 3].type === 'double';
          }
          case 'normal':
            return false;
          case 'double':
            return true;
          case 'redouble':
            return false;
          default:
            throw new Error("Unexpected type");
        }
      }
      default:
        throw new Error("Unexpected type " + this.type);
    }
  }

  getLastNormalBid(bids: Bid[]): Bid | null {
    for (let i = 0; i < bids.length; i++) {
      if (bids[bids.length - 1 - i].type === 'normal') {
        return bids[bids.length - 1 - i];
      }
    }
    return null;
  }

  isLarger(bid: Bid): boolean {
    assert(this.type === 'normal' && bid.type === 'normal');
    return this.count > bid.count || (this.count === bid.count && STRAINS.indexOf(this.strain) > STRAINS.indexOf(bid.strain));
  }
}