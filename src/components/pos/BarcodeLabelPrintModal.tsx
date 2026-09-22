import { useEffect, useMemo, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { motion } from 'framer-motion';
import { X, Printer, Minus, Plus, Tag } from 'lucide-react';

interface ProductForLabel {
  id: number;
  name: string;
  price: number;
  barcode: string;
  stockQuantity?: number;
  image?: string;
}

interface BarcodeLabelPrintModalProps {
  product: ProductForLabel;
  onClose: () => void;
}

const LABEL_PRESETS = [
  { id: '2x1',  name: '2×1" (Small Retail)',   cols: 4, w: '51mm', h: '25mm',  fontSize: 10 },
  { id: '3x1',  name: '3×1" (Standard Price)', cols: 3, w: '76mm', h: '28mm',  fontSize: 11 },
  { id: '4x2',  name: '4×2" (Shelf Tag)',      cols: 2, w: '102mm', h: '50mm', fontSize: 13 },
  { id: 'shelf',name: 'Shelf Talker A7',       cols: 2, w: '74mm', h: '105mm', fontSize: 14 },
];

const BarcodeLabelPrintModal = ({ product, onClose }: BarcodeLabelPrintModalProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(Math.max(1, product.stockQuantity || 1));
  const [presetId, setPresetId] = useState('3x1');
  const [showPrice, setShowPrice] = useState(true);
  const [showName, setShowName] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);

  const preset = useMemo(() => LABEL_PRESETS.find(p => p.id === presetId)!, [presetId]);
  const safeBarcode = product.barcode && product.barcode.length >= 6
    ? product.barcode
    : product.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 10) || String(product.id).padStart(10, '0');

  // Auto-render barcode into all SVG placeholders every time preset/copies change
  useEffect(() => {
    const timers: number[] = [];
    // Run on next tick so DOM is ready
    const t = window.setTimeout(() => {
      const svgs = document.querySelectorAll<SVGSVGElement>(`[data-barcode-svg="${product.id}"]`);
      svgs.forEach((svg, i) => {
        try {
          JsBarcode(svg, safeBarcode, {
            format: 'CODE128',
            width: 1.4,
            height: preset.id === 'shelf' ? 50 : 32,
            displayValue: true,
            fontSize: preset.id === 'shelf' ? 14 : 10,
            margin: 2,
            textMargin: 1,
            background: '#ffffff',
            lineColor: '#000000',
          });
        } catch (e) {
          // fallback numeric if svg error
        }
      });
    }, 30);
    timers.push(t);
    return () => { timers.forEach(clearTimeout); };
  }, [safeBarcode, copies, preset, product.id]);

  const handlePrint = () => {
    if (!sheetRef.current) return;
    const html = sheetRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Barcode Labels — ${product.name}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            @page { size: A4; margin: 8mm; }
            html, body { background: #fff; font-family: Arial, sans-serif; }
            body { padding: 6mm 4mm; }
            .sheet {
              display: grid;
              grid-template-columns: repeat(${preset.cols}, 1fr);
              gap: 3mm;
            }
            .label {
              border: 1px dashed #bbb;
              padding: 2mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 100%;
              min-height: ${preset.h};
              page-break-inside: avoid;
              overflow: hidden;
            }
            .emoji { font-size: ${Math.round(preset.fontSize * 1.8)}px; margin-right: 4px; }
            .name  { font-size: ${preset.fontSize}px; font-weight: 700; text-align: center; margin-top: 2px; }
            .price { font-size: ${Math.round(preset.fontSize * 1.4)}px; font-weight: 900; color: #b91c1c; margin-top: 2px; }
            svg   { display: block; margin-top: 2px; max-width: 100%; height: auto; }
            @media print {
              body { padding: 0; }
              .label { border: none; }
            }
          </style>
        </head>
        <body>
          ${html}
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 400); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-2xl shadow-float w-full max-w-4xl mx-4 max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Print Barcode / Price Labels</h3>
              <p className="text-xs text-muted-foreground">
                {product.image && <span className="mr-1">{product.image}</span>}
                <strong>{product.name}</strong> • Rs {product.price} • Barcode: <span className="font-mono">{safeBarcode}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-5 border-b bg-muted/20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-muted-foreground mb-1.5 font-semibold uppercase">Label Size</label>
            <select
              value={presetId}
              onChange={e => setPresetId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border bg-card text-sm font-medium"
            >
              {LABEL_PRESETS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-muted-foreground mb-1.5 font-semibold uppercase">
              Number of Copies
              <span className="ml-2 text-primary font-bold text-base">{copies}</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCopies(c => Math.max(1, c - 1))}
                className="h-10 w-10 rounded-xl border bg-card flex items-center justify-center hover:bg-muted"
              ><Minus className="w-3.5 h-3.5" /></button>
              <input
                type="number"
                value={copies}
                onChange={e => setCopies(Math.max(1, Math.min(9999, Number(e.target.value) || 1)))}
                className="h-10 flex-1 rounded-xl border bg-card px-3 text-center font-bold"
              />
              <button
                onClick={() => setCopies(c => c + 1)}
                className="h-10 w-10 rounded-xl border bg-card flex items-center justify-center hover:bg-muted"
              ><Plus className="w-3.5 h-3.5" /></button>
            </div>
            <button
              onClick={() => setCopies(Math.max(1, product.stockQuantity || 1))}
              className="mt-1.5 text-[10px] font-semibold text-primary underline hover:opacity-70"
            >
              Use stock quantity ({product.stockQuantity ?? 1})
            </button>
          </div>

          <div className="flex flex-col justify-around">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showName}  onChange={e => setShowName(e.target.checked)} className="h-4 w-4" />
              <span className="font-semibold text-sm">Show Product Name</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showPrice} onChange={e => setShowPrice(e.target.checked)} className="h-4 w-4" />
              <span className="font-semibold text-sm">Show Price</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showEmoji} onChange={e => setShowEmoji(e.target.checked)} className="h-4 w-4" />
              <span className="font-semibold text-sm">Show Emoji</span>
            </label>
          </div>

          <div className="flex items-end">
            <button
              onClick={handlePrint}
              className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Printer className="w-4 h-4" /> Print {copies} Label{copies > 1 ? 's' : ''}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="p-5 overflow-y-auto pos-scrollbar flex-1">
          <p className="text-xs text-muted-foreground font-semibold uppercase mb-3">Live Preview (A4 Sheet)</p>
          <div
            ref={sheetRef}
            className="sheet"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${preset.cols}, 1fr)`,
              gap: '8px',
            }}
          >
            {Array.from({ length: Math.min(copies, 120) }).map((_, i) => (
              <div
                key={i}
                className="label"
                style={{
                  border: '1px dashed #d1d5db',
                  borderRadius: 8,
                  padding: 8,
                  background: '#fff',
                  minHeight: preset.h,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pageBreakInside: 'avoid',
                }}
              >
                {showName && (
                  <div className="name" style={{
                    fontSize: preset.fontSize,
                    fontWeight: 700,
                    textAlign: 'center',
                    lineHeight: 1.1,
                  }}>
                    {showEmoji && product.image && <span style={{ fontSize: preset.fontSize * 1.6 }}>{product.image} </span>}
                    {product.name}
                  </div>
                )}
                <svg data-barcode-svg={product.id} />
                {showPrice && (
                  <div className="price" style={{
                    fontSize: preset.fontSize * 1.4,
                    fontWeight: 900,
                    color: '#b91c1c',
                    marginTop: 2,
                    whiteSpace: 'nowrap',
                  }}>
                    Rs {product.price}
                  </div>
                )}
              </div>
            ))}
          </div>
          {copies > 120 && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              Preview shows first 120 labels only — print will generate all {copies} copies.
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BarcodeLabelPrintModal;
