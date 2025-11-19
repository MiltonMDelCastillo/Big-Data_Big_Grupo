import React from "react";
import { Box } from "@mui/material";

export default function TabPanel(props) {
  const { children, value, index, forceShow, ...other } = props;

  // Si forceShow es true, siempre mostrar (para modo único)
  const shouldShow = forceShow || value === index;

  return (
    <div
      role="tabpanel"
      hidden={!shouldShow}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {shouldShow && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}
