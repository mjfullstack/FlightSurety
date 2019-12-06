import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
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

    retrieveAirline(airName, callback) {
        let self = this;
        // let payload = {
        //     airline: self.airlines[0],
        //     flight: flight,
        //     timestamp: Math.floor(Date.now() / 1000)
        // } 
        self.flightSuretyApp.methods
            .retrieveAirline(airName)
            .call({ from: self.owner}, (error, results) => {
                callback(error, results);
            });
    }

    registerAirline(_name, _funds, _addr, callback) {
        let self = this;
        console.log(self.airlines[0]);
        let _fundsInEther = self.web3.utils.toWei(_funds, "ether");
        self.flightSuretyApp.methods
        // .registerAirline(_name, _funds, _addr, { from: self.airlines[0]}, (error, result) => { // 5 vs 3 args
            .registerAirline(_name, _funds, _addr) 
            .send({ from: self.airlines[0], value: _fundsInEther}, (error, result) => { // function is not payable
            // .send({ from: self.airlines[0], value: 0}, (error, result) => { // function is not payable
            // .send({ from: self.airlines[0]}, (error, result) => { // Error: no value
            // .sendTransaction({ from: self.airlines[0]}, (error, result) => { // Error: No such function
                callback(error, result);
            });
    }

}