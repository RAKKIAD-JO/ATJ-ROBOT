import"@/styles/layout.css"
import Sidebar from "@/components/sidebar"
import { Kanit } from 'next/font/google'
import { SelectedRobotProvider } from "@/app/contexts/SelectedRobotContext"; 

const kanit = Kanit({
  subsets: ['thai'],
  weight: ["100", "200"],
  variable: "--font-kanit"
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Material+Symbols+Outlined" />
      </head>

      <body className={kanit.className}>
        <SelectedRobotProvider>
          <Sidebar />
          {children}
        </SelectedRobotProvider>
      </body>
    </html>
  )
}