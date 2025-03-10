/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        jungle: {
          primary: '#1E5631',    // Dark green
          secondary: '#4E9F3D',  // Medium green
          accent: '#D8E9A8',     // Light green/yellow
          dark: '#191A19',       // Almost black
          light: '#A4BE7B',      // Light green
          highlight: '#E5D9B6',  // Beige/sand
          danger: '#A94438',     // Reddish brown
        },
      },
      backgroundImage: {
        'jungle-pattern': "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMzAgNDVDMTYuMjE1IDQ1IDUgMzMuNzg1IDUgMjBTMTYuMjE1IDUgMzAgNXMyNSAxMS4yMTUgMjUgMjUtMTEuMjE1IDI1LTI1IDI1eiIgZmlsbD0iIzRFOUYzRCIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')",
      },
      fontFamily: {
        jungle: ['Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
      boxShadow: {
        'jungle': '0 4px 6px -1px rgba(30, 86, 49, 0.1), 0 2px 4px -1px rgba(30, 86, 49, 0.06)',
      },
    },
  },
  plugins: [],
};
