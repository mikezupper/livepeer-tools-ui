import React from 'react';
import {
    Typography,
    Box,
    Card,
    CardHeader,
    Avatar,
    CardContent,
    Grid,
    Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import {useLocation, useNavigate} from "react-router-dom";

// Styled component for the Ethereum address tooltip
const AddressTooltip = styled(Tooltip)(({ theme }) => ({
    cursor: 'pointer',
    textDecoration: 'underline',
    '&:hover': {
        backgroundColor: theme.palette.grey[200],
    },
}));

function OrchestratorDetails({ orch, idx }) {
    const navigate= useNavigate()
    const location = useLocation();
    const isOnDetailsPage = location.pathname === `/orchestrator/${orch.eth_address}`;

    return (
        <Grid item xs={12} sm={6} md={4} key={orch.eth_address}>
            <Card
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: orch.activation_status ? 'white' : 'grey.200', // Light grey when inactive
                    '&:hover': {
                        boxShadow: 6,
                    },
                }}
            >
                <CardHeader
                    avatar={
                        orch.avatar ? (
                            <Avatar
                                src={orch.avatar}
                                alt={orch.name}
                                sx={{ width: 56, height: 56 }} // Increase size of the avatar
                            />
                        ) : (
                            <Avatar sx={{ width: 56, height: 56 }}> {/* Default avatar size */}
                                {orch.name.charAt(0)}
                            </Avatar>
                        )
                    }
                    title={
                        <Typography
                            variant="h5" // Change to a larger variant
                            component="div"
                            sx={{ fontWeight: 'bold' }} // Optional: Make it bold
                        >
                            {orch.name}
                        </Typography>
                    }
                    subheader={
                        <AddressTooltip title={orch.eth_address} placement="top" arrow>
                            <Typography variant="body2" color="textSecondary">
                                {`${orch.eth_address.substring(0, 6)}...${orch.eth_address.substring(
                                    orch.eth_address.length - 4
                                )}`}
                            </Typography>
                        </AddressTooltip>
                    }
                />
                <CardContent sx={{ flexGrow: 1 }}>
                    <Grid container spacing={2}>
                        {/* Row 1: Rank and Active */}
                        { idx && (<Grid item xs={12} sm={6}>
                            <Box>
                                <Typography variant="subtitle2" color="textPrimary">
                                    Rank
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {idx}
                                </Typography>
                            </Box>
                        </Grid>)}
                        <Grid item xs={12} sm={6}>
                            <Box>
                                <Typography variant="subtitle2" color="textPrimary">
                                    Active
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {orch.activation_status ? 'Yes' : 'No'}
                                </Typography>
                            </Box>
                        </Grid>
                        {/* Row 2: Reward Cut and Fee Cut */}
                        <Grid item xs={12} sm={6}>
                            <Box>
                                <Typography variant="subtitle2" color="textPrimary">
                                    Reward Cut
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {orch.reward_cut}%
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box>
                                <Typography variant="subtitle2" color="textPrimary">
                                    Fee Cut
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {orch.fee_cut}%
                                </Typography>
                            </Box>
                        </Grid>
                        {/* Row 3: Total Stake (spanning both columns) */}
                        <Grid item xs={12} sm={12}>
                            <Box>
                                <Typography variant="subtitle2" color="textPrimary">
                                    Total Stake
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {orch.total_stake} ETH
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                    {!isOnDetailsPage &&(
                    <Box sx={{ mt: 3, mb:3 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={() => navigate(`/orchestrator/${orch.eth_address}`)}
                        >
                            View Details
                        </Button>
                    </Box>)}
                    <Box sx={{ mt: 3, mb:3 }}>

                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            target="_blank"
                            href={`https://explorer.livepeer.org/accounts/${orch.eth_address}/orchestrating`}
                            rel="noopener"
                        >
                            View on Livepeer
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    );
}

export default OrchestratorDetails;
