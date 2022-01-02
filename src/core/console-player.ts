import { Bid, BID_PATTERN } from "./bid";
import { BidContext, BoardContext, FinalBoardContext, PlayContext, Seat, getSeatName } from "./common";
import { PlayerBase } from "./player";
import * as prompt from 'prompt';
import { Hand } from "./hand";
import { Card } from "./card";

export class ConsolePlayer extends PlayerBase {

  constructor() {
    super();
    prompt.start();
  }

  async startBoard(context: BoardContext): Promise<void> {
    await prompt.get({
      properties: {
        hello: {
          message: `Starting board: ${context.boardId}\n${context.toString()}`,
          required: false
        }
      }
    });
  }

  async bid(context: BidContext): Promise<Bid> {
    const response = await prompt.get({
      properties: {
        bid: {
          pattern: BID_PATTERN,
          message: context.auction.toString() + `\n\n${getSeatName(this.seat)} What do you bid (pass, dbl, rdb, 1c, 2h, 3n, etc.) [pass]`,
          required: false
        }
      }
    });
    const requestedBid = (response.bid || 'pass').toString();
    return Bid.parse(requestedBid);
  }

  async startPlay(context: PlayContext): Promise<void> {
    await prompt.get({
      properties: {
        hello: {
          message: `Starting play...`,
          required: false
        }
      }
    });
  }

  async play(context: PlayContext, hand: Hand): Promise<Card> {
    const response = await prompt.get({
      properties: {
        card: {
          pattern: /^(pass)|(dbl)|rdbl?|([1-7](c|d|h|s|nt?))$/i,
          message: hand.toString() + `\n\n${this.seat} What card do you play?`,
          required: true
        }
      }
    });
    const requestedCard = response.card.toString();
    return Card.parse(requestedCard);
  }

  async finishPlay(context: FinalBoardContext): Promise<void> {
    await prompt.get({
      properties: {
        hello: {
          message: context.toString(),
          required: false
        }
      }
    });
  }
}
