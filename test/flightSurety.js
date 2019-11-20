
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    console.log(`FlightSurety in before: flightSuretyApp.address: ${config.flightSuretyApp.address}`); // 
    let beforeIsAuthed = await config.flightSuretyData.checkCallerStatus(config.flightSuretyApp.address);
    console.log(`FlightSurety in before: beforeIsAuthed: ${beforeIsAuthed}`);
  });

  it('Can authorize APP contract in DATA Contract...', async () => {
    
    // ARRANGE
    // Done in the 'before' above ONCE for the tests...

    // ACT
    let isAuthed = await config.flightSuretyData.checkCallerStatus(config.flightSuretyApp.address);
    console.log(`FlightSurety Can Auth App isAuthed: ${isAuthed}`);
    console.log(`FlightSurety Can Auth App: flightSuretyApp.address: ${config.flightSuretyApp.address}`);

    // ASSERT
    assert.equal(isAuthed, true, "APP contract could not get authorized");

  });

  it('Can register an airline via the DATA Contract...', async () => {
    
    // ARRANGE
    let air1reg = {
        name: 'Uno Air',
        bal: 10, // web3.toWei("10", "ether"),
        addr: accounts[1]
    }

    let air2reg = {
        name: 'Dosequis Air',
        bal: 10, // web3.toWei("10", "ether"),
        addr: config.testAddresses[0]
    }

    function log2console (_result) {
        console.log(`Airline Name: ${_result[0]}`);
        console.log(`Airline isRegistered: ${_result[1]}`);
        console.log(`Airline isFunded: ${_result[2]}`);
        console.log(`Airline Balance: ${_result[3].toNumber()}`);
        console.log(`Airline Address: ${_result[4]}`);
    }
    // ACT
    let isReg1 = await config.flightSuretyData.isAirlineRegistered(air1reg.name);
    let gotAir1 = await config.flightSuretyData.retrieveAirline(air1reg.name);
    await config.flightSuretyData.registerAirline(air2reg.name, air2reg.bal, air2reg.addr);
    let isReg2 = await config.flightSuretyData.isAirlineRegistered(air2reg.name);
    let gotAir2 = await config.flightSuretyData.retrieveAirline(air2reg.name);
    console.log(`FlightSurety Can register airline via DATA: isReg1: ${isReg1}`);
    console.log(`FlightSurety Can register airline via DATA: isReg2: ${isReg2}`);
    console.log(`FlightSurety Can retrieve airline via DATA: gotAir1: ${gotAir1}`);
    // console.log(gotAir1);
    log2console(gotAir1);
    console.log(`FlightSurety Can retrieve airline via DATA: gotAir2: ${gotAir2}`);
    log2console(gotAir2);

    // ASSERT
    assert.equal(isReg1, true, "DATA contract could not register FIRST airline via constructor");
    assert.equal(isReg2, true, "DATA contract could not register 2nd airline via registerAirline()");
    assert.equal(gotAir1.airName, air1reg.name, "DATA contract retrieve 1st airline via retrieveAirline()");
    assert.equal(gotAir1.airIsRegd, true, "DATA contract retrieve 1st airline via retrieveAirline()");
    assert.equal(gotAir1.airIsFunded, true, "DATA contract retrieve 1st airline via retrieveAirline()");
    assert.equal(gotAir1.airBal.toNumber(), air1reg.bal, "DATA contract retrieve 1st airline via retrieveAirline()");
    assert.equal(gotAir1.airAddr, air1reg.addr, "DATA contract retrieve 1st airline via retrieveAirline()");
    assert.equal(gotAir2.airName, air2reg.name, "DATA contract retrieve 2nd airline via retrieveAirline()");
    assert.equal(gotAir2.airIsRegd, true, "DATA contract retrieve 2nd airline via retrieveAirline()");
    assert.equal(gotAir2.airIsFunded, true, "DATA contract retrieve 2nd airline via retrieveAirline()");
    assert.equal(gotAir2.airBal.toNumber(), air2reg.bal, "DATA contract retrieve 2nd airline via retrieveAirline()");
    assert.equal(gotAir2.airAddr, air2reg.addr, "DATA contract retrieve 2nd airline via retrieveAirline()");
  });

  /****************************************************************************************/
  /* Operations and Settings - These are Udacity's Starter Code tests - Need review       */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

//   it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
//     // ARRANGE
//     let newAirline = accounts[2];

//     // ACT
//     try {
//         await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
//     }
//     catch(e) {

//     }
//     let result = await config.flightSuretyData.isAirline.call(newAirline); 

//     // ASSERT
//     assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

//   });
 

});
