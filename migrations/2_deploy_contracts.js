const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = function(deployer) {

    // let firstAirline = '0xf17f52151EbEF6C7334FAD080c5704D77216b732'; // account[1] for our test suite
    let firstAirline = '0x724010d1cd4bc3d816e03677141d1ffc0edc1433'; // account[1] for our test suite
    deployer.deploy(FlightSuretyData, firstAirline)
    .then(() => {
        // let firstAirline = '0xf17f52151EbEF6C7334FAD080c5704D77216b732'; // account[1] for our test suite
        // let firstAirline = '0x724010d1cd4bc3d816e03677141d1ffc0edc1433'; // account[1] for our test suite
        console.log(`deploy: FlightSuretyData.address: ${FlightSuretyData.address}`);
        return deployer.deploy(FlightSuretyApp, FlightSuretyData.address, firstAirline)
        .then(() => {
            let config = {
                localhost: {
                    // url: 'http://localhost:8545',
                    url: 'https://rinkeby.infura.io/v3/3ac14fbe81e0423fa4bd9936e05fa011',
                    dataAddress: FlightSuretyData.address,
                    appAddress: FlightSuretyApp.address
                }
            }
            // Creates JSON files for addresses to be the same for server and dapp
            fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
            fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
        });
    });
}