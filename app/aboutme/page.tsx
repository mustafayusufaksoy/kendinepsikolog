"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@nextui-org/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

export default function AboutMe() {
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleContinue = () => {
        router.push('/skills');
    };

    return (
        <main className="relative min-h-screen flex flex-col items-center justify-center px-4">
            <div className={`text-center ${isVisible ? 'animate-fadeIn' : 'opacity-0'}`}>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#A8E6CE] mb-4 md:mb-8 font-mono">
                    About Me
                </h1>

                <div className={`max-w-2xl mx-auto px-4 ${isVisible ? 'animate-slideIn' : 'opacity-0'}`}>
                    <p className="text-white text-sm sm:text-base md:text-lg font-mono leading-relaxed mb-4 md:mb-8">
                        I&apos;m a Full Stack Developer with 2 years of experience in the industry. 
                        During this time, I have worked on large-scale projects in the private sector that are actively used.
                    </p>
                    <p className="text-white text-sm sm:text-base md:text-lg font-mono leading-relaxed">
                        With a background in computer science, I&apos;m a problem solver at heart and love taking on complex and challenging projects. 
                        I&apos;m great at quickly getting up to speed and breaking down tricky business requirements for industry-specific systems.
                    </p>
                </div>

                <Button
                    onPress={handleContinue}
                    className="mt-8 md:mt-12 bg-gradient-to-r from-green-700 to-green-300 
                             hover:from-green-600 hover:to-green-600 
                             text-white font-bold text-sm md:text-base
                             px-4 py-2 md:px-6 md:py-3 rounded-full
                             transition-all duration-300 hover:scale-105
                             shadow-lg hover:shadow-xl"
                    endContent={<FontAwesomeIcon icon={faArrowRight} className="ml-1 md:ml-2 text-sm md:text-base" />}
                >
                    Continue to Skills
                </Button>
            </div>

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s forwards;
                }
                .animate-slideIn {
                    animation: slideIn 0.8s forwards;
                }
            `}</style>
        </main>
    );
}