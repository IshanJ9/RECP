// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Project} from "./Project.sol";

contract ProjectFactory{
    
    uint256 totalProjects=0;
    mapping (uint256=> address) public projectIdToAddress;
    mapping (string=>uint256) public projectNametoprojectId;

    event ProjectCreated(
        uint256 indexed projectId,
        address indexed owner
    );

    function createProject(
        string memory _name,
        string memory _founderName,
        uint256 _budget,
        uint256 _duration,
        uint256 _proposalLimit,
        uint256 _investmentLimit
        ) public {
        require(projectNametoprojectId[_name]==0,"Project with this name exists");
        require(_investmentLimit<_budget &&_proposalLimit<_budget,"Limits exceed the project budget");
        totalProjects++;

        // Create a new Project instance with the provided parameters.
        Project project = new Project(
            totalProjects,  
            _name,
            _founderName,
            msg.sender,
            _budget,
            _duration,
            _proposalLimit,
            _investmentLimit
        );

        emit ProjectCreated(totalProjects, msg.sender);
        projectNametoprojectId[_name]=totalProjects;
        projectIdToAddress[totalProjects]=address(project);
    }

    function getNumberOfProjects() external view returns (uint256){
        return totalProjects;
    }
}