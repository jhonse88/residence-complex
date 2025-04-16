import './globals.css';
import Navbar from './components/Navbar';
import { Provider } from './components/Provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang='en'>
            <body >               
                <Provider>
                    <Navbar />
                <div className='pt-8'></div>
                    {children}
                </Provider>
            </body>
        </html>
    );
}
