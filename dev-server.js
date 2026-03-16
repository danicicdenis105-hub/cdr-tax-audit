// Wrapper to start Next.js dev server on Windows
// Avoids .bin/next Unix shell script issue
process.argv = [process.argv[0], 'dev', '-p', process.env.PORT || '3000'];
require('next/dist/bin/next');
