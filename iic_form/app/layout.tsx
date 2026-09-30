import type { Metadata, Viewport } from 'next';
import { Poppins, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
	subsets: ['latin'],
	variable: '--font-poppins',
	weight: ['300', '400', '500', '600', '700', '800'],
	display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ['latin'],
	variable: '--font-mono',
	weight: ['400', '600', '700'],
	display: 'swap',
});

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
	themeColor: '#FFFFFF',
};

export const metadata: Metadata = {
	title: 'IMU Kolkata Campus | Institution’s Innovation Council (IIC 2026–27)',
	description:
		'Official Cadet & Student Registration Form for Institution’s Innovation Council (IIC 2026–27), IMU Kolkata Campus.',
	keywords: [
		'IMU Kolkata Campus',
		'IIC 2026-27',
		'Institution Innovation Council',
		'Cadet Registration',
		'Maritime Innovation',
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang='en'
			className={`${poppins.variable} ${jetbrainsMono.variable} h-full antialiased`}>
			<head>
				<link
					rel='preload'
					as='image'
					href='/iic-banner-v5.webp'
					type='image/webp'
					fetchPriority='high'
				/>
			</head>
			<body className='min-h-full bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#1D4ED8] selection:text-white'>
				{children}
			</body>
		</html>
	);
}
