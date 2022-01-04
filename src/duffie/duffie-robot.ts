import { Seat } from "../core/common";
import { BridgeRobot } from "../core/bridge-robot";
import { DuffieBidder } from "./duffie-bidder";
import { DuffieCardPlayer } from "./duffie-card-player";
import { BbsBidder } from "./bbs-bidder";

export class DuffieRobot extends BridgeRobot {
  constructor() {
    super(new BbsBidder(), new DuffieCardPlayer());
  }
}
