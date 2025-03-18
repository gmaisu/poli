const PoliTokenContract = artifacts.require("PoliToken.sol");

const TOTAL_SUPPLY = 1_000_000_000;

module.exports = async function (deployer, network, accounts) {
    const owner = accounts[0];

    console.log(`Owner address is ${owner}`);

    await deployer.deploy(
        PoliTokenContract,
        owner,
        web3.utils.toWei(TOTAL_SUPPLY.toString(), "ether")
    );
};
