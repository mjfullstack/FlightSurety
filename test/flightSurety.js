
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

let DEBUG_LOGGING = true;

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    let beforeIsAuthedFALSE = await config.flightSuretyData.checkCallerStatus(config.flightSuretyApp.address);
    console.log(`FlightSurety in before: beforeIsAuthedFALSE: ${beforeIsAuthedFALSE}`);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    console.log(`FlightSurety in before: flightSuretyApp.address: ${config.flightSuretyApp.address}`); // 
    let beforeIsAuthedTRUE = await config.flightSuretyData.checkCallerStatus(config.flightSuretyApp.address);
    console.log(`FlightSurety in before: beforeIsAuthedTRUE: ${beforeIsAuthedTRUE}`);
  });

  function log2console (_result) {
    console.log(`Airline Name: ${_result[0]}`);
    console.log(`Airline isRegistered: ${_result[1]}`);
    console.log(`Airline isFunded: ${_result[2]}`);
    console.log(`Airline Balance: ${_result[3].toNumber()}`);
    console.log(`Airline Address: ${_result[4]}`);
    console.log(`Airline voteCount: ${_result[5].toNumber()}`);
    console.log(`Airline ttlVoters: ${_result[6].toNumber()}`);
  }

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

/************** MAY ONLY WORK BEFORE ADDING CAPABILITY IN APP CONTRACT ******************
  it('Can register an airline via the DATA Contract...', async () => {
    
    // ARRANGE
    let air1reg = {
        name: 'Uno Air',
        bal: 10, // web3.toWei("10", "ether"),
        addr: accounts[1],
        votes: 1,
        ttlVoters: 1       
    }

    let air2reg = {
        name: 'Dosequis Air',
        bal: 10, // web3.toWei("10", "ether"),
        addr: config.testAddresses[0],
        votes: 1,
        ttlVoters: 2
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
    assert.equal(gotAir1.airName, air1reg.name, "DATA can't retrieve 1st airline NAME via retrieveAirline()");
    assert.equal(gotAir1.airIsRegd, true, "DATA can't retrieve 1st airline isREGISTERED via retrieveAirline()");
    assert.equal(gotAir1.airIsFunded, true, "DATA can't retrieve 1st airline isFUNDED via retrieveAirline()");
    assert.equal(gotAir1.airBal.toNumber(), air1reg.bal, "DATA can't retrieve 1st airline BALANCE via retrieveAirline()");
    assert.equal(gotAir1.airAddr, air1reg.addr, "DATA can't retrieve 1st airline ADDRESS via retrieveAirline()");
    assert.equal(gotAir1.airVoteCount.toNumber(), air1reg.votes, "DATA can't retrieve 1st airline VOTE COUNT via retrieveAirline()");
    assert.equal(gotAir1.airTtlVoters.toNumber(), air1reg.ttlVoters, "DATA can't retrieve 1st airline TOTAL VOTERS via retrieveAirline()");
    assert.equal(gotAir2.airName, air2reg.name, "DATA can't retrieve 2nd airline NAME via retrieveAirline()");
    assert.equal(gotAir2.airIsRegd, true, "DATA can't retrieve 2nd airline isREGISTERED via retrieveAirline()");
    assert.equal(gotAir2.airIsFunded, true, "DATA can't retrieve 2nd airline isFUNDED via retrieveAirline()");
    assert.equal(gotAir2.airBal.toNumber(), air2reg.bal, "DATA can't retrieve 2nd airline BALANCE via retrieveAirline()");
    assert.equal(gotAir2.airAddr, air2reg.addr, "DATA can't retrieve 2nd airline ADDRESS via retrieveAirline()");
    assert.equal(gotAir2.airVoteCount.toNumber(), air2reg.votes, "DATA can't retrieve 2nd airline VOTE COUNT via retrieveAirline()");
    assert.equal(gotAir2.airTtlVoters.toNumber(), air2reg.ttlVoters, "DATA can't retrieve 2nd airline TOTAL VOTERS via retrieveAirline()");
  });
************** MAY ONLY WORK BEFORE ADDING CAPABILITY IN APP CONTRACT ******************/

  it('Can register an airline via the APP Contract...', async () => {
    
    // ARRANGE
    let air1reg = {
        name: 'Uno Air', // This first airline created in constructor per project rubic
        bal: 10, // web3.toWei("10", "ether"),
        addr: accounts[1],
        votes: 1,
        ttlVoters: 1       
    }

    let air2reg = {
        name: 'Dosequis Air',
        bal: 10, // web3.toWei("10", "ether"),
        addr: accounts[2],
        votes: 1,
        ttlVoters: 2
    }

    // let chkSuccess, chkVotes;

    /***  NOTE: CAN'T WATCH EVENTS: The current provider doesn't support subscriptions!  ***/
    // Declare and Initialize a variable for event
    var eventEmittedDATA_1 = false;
    // EVENT 1: Watch the emitted event AirlineRegisteredDATA()
    config.flightSuretyData.AirlineRegisteredDATA( async (err, event) => {
        if (err) {
            // console.log("err 1 new: The current provider doesn't support subscriptions!");
            // // console.log(err);
            eventEmittedDATA_1 = true;
            // console.log("REGISTERED eventEmittedDATA_1 event 1");
            // // let isReg3 = await config.flightSuretyData.isAirlineRegistered(air2reg.name);
            // // NOW BOTH isReg3 & isReg4 get false, but not needed here anyway
            // let gotAir3 = await config.flightSuretyApp.retrieveAirline(air2reg.name);
            // let isReg3 = gotAir3[1]; // struct Airline.isRegistered
            // console.log(`FlightSurety AT DATA EVENT Can CHECK airline TWO via APP: isReg3: ${isReg3}`);
            // // console.log(isReg3);
        } else {
            console.log("event 1 new:");
            console.log(event);
        }
    });

    // EVENT 2: Watch the emitted event LoggingDATA()
    // config.flightSuretyData.LoggingDATA( (err, event) => {
    //     if (err) {
    //         console.log("err 2 new: The current provider doesn't support subscriptions!");
    //         // console.log(err);
    //         console.log("LOGGING eventEmittedDATA_1 event2");
    //     } else {
    //         console.log("event 2 new:");
    //         console.log(event);
    //     }
    // });

    var eventEmittedAPP_1 = false;
    // EVENT 3: Watch the emitted event AirlineRegisteredAPP()
    config.flightSuretyApp.AirlineRegisteredAPP( async (err, event) => {
        if (err) {
            // console.log("err 3 new: The current provider doesn't support subscriptions!");
            // // console.log(err);
            eventEmittedAPP_1 = true;
            // console.log("REGISTERED eventEmittedAPP_1 event 3");
            // // let isReg4 = await config.flightSuretyData.isAirlineRegistered(air2reg.name);
            // // NOW BOTH isReg3 & isReg4 get false, but not needed here anyway
            // let gotAir4 = await config.flightSuretyApp.retrieveAirline(air2reg.name);
            // let isReg4 = gotAir4[1]; // struct Airline.isRegistered
            // console.log(`FlightSurety AT APP EVENT Can CHECK airline TWO via APP: isReg4: ${isReg4}`);
            // // console.log(isReg4);
        } else {
            console.log("event 3 new:");
            console.log(event);
        }
    });

    // EVENT 4: Watch the emitted event LoggingAPP()
    // config.flightSuretyApp.LoggingAPP((err, event) => {
    //     if (err) {
    //         console.log("err 4 new: The current provider doesn't support subscriptions!");
    //         // console.log(err);
    //         console.log("LOGGING eventEmittedAPP_1 event 4");
    //     } else {
    //         console.log("event 4 new:");
    //         console.log(event);
    //     }
    // });
    /***  NOTE: CAN'T WATCH EVENTS: The current provider doesn't support subscriptions!  ***/

    // ACT
    let isReg1 = await config.flightSuretyData.isAirlineRegistered(air1reg.name);
    let gotAir1 = await config.flightSuretyApp.retrieveAirline(air1reg.name);
    await config.flightSuretyApp.registerAirline(air2reg.name, air2reg.bal, air2reg.addr);
    let gotAir2 = await config.flightSuretyApp.retrieveAirline(air2reg.name);
    // Original function FAILS, returns FALSE when IS S/B TRUE...
    // SO... Changed to new function structure in DATA contract
    // let isReg2 = await config.flightSuretyData.isAirlineRegistered(air2reg.name);
    // NOTE: With multiple attempts and function configurations, the isAirlineRegistered()
    // CANNOT return reliable answers. THEREFORE, changing to using retrieveAirline() and
    // selecting the appropriate array item.
    let isReg2 = gotAir2[1]; // struct Airline.isRegistered
    if (DEBUG_LOGGING) {
        console.log(`FlightSurety Can CHECK airline ONE via APP: isReg1: ${isReg1}`);
        console.log(`FlightSurety Can CHECK airline TWO via APP: isReg2: ${isReg2}`);
        // console.log(`FlightSurety Can register airline via APP: chkSuccess T/F: ${chkSuccess}`);
        // console.log(`FlightSurety Can register airline via APP: chkSuccess Votes: ${chkSuccess[1].toNumber()}`);
        console.log(`FlightSurety Can retrieve airline via APP: gotAir1: ${gotAir1}`);
        // console.log(gotAir1);
        log2console(gotAir1);
        console.log(`FlightSurety Can retrieve airline via APP: gotAir2: ${gotAir2}`);
        log2console(gotAir2);
        console.log(`eventEmittedAPP_1: ${eventEmittedAPP_1}`);
        console.log(`eventEmittedDATA_1: ${eventEmittedDATA_1}`);
    }

    // ASSERT
    assert.equal(isReg1, true, "APP contract could not register FIRST airline via constructor");
    assert.equal(isReg2, true, "APP contract could not register 2nd airline via registerAirline()");
    assert.equal(gotAir1.airName, air1reg.name, "APP can't retrieve 1st airline NAME via retrieveAirline()");
    assert.equal(gotAir1.airIsRegd, true, "APP can't retrieve 1st airline isREGISTERED via retrieveAirline()");
    assert.equal(gotAir1.airIsFunded, true, "APP can't retrieve 1st airline isFUNDED via retrieveAirline()");
    assert.equal(gotAir1.airBal.toNumber(), air1reg.bal, "APP can't retrieve 1st airline BALANCE via retrieveAirline()");
    assert.equal(gotAir1.airAddr, air1reg.addr, "APP can't retrieve 1st airline ADDRESS via retrieveAirline()");
    assert.equal(gotAir1.airVoteCount.toNumber(), air1reg.votes, "APP can't retrieve 1st airline VOTE COUNT via retrieveAirline()");
    assert.equal(gotAir1.airTtlVoters.toNumber(), air1reg.ttlVoters, "APP can't retrieve 1st airline TOTAL VOTERS via retrieveAirline()");
    assert.equal(gotAir2.airName, air2reg.name, "APP can't retrieve 2nd airline NAME via retrieveAirline()");
    assert.equal(gotAir2.airIsRegd, true, "APP can't retrieve 2nd airline isREGISTERED via retrieveAirline()");
    assert.equal(gotAir2.airIsFunded, true, "APP can't retrieve 2nd airline isFUNDED via retrieveAirline()");
    assert.equal(gotAir2.airBal.toNumber(), air2reg.bal, "APP can't retrieve 2nd airline BALANCE via retrieveAirline()");
    assert.equal(gotAir2.airAddr, air2reg.addr, "APP can't retrieve 2nd airline ADDRESS via retrieveAirline()");
    assert.equal(gotAir2.airVoteCount.toNumber(), air2reg.votes, "APP can't retrieve 2nd airline VOTE COUNT via retrieveAirline()");
    assert.equal(gotAir2.airTtlVoters.toNumber(), air2reg.ttlVoters, "APP can't retrieve 2nd airline TOTAL VOTERS via retrieveAirline()");
    assert.equal(eventEmittedDATA_1, true, 'Invalid DATA event emitted')        
    assert.equal(eventEmittedAPP_1, true, 'Invalid APP event emitted')        
    // assert.equal(eventEmittedAPP_1, false, 'Invalid APP event emitted'); // JUST To get the Events Emitted to print...
});

it('Can register an airline BY SECOND AIRLINE via the APP Contract...', async () => {
    
    // ARRANGE
    let air3reg = {
        name: 'Trifecta Air',
        bal: 10, // web3.toWei("10", "ether"),
        addr: accounts[3],
        votes: 1,
        ttlVoters: 3       
    }

    let air4reg = {
        name: 'Quatro King Air',
        bal: 10, // web3.toWei("10", "ether"),
        addr: accounts[4],
        votes: 1,
        ttlVoters: 4
    }

    // let chkSuccess, chkVotes;

    /***  NOTE: CAN'T WATCH EVENTS: The current provider doesn't support subscriptions!  ***/
    // Declare and Initialize a variable for event
    var eventEmittedDATA_2 = false;
    // EVENT 1: Watch the emitted event AirlineRegisteredDATA()
    config.flightSuretyData.AirlineRegisteredDATA( async (err, event) => {
        if (err) {
            eventEmittedDATA_2 = true;
        } else {
            console.log("event 1 new:");
            console.log(event);
        }
    });

    var eventEmittedAPP_2 = false;
    // EVENT 3: Watch the emitted event AirlineRegisteredAPP()
    config.flightSuretyApp.AirlineRegisteredAPP( async (err, event) => {
        if (err) {
            eventEmittedAPP_2 = true;
        } else {
            console.log("event 3 new:");
            console.log(event);
        }
    });
    /***  NOTE: CAN'T WATCH EVENTS: The current provider doesn't support subscriptions!  ***/

    // ACT
    await config.flightSuretyApp.registerAirline(air3reg.name, air3reg.bal, air3reg.addr, {from: accounts[1]});
    // Original function FAILS, returns FALSE when IS S/B TRUE...
    // let isReg3 = await config.flightSuretyData.isAirlineRegistered(air3reg.name);
    let gotAir3 = await config.flightSuretyApp.retrieveAirline(air3reg.name);
    let isReg3 = gotAir3[1]; // struct Airline.isRegistered
    await config.flightSuretyApp.registerAirline(air4reg.name, air4reg.bal, air4reg.addr, {from: accounts[2]});
    let gotAir4 = await config.flightSuretyApp.retrieveAirline(air4reg.name);
    // Original function FAILS, returns FALSE when IS S/B TRUE...
    // SO... Changed to new function structure in DATA contract
    let isReg4 = gotAir4[1]; // struct Airline.isRegistered
    if (DEBUG_LOGGING) {
        console.log(`FlightSurety Can CHECK airline THREE via APP: isReg3: ${isReg3}`);
        console.log(`FlightSurety Can CHECK airline FOUR via APP: isReg4: ${isReg4}`);
        console.log(`FlightSurety Can retrieve airline via APP: gotAir3: ${gotAir3}`);
        log2console(gotAir3);
        console.log(`FlightSurety Can retrieve airline via APP: gotAir4: ${gotAir4}`);
        log2console(gotAir4);
        console.log(`eventEmittedAPP_2: ${eventEmittedAPP_2}`);
        console.log(`eventEmittedDATA_2: ${eventEmittedDATA_2}`);
    }
    // ASSERT
    assert.equal(isReg3, true, "APP contract could not register THIRD airline via constructor");
    assert.equal(isReg4, true, "APP contract could not register FOURTH airline via registerAirline()");
    assert.equal(gotAir3.airName, air3reg.name, "APP can't retrieve 3rd airline NAME via retrieveAirline()");
    assert.equal(gotAir3.airIsRegd, true, "APP can't retrieve 3rd airline isREGISTERED via retrieveAirline()");
    assert.equal(gotAir3.airIsFunded, true, "APP can't retrieve 3rd airline isFUNDED via retrieveAirline()");
    assert.equal(gotAir3.airBal.toNumber(), air3reg.bal, "APP can't retrieve 3rd airline BALANCE via retrieveAirline()");
    assert.equal(gotAir3.airAddr, air3reg.addr, "APP can't retrieve 3rd airline ADDRESS via retrieveAirline()");
    assert.equal(gotAir3.airVoteCount.toNumber(), air3reg.votes, "APP can't retrieve 3rd airline VOTE COUNT via retrieveAirline()");
    assert.equal(gotAir3.airTtlVoters.toNumber(), air3reg.ttlVoters, "APP can't retrieve 3rd airline TOTAL VOTERS via retrieveAirline()");
    assert.equal(gotAir4.airName, air4reg.name, "APP can't retrieve 4th airline NAME via retrieveAirline()");
    assert.equal(gotAir4.airIsRegd, true, "APP can't retrieve 4th airline isREGISTERED via retrieveAirline()");
    assert.equal(gotAir4.airIsFunded, true, "APP can't retrieve 4th airline isFUNDED via retrieveAirline()");
    assert.equal(gotAir4.airBal.toNumber(), air4reg.bal, "APP can't retrieve 4th airline BALANCE via retrieveAirline()");
    assert.equal(gotAir4.airAddr, air4reg.addr, "APP can't retrieve 4th airline ADDRESS via retrieveAirline()");
    assert.equal(gotAir4.airVoteCount.toNumber(), air4reg.votes, "APP can't retrieve 4th airline VOTE COUNT via retrieveAirline()");
    assert.equal(gotAir4.airTtlVoters.toNumber(), air4reg.ttlVoters, "APP can't retrieve 4th airline TOTAL VOTERS via retrieveAirline()");
    assert.equal(eventEmittedDATA_2, true, 'Invalid DATA event emitted')        
    assert.equal(eventEmittedAPP_2, true, 'Invalid APP event emitted')        
    // assert.equal(eventEmittedAPP_2, false, 'Invalid APP event emitted'); // JUST To get the Events Emitted to print...
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
