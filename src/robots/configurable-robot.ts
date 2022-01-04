import { BridgeCardPlayer } from "../core/player";
import { BridgeBidder } from "../core/player";
import { BridgeRobot } from "../core/bridge-robot";
import { PassiveBidder } from "./passive-bidder";
import { RandomPlayer } from "./random-player";

export class ConfigurableRobot extends BridgeRobot {
  constructor(bidder?: BridgeBidder, player?: BridgeCardPlayer) {
    super(bidder || new PassiveBidder(), player || new RandomPlayer());
  }
}
