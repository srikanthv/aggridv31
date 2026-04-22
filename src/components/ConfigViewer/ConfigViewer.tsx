import React from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { ColumnSchema, GridConfig } from '../../types';

interface ConfigViewerProps {
  gridId: string;
  schema: ColumnSchema[];
  configOverrides?: GridConfig;
  defaultConfig: Required<GridConfig>;
}

export default function ConfigViewer({
  gridId,
  schema,
  configOverrides = {},
  defaultConfig
}: ConfigViewerProps) {
  const [copied, setCopied] = React.useState(false);

  const finalConfig = {
    ...defaultConfig,
    ...configOverrides
  };

  const copyToClipboard = () => {
    const fullJson = JSON.stringify({ gridId, schema, configOverrides, resolvedConfig: finalConfig }, null, 2);
    navigator.clipboard.writeText(fullJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Section = ({ title, data }: { title: string; data: any }) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</h4>
      </div>
      <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800 shadow-inner max-h-64 scrollbar-thin scrollbar-thumb-slate-700">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden border-l border-slate-800 shadow-2xl">
      <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <Terminal size={18} className="text-emerald-500" />
          <div>
            <h3 className="text-sm font-bold tracking-tight uppercase">Registry Inspector</h3>
            <p className="text-[9px] text-slate-500 font-mono tracking-tighter">CONFIG_SOURCE: {gridId.toUpperCase()}</p>
          </div>
        </div>
        <button 
          onClick={copyToClipboard}
          className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-emerald-400"
          title="Copy full JSON"
        >
          {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
        <div className="mb-8 flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
          <div className="flex-1">
            <span className="text-[10px] font-bold text-emerald-500 uppercase block mb-1">Instance ID</span>
            <code className="text-sm font-mono font-bold">{gridId}</code>
          </div>
        </div>

        <Section title="Column Schema Mapping" data={schema} />
        <Section title="Configuration Overrides" data={configOverrides} />
        <Section title="Resolved Engine Features" data={finalConfig} />

        <div className="mt-10 p-4 rounded-lg border border-slate-800 bg-slate-900/30 text-[10px] text-slate-500 italic leading-relaxed">
          * This panel displays the dynamic registry definitions passed to the ReusableGrid component. 
          Changes in gridConfigs.tsx are reflected here in real-time.
        </div>
      </div>
    </div>
  );
}
