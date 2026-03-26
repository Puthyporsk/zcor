import { Typography } from "@mui/material";

export default function ZcorAllRightsReserved() {
    return (                
        <Typography sx={{ textAlign: "center", color: "inherit", opacity: 0.55, fontSize: 12, pb: 2 }}>
            © {new Date().getFullYear()} ZCOR. All rights reserved.
        </Typography>
    );
}