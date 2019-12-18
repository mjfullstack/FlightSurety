import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
// import TruffleContract from '\@truffle/contract/dist/truffle-contract.js';
// import TruffleContract from 'truffle-contract';
// infura.io URL : rinkeby.infura.io/v3/3ac14fbe81e0423fa4bd9936e05fa011
// web3ProviderURL: "https://rinkeby.infura.io/v3/3ac14fbe81e0423fa4bd9936e05fa011";

export default class Contract {
    constructor(network, _callback) {

        this.config = Config[network];
        // this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.initWeb3();
        // this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.metamaskAccountID = null;
        this.contracts = {};
        this.callback = _callback;
        // this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    // initWeb3: async function () {
    async initWeb3  ()  {
        // Adding with above line changes
        let self = this;
        /// Find or Inject Web3 Provider
        /// Modern dapp browsers...
        if (window.ethereum) {
            console.log("initWeb3: Modern dapp browsers...");
            // App.web3Provider = window.ethereum;
            self.web3 = window.ethereum;
            try {
                // Request account access
                await window.ethereum.enable();
                console.log("initWeb3: window.ethereum");
                console.log(window.ethereum);
            } catch (error) {
                // User denied account access...
                console.error("User denied account access")
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            console.log("initWeb3: Legacy dapp browsers...");
            // App.web3Provider = window.web3.currentProvider;
            self.web3 = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            console.log("initWeb3: If no injected web3 instance is detected, fall back to Ganache...");
            // App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            // this.flightSuretyApp = new Web3.providers.HttpProvider('http://localhost:7545');
            self.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
    }

        await self.getMetaskAccountID();

        await self.initFlightSuretyApp(); // NAME CHANGE, and placement 

        console.log(`initWeb3: self.callback`);
        console.log(self.callback);
        return await self.initialize(self.callback); // Move to reate order where there was none...
    }

    // getMetaskAccountID: function () {
    async getMetaskAccountID() {
        let self = this;
        web3 = new Web3(self.web3);
        console.log("getMetaskAccountID: self.web3");
        console.log(self.web3);
        console.log("getMetaskAccountID: web3"); // Looks good...
        console.log(web3);

        // Retrieving accounts
        await web3.eth.getAccounts(function(err, res) { // of undefined
        // _web3.getAccounts(function(err, res) { // NOT a function
            if (err) {
                console.log('Error:',err);
                return;
            }
            console.log('getMetaskAccountID:', res);
            console.log(res);
            self.metamaskAccountID = res[0];
            console.log('this.metamaskAccountID:', res[0]);
        })
    }

        async initFlightSuretyApp() {
        console.log(`Hello World from NEW initFlightSuretyApp, OLD initSupplyChain!!!`);
        let self = this;
        /// Source the truffle compiled smart contracts
        // Adding for TruffleContract
        // Works, Added externals in webpack.config.dapp.js for xmlhttprequest
        var contract = require("@truffle/contract");

        var FlightSuretyAppArtifact = FlightSuretyApp;
        console.log("contract");
        console.log(contract);
        self.contracts.FlightSuretyApp = TruffleContract(FlightSuretyAppArtifact);
        self.contracts.FlightSuretyApp.setProvider(self.web3);
        self.flightSuretyApp = self.contracts.FlightSuretyApp;

    }

    async initialize(callback) {
        let self = this;
        web3 = new Web3(self.web3);
        await web3.eth.getAccounts((error, accts) => {
            if (error) {
                console.log('Error:',error);
                return;
            }

            this.owner = accts[0];
            console.log(`this.owner = ${this.owner}`);

            // let counter = 1;
            // let eachMax = 5;
            
            // while(this.airlines.length < eachMax) {
            //     console.log(`airlines[${counter}] = acct: ${accts[counter]}`);
            //     this.airlines.push(accts[counter++]);
            // }

            // while(this.passengers.length < eachMax) {
            //     console.log(`passengers[${counter - eachMax}] = acct: ${accts[counter]}`);
            //     this.passengers.push(accts[counter++]);
            // }

            callback();
        });
    }

    async isOperational(callback) {
        let self = this;
        console.log("isOperational: self.flightSuretyApp");
        console.log(self.flightSuretyApp);
        console.log("isOperational: self.contracts.FlightSuretyApp");
        console.log(self.contracts.FlightSuretyApp);
        await self.getMetaskAccountID();
        await self.contracts.FlightSuretyApp.deployed().then(function(instance) {
            return instance.isOperational();
            }).then(function(result) {
                console.log(`isOperational: result:`);
                console.log(result);

                callback(null, result, self.metamaskAccountID);
            })
            .catch(function(err) {
                console.log(err.message);
            });
        }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }

    async retrieveOneAirline(airName, callback) {
        let self = this;
        await self.contracts.FlightSuretyApp.deployed().then(function(instance) {
            return instance.retrieveAirline(airName);
            }).then(function(result) {
                callback(null, result);
            })
            .catch(function(err) {
                console.log(err.message);
            });
    }

    async retrieveAllAirlines(callback) {
        let self = this;
        let testAirlineNames = [];
        await self.contracts.FlightSuretyApp.deployed().then(function(instance) {
            return instance.getAirlineCount();
        }).then( async function(airlineCount) {
            console.log(`airlineCount ${airlineCount}`);
            for (let i=0; i<airlineCount; i++) {
                await self.contracts.FlightSuretyApp.deployed().then(function(instance) {
                    return instance.getAirlineName(i);
                }).then ( (testAirlineName) => {
                    console.log(`Retrieve Airline NAME... APP.getAirlineName(${i}): testAirlineName: ${testAirlineName}`);
                    testAirlineNames.push(testAirlineName);
                    console.log(`Display testAirlineNames ARRAY[${i}]: ${testAirlineNames[i]} `);
                })
            }
            console.log(`testAirlineNames ARRAY...`);
            console.log(testAirlineNames);
            callback(testAirlineNames);
        })
        .catch(function(err) {
            console.log(err.message);
        });
    }

    async registerAirline(_name, _addr, _sponsor, callback) {
        let self = this;
        web3 = new Web3(self.web3);
        console.log(`self.owner: ${self.owner}`);
        // let _fundsInWei = web3.utils.toWei(_funds, "ether");
        // // self.flightSuretyApp.methods // OLD METHOD BEFORE WALLET
        //     // .registerAirline(_name, _funds, _addr, { from: self.airlines[0]}, (error, result) => { // 5 vs 3 args
        //     // .send({ from: self.airlines[0], value: 0}, (error, result) => { // function is not payable
        //     // //    callback(error, result);
        //     });
        await self.contracts.FlightSuretyApp.deployed().then(function(instance) {
            return instance.registerAirline(_name, _addr, _sponsor, { from: _sponsor});
            // return instance.registerAirline(_name, _addr, _sponsor);
            }).then(function(result) {
                console.log(`contract.js registerAirline: result:`);
                console.log(result);
                callback(null, result);
            })
            .catch(function(err) {
                console.log(err.message);
            });
    }

    async fundAirline(_name, _funds, _addr, callback) {
        let self = this;
        web3 = new Web3(self.web3);
        console.log(`self.owner: ${self.owner}`);
        console.log(`self.metamaskAccountID: ${self.metamaskAccountID}`);
        let _fundsInWei = web3.utils.toWei(_funds, "ether");
        await self.contracts.FlightSuretyApp.deployed().then(function(instance) {
            return instance.fundAirline(_name, _funds, _addr, { from: self.metamaskAccountID, value: _fundsInWei});
            }).then(function(result) {
                console.log(`contract.js fundAirline: result:`);
                console.log(result);
                callback(null, result);
            })
            .catch(function(err) {
                console.log(err.message);
            });
    }

}