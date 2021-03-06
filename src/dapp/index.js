
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;
    let initLookupDispComplete = false;
    let initRegAirDispComplete = false;
    let initFundAirDispComplete = false;
    let initVoteAirDispComplete = false;
    let initEligibleVoteAirDispComplete = false;

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
        // getAllAirlines();
        getSelectedAirlines("fullList"); // fullList, seekingVoterApprovalList, seekingFundsList, eligibleVoterList
        getSelectedAirlines("seekingVoterApprovalList"); // fullList, seekingVoterApprovalList, seekingFundsList, eligibleVoterList
        getSelectedAirlines("seekingFundsList"); // fullList, seekingVoterApprovalList, seekingFundsList, eligibleVoterList
        getSelectedAirlines("eligibleVoterList"); // fullList, seekingVoterApprovalList, seekingFundsList, eligibleVoterList
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
                // getAllAirlines();
                getSelectedAirlines("fullList") // fullList, seekingVoterApprovalList, seekingFundsList, eligibleVoterList
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
                        getSelectedAirlines("fullList") // fullList, seekingVoterApprovalList, seekingFundsList, eligibleVoterList
                        console.log(`result.airIsRegd: ${retResult.airIsRegd}`);
                        // Count of total voters: Less than 3 display for funding; 4 or more display for voting
                        let airIndex = String(retResult.airIndex);
                        console.log(`airIndex ${airIndex}`);
                        let totalAirlines = String(retResult.totalAirlines);
                        console.log(`airIndex ${totalAirlines}`);
                        let totalVoters = String(retResult.totalVoters);
                        console.log(`airIndex ${totalVoters}`);
                        if (totalVoters < 4) {
                            displayFundAirlineClear('Airline Funding', 'Fund an Approved Airline', initFundAirDispComplete, 'Approved Airline Requiring Funding');
                            getSelectedAirlines("seekingFundsList") // fullList, seekingVoterApprovalList, seekingFundsList, eligibleVoterList
                        } else {
                            displayVoteAirlineClear('Airline Voting - Initiation', "Initiate Voting for a Sponsored Airline", initVoteAirDispComplete, 'Airline Seeking Voter Approval');
                            getSelectedAirlines("seekingVoterApprovalList") // fullList, seekingVoterApprovalList, seekingFundsList, eligibleVoterList
                        }
                    });
                    DOM.elid('reg-airline-name').value = "";
                    DOM.elid('reg-airline-addr').value = "";
                    DOM.elid('reg-sponsor-addr').value = "";
                }
            });
        })
    
        // FUND AIRLINE: User-submitted transaction
        displayFundAirlineClear('Airline Funding', "Fund a Registered Airline", initFundAirDispComplete, 'Approved Airline Requiring Funding');
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
                        displayFundAirlineClear('Airline Funding', 'Fund an Approved Airline', initFundAirDispComplete, 'Approved Airline Requiring Funding');
                        // getAllAirlines();
                        getSelectedAirlines("fullList"); // fullList, seekingVoterApprovalList, seekingFundsList, eligibleVoterList
                        getSelectedAirlines("seekingFundsList"); // fullList, seekingVoterApprovalList, seekingFundsList, eligibleVoterList
                        getSelectedAirlines("eligibleVoterList"); // fullList, seekingVoterApprovalList, seekingFundsList, eligibleVoterList
                        console.log(`result.airIsRegd: ${fundResult.airIsRegd}`);
                    });
                    DOM.elid('fund-airline-name').value = "";
                    DOM.elid('fund-airline-funds').value = "";
                    DOM.elid('fund-airline-addr').value = "";
                }
            });
        })
    
        // VOTE FOR AIRLINE: User-submitted transaction
        displayVoteAirlineClear('Airline Voting - Initiation', "Initiate Voting for a Sponsored Airline", initVoteAirDispComplete, 'Airline Seeking Voter Approval');
        // displayVoteAirline('Airline Voting', "Initiate Voting for a Sponsored Airline", initVoteAirDispComplete, [ { label: 'Voter Approved  Airline'} ]);
        initVoteAirDispComplete = true;
        DOM.elid('initiate-vote-airline-btn').addEventListener('click', async () => {
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
                        displayVoteAirlineClear('Airline Voting', "Initiate Voting for a Sponsored Airline", initVoteAirDispComplete, 'Airline Seeking Voter Approval');
                        // getAllAirlines();
                        getSelectedAirlines("fullList") // fullList, seekingVoterApprovalList, seekingFundsList, eligibleVoterList
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

    // async function getAllAirlines() {
    //     await contract.retrieveAllAirlineNames(async (airNamesArray) => {
    //         console.log(`airNamesArray: ${airNamesArray}`);
    //         displayAirClear(initLookupDispComplete, 'Airline Status')
    //         for (let i=0; i<airNamesArray.length; i++ ) {
    //             await contract.retrieveOneAirline(airNamesArray[i], (error, result) => {
    //                 if(error) {
    //                     console.log(error.message);
    //                 } else {
    //                     console.log(result);
    //                     console.log(result.airName, result.airIsRegd, result.airIsFunded, result.airAddr);
    //                     displayAir('Airline List', 'Retrieve Airline Details', initLookupDispComplete, [ { label: 'Airline Status', error: error, value: result} ]);
    //                     initLookupDispComplete = true;
    //                     console.log(`result.airIsRegd: ${result.airIsRegd}`);
    //                 }
    //             });
    //         }
    //     });
    // }

    // Get a subset of airlines based on intended placement on page
    // getSelectedAirlines() // fullList, seekingVoterApprovalList, seekingFundsList, eligibleVoterList
    async function getSelectedAirlines(_listId) {
        let acceptingCharterMembers;
        let approvedToSeekFunds;
        let approvedToSeekVotes;
        let approvedToVote;
        await contract.retrieveAllAirlineNames(async (airNamesArray) => {
            console.log(`airNamesArray: ${airNamesArray}`);
            console.log(`_listId = ${_listId}`);
            switch(_listId) {
                case "fullList":
                    displayAirClear(initLookupDispComplete, 'Airline Status')
                    break;
                case "seekingVoterApprovalList":
                    displayVoteAirlineClear('Airline Voting - Initiation', "Initiate Voting for a Sponsored Airline", initVoteAirDispComplete, 'Airline Seeking Voter Approval');
                    break;
                case "seekingFundsList":
                    displayFundAirlineClear('Airline Funding', 'Fund an Approved Airline', initFundAirDispComplete, 'Approved Airline Requiring Funding');
                    break;
                case "eligibleVoterList":
                    displayEligibleVoterAirlineClear('Airline Voting - Session', "List of Airlines Eligibe to Vote", initEligibleVoteAirDispComplete, 'Voting Airlines');
                    break;
            }

            for (let i=0; i<airNamesArray.length; i++ ) {
                await contract.retrieveOneAirline(airNamesArray[i], (error, result) => {
                    if(error) {
                        console.log(error.message);
                    } else {
                        console.log(result);
                        console.log(result.airName, result.airIsRegd, result.airIsFunded, result.airAddr);
                        acceptingCharterMembers = result.totalVoters < 4;
                        approvedToSeekFunds = result.airIsRegd && !result.airIsFunded && (acceptingCharterMembers || result.airIsVoterApproved);
                        approvedToSeekVotes = result.airIsRegd && !result.airIsFunded && !result.airIsVoterApproved && !acceptingCharterMembers;
                        approvedToVote = result.airIsRegd && result.airIsFunded;
                        switch(_listId) {
                            case "fullList":
                                displayAir('Airline List', 'Retrieve Airline Details', initLookupDispComplete, [ { label: 'Airline Status', error: error, value: result} ]);
                                initLookupDispComplete = true;
                                break;
                            case "seekingVoterApprovalList":
                                if (approvedToSeekVotes) {
                                    displayVoteAirline('Airline Voting - Initiation', 'Initiate Voting for a Sponsored Airline', initVoteAirDispComplete, [ { label: 'Airline Seeking(s) Voter Approval', error: error, value: result} ]);
                                    initVoteAirDispComplete = true;
                                }
                                break;
                            case "seekingFundsList":
                                if (approvedToSeekFunds) {
                                    displayFundAirline('Airline Funding', 'Fund an Approved Airline', initFundAirDispComplete, [ { label: 'Approved Airline(s) Requiring Funding', error: error, value: result} ]);
                                    initFundAirDispComplete = true;
                                }
                                break;
                            case "eligibleVoterList":
                                if (approvedToVote) {
                                    displayEligibleVoterAirline('Airline Voting - Session', 'Voting Eligible Airlines', initEligibleVoteAirDispComplete, [ { label: 'Airlines Authorized to Vote', error: error, value: result} ]);
                                    initEligibleVoteAirDispComplete = true;
                                }
                                break;
                        }
                        console.log(`result.airIsRegd: ${result.airIsRegd}`);
                    }
                });
            }
        });
    }
})();



function displayOps(title, description, count, currAcct, results) {
    let displayDiv = DOM.elid("display-ops");
    // let displayDivHover = DOM.elid("display-ops-hover");
    // let displayDivOverlay = DOM.elid("display-ops-overlay-h2");
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
    // displayDivHover.appendChild(DOM.div({id: 'ops-res-value', className: 'col col-sm-8 field-value hovereffect'}, String(currAcct)));
    // displayDivOverlay.appendChild(DOM.div({id: 'ops-res-value', className: 'col col-sm-8 field-value overlay container'}, String(currAcct)));
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
    let airIndex = String(results[0].value.airIndex);
    console.log(`airIndex ${airIndex}`);
    displayListRow.appendChild(DOM.div({className: 'col col-lg-2 col-md-2 col-sm-3 col-xs-12 field'}, airIndex));
    if (results.error) {
        displayListRow.appendChild(DOM.div({className: 'col col-lg-9 col-md-9 col-sm-6 col-xs-12 field-value'}, String(results.error)));
    } else {
        console.log(results[0].value.airName, results[0].value.airIsRegd, results[0].value.airIsFunded, results[0].value.airAddr);
        let registered = results[0].value.airIsRegd ? "Registered" : "NOT Registered";
        let funded = results[0].value.airIsFunded ? "Funded" : "NOT Funded";
        let addr = String(results[0].value.airAddr).substring(0, 6) + "..." + String(results[0].value.airAddr).substring(38);
        let voterType;
        if (results[0].value.airIsCharterMember) {
            voterType = "Charter Member, ";
        } else if (results[0].value.airIsVoterApproved) {
            voterType = "Voter Approved, ";
        } else {
            voterType = "";
        }
        let voteStatus;
        if (results[0].value.airIsRegd && results[0].value.airIsFunded) {
            voteStatus = "Eligible"
        } else {
            voteStatus = "NOT Eligible"
        }
        displayListRow.appendChild(DOM.div({className: 'col col-lg-7 col-md-8 col-sm-9 col-xs-12 field-value'}, `${String(results[0].value.airName)}, ${registered}, ${funded}, ${voterType}Addr: ${addr}` ));
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
            console.log(results[0].value);
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

// Airline Funding Section
function displayFundAirline(title, description, initDispDone, results) {
    let displayDiv = DOM.elid("fund-airline");
    let section = DOM.section();
    // if (!initDispDone) {
    //     section.appendChild(DOM.h2({className: "multi-section-title"}, title));
    //     section.appendChild(DOM.h5(description));
    // }
    // results.map((result) => {
    let displayFundDiv = DOM.elid("airline-fund-display");
    let displayFundRow = DOM.elid('airline-fund-row');
    // Count of total voters when this airline was registered serves as airline index number
    let airIndex = String(results[0].value.airIndex);
    console.log(`airIndex ${airIndex}`);
    displayFundRow.appendChild(DOM.div({className: 'col col-lg-2 col-md-2 col-sm-3 col-xs-12 field'}, airIndex));
    if (results.error) {
        displayFundRow.appendChild(DOM.div({className: 'col col-lg-9 col-md-9 col-sm-6 col-xs-12 field-value'}, String(results.error)));
    } else {
        console.log(results);
        console.log(results[0].error);
        console.log(results[0].value);
        console.log(results[0].value.airName, results[0].value.airIsRegd, results[0].value.airIsFunded, results[0].value.airAddr);
        let balance = String(results[0].value.airBal)
        let addr = String(results[0].value.airAddr).substring(0, 6) + "..." + String(results[0].value.airAddr).substring(38);
        // displayFundRow.appendChild(DOM.div({className: 'col col-lg-7 col-md-8 col-sm-9 col-xs-12 field-value'}, `${String(results[0].value.airName)}, ${registered}, ${funded}, Addr: ${addr}` ));
        // displayFundRow.appendChild(DOM.div({className: 'col col-lg-3 col-md-2 col-sm-9 col-xs-12 field-value'}, `${voteStatus}` ));
        displayFundRow.appendChild(DOM.div({className: 'col col-lg-7 col-md-8 col-sm-9 col-xs-12 field-value'}, `${String(results[0].value.airName)}, Addr: ${String(results[0].value.airAddr)}` ));
        displayFundRow.appendChild(DOM.div({className: 'col col-lg-3 col-md-2 col-sm-9 col-xs-12 field-value'}, `${balance}` ));
    }
    // }
    displayDiv.append(section);
    displayFundDiv.appendChild(displayFundRow);
}

// CLEAR the Airline Funding Display
function displayFundAirlineClear(title, description, initDispDone, label) {
    let displayDiv = DOM.elid("fund-airline");
    let section = DOM.section();
    if (!initDispDone) {
        section.appendChild(DOM.h2({className: "multi-section-title"}, title));
        section.appendChild(DOM.h5(description));
    } else {
        let displayFundRemove = DOM.elid('airline-fund-row');
        displayFundRemove.parentNode.removeChild(displayFundRemove); // Clears Current Funding List
    }
    let displayFundDiv = DOM.elid("airline-fund-display");
    let displayFundRow = section.appendChild(DOM.div({id: 'airline-fund-row', className:'row'}));
    displayFundRow.appendChild(DOM.div({className: 'col col-lg-2 col-md-4 col-sm-3 col-xs-12 field'}, 'Number'));
    displayFundRow.appendChild(DOM.div({className: 'col col-lg-7 col-md-4 col-sm-3 col-xs-12 field'}, label));
    displayFundRow.appendChild(DOM.div({className: 'col col-lg-3 col-md-4 col-sm-3 col-xs-12 field'}, 'Funding Balance'));
    displayDiv.append(section);
    displayFundDiv.appendChild(displayFundRow);
}

// Airline Voting Section
// Airline Seeking Votes Display
function displayVoteAirline(title, description, initDispDone, results) {
    let displayDiv = DOM.elid("vote-airline");
    let section = DOM.section();
    let displayVoteDiv = DOM.elid("airline-initiate-vote");
    let displayVoteRow = DOM.elid('airline-initiate-vote-row');
    let airIndex = String(results[0].value.airIndex);
    console.log(`airIndex ${airIndex}`);
    displayVoteRow.appendChild(DOM.div({className: 'col col-lg-2 col-md-2 col-sm-3 col-xs-12 field'}, airIndex));
    if (results.error) {
        displayVoteRow.appendChild(DOM.div({className: 'col col-lg-9 col-md-9 col-sm-6 col-xs-12 field-value'}, String(results.error)));
    } else {
        console.log(results.airName, results.airIsRegd, results.airIsFunded, results[0].value.airAddr);
        let addr = String(results[0].value.airAddr).substring(0, 6) + "..." + String(results[0].value.airAddr).substring(38);
        let voteStatus;
        if (results[0].value.airIsRegd && results[0].value.airIsFunded) {
            voteStatus = "Eligible"
        } else {
            voteStatus = "Awaiting Voting"
        }
        // displayVoteRow.appendChild(DOM.div({className: 'col col-lg-7 col-md-8 col-sm-9 col-xs-12 field-value'}, `${String(results[0].value.airName)}, ${registered}, ${funded}, Addr: ${addr}` ));
        displayVoteRow.appendChild(DOM.div({className: 'col col-lg-7 col-md-8 col-sm-9 col-xs-12 field-value'}, `${String(results[0].value.airName)}, Addr: ${String(results[0].value.airAddr)}` ));
        displayVoteRow.appendChild(DOM.div({className: 'col col-lg-3 col-md-2 col-sm-9 col-xs-12 field-value'}, `${voteStatus}` ));
    }
    displayDiv.append(section);
    displayVoteDiv.appendChild(displayVoteRow);
}

// CLEAR the Airline Seeking Votes Display
function displayVoteAirlineClear(title, description, initDispDone, label) {
    let displayDiv = DOM.elid("vote-airline");
    let section = DOM.section();
    if (!initDispDone) {
        section.appendChild(DOM.h2({className: "multi-section-title"}, title));
        section.appendChild(DOM.h5(description));
    } else {
        let displayVoteRemove = DOM.elid('airline-initiate-vote-row');
        displayVoteRemove.parentNode.removeChild(displayVoteRemove); // Clears Current Voting List
    }
    let displayVoteDiv = DOM.elid("airline-initiate-vote");
    let displayVoteRow = section.appendChild(DOM.div({id: 'airline-initiate-vote-row', className:'row'}));
    displayVoteRow.appendChild(DOM.div({className: 'col col-lg-2 col-md-4 col-sm-3 col-xs-12 field'}, 'Number'));
    displayVoteRow.appendChild(DOM.div({className: 'col col-lg-7 col-md-4 col-sm-3 col-xs-12 field'}, label));
    displayVoteRow.appendChild(DOM.div({className: 'col col-lg-3 col-md-4 col-sm-3 col-xs-12 field'}, 'Voting Status'));
    displayDiv.append(section);
    displayVoteDiv.appendChild(displayVoteRow);
}

// ELEGIBLE Airline VOTERS
function displayEligibleVoterAirline(title, description, initDispDone, results) {
    let displayDiv = DOM.elid("vote-airline");
    let section = DOM.section();
    // if (!initDispDone) {
    //     section.appendChild(DOM.h2({className: "multi-section-title"}, title));
    //     section.appendChild(DOM.h5(description));
    // }
    // results.map((result) => {
    let displayVoteDiv = DOM.elid("airline-voter-display");
    let displayVoteRow = DOM.elid('airline-voter-row');
    // Count of total voters when this airline was registered serves as airline index number
    // let airIndex = String(results.airIndex); FAILS HERE!
    let airIndex = String(results[0].value.airIndex);
    console.log(`airIndex ${airIndex}`);
    displayVoteRow.appendChild(DOM.div({className: 'col col-lg-2 col-md-2 col-sm-3 col-xs-12 field'}, airIndex));
    if (results.error) {
        displayVoteRow.appendChild(DOM.div({className: 'col col-lg-9 col-md-9 col-sm-6 col-xs-12 field-value'}, String(results.error)));
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
        displayVoteRow.appendChild(DOM.div({className: 'col col-lg-7 col-md-8 col-sm-9 col-xs-12 field-value'}, `${String(results[0].value.airName)}, Addr: ${String(results[0].value.airAddr)}` ));
        displayVoteRow.appendChild(DOM.div({className: 'col col-lg-3 col-md-2 col-sm-9 col-xs-12 field-value'}, `${voteStatus}` ));
    }
    // }
    displayDiv.append(section);
    displayVoteDiv.appendChild(displayVoteRow);
}

// CLEAR the ELEGIBLE Airline Voting Display
function displayEligibleVoterAirlineClear(title, description, initDispDone, label) {
    // let displayDiv = DOM.elid("vote-airline");
    let section = DOM.section();
    if (!initDispDone) {
        section.appendChild(DOM.h2({className: "multi-section-title"}, title));
        section.appendChild(DOM.h5(description));
    } else {
        let displayVoteRemove = DOM.elid('airline-voter-row');
        displayVoteRemove.parentNode.removeChild(displayVoteRemove); // Clears Current Voting List
    }
    let displayVoteDiv = DOM.elid("airline-voter-display");
    let displayVoteRow = section.appendChild(DOM.div({id: 'airline-voter-row', className:'row'}));
    displayVoteRow.appendChild(DOM.div({className: 'col col-lg-2 col-md-4 col-sm-3 col-xs-12 field'}, 'Number'));
    displayVoteRow.appendChild(DOM.div({className: 'col col-lg-7 col-md-4 col-sm-3 col-xs-12 field'}, label));
    displayVoteRow.appendChild(DOM.div({className: 'col col-lg-3 col-md-4 col-sm-3 col-xs-12 field'}, 'Voting Status'));
    // displayDiv.append(section);
    displayVoteDiv.append(section);
    displayVoteDiv.appendChild(displayVoteRow);
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
