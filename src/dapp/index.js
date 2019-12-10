
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

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
            // DOM.elid('display-ops').innerHTML("");
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
            displayAir('Airline List', 'Retrieve Airline Details', [ { label: 'Airline Status', error: error, value: result} ]);
        });
    

        // REGISTER AIRLINE: User-submitted transaction
        displayRegAirline('Airline Registration', 'Add New Airlines to the Program', [ { label: 'New Airline to Register'} ]);
        DOM.elid('reg-airline-btn').addEventListener('click', () => {
            let airlineName = DOM.elid('reg-airline-name').value;
            let airlineFunds = DOM.elid('reg-airline-funds').value;
            // let airlineFunds = web3.toWei(DOM.elid('reg-airline-funds').value, "ether");
            let airlineAddress = DOM.elid('reg-airline-addr').value;
            // Write transaction
            console.log(airlineName, airlineFunds, airlineAddress);
            contract.registerAirline(airlineName, airlineFunds, airlineAddress, (error, result) => {
                displayRegAirline('Airline Registration', 'Add New Airlines to the Program', [ { label: 'New Airline to Register', error: error, value: result} ]);
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
        row.appendChild(DOM.div({id: 'ops-res-label', className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({id: 'ops-res-value', className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

// Displays a SINGLE Airline retrieved by NAME...
function displayAir(title, description, results) {
    let displayDiv = DOM.elid("display-airline");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    // results.map((result) => {
    let row = section.appendChild(DOM.div({className:'row'}));
    row.appendChild(DOM.div({className: 'col-sm-4 field'}, results[0].label));
    if (results.error) {
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, String(results.error)));
    } else {
        console.log(results[0].value.airName, results[0].value.airIsRegd, results[0].value.airIsFunded, results[0].value.airAddr);
        let registered = results[0].value.airIsRegd ? "Registered" : "NOT Registered";
        let funded = results[0].value.airIsFunded ? "Funded" : "NOT Funded";
        let addr = String(results[0].value.airAddr).substring(0, 6) + "..." + String(results[0].value.airAddr).substring(38);
        // row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, `Name: ${String(results[0].value.airName)}, Reg'd: ${String(results[0].value.airIsRegd)}, Funded: ${String(results[0].value.airIsFunded)}, Addr: ${String(results[0].value.airAddr)}` ));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, `${String(results[0].value.airName)}, ${registered}, ${funded}, Addr: ${addr}` ));
    }
    section.appendChild(row);
    // })
    displayDiv.append(section);
}

function displayRegAirline(title, description, results) {
    let displayDiv = DOM.elid("register-airline");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    // results.map((result) => {
    let row = section.appendChild(DOM.div({className:'row'}));
    row.appendChild(DOM.div({className: 'col-sm-4 field'}, results[0].label));
    if (results.error) {
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, String(results.error)));
    } else {
        console.log(results);
        console.log(results.error);
        console.log(results.value);
        // console.log(results[0].value.airName, results[0].value.airIsRegd, results[0].value.airIsFunded, results[0].value.airAddr);
        // let registered = results[0].value.airIsRegd ? "Registered" : "NOT Registered";
        // let funded = results[0].value.airIsFunded ? "Funded" : "NOT Funded";
        // let addr = String(results[0].value.airAddr).substring(0, 6) + "..." + String(results[0].value.airAddr).substring(38);
        // row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, `Name: ${String(results[0].value.airName)}, Reg'd: ${String(results[0].value.airIsRegd)}, Funded: ${String(results[0].value.airIsFunded)}, Addr: ${String(results[0].value.airAddr)}` ));
        // row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, `${String(results[0].value.airName)}, ${registered}, ${funded}, Addr: ${addr}` ));
    }
    section.appendChild(row);
    // })
    displayDiv.append(section);
}

function displayOracles(title, description, results) {
    let displayDiv = DOM.elid("display-oracles");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        // if (results.value) {
            row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        // } else {
        //     row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, ""));
        // }
        section.appendChild(row);
    })
    displayDiv.append(section);
}


