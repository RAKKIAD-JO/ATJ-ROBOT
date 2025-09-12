import"@/styles/layout.css"
import { Kanit } from 'next/font/google'
import ClientLayout from "@/components/clientLayout";

const kanit = Kanit({
  subsets: ['thai'],
  weight: ["100", "200"],
  variable: "--font-kanit"
})

export const metadata = {
  title: 'ATJ Robot - หุ่นยนต์ฉีดพ่นเพื่อการเกษตร',
  description: 'ลดการสัมผัสสารเคมีโดยตรง ช่วยลดความเสี่ยงต่อสุขภาพของเกษตรกร',
  icons: '/logomine1.png'
}

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
         <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}