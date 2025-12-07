import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
    config: {
        initialColorMode: 'dark',
        useSystemColorMode: false,
    },
    styles: {
        global: {
            body: {
                bg: '#0a0e27',
                color: 'white',
            },
        },
    },
    colors: {
        brand: {
            50: '#e8f0ff',
            100: '#b8d4ff',
            200: '#88b8ff',
            300: '#6495ED', // Main brand color
            400: '#4a7dd9',
            500: '#3065c5',
            600: '#1e4db1',
            700: '#0c359d',
            800: '#001d89',
            900: '#000575',
        },
    },
    components: {
        Button: {
            baseStyle: {
                fontWeight: '600',
                borderRadius: 'xl',
                transition: 'all 0.3s ease',
            },
            variants: {
                solid: {
                    bg: 'linear-gradient(135deg, #6495ED 0%, #4a7dd9 100%)',
                    color: 'white',
                    _hover: {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 0 20px rgba(100, 149, 237, 0.5)',
                        _disabled: {
                            transform: 'none',
                        },
                    },
                    _active: {
                        transform: 'translateY(0)',
                    },
                },
                outline: {
                    borderColor: '#6495ED',
                    color: '#6495ED',
                    _hover: {
                        bg: 'rgba(100, 149, 237, 0.1)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 0 15px rgba(100, 149, 237, 0.3)',
                    },
                },
            },
        },
    },
});

export default theme;
