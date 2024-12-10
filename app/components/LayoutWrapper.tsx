"use client";
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import { Button } from '@nextui-org/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    return (
      <>
        <div className="fixed inset-0 z-0">
          <Image
            src="/@origbig.png"
            alt="Northern Lights Background"
            fill
            priority
            className="object-cover"
            quality={100}
          />
        </div>
        <div className="fixed top-6 right-6 z-50">
          <Button
            onPress={handleBack}
            className="bg-gradient-to-r from-blue-700 to-blue-500 
                     text-white font-bold rounded-full 
                     transition-all duration-300 
                     hover:scale-105 hover:from-blue-600 hover:to-blue-400
                     shadow-lg hover:shadow-xl
                     px-6 py-2"
            startContent={<FontAwesomeIcon icon={faArrowLeft} className="mr-2" />}
          >
            Back
          </Button>
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </>
    )
} 