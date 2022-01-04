import { BbsBidder } from "../robots/bbs-bidder";
import { PassiveBidder } from "../robots/passive-bidder";
import { RandomPlayer } from "../robots/random-player";
import { BridgeTable } from "../core/bridge-table";
import { ConfigurableRobot } from "../robots/configurable-robot";

async function run() {
  const table = new BridgeTable({ assignContract: true, randomSeed: undefined });
  const r1 = new ConfigurableRobot(new PassiveBidder(), new RandomPlayer());
  const r2 = new ConfigurableRobot(new PassiveBidder(), new RandomPlayer());
  const r3 = new ConfigurableRobot(new PassiveBidder(), new RandomPlayer());
  const r4 = new ConfigurableRobot(new PassiveBidder(), new RandomPlayer());
  table.assignTeam('NS', [r1, r2]);
  table.assignTeam('EW', [r3, r4]);
  for (let i = 1; ; i++) {
    const board = await table.startBoard();
    await table.playBoard();
    console.log(board.toString());
    if (i % 10000 === 0) {
      console.log('\n\nTable Stats\n');
      console.log(table.tableStats.toString());
      console.log();
    }
  }
}

run().then(() => { console.log("Finished") });