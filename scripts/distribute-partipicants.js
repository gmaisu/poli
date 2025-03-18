import {
    CONTRACT_ADDRESS,
    OWNER_PRIVATE_KEY,
    OWNER_ADDRESS,
    FUND_WALLET_ADDRESS,
    CONTRACT,
    API_SERVICE_URL,
    web3,
} from "./const.js";

import { BN } from "bn.js";
import { createObjectCsvWriter as csvWriter } from "csv-writer";

async function getAssetTransfers(body) {
    const response = await fetch(API_SERVICE_URL, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-type": "application/json; charset=UTF-8",
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
}

async function getFundersAndAllocations() {
    console.log(`Fetching incoming transactions for ${FUND_WALLET_ADDRESS}`);

    const funders = {};
    let totalFunded = new BN("0");
    let totalTransactions = 0;

    const pageSize = "0x64";
    let pageKeyString = null;
    let nextPage = true;
    let page = 0;

    while (nextPage) {
        const body = {
            id: 1,
            jsonrpc: "2.0",
            method: "alchemy_getAssetTransfers",
            params: [
                {
                    fromBlock: "0x0",
                    toBlock: "latest",
                    toAddress: FUND_WALLET_ADDRESS,
                    category: ["external"],
                    order: "asc",
                    withMetadata: true,
                    excludeZeroValue: true,
                    maxCount: pageSize,
                },
            ],
        };

        if (pageKeyString) {
            body["params"][0]["pageKey"] = pageKeyString;
        }

        const response = await getAssetTransfers(body);

        const transfers = response.result.transfers;
        const pageKey = response.result.pageKey;

        for (let i = 0; i < transfers.length; i++) {
            const transfer = transfers[i];

            let sender = transfer.from.toLowerCase();
            let amount = new BN(web3.utils.toWei(transfer.value, "ether"));

            if (!funders[sender]) {
                funders[sender] = new BN("0");
            }

            funders[sender] = funders[sender].add(amount);
            totalFunded = totalFunded.add(amount);

            totalTransactions++;
        }

        if (pageKey) {
            pageKeyString = pageKey;
        } else {
            nextPage = false;
        }

        page++;
    }

    console.log(
        `Total Funded: ${web3.utils.fromWei(totalFunded, "ether")} BNB`
    );
    console.log(`Total Transactions Count: ${totalTransactions}`);

    const totalSupply = await CONTRACT.methods.totalSupply().call();
    const partipicantsTotalAmount = new BN(totalSupply)
        .mul(new BN("35"))
        .div(new BN("100"));

    let allocations = {};
    for (let funder in funders) {
        let funded = funders[funder];

        let proportion = funded.mul(partipicantsTotalAmount).div(totalFunded);

        allocations[funder] = {
            funded: funded,
            receive: proportion,
        };
    }

    const totalProportion = Object.values(allocations)
        .map((a) => a.receive)
        .reduce((a, b) => a.add(b));

    if (partipicantsTotalAmount !== totalProportion) {
        allocations[Object.keys(allocations)[0]]["receive"] = allocations[
            Object.keys(allocations)[0]
        ]["receive"].add(partipicantsTotalAmount.sub(totalProportion));
    }

    return allocations;
}

async function batchTransfer(recipients, amounts) {
    const convertedAmounts = amounts.map((a) => a.toString());

    // Create the transaction
    const tx = CONTRACT.methods.batchTransfer(recipients, convertedAmounts);

    const gas = await tx.estimateGas({ from: OWNER_ADDRESS });
    const gasPrice = await web3.eth.getGasPrice();
    const nonce = await web3.eth.getTransactionCount(OWNER_ADDRESS);

    const signedTx = await web3.eth.accounts.signTransaction(
        {
            to: CONTRACT_ADDRESS,
            data: tx.encodeABI(),
            gas,
            gasPrice,
            nonce,
        },
        OWNER_PRIVATE_KEY
    );

    // Send the transaction
    const receipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
    );
    console.log("Transaction receipt:", receipt);
}

// GET incoming transactions with API and distribute allocations and export to CSV
async function main() {
    const records = [];

    const funderAndAllocations = await getFundersAndAllocations();
    const recipients = Object.keys(funderAndAllocations);
    const amounts = Object.values(funderAndAllocations);

    for (let i = 0; i < recipients.length; i++) {
        records.push({
            id: i + 1,
            funder: recipients[i],
            funded: web3.utils.fromWei(amounts[i].funded, "ether"),
            received: web3.utils.fromWei(amounts[i].receive, "ether"),
        });
    }

    // Export data to CSV
    const csv = csvWriter({
        path: "partipicants-distribution.csv",
        header: [
            { id: "id", title: "ID" },
            { id: "funder", title: "Funder Address" },
            { id: "funded", title: "Funded BNB Amount" },
            { id: "received", title: "Received Token Amount" },
        ],
    });

    await csv.writeRecords(records);
    console.log("CSV file has been written successfully.");

    // Call the contract method to distribute tokens
    console.log(`Distributing tokens to partipicants wallets...`);
    await batchTransfer(
        recipients,
        amounts.map((a) => a.receive)
    );
    console.log("Tokens distributed successfully.");
}

// Run the script
main().catch((err) => console.error(err));
