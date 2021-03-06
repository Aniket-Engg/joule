const chai = require("chai");
const BigNumber = require('bignumber.js');
chai.use(require("chai-bignumber")(BigNumber));
chai.use(require("chai-as-promised"));
chai.should();

const {increaseTime, revert, snapshot, mine} = require('./evmMethods');
const {printNextContracts, printTxLogs} = require('./jouleUtils');
const utils = require('./web3Utils');

const JouleNative = artifacts.require("./Joule.sol");
const Joule = artifacts.require("./JouleBehindProxy.sol");
const Proxy = artifacts.require("./JouleProxy.sol");
const Storage = artifacts.require("./JouleStorage.sol");
const Vault = artifacts.require("./JouleVault.sol");

const commonTest = require("./jouleCommon");

const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

let NOW, TOMORROW, DAY_AFTER_TOMORROW;

const initTime = (now) => {
    NOW = now;
    TOMORROW = now + DAY;
    DAY_AFTER_TOMORROW = TOMORROW + DAY;
};

initTime(new Date("2017-10-10T15:00:00Z").getTime() / 1000);

contract('JouleProxy', accounts => {
    let snapshotId;

    beforeEach(async () => {
        snapshotId = (await snapshot()).result;
        const latestBlock = await utils.web3async(web3.eth, web3.eth.getBlock, 'latest');
        initTime(latestBlock.timestamp);
    });

    afterEach(async () => {
        await revert(snapshotId);
    });

    const createJoule = async() => {
        const vault = await Vault.new();
        const storage = await Storage.new();

        const joule = await Joule.new(vault.address, 0, 0, storage.address);
        await vault.setJoule(joule.address);
        await storage.giveAccess(joule.address);

        const proxy = await Proxy.new();
        await proxy.setJoule(joule.address);
        await joule.setProxy(proxy.address);

        return proxy;
    };

    commonTest.init(accounts, createJoule);
    commonTest.forEachTest(function (test) {
        it(test.name, test.test);
    });
});