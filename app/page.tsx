import Image from "next/image";
import MainContent from '@/components/MainContent';
import ClickChart from '@/components/ClickChart';
import { ModeToggle } from '@/components/ui/theme-toggle';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-2 ">
            {/* <MainContent /> */}

            <ClickChart />
            <ModeToggle />
        </main>
    );
}
