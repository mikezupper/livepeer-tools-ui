import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
    useTheme,
    useMediaQuery,
    IconButton, Grid, Avatar,
} from '@mui/material';
import BallotIcon from '@mui/icons-material/Ballot';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useLoaderData} from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import Button from "@mui/material/Button";
import {ArrowForward, Poll, ThumbDown, ThumbsUpDown, ThumbUp} from "@mui/icons-material"; // Import alpha utility

// Utility function for formatting numbers
const formatNumber = (number) => {
    return number.toLocaleString(undefined, { // 'undefined' uses the user's locale
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const VotingHistoryList = () => {
    // proposals is an array: [{ id: ..., title: ..., proposerAddress: ..., votes: [...] }, ...]
    const { proposals } = useLoaderData();

    // State to track which proposal is currently selected
    const [selectedProposalId, setSelectedProposalId] = useState(null);

    // Retrieve the selected proposal data
    const selectedProposalData = selectedProposalId
        ? proposals.find((proposal) => proposal.id === selectedProposalId)
        : null;

    // Access the MUI theme
    const theme = useTheme();

    return (
        <Box
            sx={{
                // On small screens (xs, sm, md), stack vertically; on larger, use side-by-side
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                // Adjust height or remove to allow auto height on smaller screens
                height: { xs: 'auto', md: 'calc(100vh - 100px)' },
                mt: 2,
                mb: 2,
                gap: 2,
            }}
        >
            {/* LEFT PANE - List of proposals */}
            <Box
                sx={{
                    width: { xs: '100%', md: '30%' },
                    borderRight: { xs: 'none', md: `1px solid ${theme.palette.divider}` },
                    overflowY: 'auto',
                    // Add a subtle background color
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: { xs: theme.shadows[1], md: 'none' },
                }}
            >
                <TableContainer component={Paper} sx={{ borderRadius: 0 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow
                                sx={{
                                    backgroundColor: theme.palette.primary.main,
                                }}
                            >
                                <TableCell
                                    sx={{
                                        color: theme.palette.common.white,
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                    }}
                                >
                                    <BallotIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Proposals
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {proposals.map((proposal) => (
                                <TableRow
                                    key={proposal.id}
                                    hover
                                    onClick={() => setSelectedProposalId(proposal.id)}
                                    sx={{
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s',
                                        '&:hover': {
                                            backgroundColor: theme.palette.action.hover,
                                        },
                                        // Use theme's selected color if this row is the selected one
                                        backgroundColor:
                                            proposal.id === selectedProposalId
                                                ? theme.palette.action.selected
                                                : 'inherit',
                                    }}
                                >
                                    <TableCell
                                        sx={{
                                            fontWeight: proposal.id === selectedProposalId ? 'bold' : 'normal',
                                        }}
                                    >
                                        {proposal.title || 'Untitled Proposal'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* RIGHT PANE - Details of the selected proposal */}
            <Box
                sx={{
                    width: { xs: '100%', md: '70%' },
                    overflowY: 'auto',
                    p: 2,
                }}
            >
                {/* If no proposal is selected, display a placeholder message */}
                {!selectedProposalData ? (
                    <Card
                        variant="outlined"
                        sx={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 2,
                        }}
                    >
                        <Typography variant="h6" color="textSecondary">
                            Select a proposal from the list to view details.
                        </Typography>
                    </Card>
                ) : (
                    <Card
                        variant="outlined"
                        sx={{
                            // Add some elevation and a subtle background highlight
                            boxShadow: theme.shadows[2],
                            backgroundColor: theme.palette.background.default,
                        }}
                    >
                        <CardContent>
                            {/* Proposal Title */}
                            <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                                <BallotIcon sx={{ mr: 1 }} />
                                {selectedProposalData.title || 'Untitled Proposal'}
                            </Typography>

                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonOutlineIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                    <strong>Proposer:</strong> {selectedProposalData.proposerName !=='' ? selectedProposalData.proposerName: selectedProposalData.proposerAddress}
                                </Typography>
                            </Box>
                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonOutlineIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                    <strong>Original Proposal:</strong>
                                    <Button
                                        size="small"
                                        color="primary"
                                        endIcon={<ArrowForward />}
                                        target="_blank"
                                        href={`https://explorer.livepeer.org/treasury/${selectedProposalData.id}`}
                                        rel="noopener"
                                    >
                                        View on Livepeer
                                    </Button>
                                </Typography>
                            </Box>
                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Poll fontSize="small" color="action" />
                                <Typography variant="body2">
                                    <strong>Total Stake Voted:</strong> {typeof selectedProposalData.totalStakeVoted === 'number'
                                    ? formatNumber(selectedProposalData.totalStakeVoted)
                                    : selectedProposalData.totalStakeVoted}
                                </Typography>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Total Support: {selectedProposalData.forPct.toFixed(4)}%
                                </Typography>
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ThumbUp fontSize="small" color="action" />
                                    <Typography variant="body2">
                                        For ({selectedProposalData.forPct.toFixed(4)}%): {selectedProposalData.forStake.toLocaleString(undefined, {maximumFractionDigits: 3})} LPT
                                    </Typography>
                                </Box>
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ThumbDown fontSize="small" color="action" />
                                    <Typography variant="body2">
                                        Against ({selectedProposalData.againstPct.toFixed(4)}%): {selectedProposalData.againstStake.toLocaleString(undefined, {maximumFractionDigits: 3})} LPT
                                    </Typography>
                                </Box>
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ThumbsUpDown fontSize="small" color="action" />
                                    <Typography variant="body2">
                                        Abstain ({selectedProposalData.abstainPct.toFixed(4)}%): {selectedProposalData.abstainStake.toLocaleString(undefined, {maximumFractionDigits: 3})} LPT
                                    </Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ my: 2 }} />

                            {/* Votes Table */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                                <HowToVoteIcon color="action" />
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    Votes
                                </Typography>
                            </Box>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow
                                            sx={{
                                                backgroundColor: theme.palette.action.hover,
                                            }}
                                        >
                                            <TableCell sx={{ fontWeight: 'bold' }}>Voter</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Support</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Stake (ETH)</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>% of Vote</TableCell>
                                            {/*<TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>*/}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedProposalData.votes && selectedProposalData.votes.length > 0 ? (
                                            selectedProposalData.votes.map((vote, idx) => {

                                                // Determine faint background color based on vote.support
                                                let bgColor = 'inherit';
                                                switch (vote.support) {
                                                    case 'Yes':
                                                        bgColor = alpha(theme.palette.success.main, 0.1); // Very faint green
                                                        break;
                                                    case 'No':
                                                        bgColor = alpha(theme.palette.error.main, 0.1); // Very faint red
                                                        break;
                                                    case 'Abstain':
                                                        bgColor = alpha(theme.palette.warning.main, 0.1); // Very faint yellow
                                                        break;
                                                    default:
                                                        bgColor = 'inherit';
                                                }
                                                const voterName = (vote.voterName === '' ? `${vote.voterAddress.substring(0, 6)}...${vote.voterAddress.substring(vote.voterAddress.length - 4)}` : `${vote.voterName}`);
                                                return (
                                                    <TableRow
                                                        key={idx}
                                                        sx={{
                                                            backgroundColor: bgColor,
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Grid container alignItems="center" spacing={1} sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <Grid item>
                                                                    <Avatar src={vote.voterAvatar} alt={voterName} sx={{ width: 24, height: 24 }}/>
                                                                </Grid>
                                                                <Grid item>
                                                                    <Typography variant="inherit">{voterName}</Typography>
                                                                </Grid>
                                                            </Grid>
                                                        </TableCell>
                                                        <TableCell>{vote.support}</TableCell>
                                                        <TableCell>
                                                            {typeof vote.stakeAmount === 'number'
                                                                ? formatNumber(vote.stakeAmount)
                                                                : vote.stakeAmount}
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatNumber(vote.stakeAmount / selectedProposalData.totalStakeVoted * 100)}%
                                                        </TableCell>
                                                        {/*<TableCell>{new Date(vote.castAt * 1000).toLocaleString()}</TableCell>*/}
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center">
                                                    No votes found for this proposal.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Box>
    );

};

export default VotingHistoryList;
