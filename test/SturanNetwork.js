const { expect } = require("chai");
const { parseEther } = require("ethers");
const { ethers } = require("hardhat");

describe("SturanNetwork", function () {
    let SturanNetwork, sturanNetwork, MockToken, mockToken;
    let owner, addr1, addr2, addr3;

    beforeEach(async () => {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        MockToken = await ethers.getContractFactory("MockToken");
        mockToken = await MockToken.deploy(owner.address);
        await mockToken.waitForDeployment();

        SturanNetwork = await ethers.getContractFactory("SturanNetwork");
        sturanNetwork = await SturanNetwork.deploy(await mockToken.getAddress(), owner.address);
        await sturanNetwork.waitForDeployment();

        await mockToken.mint(addr1.address, ethers.parseEther("1000"));
        await mockToken.mint(addr2.address, ethers.parseEther("1000"));
        await mockToken.mint(addr3.address, ethers.parseEther("1000"));

        await mockToken.connect(addr1).approve(await sturanNetwork.getAddress(), ethers.parseEther("1000"));
        await mockToken.connect(addr2).approve(await sturanNetwork.getAddress(), ethers.parseEther("1000"));
        await mockToken.connect(addr3).approve(await sturanNetwork.getAddress(), ethers.parseEther("1000"));
    });

    describe('Deployment', () => {
        //deploy the contract
        it('Should set the right owner', async() => {
            expect(await sturanNetwork.owner()).to.equal(owner.address);
        });
    });

    describe('Adding Campaign', () => {
        it('Should allow owner to add a campaign', async() => {
            await expect(sturanNetwork.addCampaign("Test Campaign", ethers.parseEther("100"), ethers.parseEther("10"), 5, 86400))
                .to.emit(sturanNetwork, "CampaignCreated")
                .withArgs(0, "Test Campaign", ethers.parseEther("100"), 86400);

            expect(await sturanNetwork.getCampaignCount()).to.equal(1);
        });

        it('Should not allow non-owner to add a campaign', async() => {
            await expect(sturanNetwork.connect(addr1).addCampaign(
                "Test Campaign", 
                ethers.parseEther("100"), 
                ethers.parseEther("10"), 
                5, 
                86400)
            ).to.be.revertedWithCustomError(sturanNetwork, 'OwnableUnauthorizedAccount').withArgs(addr1.address);
        });        
    });

    describe('Contributing to campaign', () => {
        beforeEach(async () => {
            await sturanNetwork.addCampaign("Test campaign", ethers.parseEther("100"), ethers.parseEther("10"), 5, 86400);
        })

        it('Should allow contributing to an open campaign',async () => {
            await expect(sturanNetwork.connect(addr1).contribute(0, ethers.parseEther("5")))
            .to.emit(sturanNetwork, "ContributionMade")
            .withArgs(0, addr1.address, ethers.parseEther("5"));
        });
        
        it('Should not allow contribution exceeding max contribution', async() => {
            await expect(sturanNetwork.connect(addr1).contribute(0, ethers.parseEther("11")))
            .to.be.revertedWith("Exceeds max contribution");
        });
    });

    describe('Close campaign', () => {
        beforeEach(async () => {
            await sturanNetwork.addCampaign("Testing campaign", ethers.parseEther("100"), ethers.parseEther("10"), 5, 86400);
            await sturanNetwork.connect(addr1).contribute(0, ethers.parseEther("5"));
        })

        it('Should allow owner to close campaign', async() => {
            await expect(sturanNetwork.closeCampaign(0))
            .to.emit(sturanNetwork, "CampaignClosed")
            .withArgs(0, "Testing campaign", ethers.parseEther("5"));
        });

        it('Should not allow non owner to close campaign', async() => {
            await expect(sturanNetwork.connect(addr1).closeCampaign(0))
            .to.be.revertedWithCustomError(sturanNetwork, 'OwnableUnauthorizedAccount').withArgs(addr1.address)
        }); 
    });
    
    describe('Refunding', () => {
        beforeEach(async () => {
            await sturanNetwork.addCampaign("Testing campaign", ethers.parseEther("100"), ethers.parseEther("10"), 5, 86400);
            await sturanNetwork.connect(addr1).contribute(0, ethers.parseEther("5"));
            await sturanNetwork.closeCampaign(0);
        })

        it('Should allow refund after campaign is close', async() => {
            await ethers.provider.send("evm_increaseTime", [86401]);
            await ethers.provider.send("evm_mine");

            await expect(sturanNetwork.connect(addr1).refund(0))
            .to.emit(sturanNetwork, "ContributionRefunded")
            .withArgs(0, addr1.address, ethers.parseEther("5"));
        });

        it('Should not allow refunded if campaign is still open', async() => {
            await sturanNetwork.addCampaign("Testing campaign 2", ethers.parseEther("100"), ethers.parseEther("10"), 5, 86400);
            await sturanNetwork.connect(addr1).contribute(1, ethers.parseEther("5"));

            await expect(sturanNetwork.connect(addr1).refund(1))
            .to.be.revertedWith("Campaign is still open")
        });
    });

    describe('WithdrawToken', () => {
        beforeEach(async () => {
            await sturanNetwork.addCampaign("Testing campaign", ethers.parseEther("100"), ethers.parseEther("100"), 5, 86400);
    
            // Register addr3 as a whitelisted user
            await sturanNetwork.addWhiteListedUser(addr3.address);
    
            // These contributions should still be valid
            await sturanNetwork.connect(addr1).contribute(0, ethers.parseEther("40"));
            await sturanNetwork.connect(addr2).contribute(0, ethers.parseEther("60"));
        });
    
        it('Should allow whitelisted user to withdraw tokens after campaign end and goal reached', async () => {
            await ethers.provider.send("evm_increaseTime", [86401]);
            await ethers.provider.send("evm_mine");
    
            await sturanNetwork.closeCampaign(0);
    
            const contractAddress = await sturanNetwork.getAddress();
            const contractBalance = await mockToken.balanceOf(contractAddress);
            expect(contractBalance).to.equal(ethers.parseEther("100"));
    
            const withdrawTx = await sturanNetwork.connect(addr3).withdrawToken(0, addr3.address, ethers.parseEther("100"));
            await expect(withdrawTx)
                .to.emit(mockToken, "Transfer")
                .withArgs(contractAddress, addr3.address, ethers.parseEther("100"));
            console.log(withdrawTx);
    
            const newContractBalance = await mockToken.balanceOf(contractAddress);
            expect(newContractBalance).to.equal(0);
    
            const addr3Balance = await mockToken.balanceOf(addr3.address);
            expect(addr3Balance).to.equal(ethers.parseEther("1100"));
        });        
    
        it('Should not allow non-whitelisted user to withdraw tokens', async() => {
            await ethers.provider.send("evm_increaseTime", [86401]);
            await ethers.provider.send("evm_mine");
    
            await sturanNetwork.closeCampaign(0);
    
            await expect(sturanNetwork.connect(addr1).withdrawToken(0, addr1.address, ethers.parseEther("100")))
                .to.be.revertedWith("Not whitelisted");
        });
    });
});