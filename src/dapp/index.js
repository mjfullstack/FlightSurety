
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
        await contract.isOperational((error, result) => {
            console.log(error,result);
            displayOps('Operational Status', 'Check if contract is operational', opsStatusCheckCount, [ { label: 'Operational Status', error: error, value: result} ]);
        });
        // ALSO read Ops Status when clicked to check it...
        DOM.elid('check-status').addEventListener('click', () => {
            opsStatusCheckCount += 1;
            contract.isOperational((error, result) => {
                console.log(error, result, opsStatusCheckCount);
                displayOps('Operational Status', 'Check if contract is operational, # ', opsStatusCheckCount, [ { label: 'Operational Status', error: error, value: result} ]);
            });                
        });
    
        // Retrieve Airline
        await contract.retrieveAirline("Uno Air", (error, result) => {
            console.log(error,result);
            // let resArray = [result[0], result[1], result[2], result[3], result[4] ];
            console.log(result.airName, result.airIsRegd, result.airIsFunded, result.airAddr);
            displayAir('Airline List', 'Retrieve Airline Details', initLookupDispComplete, [ { label: 'Airline Status', error: error, value: result} ]);
            initLookupDispComplete = true;
            console.log(`result.airIsRegd: ${result.airIsRegd}`);
        });
        // ALSO LOOKUP an Airline Status when clicked to check it...
        DOM.elid('lookup-airline').addEventListener('click', () => {
            let _name = DOM.elid('lookup-airline-name').value;
            console.log("_name: ", _name);
            contract.retrieveAirline(_name, (error, result) => {
                console.log(error, result, _name);
                displayAir('Airline List', 'Retrieve Airline Details', initLookupDispComplete, [ { label: 'Airline Status', error: error, value: result} ]);
                console.log(`result.airIsRegd: ${result.airIsRegd}`);
                if (result.airIsRegd) {
                    DOM.elid('lookup-airline-name').value = "";
                }
            });                
        });
    

        // REGISTER AIRLINE: User-submitted transaction
        displayRegAirline('Airline Registration', "Add New Airlines to the Program - Provide Sponsoring Airline's Address", initRegAirDispComplete, [ { label: 'New Airline to Register'} ]);
        initRegAirDispComplete = true;
        DOM.elid('reg-airline-btn').addEventListener('click', async () => {
            let airlineName = DOM.elid('reg-airline-name').value;
            // let airlineFunds = DOM.elid('reg-airline-funds').value;
            let airlineAddress = DOM.elid('reg-airline-addr').value;
            let airlineSponsor = DOM.elid('reg-sponsor-addr').value;

            console.log(`airlineName: ${airlineName}`);
            // console.log(`airlineFunds: ${airlineFunds}`);
            console.log(`airlineAddress: ${airlineAddress}`);
            // Write transaction
            console.log(airlineName, airlineAddress);
            await contract.registerAirline(airlineName, airlineAddress, airlineSponsor, async (error, result) => {
                console.log(`index.js registerAirline: result:`);
                // console.log(result);
                // console.log(result.receipt);
                // console.log(result.logs);
                console.log(`result.receipt.status: ${result.receipt.status}`);
                if (result.receipt.status == true) {
                    await contract.retrieveAirline(airlineName, (error, retResult) => {
                        console.log(error, retResult, airlineName);
                        displayRegAirline('Airline Registration', 'Add New Airlines to the Program', initRegAirDispComplete, [ { label: 'New Airline Registered', error: error, value: retResult} ]);
                        displayAir('Airline List', 'Retrieve Airline Details', initLookupDispComplete, [ { label: 'Airline Status', error: error, value: retResult} ]);
                        console.log(`result.airIsRegd: ${retResult.airIsRegd}`);
                    });
                    DOM.elid('reg-airline-name').value = "";
                    // DOM.elid('reg-airline-funds').value = "";
                    DOM.elid('reg-airline-addr').value = "";
                    DOM.elid('reg-sponsor-addr').value = "";
                }
            });
        })
    
        // FUND AIRLINE: User-submitted transaction
        displayFundAirline('Airline Funding', "Fund a Registered Airline", initFundAirDispComplete, [ { label: 'Fund a Registered Airline'} ]);
        initFundAirDispComplete = true;
        DOM.elid('fund-airline-btn').addEventListener('click', async () => {
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
                    await contract.retrieveAirline(airlineName, (error, fundResult) => {
                        console.log(error, fundResult, airlineName);
                        displayFundAirline('Airline Funding', 'Fund a Registered Airline', initFundAirDispComplete, [ { label: 'New Airline Funded', error: error, value: fundResult} ]);
                        displayAir('Airline List', 'Retrieve Airline Details', initLookupDispComplete, [ { label: 'Airline Status', error: error, value: fundResult} ]);
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
                    await contract.retrieveAirline(airlineName, (error, voteResult) => {
                        console.log(error, voteResult, airlineName);
                        displayVoteAirline('Airline Voting', 'Vote for a Sponsored Airline', initVoteAirDispComplete, [ { label: 'Voter Approved Airline', error: error, value: voteResult} ]);
                        displayAir('Airline List', 'Retrieve Airline Details', initLookupDispComplete, [ { label: 'Airline Status', error: error, value: voteResult} ]);
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
    

})();


function displayOps(title, description, count, results) {
    let displayDiv = DOM.elid("display-ops");
    let section = DOM.section();
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
        // Doing this via the row that contains these elements
        // let opsResLabel = DOM.elid("ops-res-label");
        // let opsResValue = DOM.elid("ops-res-value");
        // opsResLabel.parentNode.removeChild(opsResLabel);
        // opsResValue.parentNode.removeChild(opsResValue);
        section.appendChild(DOM.h2({id: "ops-title"}, title));
        section.appendChild(DOM.h5({id: "ops-desc"}, description, String(count)));
    }
    results.map((result) => {
        let row = section.appendChild(DOM.div({id: 'ops-res-row', className:'row'}));
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
    if (!initDispDone) {
        displayListDiv.appendChild(DOM.div({className: 'col col-lg-2 col-md-4 col-sm-3 col-xs-12 field'}, 'Airline Count'));
        displayListDiv.appendChild(DOM.div({className: 'col col-lg-7 col-md-4 col-sm-3 col-xs-12 field'}, results[0].label));
        displayListDiv.appendChild(DOM.div({className: 'col col-lg-3 col-md-4 col-sm-3 col-xs-12 field'}, 'Voting Status'));
    }
    displayListDiv.appendChild(DOM.div({className: 'col col-lg-2 col-md-2 col-sm-3 col-xs-12 field'}, results[0].label));
    if (results.error) {
        displayListDiv.appendChild(DOM.div({className: 'col col-lg-9 col-md-9 col-sm-6 col-xs-12 field-value'}, String(results.error)));
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
        // displayListDiv.appendChild(DOM.div({className: 'col-sm-8 field-value'}, `Name: ${String(results[0].value.airName)}, Reg'd: ${String(results[0].value.airIsRegd)}, Funded: ${String(results[0].value.airIsFunded)}, Addr: ${String(results[0].value.airAddr)}` ));
        displayListDiv.appendChild(DOM.div({className: 'col col-lg-7 col-md-8 col-sm-9 col-xs-12 field-value'}, `${String(results[0].value.airName)}, ${registered}, ${funded}, Addr: ${addr}` ));
        displayListDiv.appendChild(DOM.div({className: 'col col-lg-3 col-md-2 col-sm-9 col-xs-12 field-value'}, `${voteStatus}` ));
    }
    displayDiv.append(section);
    section.appendChild(displayListDiv);
    // })
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


