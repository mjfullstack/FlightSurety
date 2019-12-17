
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;
    let initLookupDispComplete = false;
    let initRegAirDispComplete = false;
    let initFundAirDispComplete = false;
    let initVoteAirDispComplete = false;

    let contract = new Contract('localhost', async () => {
        let opsStatusCheckCount = 0;

        // Read Ops Status at Start-Up and...
        await contract.isOperational((error, result, currentAcct) => {
            console.log(error,result);
            console.log(`currentAcct: ${currentAcct}`)
            displayOps('Operational Status', 'Display current account and check contract operational status', opsStatusCheckCount, currentAcct, [ { label: 'Operational Status', error: error, value: result} ]);
            opsStatusCheckCount += 1;
        });
        // ALSO read Ops Status when clicked to check it...
        DOM.elid('check-status').addEventListener('click', () => {
            checkOpStatus(opsStatusCheckCount);
            opsStatusCheckCount += 1;
        });
    
        // Retrieve Airline
        getAllAirlines();
        // ALSO LOOKUP an Airline Status when clicked to check it...
        DOM.elid('lookup-airline').addEventListener('click', () => {
            let _name = DOM.elid('lookup-airline-name').value;
            // If a name was entered, display that SINGLE airline
            if (_name) {
                console.log("NOT null _name: ", _name);
                contract.retrieveOneAirline(_name, (error, result) => {
                    console.log(error, result, _name);
                    displayAirClear('Airline List', 'Retrieve Airline Details', initLookupDispComplete, 'Airline Status')
                    displayAir('Airline List', 'Retrieve Airline Details', initLookupDispComplete, [ { label: 'Airline Status', error: error, value: result} ]);
                    console.log(`result.airIsRegd: ${result.airIsRegd}`);
                    if (result.airIsRegd) {
                        DOM.elid('lookup-airline-name').value = "";
                    }
                });
            } else { // Otherwise, a null name retrieves ALL airlines
                console.log("NULL _name: ", _name);
                getAllAirlines();
            }
            
        });
    

        // REGISTER AIRLINE: User-submitted transaction
        displayRegAirline('Airline Registration', "Add New Airlines to the Program - Provide Sponsoring Airline's Address", initRegAirDispComplete, [ { label: 'New Airline to Register'} ]);
        initRegAirDispComplete = true;
        DOM.elid('reg-airline-btn').addEventListener('click', async () => {
            let airlineName = DOM.elid('reg-airline-name').value;
            let airlineAddress = DOM.elid('reg-airline-addr').value;
            let airlineSponsor = DOM.elid('reg-sponsor-addr').value;

            console.log(`airlineName: ${airlineName}`);
            console.log(`airlineAddress: ${airlineAddress}`);
            // Write transaction
            console.log(airlineName, airlineAddress);
            await contract.registerAirline(airlineName, airlineAddress, airlineSponsor, async (error, result) => {
                console.log(`index.js registerAirline: result:`);
                console.log(`result.receipt.status: ${result.receipt.status}`);
                if (result.receipt.status == true) {
                    await contract.retrieveOneAirline(airlineName, (error, retResult) => {
                        console.log(error, retResult, airlineName);
                        displayRegAirline('Airline Registration', 'Add New Airlines to the Program', initRegAirDispComplete, [ { label: 'New Airline Registered', error: error, value: retResult} ]);
                        getAllAirlines();
                        console.log(`result.airIsRegd: ${retResult.airIsRegd}`);
                    });
                    DOM.elid('reg-airline-name').value = "";
                    DOM.elid('reg-airline-addr').value = "";
                    DOM.elid('reg-sponsor-addr').value = "";
                }
            });
        })
    
        // FUND AIRLINE: User-submitted transaction
        displayFundAirline('Airline Funding', "Fund a Registered Airline", initFundAirDispComplete, [ { label: 'Fund a Registered Airline'} ]);
        initFundAirDispComplete = true;
        DOM.elid('fund-airline-btn').addEventListener('click', async () => {
            checkOpStatus(opsStatusCheckCount);
            opsStatusCheckCount += 1;
            let airlineName = DOM.elid('fund-airline-name').value;
            let airlineFunds = DOM.elid('fund-airline-funds').value;
            let airlineAddress = DOM.elid('fund-airline-addr').value;
            console.log(`airlineName: ${airlineName}`);
            console.log(`airlineFunds: ${airlineFunds}`);
            console.log(`airlineAddress: ${airlineAddress}`);
            // Write transaction
            console.log(airlineName, airlineFunds, airlineAddress);
            await contract.fundAirline(airlineName, airlineFunds, airlineAddress, async (error, result) => {
                console.log(`index.js fundAirline: result:`);
                console.log(`result.receipt.status: ${result.receipt.status}`);
                if (result.receipt.status == true) {
                    await contract.retrieveOneAirline(airlineName, (error, fundResult) => {
                        console.log(error, fundResult, airlineName);
                        displayFundAirline('Airline Funding', 'Fund a Registered Airline', initFundAirDispComplete, [ { label: 'New Airline Funded', error: error, value: fundResult} ]);
                        getAllAirlines();
                        console.log(`result.airIsRegd: ${fundResult.airIsRegd}`);
                    });
                    DOM.elid('fund-airline-name').value = "";
                    DOM.elid('fund-airline-funds').value = "";
                    DOM.elid('fund-airline-addr').value = "";
                }
            });
        })
    
        // VOTE FOR AIRLINE: User-submitted transaction
        displayVoteAirline('Airline Voting', "Vote for a Sponsored Airline", initVoteAirDispComplete, [ { label: 'Voter Approved  Airline'} ]);
        initVoteAirDispComplete = true;
        DOM.elid('vote-airline-btn').addEventListener('click', async () => {
            let airlineName = DOM.elid('vote-airline-name').value;
            let airlineAddress = DOM.elid('vote-airline-addr').value;
            console.log(`airlineName: ${airlineName}`);
            console.log(`airlineAddress: ${airlineAddress}`);
            // Write transaction
            console.log(airlineName, airlineAddress);
            await contract.voteAirline(airlineName, airlineAddress, async (error, result) => {
                console.log(`index.js voteAirline: result:`);
                console.log(`result.receipt.status: ${result.receipt.status}`);
                if (result.receipt.status == true) {
                    await contract.retrieveOneAirline(airlineName, (error, voteResult) => {
                        console.log(error, voteResult, airlineName);
                        displayVoteAirline('Airline Voting', 'Vote for a Sponsored Airline', initVoteAirDispComplete, [ { label: 'Voter Approved Airline', error: error, value: voteResult} ]);
                        // displayAir('Airline List', 'Retrieve Airline Details', initLookupDispComplete, [ { label: 'Airline Status', error: error, value: voteResult} ]);
                        // displayAirClear('Airline List', 'Retrieve Airline Details', initLookupDispComplete, 'Airline Status')
                        getAllAirlines();
                        console.log(`result.airIsRegd: ${voteResult.airIsRegd}`);
                    });
                    DOM.elid('vote-airline-name').value = "";
                    DOM.elid('vote-airline-addr').value = "";
                }
            });
        })
    
        // User-submitted transaction
        displayOracles('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status'} ]);
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                displayOracles('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })
    
    });
    
    // Create function so it can be called from multiple locations in this contract
    async function checkOpStatus(_opsStatusCheckCount) {
        contract.isOperational((error, result, currentAcct) => {
            console.log(error, result, _opsStatusCheckCount);
            console.log(`currentAcct: btn ${currentAcct}`)
            displayOps('Operational Status', 'Display current account and check contract operational status, # ', _opsStatusCheckCount, currentAcct, [ { label: 'Operational Status', error: error, value: result} ]);
        });                
    }

    async function getAllAirlines() {
        await contract.retrieveAllAirlines(async (airNamesArray) => {
            console.log(`airNamesArray: ${airNamesArray}`);
            displayAirClear(initLookupDispComplete, 'Airline Status')
            for (let i=0; i<airNamesArray.length; i++ ) {
                await contract.retrieveOneAirline(airNamesArray[i], (error, result) => {
                    if(error) {
                        console.log(error.message);
                    } else {
                        console.log(result);
                        console.log(result.airName, result.airIsRegd, result.airIsFunded, result.airAddr);
                        displayAir('Airline List', 'Retrieve Airline Details', initLookupDispComplete, [ { label: 'Airline Status', error: error, value: result} ]);
                        initLookupDispComplete = true;
                        console.log(`result.airIsRegd: ${result.airIsRegd}`);
                    }
                });
            }
        });
    }
})();



function displayOps(title, description, count, currAcct, results) {
    let displayDiv = DOM.elid("display-ops");
    let section = DOM.section();
    console.log(`count: ${count}`)
    console.log(`currAcct: ${currAcct}`)
    if ( count == 0) {
        section.appendChild(DOM.h2({id: "ops-title"}, title));
        section.appendChild(DOM.h5({id: "ops-desc"}, description));
    } else {
        // displayDiv.parentNode.removeChild(displayDiv); // Takes it ALL the way out! OK 1st time, 2nd kills it
        let opsTitle = DOM.elid("ops-title");
        let opsDesc = DOM.elid("ops-desc");
        let opsResRow = DOM.elid("ops-res-row");
        opsTitle.parentNode.removeChild(opsTitle);
        opsDesc.parentNode.removeChild(opsDesc);
        opsResRow.parentNode.removeChild(opsResRow);
        section.appendChild(DOM.h2({id: "ops-title"}, title));
        section.appendChild(DOM.h5({id: "ops-desc"}, description, String(count)));
    }
    let row = section.appendChild(DOM.div({id: 'ops-res-row', className:'row'}));
    row.appendChild(DOM.div({id: 'ops-res-label', className: 'col col-sm-4 field'}, "Current Account: "));
    row.appendChild(DOM.div({id: 'ops-res-value', className: 'col col-sm-8 field-value'}, String(currAcct)));
    results.map((result) => {
        row.appendChild(DOM.div({id: 'ops-res-label', className: 'col col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({id: 'ops-res-value', className: 'col col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

// Displays a SINGLE Airline retrieved by NAME...
function displayAir(title, description, initDispDone, results) {
    let displayDiv = DOM.elid("display-airline");
    let section = DOM.section();
    if (!initDispDone) {
        section.appendChild(DOM.h2(title));
        section.appendChild(DOM.h5(description));
    }
    // results.map((result) => {
    let displayListDiv = DOM.elid("airline-list-display");
    let displayListRow = DOM.elid('airline-list-row');
    // Count of total voters when this airline was registered serves as airline index number
    let ttlVoters = String(results[0].value.airTtlVoters);
    console.log(`ttlVoters ${ttlVoters}`);
    displayListRow.appendChild(DOM.div({className: 'col col-lg-2 col-md-2 col-sm-3 col-xs-12 field'}, ttlVoters));
    if (results.error) {
        displayListRow.appendChild(DOM.div({className: 'col col-lg-9 col-md-9 col-sm-6 col-xs-12 field-value'}, String(results.error)));
    } else {
        console.log(results[0].value.airName, results[0].value.airIsRegd, results[0].value.airIsFunded, results[0].value.airAddr);
        let registered = results[0].value.airIsRegd ? "Registered" : "NOT Registered";
        let funded = results[0].value.airIsFunded ? "Funded" : "NOT Funded";
        let addr = String(results[0].value.airAddr).substring(0, 6) + "..." + String(results[0].value.airAddr).substring(38);
        let voteStatus;
        if (results[0].value.airIsRegd && results[0].value.airIsFunded) {
            voteStatus = "Eligible"
        } else {
            voteStatus = "NOT yet a Voter"
        }
        displayListRow.appendChild(DOM.div({className: 'col col-lg-7 col-md-8 col-sm-9 col-xs-12 field-value'}, `${String(results[0].value.airName)}, ${registered}, ${funded}, Addr: ${addr}` ));
        displayListRow.appendChild(DOM.div({className: 'col col-lg-3 col-md-2 col-sm-9 col-xs-12 field-value'}, `${voteStatus}` ));
    }
    displayDiv.append(section);
    displayListDiv.appendChild(displayListRow);
    // })
}

// CLEAR the Airline List Display
function displayAirClear(initDispDone, label) {
    let displayDiv = DOM.elid("display-airline");
    let section = DOM.section();
    if (initDispDone) {
        let displayListRemove = DOM.elid('airline-list-row');
        displayListRemove.parentNode.removeChild(displayListRemove); // Clears Current Display List
    }
    let displayListDiv = DOM.elid("airline-list-display");
    let displayListRow = section.appendChild(DOM.div({id: 'airline-list-row', className:'row'}));
    displayListRow.appendChild(DOM.div({className: 'col col-lg-2 col-md-4 col-sm-3 col-xs-12 field'}, 'Number'));
    displayListRow.appendChild(DOM.div({className: 'col col-lg-7 col-md-4 col-sm-3 col-xs-12 field'}, label));
    displayListRow.appendChild(DOM.div({className: 'col col-lg-3 col-md-4 col-sm-3 col-xs-12 field'}, 'Voting Status'));
    displayDiv.append(section);
    displayListDiv.appendChild(displayListRow);
}

// Registering Airline Section
function displayRegAirline(title, description, initDispDone, results) {
    let displayDiv = DOM.elid("register-airline");
    let section = DOM.section();
    if (!initDispDone) {
        section.appendChild(DOM.h2(title));
        section.appendChild(DOM.h5(description));
    } else {
        // results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col col-sm-4 field'}, results[0].label));
        if (results.error) {
            row.appendChild(DOM.div({className: 'col col-sm-8 field-value'}, String(results.error)));
        } else {
            console.log(results);
            console.log(results.error);
            console.log(results.value);
            console.log(results[0].value.airName, results[0].value.airIsRegd, results[0].value.airIsFunded, results[0].value.airAddr);
            let registered = results[0].value.airIsRegd ? "Registered" : "NOT Registered";
            let funded = results[0].value.airIsFunded ? "Funded" : "NOT Funded";
            let addr = String(results[0].value.airAddr).substring(0, 6) + "..." + String(results[0].value.airAddr).substring(38);
            // row.appendChild(DOM.div({className: 'col col-sm-8 field-value'}, `Name: ${String(results[0].value.airName)}, Reg'd: ${String(results[0].value.airIsRegd)}, Funded: ${String(results[0].value.airIsFunded)}, Addr: ${String(results[0].value.airAddr)}` ));
            row.appendChild(DOM.div({className: 'col col-sm-8 field-value'}, `${String(results[0].value.airName)}, ${registered}, ${funded}, Addr: ${addr}` ));
        }
        section.appendChild(row);
        // })
    }
    displayDiv.append(section);
}

// Funding Airline Section
function displayFundAirline(title, description, initDispDone, results) {
    let displayDiv = DOM.elid("fund-airline");
    let section = DOM.section();
    if (!initDispDone) {
        section.appendChild(DOM.h2({className: "multi-section-title"}, title));
        section.appendChild(DOM.h5(description));
    } else {
        // results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col col-sm-4 field'}, results[0].label));
        if (results.error) {
            row.appendChild(DOM.div({className: 'col col-sm-8 field-value'}, String(results.error)));
        } else {
            console.log(results);
            console.log(results.error);
            console.log(results.value);
            console.log(results[0].value.airName, results[0].value.airIsRegd, results[0].value.airIsFunded, results[0].value.airAddr);
            let registered = results[0].value.airIsRegd ? "Registered" : "NOT Registered";
            let funded = results[0].value.airIsFunded ? "Funded" : "NOT Funded";
            let addr = String(results[0].value.airAddr).substring(0, 6) + "..." + String(results[0].value.airAddr).substring(38);
            // row.appendChild(DOM.div({className: 'col col-sm-8 field-value'}, `Name: ${String(results[0].value.airName)}, Reg'd: ${String(results[0].value.airIsRegd)}, Funded: ${String(results[0].value.airIsFunded)}, Addr: ${String(results[0].value.airAddr)}` ));
            row.appendChild(DOM.div({className: 'col col-sm-8 field-value'}, `${String(results[0].value.airName)}, ${registered}, ${funded}, Addr: ${addr}` ));
        }
        section.appendChild(row);
        // })
    }
    displayDiv.append(section);
}

// Airline Voting Section
function displayVoteAirline(title, description, initDispDone, results) {
    let displayDiv = DOM.elid("vote-airline");
    let section = DOM.section();
    if (!initDispDone) {
        section.appendChild(DOM.h2({className: "multi-section-title"}, title));
        section.appendChild(DOM.h5(description));
    } else {
        // results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col col-sm-4 field'}, results[0].label));
        if (results.error) {
            row.appendChild(DOM.div({className: 'col col-sm-8 field-value'}, String(results.error)));
        } else {
            console.log(results);
            console.log(results.error);
            console.log(results.value);
            console.log(results[0].value.airName, results[0].value.airIsRegd, results[0].value.airIsFunded, results[0].value.airAddr);
            let registered = results[0].value.airIsRegd ? "Registered" : "NOT Registered";
            let funded = results[0].value.airIsFunded ? "Funded" : "NOT Funded";
            let addr = String(results[0].value.airAddr).substring(0, 6) + "..." + String(results[0].value.airAddr).substring(38);
            // row.appendChild(DOM.div({className: 'col col-sm-8 field-value'}, `Name: ${String(results[0].value.airName)}, Reg'd: ${String(results[0].value.airIsRegd)}, Funded: ${String(results[0].value.airIsFunded)}, Addr: ${String(results[0].value.airAddr)}` ));
            row.appendChild(DOM.div({className: 'col col-sm-8 field-value'}, `${String(results[0].value.airName)}, ${registered}, ${funded}, Addr: ${addr}` ));
        }
        section.appendChild(row);
        // })
    }
    displayDiv.append(section);
}

// Oracles Section
function displayOracles(title, description, results) {
    let displayDiv = DOM.elid("display-oracles");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col col-sm-4 field'}, result.label));
        // if (results.value) {
            row.appendChild(DOM.div({className: 'col col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        // } else {
        //     row.appendChild(DOM.div({className: 'col col-sm-8 field-value'}, ""));
        // }
        section.appendChild(row);
    })
    displayDiv.append(section);
}
