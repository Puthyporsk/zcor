import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

function ZcorPill({ disabled = false, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      disabled={disabled}
      onClick={onClick}
      sx={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label="ZCOR"
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          px: 1.4,
          py: 0.8,
          borderRadius: 999,
          bgcolor: "rgba(15,27,16,.86)",
          color: "#fff",
          boxShadow: "0 12px 28px rgba(15,27,16,.18)",
        }}
      >
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: 999,
            bgcolor: "rgba(255,255,255,.18)",
            display: "grid",
            placeItems: "center",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          Z
        </Box>
        <Typography sx={{ fontSize: 12, fontWeight: 900, letterSpacing: ".06em" }}>
          ZCOR
        </Typography>
      </Box>
    </Box>
  );
}

export default ZcorPill;