import React, { useState, useEffect } from 'react';

interface PreviewModalProps {
    url: string;
    onClose: () => void;
}

type ViewMode = 'interactive' | 'screenshot';

const PreviewModal: React.FC<PreviewModalProps> = ({ url, onClose }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('interactive');
    const [isIframeLoading, setIsIframeLoading] = useState(true);
    const [isScreenshotLoading, setIsScreenshotLoading] = useState(false);
    const [screenshotError, setScreenshotError] = useState<string | null>(null);

    const screenshotServiceUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=1280&h=960`;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        if (viewMode === 'interactive') {
            setIsIframeLoading(true);
        } else {
            setIsScreenshotLoading(true);
            setScreenshotError(null);
        }
    }, [viewMode, url]);

    const handleScreenshotLoad = () => {
        setIsScreenshotLoading(false);
        setScreenshotError(null);
    };

    const handleScreenshotError = () => {
        setIsScreenshotLoading(false);
        setScreenshotError('Could not load screenshot for this URL.');
    };

    const ViewModeButton: React.FC<{ mode: ViewMode; children: React.ReactNode }> = ({ mode, children }) => (
        <button
            onClick={() => setViewMode(mode)}
            disabled={viewMode === mode}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${
                viewMode === mode
                ? 'bg-indigo-600 text-white cursor-default'
                : 'bg-gray-600 text-slate-200 hover:bg-gray-500'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
            aria-labelledby="preview-modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden ring-1 ring-white/10"
                onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-4 truncate">
                        <h2 id="preview-modal-title" className="text-lg font-semibold text-slate-100 truncate hidden sm:block">
                           Preview
                        </h2>
                        <span className="text-indigo-400 font-normal truncate">{url}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 p-1 bg-gray-700/50 rounded-lg">
                            <ViewModeButton mode="interactive">Interactive</ViewModeButton>
                            <ViewModeButton mode="screenshot">Screenshot</ViewModeButton>
                        </div>
                        <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-sky-500 transition hidden sm:block"
                        >
                            Open in New Tab
                        </a>
                        <button 
                            onClick={onClose}
                            className="p-1 rounded-full text-slate-400 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            aria-label="Close preview"
                        >
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </header>

                <div className="bg-gray-900 flex-grow flex flex-col">
                    {viewMode === 'interactive' && (
                        <div className="relative flex-grow flex flex-col">
                             <div className="p-2 bg-yellow-900/50 text-yellow-200 text-xs text-center flex-shrink-0 border-b border-yellow-800/50">
                                <p><strong>Note:</strong> Some websites may not load due to security policies. Try the "Screenshot" view or "Open in New Tab".</p>
                            </div>
                            <div className="relative flex-grow">
                                {isIframeLoading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-gray-900 z-20">
                                        <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Loading interactive preview...</span>
                                    </div>
                                )}
                                <iframe
                                    src={url}
                                    title={`Interactive preview of ${url}`}
                                    className="w-full h-full border-0"
                                    sandbox="allow-scripts allow-forms allow-same-origin"
                                    onLoad={() => setIsIframeLoading(false)}
                                ></iframe>
                            </div>
                        </div>
                    )}
                    {viewMode === 'screenshot' && (
                        <div className="relative flex-grow flex items-center justify-center p-4">
                            {(isScreenshotLoading || screenshotError) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-gray-900 z-20">
                                    {isScreenshotLoading ? (
                                        <>
                                            <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Generating screenshot...</span>
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <p className="font-semibold text-red-400">Error</p>
                                            <p>{screenshotError}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                             <img
                                src={screenshotServiceUrl}
                                alt={`Screenshot of ${url}`}
                                className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isScreenshotLoading || screenshotError ? 'opacity-0' : 'opacity-100'}`}
                                onLoad={handleScreenshotLoad}
                                onError={handleScreenshotError}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreviewModal;