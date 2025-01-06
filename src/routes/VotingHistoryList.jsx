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
    Avatar,
    Grid,
    Chip,
    Button
} from '@mui/material';
import BallotIcon from '@mui/icons-material/Ballot';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import {ArrowForward, Description, Poll, ThumbDown, ThumbsUpDown, ThumbUp} from '@mui/icons-material';
import { useLoaderData } from 'react-router-dom';
import { alpha } from '@mui/material/styles';

/**
 * Return a background color based on the proposal status and MUI theme.
 * For example, “Active” -> a light info color, “Defeated” -> a light error color, etc.
 */
function getProposalColor(status, value, theme) {
    let colorVal = value ? value : 1;
    switch (status) {
        case 'Active':
            // A light “info” hue
            return alpha(theme.palette.info.light, colorVal);
        case 'Executed':
            // A light “success” hue
            return alpha(theme.palette.success.light, colorVal);
        case 'Defeated':
            // A light “error” hue
            return alpha(theme.palette.error.light, colorVal);
        default:
            // A light grey hue for other statuses
            return alpha(theme.palette.grey[400], colorVal);
    }
}

/** Helper to get a solid color (not background) for the left border and status chip. */
const getStatusColor = (status, theme) => {
    switch (status) {
        case 'Canceled':
            return theme.palette.error.main;
        case 'Executed':
            return theme.palette.success.main;
        case 'Active':
        case 'Created':
        default:
            return theme.palette.info.main;
    }
};

const formatNumber = (number) => {
    return number.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const VotingHistoryList = () => {
    const { proposals } = useLoaderData();
    const [selectedProposalId, setSelectedProposalId] = useState(null);
    const selectedProposalData = selectedProposalId
        ? proposals.find((p) => p.id === selectedProposalId)
        : null;

    const theme = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
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
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: { xs: theme.shadows[1], md: 'none' },
                    // Remove scrolling
                    overflow: 'hidden',
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
                                        backgroundColor:
                                            proposal.id === selectedProposalId
                                                ? getProposalColor(proposal.status, 0.25, theme)
                                                : 'inherit',
                                        borderLeft: `4px solid ${getProposalColor(proposal.status, undefined, theme)}`,
                                    }}
                                >
                                    <TableCell
                                        sx={{
                                            fontWeight:
                                                proposal.id === selectedProposalId ? 'bold' : 'normal',
                                        }}
                                    >
                                        <Typography variant="subtitle2">
                                            {proposal.title || 'Untitled Proposal'}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: getProposalColor(proposal.status, undefined, theme),
                                                fontWeight: 'bold',
                                                display: 'block',
                                                mt: 0.5,
                                            }}
                                        >
                                            {proposal.status || 'N/A'}
                                        </Typography>
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
                    p: 2,
                    // Remove scrolling
                    overflow: 'hidden',
                }}
            >
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
                            boxShadow: theme.shadows[2],
                            backgroundColor: theme.palette.background.default,
                            height: '100%',
                        }}
                    >
                        <CardContent>
                            {/* Proposal Title */}
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <BallotIcon sx={{ mr: 1 }} />
                                {selectedProposalData.title || 'Untitled Proposal'}
                            </Typography>

                            {/* Display status below the title */}
                            <Box sx={{ mt: 1 }}>
                                <Chip
                                    label={selectedProposalData.status || 'N/A'}
                                    sx={{
                                        fontWeight: 'bold',
                                        color: theme.palette.common.white,
                                        backgroundColor: getStatusColor(
                                            selectedProposalData.status,
                                            theme
                                        ),
                                    }}
                                />
                            </Box>

                            <Box
                                sx={{
                                    mt: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <PersonOutlineIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                    <strong>Proposer:</strong>{' '}
                                    {selectedProposalData.proposerName !== ''
                                        ? selectedProposalData.proposerName
                                        : selectedProposalData.proposerAddress}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    mt: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Description fontSize="small" color="action" />
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
                            <Box
                                sx={{
                                    mt: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Poll fontSize="small" color="action" />
                                <Typography variant="body2">
                                    <strong>Total Stake Voted:</strong>{' '}
                                    {typeof selectedProposalData.totalStakeVoted === 'number'
                                        ? formatNumber(selectedProposalData.totalStakeVoted)
                                        : selectedProposalData.totalStakeVoted}
                                </Typography>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Total Support: {selectedProposalData.forPct.toFixed(4)}%
                                </Typography>
                                <Box
                                    sx={{
                                        mt: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <ThumbUp fontSize="small" color="action" />
                                    <Typography variant="body2">
                                        For ({selectedProposalData.forPct.toFixed(4)}%):{' '}
                                        {selectedProposalData.forStake.toLocaleString(undefined, {
                                            maximumFractionDigits: 3,
                                        })}{' '}
                                        LPT
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        mt: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <ThumbDown fontSize="small" color="action" />
                                    <Typography variant="body2">
                                        Against ({selectedProposalData.againstPct.toFixed(4)}%):{' '}
                                        {selectedProposalData.againstStake.toLocaleString(undefined, {
                                            maximumFractionDigits: 3,
                                        })}{' '}
                                        LPT
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        mt: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <ThumbsUpDown fontSize="small" color="action" />
                                    <Typography variant="body2">
                                        Abstain ({selectedProposalData.abstainPct.toFixed(4)}%):{' '}
                                        {selectedProposalData.abstainStake.toLocaleString(undefined, {
                                            maximumFractionDigits: 3,
                                        })}{' '}
                                        LPT
                                    </Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ my: 2 }} />

                            {/* Votes Table */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 1,
                                    gap: 1,
                                }}
                            >
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
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedProposalData.votes &&
                                        selectedProposalData.votes.length > 0 ? (
                                            selectedProposalData.votes.map((vote, idx) => {
                                                // Color-code background for each vote row using theme
                                                let bgColor = 'inherit';
                                                switch (vote.support) {
                                                    case 'Yes':
                                                        bgColor = alpha(theme.palette.success.main, 0.1);
                                                        break;
                                                    case 'No':
                                                        bgColor = alpha(theme.palette.error.main, 0.1);
                                                        break;
                                                    case 'Abstain':
                                                        bgColor = alpha(theme.palette.warning.main, 0.1);
                                                        break;
                                                    default:
                                                        bgColor = 'inherit';
                                                }

                                                const voterName =
                                                    vote.voterName === ''
                                                        ? `${vote.voterAddress.substring(0, 6)}...${vote.voterAddress.substring(
                                                            vote.voterAddress.length - 4
                                                        )}`
                                                        : `${vote.voterName}`;

                                                return (
                                                    <TableRow key={idx} sx={{ backgroundColor: bgColor }}>
                                                        <TableCell>
                                                            <Grid
                                                                container
                                                                alignItems="center"
                                                                spacing={1}
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                }}
                                                            >
                                                                <Grid item>
                                                                    <Avatar
                                                                        src={vote.voterAvatar}
                                                                        alt={voterName}
                                                                        sx={{ width: 24, height: 24 }}
                                                                    />
                                                                </Grid>
                                                                <Grid item>
                                                                    <Typography variant="inherit">
                                                                        {voterName}
                                                                    </Typography>
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
                                                            {formatNumber(
                                                                (vote.stakeAmount /
                                                                    selectedProposalData.totalStakeVoted) *
                                                                100
                                                            )}
                                                            %
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center">
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
