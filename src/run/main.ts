import { BridgeTable } from "../core/bridge-table";

async function run() {
  const table = new BridgeTable({ assignContract: true, robotStrategy: { play: { leadingRank: 'low', secondHand: 'low', thirdHand: 'high', fourthHand: 'cover' } } });
  for (let i = 1; ; i++) {
    const board = await table.startBoard();
    await table.playBoard();
    console.log(board.toString());
    if (i % 1000 === 0) {
      console.log('\n\nTable Stats\n');
      console.log(table.tableStats.toString());
      console.log();
    }
  }
}

// setInterval(() => { }, 1 << 30);

run().then(() => { console.log("Finished") });