import React, { useState, useEffect, useRef, useCallback } from 'react';
import CodeEditor from '../components/CodeEditor';
import { Play, Download, Copy, Trash, Loader2 } from 'lucide-react';
// @ts-ignore // Ignore TypeScript errors for JS imports until types are added
import { API } from '../cSupport/utils.js'; 
// @ts-ignore
import { getApiOptions } from '../cSupport/cSupport.js';

interface LanguageTemplate {
  defaultCode: string;
  fileExtension: string;
}

const languageTemplates: Record<string, LanguageTemplate> = {
  javascript: {
    defaultCode: `// Welcome to JavaScript Playground!

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("First 5 Fibonacci numbers:");
for (let i = 0; i < 5; i++) {
  console.log(fibonacci(i));
}`,
    fileExtension: 'js'
  },
  java: {
    defaultCode: `// Welcome to Java Playground!

public class Main {
    public static void main(String[] args) {
        System.out.println("First 5 Fibonacci numbers:");
        for (int i = 0; i < 5; i++) {
            System.out.println(fibonacci(i));
        }
    }
    
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}`,
    fileExtension: 'java'
  },
  cpp: {
    defaultCode: `// Welcome to C++ Playground!
#include <iostream>
#include <vector>
#include <string>

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    std::cout << "--- C++ Execution via Wasm ---" << std::endl;
    std::cout << "First 5 Fibonacci numbers:" << std::endl;
    for (int i = 0; i < 5; i++) {
        std::cout << "Fib(" << i << ") = " << fibonacci(i) << std::endl;
    }
    std::cout << "------------------------------" << std::endl;
    return 0;
}`,
    fileExtension: 'cpp'
  }
};

const CodePlayground = () => {
  const [language, setLanguage] = useState<string>('javascript');
  const [code, setCode] = useState(languageTemplates[language].defaultCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isWasmReady, setIsWasmReady] = useState(false);
  const [wasmError, setWasmError] = useState<string | null>(null);

  const cppApi = useRef<any>(null); // Using 'any' type for the imported JS class
  const outputBufferRef = useRef<string>(''); // Buffer for Wasm output

  // Callback for Wasm's hostWrite
  const handleWasmOutput = useCallback((str: string) => {
    outputBufferRef.current += str + '\n'; // Append output
  }, []);

  // Initialize Wasm API
  useEffect(() => {
    let isActive = true; // Prevent state updates on unmounted component
    console.log("Attempting to initialize Wasm API...");
    setWasmError(null);
    setIsWasmReady(false);

    async function initializeWasm() {
      try {
        const apiOptions = getApiOptions(handleWasmOutput);
        // Ensure necessary Wasm files are specified if not hardcoded in utils.js
        // Example: apiOptions.clang = '/clang'; apiOptions.lld = '/lld'; apiOptions.sysroot = '/sysroot.tar';
        
        cppApi.current = new API(apiOptions);
        await cppApi.current.ready; // Wait for async loading in constructor/init method

        if (isActive) {
          console.log("Wasm API Initialized successfully.");
          setIsWasmReady(true);
        }
      } catch (error: any) {
        console.error("Failed to initialize Wasm API:", error);
        if (isActive) {
          setWasmError(`Failed to initialize C++/Wasm environment: ${error.message}. Ensure clang, lld, and sysroot.tar are in the /public directory.`);
          setIsWasmReady(false); // Explicitly set to false on error
        }
      }
    }

    initializeWasm();

    return () => {
      isActive = false; // Cleanup function to prevent updates after unmount
      console.log("CodePlayground unmounting, Wasm cleanup (if any) would go here.");
      // Add cleanup logic if the API class provides it (e.g., cppApi.current?.terminate?.())
    };
  }, [handleWasmOutput]); // Re-run if the output handler changes (though it shouldn't here)

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(languageTemplates[newLanguage].defaultCode);
    setOutput(''); // Clear output on language change
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput(''); // Clear previous output
    outputBufferRef.current = ''; // Clear Wasm output buffer

    if (language === 'javascript') {
      const originalConsoleLog = console.log;
      let jsOutput = 'Executing JavaScript...\n\n';
      console.log = (...args) => {
        const line = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        jsOutput += line + '\n';
      };
      try {
        eval(code);
        setOutput(jsOutput);
      } catch (error: any) {
        setOutput(`JavaScript Error: ${error.message}`);
      } finally {
        console.log = originalConsoleLog;
      }
    } else if (language === 'cpp') {
      if (!isWasmReady) {
        setOutput(`C++ Wasm environment is not ready. ${wasmError || 'Check console for errors.'}`);
        setIsRunning(false);
        return;
      }
      if (!cppApi.current) {
         setOutput("C++ Wasm API not initialized.");
         setIsRunning(false);
         return;
      }
      
      setOutput("Compiling and running C++ via Wasm...\n"); // Initial message
      try {
        // Assuming compileLinkRun handles everything and output is captured by hostWrite
        await cppApi.current.compileLinkRun(code); 
        // Update state *after* async operation completes
        setOutput(prev => prev + outputBufferRef.current); 
      } catch (error: any) {
        console.error("Wasm C++ Execution Error:", error);
        setOutput(prev => prev + `\n--- C++ Execution Error ---\n${error.message}\n--------------------------`);
      }
    } else if (language === 'java') {
      setOutput(
        `--- In-Browser Execution Limitation ---\n\n` +
        `Executing Java code directly in a web browser requires a Java Virtual Machine compiled to WebAssembly (like CheerpJ) or server-side execution.\n\n` +
        `Standard Approach (Server-Side):\n` +
        `1. Send code to a secure backend server.\n` +
        `2. Compile & execute in a sandboxed environment.\n` +
        `3. Return the output to the browser.\n\n` +
        `This demo does not currently implement Java execution.`
      );
    }
    
    setIsRunning(false);
  };

  const clearCode = () => {
    setCode(languageTemplates[language].defaultCode);
    setOutput('');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playground-code.${languageTemplates[language].fileExtension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isRunDisabled = isRunning || (language === 'cpp' && !isWasmReady);

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Code Editor Section */}
      <div className="flex-1 p-6 flex flex-col">
        <div className="mb-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Code Playground</h1>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
             {language === 'cpp' && !isWasmReady && !wasmError && (
               <span className="flex items-center text-sm text-gray-500">
                 <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Initializing C++ Environment...
               </span>
             )}
             {wasmError && (
                <span className="text-sm text-red-600" title={wasmError}>Wasm Init Failed</span>
             )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={clearCode}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded"
              title="Clear code"
            >
              <Trash className="h-5 w-5" />
            </button>
            <button
              onClick={copyCode}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded"
              title="Copy code"
            >
              <Copy className="h-5 w-5" />
            </button>
            <button
              onClick={downloadCode}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded"
              title="Download code"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={runCode}
              disabled={isRunDisabled}
              className={`flex items-center px-4 py-2 text-white rounded ${
                isRunDisabled 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Code
            </button>
          </div>
        </div>
        {/* Editor takes remaining space */}
        <div className="flex-grow border border-gray-200 rounded-lg overflow-hidden"> 
          <CodeEditor
            language={language}
            value={code}
            onChange={(value) => setCode(value || '')}
          />
        </div>
      </div>

      {/* Output Section */}
      <div className="w-96 bg-gray-900 text-white p-6 flex flex-col">
        <h2 className="text-lg font-semibold mb-4 flex-shrink-0">Output</h2>
        <div className="font-mono text-sm whitespace-pre-wrap flex-grow overflow-auto">
          {output || (isRunning ? 'Running...' : 'Run your code to see the output here...')}
        </div>
      </div>
    </div>
  );
};

export default CodePlayground;
