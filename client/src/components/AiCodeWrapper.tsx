import React, { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import * as Recharts from 'recharts';
import * as RF from '@xyflow/react';
import { motion } from 'framer-motion';
import Plot from 'react-plotly.js';
import Latex from 'react-latex-next';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import * as Babel from '@babel/standalone';
import 'katex/dist/katex.min.css';
import '@xyflow/react/dist/style.css';

import CustomReactFlow from './CustomReactFlow';
import PaperBackground from './PaperBackground';

// Helper to execute the code string (with JSX transpilation)
const executeCode = (code: string, scope: Record<string, any>) => {
    try {
        let cleanCode = code.trim();
        if (cleanCode.startsWith('export default')) {
            cleanCode = cleanCode.replace('export default', '').trim();
        }

        // Transpile JSX to JavaScript using Babel
        const transpiled = Babel.transform(cleanCode, {
            presets: ['react'],
            filename: 'component.jsx',
        }).code;

        if (!transpiled) {
            throw new Error('Babel transpilation returned empty code');
        }

        const scopeKeys = Object.keys(scope);
        const scopeValues = Object.values(scope);

        // The code is an arrow function or function expression
        const fn = new Function(...scopeKeys, `return ${transpiled}`);
        return fn(...scopeValues);
    } catch (e) {
        throw new Error(`Failed to parse code: ${e}`);
    }
};

const ErrorFallback = ({ error, resetErrorBoundary }: any) => {
    return (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <h3 className="font-bold mb-2">Something went wrong rendering this content:</h3>
            <pre className="text-xs overflow-auto bg-red-100 p-2 rounded mb-4">{error.message}</pre>
            <button
                onClick={resetErrorBoundary}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
                Try again
            </button>
        </div>
    );
};

// Modified ReactFlow with our custom wrapper
const ModifiedRF = { ...RF, ReactFlow: CustomReactFlow };

interface AiCodeWrapperProps {
    children: string; // The code string
}

const AiCodeWrapper: React.FC<AiCodeWrapperProps> = ({ children }) => {
    // Define the scope available to the AI code
    const scope = useMemo(() => ({
        React,
        Recharts,
        RF: ModifiedRF,
        motion,
        Plot,
        Latex,
        SyntaxHighlighter,
        dark,
        // Add other globals if needed
    }), []);

    const Component = useMemo(() => {
        if (!children) return null;
        try {
            return executeCode(children, scope);
        } catch (e) {
            console.error("Code execution error:", e);
            return () => <div className="text-red-500">Error parsing content code</div>;
        }
    }, [children, scope]);

    if (!Component) return null;

    return (
        <PaperBackground>
            <div className="w-full min-h-screen p-8 md:p-12 lg:p-16 max-w-5xl mx-auto">
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <Component />
                </ErrorBoundary>
            </div>
        </PaperBackground>
    );
};

export default AiCodeWrapper;
