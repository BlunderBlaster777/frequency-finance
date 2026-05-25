const hre = require("hardhat");

const WS_ADDRESS = "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38";

// DexType enum indices matching the contract
const DexType = { UniV2: 0, Solidly: 1, UniV3: 2, Algebra: 3, MetropolisDLMM: 4 };

// Only addresses verified on-chain with working quote calls
const DEXES = [
  // UniV2-compatible (getAmountsOut confirmed working)
  { name: "SpookySwap V2",    router: "0xa6AD18C2aC47803E193F75c3677b14BF19B94883", dexType: DexType.UniV2 },
  { name: "Metropolis V2",    router: "0x95a7e403d7cF20F675fF9273D66e94d35ba49fA3", dexType: DexType.UniV2 },
  // Solidly-compatible (getAmountsOut with Route struct confirmed working)
  { name: "Shadow Exchange",  router: "0x1D368773735ee1E678950B7A97bcA2CafB330CDc", dexType: DexType.Solidly },
  // UniV3 (SpookySwap V3 SwapRouter, quoted via off-chain quoter 0x3F2026...)
  { name: "SpookySwap V3",    router: "0x593856bbfd6Aaf0b714277c0BF06307900d1Aa68", dexType: DexType.UniV3 },
  // Algebra (SwapX — quoted via off-chain quoter 0xd74a9B...)
  { name: "SwapX",            router: "0xE6E9F79e551Dd3FAeF8aBe035896fc65A9eEB26c", dexType: DexType.Algebra },
  // Metropolis DLMM (quoted via off-chain quoter 0x56eaa8...)
  { name: "Metropolis DLMM",  router: "0x67803fe6d76409640efDC9b7ABcD2c6c2E7cBa48", dexType: DexType.MetropolisDLMM },
];

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("─────────────────────────────────────────");
  console.log("Deploying SonicAggregatorRouter");
  console.log("Network  :", hre.network.name);
  console.log("Chain ID :", (await hre.ethers.provider.getNetwork()).chainId.toString());
  console.log("Deployer :", deployer.address);
  console.log("Balance  :", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "S");
  console.log("─────────────────────────────────────────");

  const Factory = await hre.ethers.getContractFactory("SonicAggregatorRouter");
  const router = await Factory.deploy(WS_ADDRESS, deployer.address);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("Deployed to:", routerAddress);

  const typeNames = ["UniV2", "Solidly", "UniV3", "Algebra", "MetropolisDLMM"];
  console.log("\nRegistering DEXes...");
  for (const dex of DEXES) {
    console.log(`  ${dex.name} (${typeNames[dex.dexType]})...`);
    const tx = await router.addDex(dex.router, dex.name, dex.dexType);
    await tx.wait();
    console.log(`  ✓`);
  }

  console.log("\n─────────────────────────────────────────");
  console.log("Done:", routerAddress);
  console.log("─────────────────────────────────────────");

  const fs = require("fs");
  const info = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    contractAddress: routerAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    dexes: DEXES,
    wsAddress: WS_ADDRESS,
    quoters: {
      spookySwapV3:  "0x3F2026Cae76b987C4002e62B9dF70988b4388234",
      swapXAlgebra:  "0xd74a9Bd1C98B2CbaB5823107eb2BE9C474bEe09A",
      metropolisLB:  "0x56eaa884F29620fD6914827AaAE9Ee6a5C383149",
    }
  };
  const dir = "./deployments";
  if (!require("fs").existsSync(dir)) require("fs").mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/${hre.network.name}.json`, JSON.stringify(info, null, 2));
  console.log("Saved to", `${dir}/${hre.network.name}.json`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
