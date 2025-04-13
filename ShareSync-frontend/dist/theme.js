// Color palette based on "The Art of Color" by Johannes Itten
// Blues for trust, greens for growth, and contrasting colors for readability
export const theme = {
    colors: {
        primary: '#1E88E5', // Blue for trust and professionalism
        secondary: '#43A047', // Green for growth and collaboration
        accent: '#FDD835', // Yellow for highlights and calls to action
        background: '#F5F5F5', // Light gray for background
        text: '#212121', // Dark gray for text
        textLight: '#757575', // Lighter gray for secondary text
        white: '#FFFFFF',
        error: '#D32F2F', // Red for errors
    },
    typography: {
        fontFamily: "'Roboto', sans-serif",
        h1: { fontSize: '2.5rem', fontWeight: 700 },
        h2: { fontSize: '2rem', fontWeight: 600 },
        h3: { fontSize: '1.5rem', fontWeight: 500 },
        body: { fontSize: '1rem', fontWeight: 400 },
        caption: { fontSize: '0.875rem', fontWeight: 400 },
    },
    spacing: {
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
    },
    borderRadius: {
        small: '4px',
        medium: '8px',
        large: '12px',
    },
    shadows: {
        small: '0 2px 4px rgba(0, 0, 0, 0.1)',
        medium: '0 4px 8px rgba(0, 0, 0, 0.15)',
        large: '0 8px 16px rgba(0, 0, 0, 0.2)',
    },
};
