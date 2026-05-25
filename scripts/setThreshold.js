const hre = require("hardhat");
const deployment = require("../deployments/sonic.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();

  const router = await hre.ethers.getContractAt(
    "SonicAggregatorRouter",
    deployment.contractAddress,
    signer
  );

  console.log("Contract :", deployment.contractAddress);
  console.log("Signer   :", signer.address);

  const current = await router.minLiquidityThreshold();
  console.log("Current threshold:", current.toString());

  // Set to 0 — pair existence + nonzero reserve check is sufficient.
  // The frontend handles USD-based liquidity display.
  const tx = await router.setMinLiquidityThreshold(0n);
  console.log("Tx sent:", tx.hash);
  await tx.wait();
  console.log("Done. Threshold is now 0.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
