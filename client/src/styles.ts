
import React from 'react';

export const globalBgCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=PT+Serif:ital,wght@0,400;0,700;1,400&display=swap');
  html, body {
    background-color: ${bgColor};
    margin: 0; padding: 0;
    font-family: 'PT Serif', serif;
    color: ${textColor};
    line-height: 1.6;
    transition: background-color 0.3s;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.5px;
    margin-top: 0;
  }
  a {
    text-decoration: none;
    color: ${textColor};
    transition: color 0.3s;
  }
  a:hover {
    color: ${secondaryTextColor};
  }
  button {
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    transition: transform 0.2s, background-color 0.3s;
  }
  button:hover {
    transform: translateY(-1px);
  }
  [data-tooltip]:hover::before {
    opacity: 1;
  }

  @keyframes rotateIcon {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .rotating-icon {
    display: inline-block;
    animation: rotateIcon 1s linear infinite;
  }

  @media(max-width: 600px) {
    h1 { font-size: 1.8rem; }
    .answer-box { font-size: 0.9rem; }
  }
`;

export const containerStyles: React.CSSProperties = {
  margin: '0 auto',
  maxWidth: '600px',
  padding: '40px 20px',
  transition: 'color 0.3s',
  minHeight: '100vh'
};

export const headingStyles: React.CSSProperties = {
  textAlign: 'center' as const,
  fontWeight: 600,
  marginBottom: '40px',
  fontSize: '2.2rem',
};

export const videoWrapperStyles: React.CSSProperties = {
  border: `1px solid ${borderColor}`,
  borderRadius: '8px',
  overflow: 'hidden',
  marginBottom: '20px'
};

export const sectionHeadingStyles: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '1.3rem',
  marginBottom: '20px',
  fontWeight: 600,
  textAlign: 'center'
};

export const answerBoxStyles: React.CSSProperties = {
  border: `1px solid ${borderColor}`,
  borderRadius: '4px',
  padding: '10px',
  backgroundColor: accentBgColor,
  fontSize: '14px',
  lineHeight: '1.5',
  transition: 'background-color 0.3s'
};

export const bigCenterMessage: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  textAlign: 'center' as const,
  marginTop: '50px',
};

export const rightButtonContainer: React.CSSProperties = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end'
};

export const settingsButtonStyles: React.CSSProperties = {
  position: 'relative' as const,
  zIndex: 999,
  padding: '10px 20px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  backgroundColor: isDarkMode ? '#fdfdfd' : '#222',
  color: isDarkMode ? '#000' : '#fff',
  marginBottom: '10px'
};

export const settingsPanelStyles: React.CSSProperties = {
  position: 'absolute' as const,
  bottom: 'calc(100% + 10px)',
  right: '0',
  transform: isSettingsOpen ? 'translateY(0)' : 'translateY(10px)',
  opacity: isSettingsOpen ? 1 : 0,
  transition: 'opacity 0.3s, transform 0.3s',
  pointerEvents: isSettingsOpen ? 'auto' : 'none',
  padding: '15px',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
  borderRadius: '8px',
  minWidth: '190px'
};

export const settingsItemStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '10px'
};

export const labelStyles: React.CSSProperties = {
  color: textColor,
  fontSize: '14px',
  userSelect: 'none' as const,
  marginRight: '10px',
  fontFamily: 'Inter, sans-serif',
};

export const switchContainerStyles = (on: boolean): React.CSSProperties => ({
  position: 'relative',
  width: '40px',
  height: '20px',
  backgroundColor: on ? '#4caf50' : (isDarkMode ? '#444' : '#ccc'),
  borderRadius: '20px',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'background-color 0.3s',
  marginRight: '10px'
});

export const switchKnobStyles = (on: boolean): React.CSSProperties => ({
  position: 'absolute',
  top: '2px',
  left: on ? '20px' : '2px',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  backgroundColor: '#fff',
  transition: 'left 0.3s'
});

export const solveButtonStyles: React.CSSProperties = {
  display: 'block', // Makes the button a block-level element
  width: '100%',    // Ensures the button takes up the full width of the parent
  padding: '10px 20px', // Adjust padding for better aesthetics
  backgroundColor: isDarkMode ? '#444' : '#eee',
  color: isDarkMode ? '#fff' : '#000',
  border: 'none',
  borderRadius: '4px',
  fontSize: '16px', // Adjust font size to balance the new width
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'transform 0.2s, background-color 0.3s'
};

export const progressBarContainer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center', // Center-aligns the bars
  marginTop: '20px',
  marginBottom: '10px'
};

export const progressBarSegment: React.CSSProperties = {
  flex: 1,
  height: '8px',
  borderRadius: '4px',
  margin: '0 10px', // Increased spacing between bars for better centering
};

export const progressBarWrapper: React.CSSProperties = {
  textAlign: 'center', // Centers the label with respect to the bar
  flex: 1,
};

export const stepLabels: React.CSSProperties = {
  fontSize: '12px',
  color: secondaryTextColor,
  fontFamily: 'Inter, sans-serif',
  marginTop: '5px',
};