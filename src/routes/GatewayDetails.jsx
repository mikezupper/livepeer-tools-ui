import React from 'react';
import {Typography, Box, Card, CardHeader, Avatar, CardContent, Grid, Tooltip} from '@mui/material';
import {styled} from "@mui/material/styles";
import Button from "@mui/material/Button";


// Styled component for the Ethereum address tooltip
const AddressTooltip = styled(Tooltip)(({ theme }) => ({
    cursor: 'pointer',
    textDecoration: 'underline',
    '&:hover': {
        backgroundColor: theme.palette.grey[200],
    },
}));


function GatewayDetails({gateway}) {

    return (
        <Grid item xs={12} sm={6} md={4} key={gateway.eth_address}>
            <Card
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                        boxShadow: 6,
                    },
                }}
            >
                <CardHeader
                    avatar={
                        gateway.avatar ? (
                            <Avatar
                                src={gateway.avatar}
                                alt={gateway.name}
                            />
                        ) : (
                            <Avatar>
                                {gateway.name}
                            </Avatar>
                        )
                    }
                    title={
                        <Typography variant="h6" component="div">
                            {gateway.name}
                        </Typography>
                    }
                    subheader={
                        <AddressTooltip
                            title={gateway.eth_address}
                            placement="top"
                            arrow
                        >
                            <Typography variant="body2" color="textSecondary">
                                {`${gateway.eth_address.substring(0, 6)}...${gateway.eth_address.substring(
                                    gateway.eth_address.length - 4
                                )}`}
                            </Typography>
                        </AddressTooltip>
                    }
                />
                <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" color="textPrimary">
                            Deposit:
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {gateway.deposit} ETH
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" color="textPrimary">
                            Reserve:
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {gateway.reserve} ETH
                        </Typography>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            target="_blank"
                            href={`https://explorer.livepeer.org/accounts/${gateway.eth_address}/history`}
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

export default GatewayDetails;
