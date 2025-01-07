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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
} from '@mui/material';
import BallotIcon from '@mui/icons-material/Ballot';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { ArrowForward, Description, Poll, ThumbDown, ThumbsUpDown, ThumbUp } from '@mui/icons-material';
import { useLoaderData } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import AllVotesByVoter from './AllVotesByVoter.jsx';
import { formatNumber, getProposalColor, getStatusColor } from './votingUtils.jsx';

const VotingHistoryList = () => {
    const { proposals } = useLoaderData();
    const [selectedProposalId, setSelectedProposalId] = useState(null);
    const selectedProposalData = selectedProposalId
        ? proposals.find((p) => p.id === selectedProposalId)
        : null;

    // Store an object for the selected voter
    // e.g. { address: '0x...', name: 'Alice', avatar: 'someUrl' } or null
    const [selectedVoter, setSelectedVoter] = useState(null);

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
                                            fontWeight: proposal.id === selectedProposalId ? 'bold' : 'normal',
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
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                Click on any voter's row to see all of their votes.
                            </Typography>

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
                                            <TableCell sx={{ fontWeight: 'bold' }}>
                                                Stake (ETH)
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>% of Vote</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedProposalData.votes &&
                                        selectedProposalData.votes.length > 0 ? (
                                            selectedProposalData.votes.map((vote, idx) => {
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
                                                        : vote.voterName;

                                                return (
                                                    <TableRow
                                                        key={idx}
                                                        sx={{
                                                            backgroundColor: bgColor,
                                                            cursor: 'pointer', // indicate clickable row
                                                        }}
                                                        onClick={() => {
                                                            // Store an object for the selected voter
                                                            setSelectedVoter({
                                                                address: vote.voterAddress,
                                                                name: vote.voterName,
                                                                avatar: vote.voterAvatar,
                                                            });
                                                        }}
                                                    >
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

                            {/* The modal (or Dialog) for all votes by the selected voter */}
                            <Dialog
                                open={Boolean(selectedVoter)}
                                onClose={() => setSelectedVoter(null)}
                                fullWidth
                                maxWidth="md"
                            >
                                {selectedVoter && (
                                    <DialogTitle>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="h6" component="span">
                                                All Votes by{' '}
                                            </Typography>
                                            <Avatar
                                                src={selectedVoter.avatar}
                                                alt={
                                                    selectedVoter.name ||
                                                    `${selectedVoter.address?.substring(0, 6)}...`
                                                }
                                                sx={{ width: 24, height: 24 }}
                                            />
                                            <Typography variant="h5" component="span">
                                                {selectedVoter.name && selectedVoter.name.trim() !== ''
                                                    ? selectedVoter.name
                                                    : `${selectedVoter.address.substring(0, 6)}...${selectedVoter.address.substring(
                                                        selectedVoter.address.length - 4
                                                    )}`}
                                            </Typography>
                                        </Box>
                                    </DialogTitle>
                                )}
                                <DialogContent>
                                    <AllVotesByVoter
                                        voterAddress={selectedVoter?.address}
                                        proposals={proposals}
                                    />
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setSelectedVoter(null)}>Close</Button>
                                </DialogActions>
                            </Dialog>
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Box>
    );
};

export default VotingHistoryList;
