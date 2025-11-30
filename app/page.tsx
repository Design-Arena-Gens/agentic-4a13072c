'use client';

import { useState, useEffect } from 'react';

type ModelType = 'sentiment' | 'summarization' | 'question-answering' | 'translation' | 'text-generation';

interface ModelStatus {
  loaded: boolean;
  loading: boolean;
  error: string | null;
  progress: number;
}

export default function Home() {
  const [modelType, setModelType] = useState<ModelType>('sentiment');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus>({
    loaded: false,
    loading: false,
    error: null,
    progress: 0,
  });

  const [pipeline, setPipeline] = useState<any>(null);

  useEffect(() => {
    loadModel();
  }, [modelType]);

  const loadModel = async () => {
    setModelStatus({ loaded: false, loading: true, error: null, progress: 0 });
    setOutput('');

    try {
      const { pipeline: transformersPipeline } = await import('@xenova/transformers');

      const modelMap: Record<ModelType, { task: any; model: string }> = {
        'sentiment': { task: 'sentiment-analysis', model: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english' },
        'summarization': { task: 'summarization', model: 'Xenova/distilbart-cnn-6-6' },
        'question-answering': { task: 'question-answering', model: 'Xenova/distilbert-base-cased-distilled-squad' },
        'translation': { task: 'translation', model: 'Xenova/t5-small' },
        'text-generation': { task: 'text-generation', model: 'Xenova/gpt2' },
      };

      const { task, model } = modelMap[modelType];

      const pipe = await (transformersPipeline as any)(task, model, {
        progress_callback: (progress: any) => {
          if (progress.status === 'progress') {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setModelStatus(prev => ({ ...prev, progress: percent }));
          }
        },
      });

      setPipeline(() => pipe);
      setModelStatus({ loaded: true, loading: false, error: null, progress: 100 });
    } catch (error: any) {
      setModelStatus({ loaded: false, loading: false, error: error.message, progress: 0 });
      console.error('Model loading error:', error);
    }
  };

  const runModel = async () => {
    if (!pipeline || !input.trim()) return;

    setProcessing(true);
    setOutput('');

    try {
      let result;

      switch (modelType) {
        case 'sentiment':
          result = await pipeline(input);
          setOutput(`Sentiment: ${result[0].label}\nConfidence: ${(result[0].score * 100).toFixed(2)}%`);
          break;

        case 'summarization':
          result = await pipeline(input, { max_length: 100, min_length: 30 });
          setOutput(result[0].summary_text);
          break;

        case 'question-answering':
          const parts = input.split('\n---\n');
          if (parts.length !== 2) {
            setOutput('Please format as: Question\n---\nContext');
            break;
          }
          result = await pipeline({ question: parts[0].trim(), context: parts[1].trim() });
          setOutput(`Answer: ${result.answer}\nConfidence: ${(result.score * 100).toFixed(2)}%`);
          break;

        case 'translation':
          result = await pipeline(input, { src_lang: 'eng_Latn', tgt_lang: 'fra_Latn' });
          setOutput(result[0].translation_text);
          break;

        case 'text-generation':
          result = await pipeline(input, { max_new_tokens: 50, temperature: 0.9 });
          setOutput(result[0].generated_text);
          break;
      }
    } catch (error: any) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getPlaceholder = () => {
    switch (modelType) {
      case 'sentiment':
        return 'Enter text to analyze sentiment... (e.g., "I love this product!")';
      case 'summarization':
        return 'Enter a long text to summarize...';
      case 'question-answering':
        return 'Enter question and context separated by ---\n\nExample:\nWhat is AI?\n---\nArtificial Intelligence (AI) is the simulation of human intelligence processes by machines...';
      case 'translation':
        return 'Enter English text to translate to French...';
      case 'text-generation':
        return 'Enter a prompt to continue... (e.g., "Once upon a time")';
      default:
        return 'Enter text...';
    }
  };

  return (
    <div className="container">
      <h1>🤖 Browser AI Model</h1>
      <p className="subtitle">Fully functional AI running in your browser - No API required!</p>

      <div className="model-selector">
        <label htmlFor="model">Select AI Model:</label>
        <select
          id="model"
          value={modelType}
          onChange={(e) => setModelType(e.target.value as ModelType)}
          disabled={modelStatus.loading || processing}
        >
          <option value="sentiment">Sentiment Analysis</option>
          <option value="summarization">Text Summarization</option>
          <option value="question-answering">Question Answering</option>
          <option value="translation">Translation (EN → FR)</option>
          <option value="text-generation">Text Generation</option>
        </select>
      </div>

      {modelStatus.loading && (
        <div className="status loading">
          Loading model... {modelStatus.progress}%
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${modelStatus.progress}%` }}></div>
          </div>
        </div>
      )}

      {modelStatus.loaded && (
        <div className="status ready">✓ Model loaded and ready!</div>
      )}

      {modelStatus.error && (
        <div className="status error">Error: {modelStatus.error}</div>
      )}

      <div className="input-section">
        <label htmlFor="input">Input:</label>
        <textarea
          id="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={getPlaceholder()}
          disabled={!modelStatus.loaded || processing}
        />
      </div>

      <button
        onClick={runModel}
        disabled={!modelStatus.loaded || processing || !input.trim()}
      >
        {processing ? 'Processing...' : 'Run AI Model'}
      </button>

      {output && (
        <div className="output-section">
          <h2>Output:</h2>
          <div className="output">{output}</div>
        </div>
      )}

      <div className="features">
        <div className="feature">
          <div className="feature-icon">🚀</div>
          <div className="feature-title">Fast</div>
          <div className="feature-desc">Runs locally in browser</div>
        </div>
        <div className="feature">
          <div className="feature-icon">🔒</div>
          <div className="feature-title">Private</div>
          <div className="feature-desc">No data sent to servers</div>
        </div>
        <div className="feature">
          <div className="feature-icon">🌐</div>
          <div className="feature-title">Offline</div>
          <div className="feature-desc">Works without internet</div>
        </div>
        <div className="feature">
          <div className="feature-icon">🆓</div>
          <div className="feature-title">Free</div>
          <div className="feature-desc">No API costs</div>
        </div>
      </div>
    </div>
  );
}
