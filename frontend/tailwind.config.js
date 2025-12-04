/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'dark-bg': '#0f172a',
                'dark-text': '#f1f5f9',
            },
        },
    },
    plugins: [],
}
