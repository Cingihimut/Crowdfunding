// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol"; // Impor ERC20Votes
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

contract SturanNetworkGovernor is Initializable, GovernorUpgradeable, GovernorSettingsUpgradeable, GovernorCountingSimpleUpgradeable, GovernorVotesUpgradeable, GovernorVotesQuorumFractionUpgradeable, GovernorTimelockControlUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    IERC20 public governanceToken;
    IVotes public votesToken;

    mapping(uint256 => uint256) public proposalStake;
    mapping(address => uint256) public voterStake;
    mapping(uint256 => address[]) public voters; // Menyimpan daftar pemilih untuk setiap proposal
    mapping(address => address) public delegates; // Mapping untuk menyimpan alamat delegasi

    uint256 public stakeAmount;
    
    constructor() {
        _disableInitializers();
    }

    function initialize(IVotes _token, TimelockControllerUpgradeable _timelock, address initialOwner)
        initializer public
    {
        __Governor_init("SturanNetworkGovernor");
        __GovernorSettings_init(7200 /* 1 day */, 50400 /* 1 week */, 0);
        __GovernorCountingSimple_init();
        __GovernorVotes_init(_token);
        __GovernorVotesQuorumFraction_init(4);
        __GovernorTimelockControl_init(_timelock);
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    // Fungsi untuk mendelgasikan suara
    function delegate(address to) public {
        require(to != msg.sender, "Self-delegation is disallowed.");
        
        // Simpan delegasi
        delegates[msg.sender] = to;

        emit Delegated(msg.sender, to);
    }

    event Delegated(address indexed delegator, address indexed to);

    // The following functions are overrides required by Solidity.

    function votingDelay()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function castVote(uint256 proposalId, uint8 support) public override returns (uint256) {
        require(governanceToken.balanceOf(msg.sender) >= stakeAmount, "Insufficient balance for voting");

        governanceToken.transferFrom(msg.sender, address(this), stakeAmount);
        voterStake[msg.sender] += stakeAmount;

        // Tambahkan pemilih ke dalam daftar pemilih untuk proposal ini
        voters[proposalId].push(msg.sender);

        // Mendapatkan alamat delegasi
        address delegatee = delegates[msg.sender];
        if (delegatee != address(0)) {
            // Tambahkan suara delegasi
            voterStake[delegatee] += stakeAmount;
        }

        return super.castVote(proposalId, support);
    }

    function _countVotes(uint256 proposalId) internal view returns (uint256) {
        address[] memory currentVoters = voters[proposalId]; // Ambil daftar pemilih untuk proposal ini
        uint256 totalVotes = 0;

        for (uint256 i = 0; i < currentVoters.length; i++) {
            // Menghitung suara dari delegator
            address voter = currentVoters[i];
            address delegatee = delegates[voter];
            if (delegatee != address(0)) {
                totalVotes += votesToken.getVotes(delegatee);
            } else {
                totalVotes += votesToken.getVotes(voter);
            }
        }

        return totalVotes;
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(GovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function propose(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) public override returns (uint256) {
        require(governanceToken.balanceOf(msg.sender) >= stakeAmount, "Insufficient stake for proposal");
        governanceToken.transferFrom(msg.sender, address(this), stakeAmount);
        uint256 proposalId = super.propose(targets, values, calldatas, description);
        proposalStake[proposalId] = stakeAmount;
        return proposalId;
    }

    function proposalThreshold()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function releaseStake(uint256 proposalId) public {
        require(state(proposalId) == ProposalState.Succeeded || state(proposalId) == ProposalState.Defeated, "Voting is not finished");
        governanceToken.transfer(msg.sender, proposalStake[proposalId]);
        proposalStake[proposalId] = 0;
        governanceToken.transfer(msg.sender, voterStake[msg.sender]);
        voterStake[msg.sender] = 0;
    }

    function _queueOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (uint48)
    {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
    {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (address)
    {
        return super._executor();
    }
}
