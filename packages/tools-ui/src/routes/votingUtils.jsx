import { alpha } from '@mui/material/styles';


/**
 * Return a background color based on the proposal status and MUI theme.
 * For example, “Active” -> a light info color, “Defeated” -> a light error color, etc.
 */
export function getProposalColor(status, value, theme) {
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
export const getStatusColor = (status, theme) => {
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

// Color for each vote type
export function getSupportColor(support, theme) {
    switch (support) {
        case 'Yes':
            return alpha(theme.palette.success.main, 0.25);
        case 'No':
            return alpha(theme.palette.error.main, 0.25);
        case 'Abstain':
            return alpha(theme.palette.warning.main, 0.25);
        default:
            return 'inherit';
    }
}

export const formatNumber = (number, digits=2) => {
    return number.toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
};


/** Helper to truncate an Ethereum address if no voterName is available */
export function shortenAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}
