pragma solidity ^0.4.25;
// pragma experimental ABIEncoderV2;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
// import "./SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

  uint256 AIRLINE_REG_FEE = 1 ether; // eth

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Define enum 'State' for an instance in struct 'Airline' named 'airlineState' 
    // with the following values:
    // NOTE: This ia an alternative method for tracking an airline through it's lifecycle.
    // However, it is unused at this time because of overlapping criteria meaning registered and
    // awaiting votes or funding. So the individual properties are maintained and expanded.
    // enum State 
    // { 
    //     Unregistered,           // 0, Default State, NO EVENT REQUIRED
    //     Registered,             // 1, Entered into system, NOT a voter until funded, BEFORE 4 funded/voting airlines
    //     AwaitingVotes,          // 2, For airlines AFTER 4 are FUNDED and therefore voters
    //     AwaitingFunds,          // 3, Before 4 funded, immediately after registration? AFTER 4, after successful votes
    //     Funded,                 // 4, Allows participation and VOTING rights - addVoter Role
    //     Rejected                // 5, failed a vote sessoion
    // }

    // Default should NOT be the same as any action to which a function sets the state variable.
    // State constant defaultState = State.Unregistered;

    struct Airline {
        string name;
        // State airlineState;
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
    }

    struct Passenger {
        string name;
        bool isRegistered;
        bool isFunded;
        uint256 balance;
        address wallet;
    }

    address private contractOwner;                      // Account used to deploy contract
    bool private operational;                           // Blocks all state changes throughout the 
                                                        // contract if false
    mapping(address => bool) authorizedContracts;       // Mapping: which contracts can call in
    mapping(string => Airline) airlines;                // Mapping for storing airlines
    string[] public airNamesList;
    string[] public airNamesFundedList;
    mapping(string => string) propNames;                // Mapping of valid airline property names
    uint256 totalAirlines = 1; // The first airline is registered by the constructor, so 1 not 0
    uint256 totalVoters = 1; // The first airline is registered by the constructor, so 1 not 0

    mapping(string => Passenger) passengers;            // Mapping for storing passengers

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    // Production events
    event AirlineRegisteredDATA(bool _isRegd);
    event AirlineFundedDATA(bool _isFunded);
    event CheckAirlineRegisteredDATA(bool _isRegd);
    event CheckAirlineFundedDATA(bool _isFunded);
    event CheckAirlinePropDATA(string _airline, string _prop, bool _result);

    // Define debugging event
    event LoggingDATA(string _message, string _text, uint256 _num1, uint256 _num2, bool _bool, address _addr);

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor(
        address firstAirline
    ) 
        public 
    {
        contractOwner = msg.sender;
        operational = true;
        // Register first airline per project rubic
        airlines["Uno Air"] = Airline ({
            name: "Uno Air",
            isRegistered: true,
            isFunded: true,
            isCharterMember: true,
            isVoterApproved: false,
            isRejected: false,
            balance: 10,
            wallet: firstAirline,
            votesYes: 0,
            votesNo: 0,
            index: 1 // FIRST AIRLINE
        });
        airNamesList.push(airlines["Uno Air"].name); // Total Airlines
        airNamesFundedList.push(airlines["Uno Air"].name); // Total Voters
        // propNames["name"] = "name";
        propNames["registered"] = "registered";
        propNames["funded"] = "funded";
        propNames["charter"] = "charter";
        propNames["voterApproved"] = "voterApproved";
        propNames["rejected"] = "rejected";
        // propNames["balance"] = "balance";
        // propNames["addr"] = "addr";
        // propNames["yesVotes"] = "yesVotes";
        // propNames["noVotes"] = "noVotes";
        // propNames["index"] = "index";
    }

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
        require(operational, "Contract is currently not operational");
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

    /**
    * @dev Modifier that requires the "authorizedContracts" address to be the function caller
    */
    modifier requireAuthorizedCaller() // requireAuthorizedContract
    {
        require(authorizedContracts[msg.sender], "Caller is not authorized to call this contract");
        _;
    }

    // /// @dev Define a modifer that verifies the Caller
    // modifier verifyCaller (address _address) {
    //     require(msg.sender == _address); 
    //     _;
    // }

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

    /// @dev Define a modifier that checks airline approval status for FUNDING
    modifier requireIsApproved(string _name) {
        require(isApproved(_name), "Four or more airlines funded: Airline requires voter approval before funding.");
        _;
    }


    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
        public 
        view 
        returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus(bool mode)
        external
        requireContractOwner 
    {
        operational = mode;
    }

    /**
    * @dev ADDS App Contract Address to list of allowed contract callers
    */    
    function authorizeCaller(address _contractAddr)
        requireContractOwner
        public
    {
        authorizedContracts[_contractAddr] = true; // true
    }

    /**
    * @dev REMOVES App Contract Address to list of allowed contract callers
    */    
    function deauthorizeCaller(address _contractAddr)
        requireContractOwner
        public
    {
        delete authorizedContracts[_contractAddr]; // false, delete is a keyword - even better!
    }

    /**
    * @dev Function FOR DEVELOPMENT that checks if address is an "authorizedContracts"
    */
    function checkCallerStatus(address _contractAddr)
        requireContractOwner
        public 
        view
        returns(bool)
    {
        return(authorizedContracts[_contractAddr]);
    }

    /**
    * @dev Check Approval Status of Airline as follows:
    *      If totalVoters <= 4, approved = true
    *      If totalVoters >  4, approved = 
    * @return A bool that is the current airline's approval status
    */      
    function isApproved(string _name) 
        public 
        view 
        returns(bool) 
    {
        if (totalVoters <= 4) {
            return true;
        } else {
            return airlines[_name].isVoterApproved;
        }
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev ADD an airline to the registration list
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline(
        string  _name,
        address _addr
    )
        external
        // Don't think this can work since changing things on the blockchain takes TIME!!!
        // SO... use emit events instead like Supplychain did
        returns(bool) // returns are for "other .sol contracts", not javascript. Use emit event
    {
        require(!airlines[_name].isRegistered, "Airline is already registered.");
        totalAirlines = totalAirlines.add(1); // count of successful registrations
        // Register new airline 
        airlines[_name] = Airline ({
            name: _name,
            isRegistered: true,
            isFunded: false,
            isCharterMember: false,
            isVoterApproved: false,
            isRejected: false,
            balance: 0,
            wallet: _addr,
            votesYes: 0,
            votesNo: 0,
            index: totalAirlines
        });
        airNamesList.push(_name);
        emit AirlineRegisteredDATA(airlines[_name].isRegistered);
        emit LoggingDATA("FS DATA registerAirline(): ", 
            // airlines[_name].name, 
            airNamesList[totalAirlines.sub(1)],
            // airlines[_name].balance, 
            airNamesList.length,
            airlines[_name].index, 
            FlightSuretyData.isAirlineRegistered(_name),
            contractOwner
        );
        return airlines[_name].isRegistered;
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
        returns (bool airlineIsRegistered)
    {
        // string airName = airlines[_name].name;        
        airlineIsRegistered = airlines[_name].isRegistered;
        emit CheckAirlineRegisteredDATA(airlineIsRegistered);
        return (airlineIsRegistered);
    }

   /**
    * @dev CHECK IF a previously registered airline has been funded
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function isAirlineFunded(string _name)
        // external
        public
        view
        returns (bool airlineIsFunded)
    {
        airlineIsFunded = airlines[_name].isFunded;
        emit CheckAirlineFundedDATA(airlineIsFunded);
        return (airlineIsFunded);
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
        require(keccak256(abi.encodePacked(airlines[_airline].name)) == keccak256(abi.encodePacked(_airline)), "getAirlineProperty: Invalid Airline Name.");
        // require(propNames[_prop] == _prop, "getAirlineProperty: Valid Property Names: name, registered, funded, charter, voterApproved, rejected, balance, addr, yesVotes, noVotes, index.");
        require(keccak256(abi.encodePacked(propNames[_prop])) == keccak256(abi.encodePacked(_prop)), "getAirlineProperty: Valid Property Names: registered, funded, charter, voterApproved, rejected.");
        // Implementing if (_prop == "name") {...}
        // if (keccak256(abi.encodePacked(_prop)) == keccak256(abi.encodePacked("name")) ) {
        //     _result = airlines[_airline].name;
        //     emit CheckAirlinePropDATA(_airline, _prop, _result);
        //     return (_result);
        // }
        if (keccak256(abi.encodePacked(_prop)) == keccak256(abi.encodePacked("registered")) ) {
            _result = airlines[_airline].isRegistered;
            emit CheckAirlinePropDATA(_airline, _prop, _result);
            return (_result);
        }
        if (keccak256(abi.encodePacked(_prop)) == keccak256(abi.encodePacked("funded")) ) {
            _result = airlines[_airline].isFunded;
            emit CheckAirlinePropDATA(_airline, _prop, _result);
            return (_result);
        }
        if (keccak256(abi.encodePacked(_prop)) == keccak256(abi.encodePacked("charter")) ) {
            _result = airlines[_airline].isCharterMember;
            emit CheckAirlinePropDATA(_airline, _prop, _result);
            return (_result);
        }
        if (keccak256(abi.encodePacked(_prop)) == keccak256(abi.encodePacked("voterApproved")) ) {
            _result = airlines[_airline].isVoterApproved;
            emit CheckAirlinePropDATA(_airline, _prop, _result);
            return (_result);
        }
        if (keccak256(abi.encodePacked(_prop)) == keccak256(abi.encodePacked("rejected")) ) {
            _result = airlines[_airline].isRejected;
            emit CheckAirlinePropDATA(_airline, _prop, _result);
            return (_result);
        }
        // if (keccak256(abi.encodePacked(_prop)) == keccak256(abi.encodePacked("balance")) ) {
        //     _result = airlines[_airline].balance;
        //     emit CheckAirlinePropDATA(_airline, _prop, _result);
        //     return (_result);
        // }
        // if (keccak256(abi.encodePacked(_prop)) == keccak256(abi.encodePacked("addr")) ) {
        //     _result = airlines[_airline].wallet;
        //     emit CheckAirlinePropDATA(_airline, _prop, _result);
        //     return (_result);
        // }
        // if (keccak256(abi.encodePacked(_prop)) == keccak256(abi.encodePacked("yesVotes")) ) {
        //     _result = airlines[_airline].votesYes;
        //     emit CheckAirlinePropDATA(_airline, _prop, _result);
        //     return (_result);
        // }
        // if (keccak256(abi.encodePacked(_prop)) == keccak256(abi.encodePacked("noVotes")) ) {
        //     _result = airlines[_airline].votesNo;
        //     emit CheckAirlinePropDATA(_airline, _prop, _result);
        //     return (_result);
        // }
        // if (keccak256(abi.encodePacked(_prop)) == keccak256(abi.encodePacked("index")) ) {
        //     _result = airlines[_airline].index;
        //     emit CheckAirlinePropDATA(_airline, _prop, _result);
        //     return (_result);
        // }

    }


    // function getAirlineStatus(string _name) // ALWAYS FALSE, both 1 or 2 return values
    //     // external
    //     public
    //     view
    //     returns (
    //         // bool airlineIsRegistered,
    //         bool airlineIsFunded)
    // {
    //     Airline memory airlineView;
    //     (airlineView.name,
    //      airlineView.isRegistered,
    //      airlineView.isFunded,
    //      airlineView.balance,
    //      airlineView.wallet,
    //      airlineView.votesYes,
    //      airlineView.index
    //     ) = FlightSuretyData.retrieveAirline(_name);
    //         string memory airName = airlineView.name;
    //         // airlineIsRegistered = airlineView.isRegistered;
    //         airlineIsFunded = airlineView.isFunded;
    //     // emit CheckAirlineRegisteredDATA(airlineIsRegistered);
    //     emit CheckAirlineFundedDATA(airlineIsFunded);
    //     // return (airlineIsRegistered, airlineIsFunded);
    //     return (airlineIsFunded);
    // }

    /**
    * @dev Retrieve number of ALL registered airlines  via _listName == "all" from array.length
    *      or all of FUNDED airline names that were pushed onto the airNamesList or 
    *      airNamesFundedList array at registration
    */
    function getAirlineCount(string _listName)
        public
        view
        returns(uint256 _count)
    {
        if (keccak256(abi.encodePacked(_listName)) == keccak256(abi.encodePacked("funded")) ) { // if (_listName == "funded") {
            _count = airNamesFundedList.length;
        } else { // "all" or just default behavior
            _count = airNamesList.length;
        }
        return _count;
    }

    /**
    * @dev Retrieve NAME of registered airline in the airNamesList or airNamesFundedList array
    *
    */
    function getAirlineName(string _listName, uint256 _num)
        public
        view
        returns(string _name)
    {
        if (keccak256(abi.encodePacked(_listName)) == keccak256(abi.encodePacked("funded")) ) { // if (_listName == "funded") {
            _name = airNamesFundedList[_num];
        } else { // "all" or just default behavior
            _name = airNamesList[_num];
        }
        return _name;
    }

   /**
    * @dev Retrieve a registered airline from registration list
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function retrieveAirline(string _name)
        // external
        public
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
        airName = airlines[_name].name;
        airIsRegd = airlines[_name].isRegistered;
        airIsFunded = airlines[_name].isFunded;
        // airIsFunded = airlines[_name].isCharterMember;
        // airIsFunded = airlines[_name].isVoterApproved;
        // airIsFunded = airlines[_name].isRejected;
        airBal = airlines[_name].balance;
        airAddr = airlines[_name].wallet;
        // airVoteYesCount = airlines[_name].votesYes;
        // airVoteNoCount = airlines[_name].votesNo;
        airIndex = airlines[_name].index;

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
    * @dev Fetch part A a registered airline from registration list
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function fetchAirlinePartA(string _name)
        // external
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
        )
    {
        airName = airlines[_name].name;
        airIsRegd = airlines[_name].isRegistered;
        airIsFunded = airlines[_name].isFunded;
        airBal = airlines[_name].balance;
        airAddr = airlines[_name].wallet;
        airVoteYesCount = airlines[_name].votesYes;
        airIndex = airlines[_name].index;

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
    * @dev Fetch part B a registered airline from registration list
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function fetchAirlinePartB(string _name)
        // external
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
        )
    {
        airName = airlines[_name].name;
        airIsCharterMember = airlines[_name].isCharterMember;
        airIsVoterApproved = airlines[_name].isVoterApproved;
        airIsRejected = airlines[_name].isRejected;
        airVoteNoCount = airlines[_name].votesNo;
        airIndex = airlines[_name].index;
        ttlAirlines = totalAirlines;
        ttlVoters = totalVoters;
        return (
            airName,
            airIsCharterMember,
            airIsVoterApproved,
            airIsRejected,
            airVoteNoCount,
            airIndex,
            ttlAirlines,
            ttlVoters
        );
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fundAirline(
        string  _name,
        uint256 _bal, // msg.value ultimately
        address _addr
    )
        external
        payable
        requireIsApproved(_name)
        // paidEnough(AIRLINE_REG_FEE)
        // checkValue(_addr, AIRLINE_REG_FEE)
        returns(bool) // returns are for "other .sol contracts", not javascript. Use emit event
    {
        require(airlines[_name].isRegistered, "Airline was NOT previously registered.");
        // require(airlines[_name].wallet == _addr, "Funding Airline's address does NOT match airline's registered address");
        // require(airlines[_name].wallet == msg.sender, "Sending wallet address does NOT match airline's registered address");
        // require(_bal >= AIRLINE_REG_FEE, "Insufficuent funds provided to register your airline.");
        // require(msg.value >= AIRLINE_REG_FEE, "Insufficuent msg.value provided to register your airline.");
        totalVoters = totalVoters.add(1); // count of successful registrations
        // Fund Previously Registered Airline 
        airlines[_name].isFunded = true;
        if (airNamesFundedList.length < 5 ) {
            airlines[_name].isCharterMember = true;
        }
        airlines[_name].balance = airlines[_name].balance.add(_bal); // msg.value ultimately
        airNamesFundedList.push(_name);
        emit AirlineFundedDATA(airlines[_name].isFunded);
        emit LoggingDATA("FS DATA fundAirline(): ", 
            airlines[_name].name, 
            airlines[_name].balance, 
            airlines[_name].index, 
            FlightSuretyData.isAirlineFunded(_name),
            contractOwner
        );
        return airlines[_name].isFunded;
    }

   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy(
    )
        external
        payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(
    )
        external
        pure
    {
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay(
    )
        external
        pure
    {
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    )
        pure
        internal
        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function fund(
    )
        external
        pure
    {
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
        external 
        payable 
    { // was fund() which TBD different fundings vs ONE fallback
        // fundAirline(); // Why doesn't this work?
        this.fund();
    }


}

