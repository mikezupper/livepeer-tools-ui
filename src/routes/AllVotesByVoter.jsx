import React from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getProposalColor, getSupportColor } from './votingUtils.jsx';

const AllVotesByVoter = ({ voterAddress, proposals }) => {
    const theme = useTheme();

    if (!voterAddress) return null;

    // Gather all votes from the proposals array
    const votesByUser = proposals.reduce((acc, proposal) => {
        const vote = proposal.votes?.find((v) => v.voterAddress === voterAddress);
        if (vote) {
            acc.push({ proposal, vote });
        }
        return acc;
    }, []);

    if (votesByUser.length === 0) {
        return <Typography>No votes found for {voterAddress}.</Typography>;
    }

    return (
        <TableContainer component={Paper} variant="outlined">
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Proposal Title</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Support</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Stake (ETH)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {votesByUser.map(({ proposal, vote }) => {
                        // We no longer color the entire row, so leave it default
                        // but color just the Status and Support cells below:
                        const statusBgColor = getProposalColor(proposal.status, 0.25, theme);
                        const supportBgColor = getSupportColor(vote.support, theme);

                        return (
                            <TableRow key={proposal.id}>
                                <TableCell>
                                    {proposal.title || 'Untitled Proposal'}
                                </TableCell>
                                <TableCell sx={{ backgroundColor: statusBgColor }}>
                                    {proposal.status}
                                </TableCell>
                                <TableCell sx={{ backgroundColor: supportBgColor }}>
                                    {vote.support}
                                </TableCell>
                                <TableCell>
                                    {vote.stakeAmount.toLocaleString()}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default AllVotesByVoter;
