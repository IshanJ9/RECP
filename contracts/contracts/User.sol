// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract User {
    uint256 public totalUsers;

    struct UserInfo {
        address userWallet;
        string userName;
        string name;
        string userProfile;
        uint256[] investedProjects;
        uint256[] ownedProjects;
    }

    mapping(address => UserInfo) public users;
    mapping(string=>address) public userNameToWallet;

    modifier onlyUser(address userAddr) {
        require(users[userAddr].userWallet == msg.sender, "Not authorized");
        _;
    }

    function addUser(string memory username, string memory name, string memory profile) external {
        require(users[msg.sender].userWallet == address(0), "User already exists");
        require(userNameToWallet[username] == address(0), "Choose different username");
        totalUsers++;
        UserInfo storage user = users[msg.sender];
        user.userWallet = msg.sender;
        user.userName = username;
        user.name = name;
        user.userProfile = profile;
        userNameToWallet[name]=msg.sender;
    }

    function addInvestedProject(uint256 projectId) external {
        require(users[msg.sender].userWallet != address(0), "User not found");
        users[msg.sender].investedProjects.push(projectId);
    }

    function addOwnedProject(uint256 projectId) external {
        require(users[msg.sender].userWallet != address(0), "User not found");
        users[msg.sender].ownedProjects.push(projectId);
    }

    function changeUsername(address userAddr, string memory newName) external onlyUser(userAddr) {
        require(userNameToWallet[newName] == address(0), "Choose different username");
        users[userAddr].userName = newName;
    }

    function getUser(address userAddr) external view returns (
        address,
        string memory,
        string memory,
        string memory
    ) {
        UserInfo memory u = users[userAddr];
        return (u.userWallet, u.userName, u.name, u.userProfile);
    }

    function getInvestedProjects(address userAddr) external view returns (uint256[] memory) {
        return users[userAddr].investedProjects;
    }

    function getOwnedProjects(address userAddr) external view returns (uint256[] memory) {
        return users[userAddr].ownedProjects;
    }
}
