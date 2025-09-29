import NavbarClient from '../presentation/components/NavbarClient'
import { Provider } from '../presentation/components/Provider'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Provider>
          <NavbarClient />
          <div className='pt-8'></div>
          {children}
        </Provider>
      </body>
    </html>
  )
}
