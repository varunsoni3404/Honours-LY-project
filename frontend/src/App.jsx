import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';

function App() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const graphWrapperRef = useRef(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 600, height: 500 });

  // Resize graph dynamically to fit the container
  useEffect(() => {
    if (graphWrapperRef.current) {
      setGraphDimensions({
        width: graphWrapperRef.current.offsetWidth,
        height: graphWrapperRef.current.offsetHeight
      });
    }
  }, [result]);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      alert("Please enter some text first.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/analyze', { text: inputText });
      setResult(response.data);
    } catch (error) {
      console.error("Error analyzing:", error);
      alert("Failed to analyze text. Is the backend running?");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* --- HEADER --- */}
      <header className="bg-linear-to-r from-indigo-700 to-purple-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">FactGraph</h1>
              <p className="text-indigo-200 text-xs tracking-wider uppercase">AI Summarizer & Knowledge Verification</p>
            </div>
          </div>
          <div className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full border border-white/20">
            Final Year Project
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT COLUMN: INPUT & SUMMARY (5 Columns) --- */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* INPUT CARD */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h2 className="font-semibold text-slate-700">Source Text</h2>
              </div>
              <div className="p-4">
                <textarea 
                  rows="8"
                  className="w-full p-3 text-sm text-slate-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none bg-slate-50 focus:bg-white"
                  placeholder="Paste your news article or document here (max 5000 chars)..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button 
                  onClick={handleAnalyze}
                  disabled={loading}
                  className={`mt-4 w-full py-3 px-4 rounded-lg text-white font-semibold shadow-md transition-all flex justify-center items-center gap-2
                    ${loading 
                      ? "bg-slate-400 cursor-not-allowed" 
                      : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                    }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Running ML Models...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Summarize & Verify
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* RESULTS CARD */}
            {result && (
              <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden animate-fade-in-up">
                 <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-700">Verified Summary</h2>
                    <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Model: DistilBART + NLI</span>
                  </div>
                <div className="p-5 text-sm leading-relaxed text-slate-700">
                  {result.summary.map((sent, idx) => {
                    // Dynamic Styling based on Status
                    let bgClass = "bg-transparent";
                    let textClass = "text-slate-700";
                    let tooltip = `Confidence: ${(sent.confidence * 100).toFixed(1)}%`;

                    if (sent.status === 'Hallucination Risk') {
                      bgClass = "bg-red-50 border-b-2 border-red-400";
                      textClass = "text-red-900 font-medium";
                      tooltip = "⚠️ Potential Hallucination Detected";
                    } else if (sent.status === 'Verified') {
                        // Optional: Subtle green highlight for verified facts
                        bgClass = "hover:bg-green-50 transition-colors";
                    }

                    return (
                      <span 
                        key={idx} 
                        className={`${bgClass} ${textClass} px-0.5 py-0.5 rounded cursor-help transition-colors mr-1 inline-block`}
                        title={tooltip}
                      >
                        {sent.text}
                      </span>
                    );
                  })}
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-100 border-b-2 border-red-400"></div>
                      <span>Hallucination Risk</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-slate-100"></div>
                      <span>Verified Text</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* --- RIGHT COLUMN: KNOWLEDGE GRAPH (7 Columns) --- */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden h-full flex flex-col" style={{ minHeight: '600px' }}>
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                <h2 className="font-semibold text-slate-700">Entity Knowledge Graph</h2>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">People</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">Orgs</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">Locations</span>
                </div>
              </div>
              
              <div className="grow relative bg-slate-900" ref={graphWrapperRef}>
                {result && result.graph_data ? (
                  <ForceGraph2D
                    width={graphDimensions.width}
                    height={graphDimensions.height}
                    graphData={result.graph_data}
                    nodeAutoColorBy="group"
                    nodeLabel="id"
                    linkDirectionalParticles={2}
                    linkDirectionalParticleSpeed={d => 0.005}
                    backgroundColor="#0f172a" // Matches slate-900
                    nodeRelSize={6}
                    linkColor={() => "rgba(255,255,255,0.2)"}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-slate-500">
                    
                    <svg className="w-16 h-16 mb-4 opacity-20" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg>
                    <p className="font-medium">Waiting for analysis...</p>
                    <p className="text-sm opacity-75">Upload text to generate the Knowledge Graph</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;