import Navbar from './components/Navbar'
import { Provider } from './components/Provider'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Provider>
          <Navbar initialSession={null} />
          <div className='pt-8'></div>
          {children}
        </Provider>
      </body>
    </html>
  )
}
