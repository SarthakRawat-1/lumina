import React from 'react';

interface PaperBackgroundProps {
    children: React.ReactNode;
}

const PaperBackground: React.FC<PaperBackgroundProps> = ({ children }) => {
    return (
        <div className="min-h-screen w-full bg-[#fdfdfd] bg-opacity-90 bg-[linear-gradient(#f9f9f9_1px,transparent_1px),linear-gradient(90deg,#f9f9f9_1px,transparent_1px)] bg-[size:20px_20px] text-gray-800">
            {children}
        </div>
    );
};

export default PaperBackground;
