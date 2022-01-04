import { BridgeTable } from "../core/bridge-table";
import { DuffieRobot } from "../duffie/duffie-robot";
import { randomGenerator } from "../core/rng";
import { BridgePlayerBase } from "../core/player";

async function run() {
  randomGenerator.seed = '6';
  const table = new BridgeTable({ assignContract: true });
  const r1 = new BridgePlayerBase();
  const r2 = new BridgePlayerBase();
  const r3 = new DuffieRobot();
  const r4 = new DuffieRobot();
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

// setInterval(() => { }, 1 << 30);

run().then(() => { console.log("Finished") });