import React from 'react';
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string | undefined) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ language, value, onChange }) => {
  // The parent container now controls the border and rounded corners
  return (
    <div className="h-full w-full"> 
      <Editor
        height="100%" // Make editor fill the container height
        width="100%" // Make editor fill the container width
        language={language} // Use language prop directly if Monaco supports it (js, java, cpp are common)
        value={value}
        theme="vs-dark"
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true, // Ensures editor resizes correctly
          tabSize: 2,
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;
