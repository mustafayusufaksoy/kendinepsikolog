'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, Button, Spacer, Progress } from '@nextui-org/react';
import '@fortawesome/fontawesome-free/css/all.min.css';

export default function KendinePsikologPage() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcriptionText, setTranscriptionText] = useState('');
    const [requestCount, setRequestCount] = useState(0);
    const [showSmoke, setShowSmoke] = useState(false);
    const [alertText, setAlertText] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [conversationHistory, setConversationHistory] = useState<string[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [displayedResponse, setDisplayedResponse] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationIdRef = useRef<number | null>(null);
    const readerRef = useRef<FileReader | null>(null);
    const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
    const textQueueRef = useRef<string[]>([]);

    // API Keys - Güvenli tek parça
    const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    useEffect(() => {
        checkRequestLimit();
        speechSynthesisRef.current = new SpeechSynthesisUtterance();
        
        // Sesleri yükle ve Türkçe sesi seç
        window.speechSynthesis.onvoiceschanged = () => {
            const voices = window.speechSynthesis.getVoices();
            const turkishVoice = voices.find(
                voice => voice.lang === 'tr-TR' || 
                        voice.name.includes('Turkish') || 
                        voice.name.includes('Türkçe')
            );
            if (turkishVoice) {
                speechSynthesisRef.current!.voice = turkishVoice;
            }
            speechSynthesisRef.current!.lang = 'tr-TR';
            speechSynthesisRef.current!.rate = 1.0;
            speechSynthesisRef.current!.pitch = 1.0;
        };

        // Konuşma olaylarını dinle
        if (speechSynthesisRef.current) {
            speechSynthesisRef.current.onend = handleSpeechEnd;
            speechSynthesisRef.current.onerror = handleSpeechError;
        }
        
        return () => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    useEffect(() => {
        // Ses analizi için AudioContext kurulumu
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        return () => {
            if (audioContextRef.current?.state === 'running') {
                audioContextRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        const canvas = document.getElementById('soundVisualizer') as HTMLCanvasElement;
        const canvasCtx = canvas.getContext('2d');
        if (!analyserRef.current || !canvasCtx) return;

        const bufferLength = analyserRef.current.fftSize;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationIdRef.current = requestAnimationFrame(draw);
            analyserRef.current!.getByteFrequencyData(dataArray);

            canvasCtx.fillStyle = '#000';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let posX = 0;

            for(let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 2;
                const r = barHeight + 25 * (i / bufferLength);
                const g = 250 * (i / bufferLength);
                const b = 50;

                canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
                canvasCtx.fillRect(posX, canvas.height - barHeight, barWidth, barHeight);

                posX += barWidth + 1;
            }
        };

        if (isRecording) {
            draw();
        } else {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        }

        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
        };
    }, [isRecording]);

    const checkRequestLimit = () => {
        const today = new Date().toDateString();
        const storedCount = localStorage.getItem('requestCount');
        const lastRequestDate = localStorage.getItem('lastRequestDate');
        
        if (lastRequestDate !== today) {
            localStorage.setItem('requestCount', '0');
            localStorage.setItem('lastRequestDate', today);
            setRequestCount(0);
            return true;
        }

        const count = parseInt(storedCount || '0');
        setRequestCount(count);

        if (count >= 12312) {
            setShowSmoke(true);
            return false;
        }

        return true;
    };

    const incrementRequestCount = () => {
        const today = new Date().toDateString();
        const newCount = requestCount + 1;
        setRequestCount(newCount);
        localStorage.setItem('requestCount', newCount.toString());
        localStorage.setItem('lastRequestDate', today);

        if (newCount >= 6) {
            setShowSmoke(true);
        } else {
            setAlertText(`Bugün ${6 - newCount} konuşma hakkınız kaldı 🎯`);
        }
    };

    const handleRecordClick = async () => {
        if (!isRecording) {
            if (!checkRequestLimit()) return;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                analyzeMicrophoneAudio(stream);
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                    setIsLoading(true);
                    await processAudio(audioBlob);
                    setIsLoading(false);
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                setIsRecording(true);

                // Ses animasyonunu başlat
                startVoiceAnimation();

            } catch (error) {
                console.error('Mikrofon erişimi hatası:', error);
                setAlertText('Mikrofon erişimi sağlanamadı!');
            }
        } else {
            stopRecording();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            stopVoiceAnimation();
            
            // Eğer konuşma devam ediyorsa durdur
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        }
    };

    const processAudio = async (audioBlob: Blob) => {
        try {
            const reader = new FileReader();
            readerRef.current = reader;
            
            return new Promise<void>((resolve, reject) => {
                reader.onloadend = async () => {
                    try {
                        if (!reader.result) {
                            throw new Error('FileReader result is null');
                        }
                        
                        const result = reader.result as string;
                        const base64Audio = result.split(',')[1];
                        
                        // Whisper API'ye gönder
                        const formData = new FormData();
                        formData.append('file', audioBlob);
                        formData.append('model', 'whisper-1');
                        formData.append('language', 'tr');

                        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${OPENAI_API_KEY}`
                            },
                            body: formData
                        });

                        const transcription = await whisperResponse.json();

                        if (transcription.text) {
                            setTranscriptionText(transcription.text);
                            
                            // Gemini API'ye gönder
                            const geminiResponse = await fetch(
                                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        contents: [{
                                            parts: [{
                                                text: `You are an empathetic psychologist having a natural conversation. Your goal is to understand deeper by asking questions and providing guidance.

                                                Core Instructions:
                                                1. Always ask at least one follow-up question to understand better
                                                2. Keep a conversational and friendly tone in Turkish
                                                3. Show genuine interest in understanding the situation
                                                4. Provide brief emotional support before asking questions
                                                5. Keep responses under 4 sentences plus one question

                                                Response Structure:
                                                1. Brief empathy statement
                                                2. Validation of feelings
                                                3. One clear suggestion or observation
                                                4. Follow-up question to dig deeper

                                                Example Response:
                                                "Arkadaşlık ilişkilerinde yaşanan zorluklar gerçekten üzücü olabiliyor. Bu durumun seni nasıl etkilediğini anlıyorum. Öncelikle arkadaşınla aranızda tam olarak neler yaşandığını biraz daha detaylı anlatır mısın? Böylece sana daha iyi yardımcı olabilirim."

                                                Previous messages: ${conversationHistory.join(' | ')}
                                                Current message: ${transcription.text}`
                                            }]
                                        }]
                                    })
                                }
                            );

                            const response = await geminiResponse.json();
                            if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
                                const aiResponse = response.candidates[0].content.parts[0].text;
                                
                                // Konuşma geçmişini güncelle
                                setConversationHistory(prev => [
                                    ...prev, 
                                    `User: ${transcription.text}`,
                                    `Assistant: ${aiResponse}`
                                ].slice(-6) // Son 3 konuşmayı tut (her konuşma 2 mesaj içerir)
                                );

                                setTranscriptionText(prev => 
                                    `Sen: ${transcription.text}\n\nPsikolog: ${aiResponse}`
                                );
                                
                                await speakText(aiResponse);
                                displayResponseGradually(`Sen: ${transcription.text}\n\nPsikolog: ${aiResponse}`);
                                incrementRequestCount();
                            }
                        }
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };

                reader.onerror = () => {
                    reject(new Error('FileReader error'));
                };

                reader.readAsDataURL(audioBlob);
            });
        } catch (error) {
            console.error('İşlem hatası:', error);
            setAlertText('Bir hata oluştu, lütfen tekrar deneyin.');
        }
    };

    const startVoiceAnimation = () => {
        const circles = document.querySelectorAll('.voice-circle');
        circles.forEach(circle => {
            const randomScale = () => 0.8 + Math.random() * 0.5;
            (circle as HTMLElement).style.transform = `scale(${randomScale()})`;
        });

        animationIdRef.current = requestAnimationFrame(function animate() {
            circles.forEach(circle => {
                const randomScale = () => 0.8 + Math.random() * 0.5;
                (circle as HTMLElement).style.transform = `scale(${randomScale()})`;
            });
            animationIdRef.current = requestAnimationFrame(animate);
        });
    };

    const stopVoiceAnimation = () => {
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
            const circles = document.querySelectorAll('.voice-circle');
            circles.forEach(circle => {
                (circle as HTMLElement).style.transform = 'scale(1)';
            });
        }
    };

    // Metni parçalara bölen fonksiyon
    const splitTextIntoChunks = (text: string): string[] => {
        // Nokta veya soru işaretinden sonraki boşluklardan böl
        return text.split(/(?<=[.?!])\s+/);
    };

    // Konuşma bittiğinde sonraki parçayı oku
    const handleSpeechEnd = () => {
        if (textQueueRef.current.length > 0) {
            const nextChunk = textQueueRef.current.shift();
            if (nextChunk && speechSynthesisRef.current) {
                speechSynthesisRef.current.text = nextChunk;
                window.speechSynthesis.speak(speechSynthesisRef.current);
            } else {
                setIsSpeaking(false);
            }
        } else {
            setIsSpeaking(false);
        }
    };

    const handleSpeechError = (event: SpeechSynthesisErrorEvent) => {
        console.error('Konuşma hatası:', event);
        setIsSpeaking(false);
        textQueueRef.current = [];
    };

    // Metni sesli okuma fonksiyonu
    const speakText = (text: string) => {
        try {
            if (speechSynthesisRef.current) {
                // Önceki konuşmayı durdur
                window.speechSynthesis.cancel();
                textQueueRef.current = [];
                
                // Metni parçalara böl
                const chunks = splitTextIntoChunks(text);
                
                // İlk parçayı oku, diğerlerini kuyruğa al
                if (chunks.length > 0) {
                    const firstChunk = chunks.shift();
                    textQueueRef.current = chunks;
                    
                    if (firstChunk) {
                        speechSynthesisRef.current.text = firstChunk;
                        window.speechSynthesis.speak(speechSynthesisRef.current);
                        setIsSpeaking(true);
                    }
                }
            }
        } catch (error) {
            console.error('Ses sentezi hatası:', error);
            setIsSpeaking(false);
        }
    };

    // Konuşmayı kontrol etmek için butonlar
    const handleSpeechControl = () => {
        if (window.speechSynthesis.speaking) {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            } else {
                window.speechSynthesis.pause();
            }
        }
    };

    // Sesi durdurma fonksiyonu
    const stopSpeech = () => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            textQueueRef.current = [];
            setIsSpeaking(false);
        }
    };

    // Ses seviyesi analizi
    const analyzeMicrophoneAudio = (stream: MediaStream) => {
        const source = audioContextRef.current!.createMediaStreamSource(stream);
        source.connect(analyserRef.current!);
        
        const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount);
        
        const updateAudioLevel = () => {
            analyserRef.current!.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average);
            
            if (isRecording) {
                requestAnimationFrame(updateAudioLevel);
            }
        };
        
        updateAudioLevel();
    };

    // Yanıtı kademeli gösterme
    const displayResponseGradually = (response: string) => {
        setDisplayedResponse('');
        let index = 0;
        
        const showNextChar = () => {
            if (index < response.length) {
                setDisplayedResponse(prev => prev + response[index]);
                index++;
                setTimeout(showNextChar, 50); // Her karakter için 50ms bekle
            }
        };
        
        showNextChar();
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Header */}
                <Card className="bg-zinc-900 border-none">
                    <div className="flex flex-col items-center gap-2 p-6">
                        <h1 className="text-4xl md:text-5xl font-bold text-white">
                            Kendine Psikolog
                        </h1>
                        <p className="text-sm md:text-base text-gray-400">
                            Codewander
                        </p>
                    </div>
                </Card>

                {/* Enhanced Sound Animation */}
                <div className="flex justify-center items-center h-40 my-8">
                    <canvas id="soundVisualizer" width="300" height="100" />
                </div>

                {/* Mikrofon Butonu */}
                <Button
                    isIconOnly
                    radius="full"
                    size="lg"
                    disabled={isLoading}
                    className={`w-24 h-24 mx-auto  ${
                        isRecording 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-white hover:bg-gray-200'
                    } transition-all duration-300 flex items-center justify-center`}
                    onClick={handleRecordClick}
                >
                    <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} 
                        text-3xl ${isRecording ? 'text-white' : 'text-black'}`} 
                    />
                </Button>

                {/* Yükleme Mesajı */}
                {isLoading && (
                    <div className="flex flex-col items-center mt-4">
                        <p className="text-center text-gray-400">Cevap bekleniyor...</p>
                        <div className="loader mt-2" />
                    </div>
                )}

                {/* Transkripsiyon */}
                {displayedResponse && (
                    <Card className="mt-8 bg-zinc-900 border-none">
                        <div className="p-6">
                            <div className="flex justify-end gap-2 mb-4">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="flat"
                                    className="bg-zinc-800"
                                    onClick={handleSpeechControl}
                                    disabled={!isSpeaking}
                                >
                                    <i className="fas fa-volume-up text-white" />
                                </Button>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="flat"
                                    className="bg-zinc-800"
                                    onClick={stopSpeech}
                                >
                                    <i className="fas fa-stop text-white" />
                                </Button>
                            </div>
                            <p className="text-white whitespace-pre-wrap">
                                {displayedResponse}
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}