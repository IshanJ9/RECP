const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Full Crowdfunding + DAO Flow", function () {
  let owner, investor1, investor2, nonMember;
  let factory, project, projectAddress;

  beforeEach(async function () {
    [owner, investor1, investor2, nonMember] = await ethers.getSigners();

    // Deploy ProjectFactory
    const ProjectFactory = await ethers.getContractFactory("ProjectFactory");
    factory = await ProjectFactory.deploy();
  });

  it("1) should create a project", async function () {
    // Create a new project
    const tx = await factory.createProject(
      "Crowdfunding Project",
      "Batman",
      ethers.parseEther("10"), // 0.0001 ETH
      700000,
      ethers.parseEther("1"),
      ethers.parseEther("0.1")
    );
    await tx.wait();
    projectAddress = await factory.projectIdToAddress(1);
    expect(projectAddress).to.properAddress;
    // Get the deployed project instance
    project = await ethers.getContractAt("Project", projectAddress);
    expect(await project.name()).to.equal("Crowdfunding Project");
    expect(await project.founderName()).to.equal("Batman");
  });

  it("2) should add details to the project", async function () {
    await expect(
      project.connect(investor1).addProjectDetails("TokenName", "TKN", 100, "Project Desc", "Eco")
    ).to.be.revertedWithCustomError(project, "OwnableUnauthorizedAccount").withArgs(investor1.address);

    expect(await project.isDaoCreated()).to.equal(false);
    // Owner adds details
    const tx = await project.connect(owner).addProjectDetails("TokenName", "TKN", 100, "Project Desc", "Eco");
    await tx.wait();

    // Check token data
    const storedSupply = await project.tokenGivenToEveryone();
    // const tokenAddr = await project.tokenAddress();
    expect(storedSupply).to.equal(100);
    // expect(tokenAddr).to.properAddress;

    // Confirm category/description
    expect(await project.category()).to.equal("Eco");
    expect(await project.description()).to.equal("Project Desc");
  });

  it("3) should allow investors to invest in the project", async function () {
    // Ensure the DAO is created (if your contract requires it)
    // await project.connect(owner).addProjectDetails("TokenName", "TKN", 100, "Project Desc", "Eco");

    // Attempt to invest with too little Ether
    await expect(
      project.connect(investor1).invest("Alice", { value: ethers.parseEther("0.0001") })
    ).to.be.revertedWith("Meet the investment limit");

    // Correct investment
    const investmentAmount = ethers.parseEther("0.9");
    await expect(
      project.connect(investor1).invest("Alice", { value: investmentAmount })
    )
      .to.emit(project, "investmentMade")
      .withArgs(2, "Alice", investor1, investmentAmount);

    // // Verify the updated mappings
    const totalInvested = await project.userWallettoAmtInvested(investor1);
    expect(totalInvested).to.equal(investmentAmount);

    // // Verify the global invested amount
    const currentInvestedAmount = await project.currentInvestedAmount();
    expect(currentInvestedAmount).to.equal(investmentAmount);
  });

  it("4) should allow project owner to create a proposal", async function () {
    await expect(project.createProposal("Proposal Description 1", 10, ethers.parseEther("1"),0,120,false)).to.be.reverted

    const investmentAmount = ethers.parseEther("1");
    await expect(
      project.connect(investor2).invest("Bob", { value: investmentAmount })
    )
      .to.emit(project, "investmentMade")
      .withArgs(3, "Bob", investor2.address, investmentAmount);

    await project.createProposal("Proposal Description 1", 10, ethers.parseEther("1"),0,120,true);
    proposal = await project.proposalIdtoProposal(1);
    // await proposal.wait(); 
    expect(await proposal.voteOnce).to.equal(true);
  });

  it("5) should allow investors to vote on proposals", async function () {
    // Ensure the proposal exists
    const proposalId = 1; // Assuming the proposal was created in the previous test
    const proposal = await project.proposalIdtoProposal(proposalId);

    // Investor votes for the proposal
    await expect(
      project.connect(investor1).castVote(proposalId, 9,true)
    )
      .to.emit(project, "QVVoteCast")
      .withArgs(proposalId, 2, 3, true);

    // Check if the vote was recorded
    const hasVoted = await project.hasVoted(2, proposalId);
    expect(hasVoted).to.equal(true);
  });

  it("6) should revert if user is not a DAO member", async function () {
    await expect(project.connect(nonMember).castVote(1, 4, true)).to.be.revertedWith("Not a DAO member");
  });

  it("7) should revert if user votes again on voteOnce proposal", async function () {
    await expect(project.connect(investor1).castVote(1, 1,true)).to.be.revertedWith("Already voted");
  });

  it("8) should revert if user has insufficient tokens", async function () {
    const tokenAddress = await project.tokenAddress();
    const tokens = await ethers.getContractAt("VotingTokens", tokenAddress);
    await tokens.connect(investor2).transfer(investor1, ethers.parseEther("100")); // Empty member's balance
    await expect(project.connect(investor2).castVote(1, 4, true)).to.be.revertedWith("Insufficient tokens");
  });

  it("9) should revert if voting with more than threshold", async function () {
    await project.createProposal("Proposal Description 2",  4, ethers.parseEther("0.01"),0,120,false);
    proposal = await project.proposalIdtoProposal(2);

    await expect(project.connect(investor1).castVote(2, 5, true)).to.be.revertedWith("Excess tokens");
  });

  it("10) should revert if voting outside time window", async function () {
    // Increase time beyond endingTime
    await ethers.provider.send("evm_increaseTime", [2000]);
    await ethers.provider.send("evm_mine");
    await expect(project.connect(investor1).castVote(2, 4, true)).to.be.revertedWith("Voting unavailable");
  });


});