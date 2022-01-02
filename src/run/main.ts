import { Robot } from "../core/robot";
import { BridgeTable } from "../core/bridge-table";

async function run() {
  const table = new BridgeTable({ assignContract: true });
  const r1 = new Robot();
  const r2 = new Robot();
  const r3 = new Robot({ play: { thirdHand: ['cover', 'low'] } });
  const r4 = new Robot({ play: { thirdHand: ['cover', 'low'] } });
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