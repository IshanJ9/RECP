// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
// import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
 
contract VotingTokens is ERC20 {
   address public immutable projectAddress;

   modifier onlyProject{
      require(msg.sender == projectAddress,"only project");
      _;
   }

   constructor(
         string memory _tokenName,
         string memory _tokenSymbol
   ) ERC20(_tokenName, _tokenSymbol) {
      projectAddress = msg.sender;
   } 

   function transferTokens(address members, uint256 amount) public onlyProject{
      _approve(members, projectAddress, amount * (10 ** decimals()));
      _mint(members, amount * (10 ** decimals()));
   }   
 }