pragma solidity ^0.4.25;
// pragma experimental ABIEncoderV2; // MWJ TESTING RETURNING A STRUCT...

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
// import "./SafeMath.sol";

import "./FlightSuretyAccessControl/AirlineRole.sol";
// import "../FlightSuretyCore/Ownable.sol"; // TBD

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp is AirlineRole {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    // CONSTANTS
    uint256 AIRLINE_REG_FEE = 1; // ether;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/
    // Add "state variable" for the external data contract
    FlightSuretyData flightSuretyData; // NEEDS TO BE INITIALIZED... see Constructor

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20; // MWJ: Only one for triggering payment process per VIDEO
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;          // Account used to deploy contract

     // For ORACLES...
    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
    }
    mapping(bytes32 => Flight) private flights;

    // My Additions
    struct AirlineView {
        string name;
        bool isRegistered;
        bool isFunded;
        bool isCharterMember;
        bool isVoterApproved;
        bool isRejected;
        uint256 balance;
        address wallet;
        uint256 votesYes;
        uint256 votesNo;
        uint256 index;
        uint256 totalAirlines;
        uint256 totalVoters;
    }

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    // Production events
    event AirlineRegisteredAPP(bool _success);
    event AirlineFundedAPP(bool _success);
    event CheckAirlinePropAPP(string _airline, string _prop, bool _result);

    // Define debugging event
    event LoggingAPP(string _message, string _text, uint256 _num1, uint256 _num2, bool _bool, address _addr);

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
         // Modify to call data contract's status
        require(true, "Contract is currently not operational");  
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /// @dev Define a modifer that verifies the Caller
    modifier verifyCaller (address _address) {
        require(msg.sender == _address); 
        _;
    }

    /// @dev Define a modifier that checks if the paid amount is sufficient to cover the price
    modifier paidEnough(uint256 _price) { 
        require(msg.value >= _price); 
        _;
    }
    
    /// @dev Define a modifier that returns overpayment
    modifier checkValue(address _payer, uint256 _price) {
        _; // This structure gets the modifier to execute AFTER the function instead of usually first.
        uint256 amountPaid = msg.value;
        uint256 amountToReturn = amountPaid.sub(_price);
        _payer.transfer(amountToReturn);
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor(
        // Address parameter for data contract
        // Passed the address of the deployed instance
        // of the data contract
        // data contract is deployed first / previously
        // ONLY here and NOT on data contract because
        // The calls are UNIDIRECTIONAL - only calling
        // INTO the data contract from here - NEVER from
        // there to here
        address dataContractAddr,   // INPUT to constructor
        address firstAirlineAddr    // INPUT to constructor
    ) 
        public 
    {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(dataContractAddr);
        addAirline(firstAirlineAddr); // Add to list of airlines for Role Checking        
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational(

    ) 
        public 
        pure 
        returns(bool) 
    {
        return true;  // Modify to call data contract's status
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

  
   /**
    * @dev ADD an airline to the registration list
    *
    */   
    function registerAirline(
        string  _name,
        address _addr,
        address _sponsor
    )
        onlyAirline
        verifyCaller(_sponsor)
        external
        returns(bool success) // , uint256 votes) // 'votes' is their idea on this function. Me = TBD
    {
        // uint256 votes;
        require(!flightSuretyData.isAirlineRegistered(_name), "Airline is already registered.");
        // Register new airline 
        addAirline(_addr); // Add to list of airlines for Role Checking        
        success = flightSuretyData.registerAirline(_name, _addr);
        // // When registered, it will have 1 vote, but could retrieve actual value
        // if (success) {votes = 1;} else {votes = 0;}
        // // return (success, votes);
        emit AirlineRegisteredAPP(success);
        emit LoggingAPP("FS APP registerAirline(): ", 
            _name, 
            0, 
            // votes,
            flightSuretyData.getAirlineCount("all"), // Gets Correct Number, while called from test doesn't!
            // success,
            flightSuretyData.isAirlineRegistered(_name), 
            _addr // _sponsor
        );
        
        return (success);
    }

   /**
    * @dev CHECK IF an airline is in registration list
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function isAirlineRegistered(string _name)
        // external
        public
        view
        returns (bool)
        {
            return flightSuretyData.isAirlineRegistered(_name);
        }

   /**
    * @dev Retrieve a registered airline from registration list
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function retrieveAirline(string _name)
        external
        view
        returns (
            string airName, 
            bool airIsRegd, 
            bool airIsFunded, 
            // bool airIsCharterMember, 
            // bool airIsVoterApproved, 
            // bool airIsRejected, 
            uint256 airBal, 
            address airAddr,
            uint256 airVoteYesCount,
            // uint256 airVoteNoCount,
            uint256 airIndex
        )
    {
        // THIS WORKS for returning an object/structure
        AirlineView memory airlineView;
        (airlineView.name,
         airlineView.isRegistered,
         airlineView.isFunded,
        //  airlineView.isCharterMember,
        //  airlineView.isVoterApproved,
        //  airlineView.isRejected,
         airlineView.balance,
         airlineView.wallet,
         airlineView.votesYes,
        //  airlineView.votesNo,
         airlineView.index
        ) = flightSuretyData.retrieveAirline(_name);
            airName = airlineView.name;
            airIsRegd = airlineView.isRegistered;
            airIsFunded = airlineView.isFunded;
            // airIsCharterMember = airlineView.isCharterMember;
            // airIsVoterApproved = airlineView.isVoterApproved;
            // airIsRejected = airlineView.isRejected;
            airBal = airlineView.balance;
            airAddr = airlineView.wallet;
            airVoteYesCount = airlineView.votesYes;
            // airVoteNoCount = airlineView.votesNo;
            airIndex = airlineView.index;
            // airIndex = flightSuretyData.getAirlineCount("all");

        return (
            airName,
            airIsRegd,
            airIsFunded,
            // airIsCharterMember,
            // airIsVoterApproved,
            // airIsRejected,
            airBal,
            airAddr,
            airVoteYesCount,
            // airVoteNoCount,
            airIndex
        );
    }

   /**
    * @dev Fetch part A of a registered airline from registration list
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function fetchAirlinePartA(string _name)
        external
        view
        returns (
            string airName, 
            bool airIsRegd, 
            bool airIsFunded, 
            uint256 airBal, 
            address airAddr,
            uint256 airVoteYesCount,
            uint256 airIndex
        )
    {
        // THIS WORKS for returning an object/structure
        AirlineView memory airlineView;
        (airlineView.name,
         airlineView.isRegistered,
         airlineView.isFunded,
         airlineView.balance,
         airlineView.wallet,
         airlineView.votesYes,
         airlineView.index
        ) = flightSuretyData.fetchAirlinePartA(_name);
            airName = airlineView.name;
            airIsRegd = airlineView.isRegistered;
            airIsFunded = airlineView.isFunded;
            airBal = airlineView.balance;
            airAddr = airlineView.wallet;
            airVoteYesCount = airlineView.votesYes;
            airIndex = airlineView.index;

        return (
            airName,
            airIsRegd,
            airIsFunded,
            airBal,
            airAddr,
            airVoteYesCount,
            airIndex
        );
    }

   /**
    * @dev Fetch part B of a registered airline from registration list
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function fetchAirlinePartB(string _name)
        external
        view
        returns (
            string airName, // in both parts A and B
            bool airIsCharterMember, 
            bool airIsVoterApproved, 
            bool airIsRejected, 
            uint256 airVoteNoCount,
            uint256 airIndex, // in both parts A and B
            uint256 totalAirlines,
            uint256 totalVoters
        )
    {
        // THIS WORKS for returning an object/structure
        AirlineView memory airlineView;
        (airlineView.name,
         airlineView.isCharterMember,
         airlineView.isVoterApproved,
         airlineView.isRejected,
         airlineView.votesNo,
         airlineView.index,
         airlineView.totalAirlines,
         airlineView.totalVoters 
        ) = flightSuretyData.fetchAirlinePartB(_name);
            airName = airlineView.name;
            airIsCharterMember = airlineView.isCharterMember;
            airIsVoterApproved = airlineView.isVoterApproved;
            airIsRejected = airlineView.isRejected;
            airVoteNoCount = airlineView.votesNo;
            airIndex = airlineView.index;
            totalAirlines = airlineView.totalAirlines;
            totalVoters = airlineView.totalVoters;
        return (
            airName,
            airIsCharterMember,
            airIsVoterApproved,
            airIsRejected,
            airVoteNoCount,
            airIndex,
            totalAirlines,
            totalVoters
        );
    }

   /**
    * @dev FUND an airline previously added to the registration list
    *
    */   
    function fundAirline(
        string  _name,
        uint256 _bal,
        address _addr
    )
        onlyAirline
        verifyCaller(_addr)
        paidEnough(AIRLINE_REG_FEE)
        checkValue(_addr, AIRLINE_REG_FEE)        
        external
        payable
        returns(bool success)
    {
        uint256 votes;
        require(flightSuretyData.isAirlineRegistered(_name), "Airline is NOT registered.");
        require(_bal >= AIRLINE_REG_FEE, "Insufficuent funds provided to APP contract to register your airline.");
        require(msg.value >= AIRLINE_REG_FEE, "Insufficuent msg.value provided to APP contract to register your airline.");
        // Funding the newly approved airline 
        // success = flightSuretyData.fundAirline(_name, AIRLINE_REG_FEE, _addr, {value: AIRLINE_REG_FEE}); // NOPE
        success = flightSuretyData.fundAirline(_name, AIRLINE_REG_FEE, _addr);
        // addVoter(_addr); // Add to list of Voters for Role Checking        
        if (success) {votes = 1;} else {votes = 0;} // THIS WILL CHANGE
        emit AirlineFundedAPP(success);
        emit LoggingAPP("FS APP fundAirline(): ", 
            _name, 
            _bal, 
            votes,
            true, // flightSuretyData.isAirlineFunded(_name), 
            _addr
        );
        
        return (success);
    }

   /**
    * @dev CHECK IF a previously registered airline has been funded
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function isAirlineFunded(string _name) // ALWAYS FALSE
        // external
        public
        view
        returns (bool)
    {
        return flightSuretyData.isAirlineFunded(_name);
    }

   /**
    * @dev RETRIEVE an airline PROPERTY
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function getAirlineProperty(string _airline, string _prop)
        // external
        public
        view
        returns (bool _result)
    {
        _result = flightSuretyData.getAirlineProperty(_airline, _prop);
            // emit CheckAirlinePropAPP(_airline, _prop, _result);
            return (_result);
    }

    /**
    * @dev Retrieve number of ALL registered airlines  via _listName == "all" from array.length
    *      or all of FUNDED airline names that were pushed onto the airNamesList or airNamesFundedList 
    *      array at registration
    */
    function getAirlineCount(string _listName)
        public
        view
        returns(uint256 _count)
    {
        _count = flightSuretyData.getAirlineCount(_listName);
        return _count;
    }

    /**
    * @dev Retrieve NAME of registered airline from flightSuretyData in the airNamesList or airNamesFundedList array
    *
    */
    function getAirlineName(string _listName, uint256 _num)
        public
        view
        returns(string _name)
    {
        _name = flightSuretyData.getAirlineName(_listName, _num);
        return _name;
    }


   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight(
    )
        external
        pure
    {

    }
    
   /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    )
        internal
        pure
    {

    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(
        address airline,
        string flight,
        uint256 timestamp                            
    )
        external
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    } 


// region ORACLE MANAGEMENT - From ORACLES CLass/Section/Video/Lessons

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}   

// Provide EXTERNAL CONTRACT REFERENCES... Similar to C++ Prototype
contract FlightSuretyData {
    function registerAirline(
        string  _name,
        address _addr
    )
    external
    returns (bool);

    function isAirlineRegistered(string _name)
        // external
        public
        view
        returns (bool);

    function fundAirline(
        string  _name,
        uint256 _bal,
        address _addr
    )
    external
    returns (bool);

    function isAirlineFunded(string _name)
        // external
        public
        view
        returns (bool);

    function retrieveAirline(string _name)
        external
        view
        returns (
            string airName, 
            bool airIsRegd, 
            bool airIsFunded, 
            // bool airIsCharterMember, 
            // bool airIsVoterApproved, 
            // bool airIsRejected, 
            uint256 airBal, 
            address airAddr,
            uint256 airVoteYesCount,
            // uint256 airVoteNoCount,
            uint256 airIndex
        );

    function fetchAirlinePartA(string _name)
        public
        view
        returns (
            string airName, 
            bool airIsRegd, 
            bool airIsFunded, 
            uint256 airBal, 
            address airAddr,
            uint256 airVoteYesCount,
            uint256 airIndex
        );

    function fetchAirlinePartB(string _name)
        public
        view
        returns (
            string airName, 
            bool airIsCharterMember, 
            bool airIsVoterApproved, 
            bool airIsRejected, 
            uint256 airVoteNoCount,
            uint256 airIndex,
            uint256 ttlAirlines,
            uint256 ttlVoters
        );

    function getAirlineCount(string _listName)
        public
        view
        returns(uint256 _count);

    function getAirlineName(string _listName, uint256 _num)
        public
        view
        returns(string _name);

    function getAirlineProperty(string _airline, string _prop)
        public
        view
        returns (bool _result);

}
