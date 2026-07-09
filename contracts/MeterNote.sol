// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MeterNote {
    uint256 public nextEntryId = 1;

    struct Entry {
        address maker;
        string subject;
        uint8 score;
        string note;
        uint256 createdAt;
    }

    mapping(uint256 => Entry) private entries;

    event EntrySaved(
        uint256 indexed entryId,
        address indexed maker,
        string subject,
        uint8 score,
        string note
    );

    function saveEntry(
        string calldata subject,
        uint8 score,
        string calldata note
    ) external returns (uint256 entryId) {
        require(bytes(subject).length > 0 && bytes(subject).length <= 48, "Invalid subject");
        require(score >= 1 && score <= 10, "Invalid score");
        require(bytes(note).length > 0 && bytes(note).length <= 140, "Invalid note");

        entryId = nextEntryId++;
        entries[entryId] = Entry({
            maker: msg.sender,
            subject: subject,
            score: score,
            note: note,
            createdAt: block.timestamp
        });

        emit EntrySaved(entryId, msg.sender, subject, score, note);
    }

    function getEntry(
        uint256 entryId
    )
        external
        view
        returns (
            address maker,
            string memory subject,
            uint8 score,
            string memory note,
            uint256 createdAt
        )
    {
        Entry storage entry = entries[entryId];
        return (
            entry.maker,
            entry.subject,
            entry.score,
            entry.note,
            entry.createdAt
        );
    }
}
