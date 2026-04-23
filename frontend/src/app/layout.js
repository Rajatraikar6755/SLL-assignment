import { ClerkProvider, UserButton } from '@clerk/nextjs'
import './globals.css'

export const metadata = {
  title: 'SkillBridge',
  description: 'Attendance Management System',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header className="header" style={{ padding: '1rem 2rem' }}>
            <h2>SkillBridge</h2>
            <div className="nav-bar">
              <UserButton afterSignOutUrl="/" />
            </div>
          </header>
          <main>
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}
