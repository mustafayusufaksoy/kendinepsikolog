import '../styles/globals.css';
import '/node_modules/@fortawesome/fontawesome-free/css/all.min.css';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}

export default MyApp; 