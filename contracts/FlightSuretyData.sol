pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    struct Airline {
        string name;
        bool isRegistered;
        bool isFunded;
        uint256 balance;
        // bool isActive;
        address wallet;
        uint256 currVoteCountM;
        uint256 currTtlVotersN;
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
    mapping(string => Passenger) passengers;            // Mapping for storing passengers
    uint256 totalVoters = 1; // The first airline is registered by the constructor, so 1 not 0

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    // Production events
    event AirlineRegisteredDATA(bool _isRegd);

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
            balance: 10,
            // isActive: true,
            wallet: firstAirline,
            currVoteCountM: 1,
            currTtlVotersN: 1 // FIRST AIRLINE
        });
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
        uint256 _bal,
        address _addr
    )
        external
        // pure
        // Don't think this can work since changing things on the blockchain takes TIME!!!
        // SO... use emit events instead like Supplychain did
        returns(bool) // returns are for "other .sol contracts", not javascript. Use emit event
    {
        require(!airlines[_name].isRegistered, "Airline is already registered.");
        require(_bal >= 10, "Insufficuent funds provided to register your airline.");
        totalVoters = totalVoters.add(1); // count of successful registrations
        // Register new airline 
        airlines[_name] = Airline ({
            name: _name,
            isRegistered: true,
            isFunded: true, // _bal >= 10 ether ? true : false,
            balance: _bal,
            // isActive: airlines[_name].isRegistered && airlines[_name].isFunded,
            wallet: _addr,
            currVoteCountM: 1,
            currTtlVotersN: totalVoters
        });
        emit AirlineRegisteredDATA(airlines[_name].isRegistered);
        emit LoggingDATA("FS DATA registerAirline(): ", 
            airlines[_name].name, 
            airlines[_name].balance, 
            airlines[_name].currTtlVotersN, 
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
    // THIS METHOD FAILS TO PRODUCE 'TRUE' WHEN AIRLINE IS REGISTERED
    // SWITCHING TO NEW APPROACH BELOW...
    // function isAirlineRegistered(string _name)
    //     // external
    //     public
    //     view
    //     returns (bool airlineIsRegistered)
    // {
    //     string airName = airlines[_name].name;        
    //     airlineIsRegistered = airlines[_name].isRegistered;
    //     return (airlineIsRegistered);
    // }
    // SINCE THE retrieveAirline() FUNCTION CAN GET THE CORRECT ANSWER(S),
    // CALL IT AND ONLY RETURN THE ITEM OF INTEREST...
    function isAirlineRegistered(string _name)
        // external
        public
        view
        returns (bool airlineIsRegistered)
    {
        Airline memory airlineView;
        (airlineView.name,
         airlineView.isRegistered,
         airlineView.isFunded,
         airlineView.balance,
         airlineView.wallet,
         airlineView.currVoteCountM,
         airlineView.currTtlVotersN
        ) = FlightSuretyData.retrieveAirline(_name);
            string memory airName = airlineView.name;
            airlineIsRegistered = airlineView.isRegistered;
            bool airIsFunded = airlineView.isFunded;
            // NOTE 1: CompilerError: Stack too deep, try removing local variables... So commented
            // NOTE 2: Doing so STILL can't return the correct value for airlineIsRegistered!
            // uint256 airBal = airlineView.balance;
            // address airAddr = airlineView.wallet;
            // uint256 airVoteCount = airlineView.currVoteCountM;
            // uint256 airTtlVoters = airlineView.currTtlVotersN;
        return (airlineIsRegistered);
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
            uint256 airBal, 
            address airAddr,
            uint256 airVoteCount,
            uint256 airTtlVoters
        )
    {
        airName = airlines[_name].name;
        airIsRegd = airlines[_name].isRegistered;
        airIsFunded = airlines[_name].isFunded;
        airBal = airlines[_name].balance;
        airAddr = airlines[_name].wallet;
        airVoteCount = airlines[_name].currVoteCountM;
        airTtlVoters = airlines[_name].currTtlVotersN;

        return (
            airName,
            airIsRegd,
            airIsFunded,
            airBal,
            airAddr,
            airVoteCount,
            airTtlVoters
        );
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

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund(
    )
        public
        payable
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

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
        external 
        payable 
    {
        fund();
    }


}

