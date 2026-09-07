import type { Metadata } from 'next';
import { Montserrat, Inter } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
	subsets: ['latin'],
	variable: '--font-heading',
	weight: ['500', '600', '700', '800', '900'],
});

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-sans',
	weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
	title: 'IMU Kolkata Campus | Institution’s Innovation Council (IIC 2026–27)',
	description:
		'Official Cadet & Student Registration Form for Institution’s Innovation Council (IIC 2026–27), IMU Kolkata Campus.',
	keywords: [
		'IMU Kolkata Campus',
		'IIC 2026-27',
		'Institution Innovation Council',
		'Cadet Registration',
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en' className={`${montserrat.variable} ${inter.variable} h-full antialiased`}>
			<head>
				<link
					rel='preload'
					as='image'
					href='/iic-banner-v5.png'
					type='image/png'
					fetchPriority='high'
				/>
			</head>
			<body className='min-h-full bg-[#f3f6fa] text-[#0e2544] flex flex-col font-sans selection:bg-[#0e2544] selection:text-white'>
				{children}
			</body>
		</html>
	);
}
