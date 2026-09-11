import { useEffect, useRef, useState } from 'react';
import { ExternalLink, FileUp, Database, CheckCircle2, Clock3, AlertTriangle } from 'lucide-react';
import { useNavigate } from '@/lib/router-compat';
import { apiGet } from '@/services/api';
import { ingestionService } from '@/services/ingestionService';
import type { IngestionFile } from '@/types';

type SourceAccess = 'PUBLIC' | 'ACCESS REQUIRED';
type DatasetSource = {
  name: string;
  publisher: string;
  url: string;
  license: string;
  access: SourceAccess;
  note: string;
};

const DATASET_SOURCES: DatasetSource[] = [
  {
    name: 'CIC-IDS2017',
    publisher: 'Canadian Institute for Cybersecurity',
    url: 'https://www.unb.ca/cic/datasets/ids-2017.html',
    license: 'Research use; see publisher terms',
    access: 'PUBLIC',
    note: 'Labeled network traffic and attack scenarios.',
  },
  {
    name: 'CSE-CIC-IDS2018',
    publisher: 'CIC / Communications Security Establishment',
    url: 'https://www.unb.ca/cic/datasets/ids-2018.html',
    license: 'Research use; see publisher terms',
    access: 'PUBLIC',
    note: 'Enterprise traffic captures with labeled scenarios.',
  },
  {
    name: 'UNSW-NB15',
    publisher: 'UNSW Canberra Cyber',
    url: 'https://research.unsw.edu.au/projects/unsw-nb15-dataset',
    license: 'Research use; see publisher terms',
    access: 'PUBLIC',
    note: 'Nine attack families with raw and processed records.',
  },
  {
    name: 'CTU-13',
    publisher: 'Stratosphere Laboratory, CTU University',
    url: 'https://www.stratosphereips.org/datasets-ctu13',
    license: 'Research use; see publisher terms',
    access: 'PUBLIC',
    note: 'Botnet traffic scenarios and ground truth.',
  },
  {
    name: 'CICIoT2023',
    publisher: 'Canadian Institute for Cybersecurity',
    url: 'https://www.unb.ca/cic/datasets/iotdataset-2023.html',
    license: 'Research use; see publisher terms',
    access: 'PUBLIC',
    note: 'IoT attack traffic across multiple device types.',
  },
  {
    name: 'LANL Authentication',
    publisher: 'Los Alamos National Laboratory',
    url: 'https://csr.lanl.gov/data/cyber1/',
    license: 'LANL data-use terms',
    access: 'ACCESS REQUIRED',
    note: 'Request authorization from the official publisher.',
  },
  {
    name: 'DARPA IDS',
    publisher: 'Defense Advanced Research Projects Agency',
    url: 'https://www.ll.mit.edu/r-d/datasets/1998-darpa-intrusion-detection-evaluation-data-set',
    license: 'Dataset terms apply',
    access: 'ACCESS REQUIRED',
    note: 'Access and redistribution are governed by the publisher.',
  },
];

export function DatasetsPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<IngestionFile[]>([]);
  const [imported, setImported] = useState<
    Array<{
      name: string;
      sourceFormat: string;
      createdAt: string;
      flowCount: number;
      stateCount: number;
    }>
  >([]);

  useEffect(() => {
    void apiGet<
      Array<{
        name: string;
        sourceFormat: string;
        createdAt: string;
        flowCount: number;
        stateCount: number;
      }>
    >('/api/datasets').then(setImported).catch(() => setImported([]));
  }, [files.length]);

  const importFile = async (file: File) => {
    await ingestionService.processFile(file, (update) => {
      setFiles((previous) => {
        const existing = previous.findIndex((item) => item.name === update.name);
        if (existing < 0) return [...previous, update];
        const next = [...previous];
        next[existing] = update;
        return next;
      });
    });
  };

  const importFolder = (selected: FileList | null) => {
    if (!selected) return;
    void (async () => {
      for (const file of Array.from(selected)) {
        if (file.name.toLowerCase().endsWith('.csv')) await importFile(file);
      }
    })();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-screen-xl mx-auto">
      <header>
        <p className="text-[10px] uppercase tracking-widest text-blue-400 mb-2">Data governance</p>
        <h1 className="text-xl font-semibold">Datasets</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Verified public sources and organization-owned network captures.
        </p>
      </header>
      <section className="border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-medium flex items-center gap-2">
              <FileUp className="size-4 text-blue-400" /> Import a network capture
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Upload PCAP, NetFlow, IPFIX or CSV. Large CSV files are split into safe, newline-aligned
              chunks before processing.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
            >
              Choose file
            </button>
            <button
              onClick={() => folderInputRef.current?.click()}
              className="px-4 py-2 border border-[var(--border)] hover:border-blue-500/50 text-xs font-medium"
            >
              Choose dataset folder
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pcap,.pcapng,.csv,.json,.ndjson,.ipfix"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importFile(file);
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          className="hidden"
          accept=".csv"
          multiple
          onChange={(event) => importFolder(event.target.files)}
          {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
        />
        {files.length > 0 && (
          <div className="mt-5 space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs"
              >
                <span>{file.name}</span>
                <span className="flex items-center gap-2 text-[var(--muted-foreground)]">
                  {file.status === 'ready' ? (
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                  ) : file.status === 'error' ? (
                    <AlertTriangle className="size-3.5 text-red-400" />
                  ) : (
                    <Clock3 className="size-3.5 text-amber-400" />
                  )}
                  {file.status} {file.status !== 'error' && `${file.progress}%`}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Database className="size-4 text-blue-400" />
          <h2 className="font-medium">Official dataset sources</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {DATASET_SOURCES.map((source) => (
            <article
              key={source.name}
              className="border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{source.name}</h3>
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                    {source.publisher}
                  </p>
                </div>
                <span
                  className={`text-[9px] tracking-wider px-2 py-1 border ${source.access === 'PUBLIC' ? 'text-emerald-400 border-emerald-400/30' : 'text-amber-400 border-amber-400/30'}`}
                >
                  {source.access}
                </span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-3 leading-relaxed">
                {source.note}
              </p>
              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--border)]">
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  License: {source.license}
                </span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                  title={`Open ${source.name} source`}
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
      {imported.length > 0 && (
        <section>
          <h2 className="font-medium mb-3">Imported datasets</h2>
          <div className="border border-[var(--border)] bg-[var(--card)] divide-y divide-[var(--border)]">
            {imported.map((dataset) => (
              <button
                key={`${dataset.name}-${dataset.createdAt}`}
                onClick={() => navigate('/dashboard')}
                className="w-full text-left p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-[var(--secondary)]"
              >
                <span>
                  <span className="block text-sm font-medium">{dataset.name}</span>
                  <span className="block text-[10px] text-[var(--muted-foreground)]">
                    {dataset.sourceFormat.toUpperCase()} · imported{' '}
                    {new Date(dataset.createdAt).toLocaleString()}
                  </span>
                </span>
                <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                  {dataset.flowCount.toLocaleString()} flows · {dataset.stateCount.toLocaleString()}{' '}
                  states
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
      <section className="border-t border-[var(--border)] pt-6">
        <p className="text-[10px] uppercase tracking-widest text-blue-400 mb-2">
          Threat intelligence
        </p>
        <h2 className="font-medium">Official intelligence references</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 mt-3">
          {[
            ['MITRE ATT&CK', 'https://attack.mitre.org/'],
            ['CAPEC', 'https://capec.mitre.org/'],
            ['CVE / NVD', 'https://nvd.nist.gov/'],
            ['NCIIPC', 'https://nciipc.gov.in/'],
          ].map(([name, url]) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="border border-[var(--border)] bg-[var(--card)] p-3 flex items-center justify-between text-xs hover:border-blue-500/50"
            >
              <span>{name}</span>
              <ExternalLink className="size-3 text-blue-400" />
            </a>
          ))}
        </div>
        <p className="text-[11px] text-[var(--muted-foreground)] mt-3">
          NCIIPC assistance: helpdesk1@nciipc.gov.in. External intelligence is linked to its
          official publisher and is never inferred as confirmed incident evidence.
        </p>
      </section>
    </div>
  );
}
