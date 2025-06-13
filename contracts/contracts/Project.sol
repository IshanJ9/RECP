// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import {VotingTokens} from "./VotingTokens.sol";
// import {MyNFT} from "NFTs.sol";

contract Project is Ownable {

    uint256 public immutable id;
    string public name;
    string public founderName;
    address public immutable founder;
    uint256 public immutable budget;
    uint256 public immutable investmentLimit;
    uint256 public currentInvestedAmount;
    address private tokenAddress;
    uint256 public immutable proposalLimit;
    uint256 public tokenGivenToEveryone;
    uint256 private  immutable duration;
    string public description;
    string public category;

    uint public totalProposals = 0;
    uint public totalUser = 0;
    uint public totalDocuments = 0;
    uint public totalFundsWithdrawn = 0;
    bool internal isDaoCreated = false;
    uint256 public startTime = 0;
    bool internal isActive = true;


    event investmentMade(
        uint256 indexed userId,
        string userName,
        address userWallet,
        uint256 investedAmount
    );


    event MemberAddedToDAO(
        uint256 indexed projectId,
        uint256 userId,
        address userWallet
    );
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed ProjectAddress, 
        string proposalName,
        address indexed creator,
        uint256 fundsNeeded
    );
    event QVVoteCast(
        uint256 indexed proposalId,
        uint256 userId,
        uint256 numTokens,
        bool voteChoice
    );
    event ResultCalculated(
        uint256 indexed proposalId,
        bool result
    );
    // Add an event for fund withdrawal
    event FundsWithdrawn(
        uint256 indexed proposalId,
        uint256 amountWithdrawn,
        address indexed owner
    );

    constructor(
        uint256 _id,
        string memory _name,
        string memory _founderName,
        address _founder,
        uint256 _budget,
        uint256 _duration,
        uint256 _proposalLimit,
        uint256 _investmentLimit
        )
        Ownable(_founder) {
        id = _id;
        name = _name;
        founderName = _founderName;
        founder = _founder;
        budget = _budget;
        proposalLimit = _proposalLimit;
        investmentLimit = _investmentLimit;
        duration = _duration;
        startTime = block.timestamp;
    }


    struct Document {
        uint256 documentId;
        string documentTitleAndDescription;
        string ipfsHash;
    }

    struct proposal {
        uint256 proposalId;
        string proposalTitleAndDesc;
        uint256 votingThreshold;
        uint256 fundsNeeded;
        uint256 beginningTime;
        uint256 endingTime;
        bool voteOnce;
    }

    mapping(uint256 => string) public userIdtoUser;
    mapping(address => uint256) public userWallettoUserId;
    mapping(uint256 => proposal) public proposalIdtoProposal;
    mapping(uint256 => uint256[]) public proposalIdtoVoters;
    mapping(uint256 => uint256) public proposalIdToQuadraticYesMappings;
    mapping(uint256 => uint256) public proposalIdToQuadraticNoMappings;
    mapping(address=>uint256) public userWallettoAmtInvested;
    mapping (uint256 => bool) public proposalIdToResult;
    mapping (uint256 => bool) public proposalToResultCalculated;
    mapping(uint256 => Document) public documentIdtoDocument;
    
    function invest(string memory userName) external payable {
        require(isDaoCreated==true,"Dao not created");
        require(msg.value >= investmentLimit , "Meet the investment limit");
        address userWallet = msg.sender;
        
        //update mapping of userWallet to totalAmountInvested
        if(userWallettoAmtInvested[userWallet]!=0)
            userWallettoAmtInvested[userWallet]+=msg.value;
        else{
            addUsertoDao(userName,userWallet);
            userWallettoAmtInvested[userWallet]=msg.value;
        } 

        currentInvestedAmount += msg.value;

        //emit invested amount
        emit investmentMade(totalUser, userName, userWallet,msg.value);
    }    

    function castVote(uint _proposalId, uint numTokens, bool _vote) external {
        address funcCaller = msg.sender;
        require(checkMembership(funcCaller), "Not a DAO member");

        uint256 userId = userWallettoUserId[funcCaller]; // Assumes mapping exists
        if (proposalIdtoProposal[_proposalId].voteOnce) {
            require(!hasVoted(userId, _proposalId) && checkMembership(funcCaller), "Already voted");
        }
        
        VotingTokens vt = VotingTokens(tokenAddress);
        require(vt.balanceOf(funcCaller) >= numTokens,"Insufficient tokens");
        require(numTokens <= proposalIdtoProposal[_proposalId].votingThreshold,"Excess tokens");
        require(block.timestamp >= proposalIdtoProposal[_proposalId].beginningTime && block.timestamp < proposalIdtoProposal[_proposalId].endingTime, "Voting unavailable");

        // Quadratic Voting: votes = sqrt(numTokens)
        uint256 numVotes = sqrt(numTokens);
        vt.transferFrom(msg.sender, address(this), numTokens*1e18);
        if (_vote) {
            proposalIdToQuadraticYesMappings[_proposalId] += numVotes;
        } else {
            proposalIdToQuadraticNoMappings[_proposalId] += numVotes;
        }
        emit QVVoteCast(_proposalId, userId, numVotes, _vote);
        // Mark user as having voted
        proposalIdtoVoters[_proposalId].push(userId);
    }

    function addProjectDetails(
        string memory _tokenName, 
        string memory _tokenSymbol,
        uint256 supply,
        string memory _description,  
        string memory _category
        ) external onlyOwner{
        require(isDaoCreated == false, "DAO already created");
        
        category = _category;
        description = _description;

        isDaoCreated = true;
        
        VotingTokens vt = new VotingTokens(_tokenName,_tokenSymbol);
        tokenGivenToEveryone = supply;
        tokenAddress = address(vt);
        addUsertoDao(founderName, founder);
    }
    
    function createProposal(
        string memory proposalTitleAndDesc,
        uint256 votingThreshold,
        uint256 fundsNeeded,
        uint256 beginningTime,
        uint256 endingTime,
        bool voteOnce
    ) external onlyOwner {
        require(isDaoCreated == true && currentInvestedAmount>=proposalLimit && currentInvestedAmount-totalFundsWithdrawn >= fundsNeeded && fundsNeeded<=budget,"Reach Proposal Condition");
        
        totalProposals++;

        proposal memory newProposal = proposal({
            proposalId: totalProposals,
            proposalTitleAndDesc: proposalTitleAndDesc,
            votingThreshold: votingThreshold,
            fundsNeeded: fundsNeeded,
            beginningTime: beginningTime+block.timestamp,
            endingTime: endingTime+block.timestamp,
            voteOnce: voteOnce
        });
        proposalIdtoProposal[totalProposals] = newProposal;
        
        emit ProposalCreated(totalProposals, address(this), proposalTitleAndDesc, msg.sender, fundsNeeded);
    }
    
    function calculateProposalResult(uint256 _proposalId) external onlyOwner {
        require(block.timestamp > proposalIdtoProposal[_proposalId].endingTime, "Voting not ended");
        require(!proposalToResultCalculated[_proposalId], "Result already calculated");
        
        uint256 yesVotes = proposalIdToQuadraticYesMappings[_proposalId];
        uint256 noVotes = proposalIdToQuadraticNoMappings[_proposalId];
        bool tempResult;
        if (yesVotes > noVotes) {
            proposalIdToResult[_proposalId] = true;
            tempResult = true;  
        }
        else{
            proposalIdToResult[_proposalId] = false;
            tempResult = false;
        }
        proposalToResultCalculated[_proposalId] = true;
        emit ResultCalculated(_proposalId, tempResult);
        if(tempResult==true){
            proposal memory selectedProposal = proposalIdtoProposal[_proposalId];
            require( selectedProposal.fundsNeeded <= address(this).balance, "Proposal failed or insufficient balance");
            payable(msg.sender).transfer(selectedProposal.fundsNeeded);
            totalFundsWithdrawn += selectedProposal.fundsNeeded;
            emit FundsWithdrawn(_proposalId, selectedProposal.fundsNeeded, msg.sender);
        }
    }


    function addUsertoDao(string memory userName,address userWallet) internal {
        totalUser++;
        userIdtoUser[totalUser]=userName;
        userWallettoUserId[userWallet]=totalUser;
        VotingTokens(tokenAddress).transferTokens(userWallet, tokenGivenToEveryone);

        // Emit an event for adding a user to the DAO
        emit MemberAddedToDAO(id, totalUser, userWallet);
        
    }    

    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    function checkMembership( address _callerWalletAddress ) internal view returns (bool b) {
        return userWallettoUserId[_callerWalletAddress] != 0;
    }
    
    function hasVoted(
        uint256 _userId,
        uint256 _proposalId
    ) public view returns (bool) {
        for (uint256 i = 0; i < proposalIdtoVoters[_proposalId].length; i++) {
            if (_userId == proposalIdtoVoters[_proposalId][i]) {
                return true;
            }
        }
        return false;
    }

    function getBalanceOfTokens(address user) external view returns(uint256){
        return VotingTokens(tokenAddress).balanceOf(user);
    }

    function setComplete() external onlyOwner {
        isActive=false;
    }

    function addDocument(string memory documentTitleAndDescription, string memory ipfsHash) external onlyOwner{
        totalDocuments++;
        Document memory d1 = Document(totalDocuments,documentTitleAndDescription,ipfsHash);
        documentIdtoDocument[totalDocuments]=d1;
    }
}