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

interface LabelPreset {
  id: string;
  name: string;
  cols: number;
  w: string;
  h: string;
  wMm: number;
  hMm: number;
  fontSize: number; // pt (print) / px (preview)
  roll?: boolean;   // true = thermal roll, 1 label = 1 page
}

const LABEL_PRESETS: LabelPreset[] = [
  // Thermal roll labels (1 label = 1 page)
  { id: 'r50x30', name: '50×30 mm (Thermal Roll)', cols: 1, w: '50mm', h: '30mm', wMm: 50, hMm: 30, fontSize: 9,  roll: true },
  { id: 'r50x25', name: '50×25 mm (Thermal Roll)', cols: 1, w: '50mm', h: '25mm', wMm: 50, hMm: 25, fontSize: 8,  roll: true },
  { id: 'r38x25', name: '38×25 mm (Thermal Roll)', cols: 1, w: '38mm', h: '25mm', wMm: 38, hMm: 25, fontSize: 7,  roll: true },
  { id: 'r50x75', name: '50×75 mm (Thermal Roll)', cols: 1, w: '50mm', h: '75mm', wMm: 50, hMm: 75, fontSize: 11, roll: true },
  // A4 sheets
  { id: '2x1', name: '2×1" (A4 Sheet)', cols: 4, w: '51mm',  h: '25mm', wMm: 51,  hMm: 25, fontSize: 10 },
  { id: '3x1', name: '3×1" (A4 Sheet)', cols: 3, w: '76mm',  h: '28mm', wMm: 76,  hMm: 28, fontSize: 11 },
  { id: '4x2', name: '4×2" (A4 Sheet)', cols: 2, w: '102mm', h: '50mm', wMm: 102, hMm: 50, fontSize: 13 },
];

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const BarcodeLabelPrintModal = ({ product, onClose }: BarcodeLabelPrintModalProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(Math.max(1, product.stockQuantity || 1));
  const [presetId, setPresetId] = useState('r50x30');
  const [showPrice, setShowPrice] = useState(true);
  const [showName, setShowName] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);

  const preset = useMemo(() => LABEL_PRESETS.find(p => p.id === presetId)!, [presetId]);

  const safeBarcode =
    product.barcode && product.barcode.length >= 6
      ? product.barcode
      : product.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 10) || String(product.id).padStart(10, '0');

  // Render barcode into every SVG placeholder (EAN-13 when possible, else CODE128)
  useEffect(() => {
    const t = window.setTimeout(() => {
      const root = sheetRef.current;
      if (!root) return;
      const svgs = root.querySelectorAll<SVGSVGElement>(`[data-barcode-svg="${product.id}"]`);
      const isEAN13 = /^\d{13}$/.test(safeBarcode);

      svgs.forEach(svg => {
        const options = {
          width: 3,                       // thick bars
          height: preset.roll ? 70 : 50,
          displayValue: true,
          fontSize: 22,                   // big human-readable number
          fontOptions: 'bold',
          font: 'Arial',
          textMargin: 3,
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000',
        };

        // reset in case of re-render
        svg.removeAttribute('viewBox');
        svg.innerHTML = '';

        try {
          JsBarcode(svg, safeBarcode, { ...options, format: isEAN13 ? 'EAN13' : 'CODE128' });
        } catch {
          // EAN13 checksum invalid -> fall back to CODE128
          try {
            svg.innerHTML = '';
            JsBarcode(svg, safeBarcode, { ...options, format: 'CODE128' });
          } catch {
            /* ignore */
          }
        }

        // Make it scale-proof: viewBox instead of fixed px so it fills label width sharply
        const w = parseFloat(svg.getAttribute('width') || '0');
        const h = parseFloat(svg.getAttribute('height') || '0');
        if (w && h) {
          svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
          svg.removeAttribute('width');
          svg.removeAttribute('height');
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          svg.setAttribute('shape-rendering', 'crispEdges');
          svg.style.width = '100%';
          svg.style.height = 'auto';
          svg.style.maxHeight = '100%';
        }
      });
    }, 30);
    return () => clearTimeout(t);
  }, [safeBarcode, copies, preset, product.id, showName, showPrice]);

  const handlePrint = () => {
    const firstSvg = sheetRef.current?.querySelector('svg');
    if (!firstSvg) return;
    const svgHtml = firstSvg.outerHTML;

    // Build clean label markup ourselves (no preview inline styles) -> prints ALL copies
    const nameHtml = showName
      ? `<div class="name">${showEmoji && product.image ? `<span class="emoji">${escapeHtml(product.image)}</span> ` : ''}${escapeHtml(product.name)}</div>`
      : '';
    const priceHtml = showPrice ? `<div class="price">Rs ${escapeHtml(String(product.price))}</div>` : '';
    const labelHtml = `<div class="label">${nameHtml}${svgHtml}${priceHtml}</div>`;
    const html = `<div class="sheet">${Array.from({ length: copies }).map(() => labelHtml).join('')}</div>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;

    const pageCss = preset.roll
      ? `@page { size: ${preset.wMm}mm ${preset.hMm}mm; margin: 0; }`
      : `@page { size: A4; margin: 8mm; }`;

    const layoutCss = preset.roll
      ? `
        .sheet { display: block; }
        .label {
          width: ${preset.wMm}mm; height: ${preset.hMm}mm;
          padding: 1.5mm 2mm;
          page-break-after: always; break-after: page;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          overflow: hidden;
        }
        .label:last-child { page-break-after: auto; break-after: auto; }`
      : `
        body { padding: 6mm 4mm; }
        .sheet { display: grid; grid-template-columns: repeat(${preset.cols}, 1fr); gap: 3mm; }
        .label {
          padding: 2mm; min-height: ${preset.h};
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          page-break-inside: avoid; break-inside: avoid; overflow: hidden;
        }`;

    win.document.write(`
      <html>
        <head>
          <title>Barcode Labels — ${escapeHtml(product.name)}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            ${pageCss}
            html, body { background: #fff; font-family: Arial, sans-serif; color: #000; }
            ${layoutCss}
            .emoji { font-size: ${Math.round(preset.fontSize * 1.6)}pt; }
            .name  { font-size: ${preset.fontSize}pt; font-weight: 700; text-align: center; line-height: 1.1; }
            .price { font-size: ${Math.round(preset.fontSize * 1.5)}pt; font-weight: 900; color: #000; margin-top: 1mm; white-space: nowrap; }
            svg { display: block; width: 100%; height: auto; flex: 0 1 auto; min-height: 0; margin-top: 1mm; shape-rendering: crispEdges; }
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
              <input type="checkbox" checked={showName} onChange={e => setShowName(e.target.checked)} className="h-4 w-4" />
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
          <p className="text-xs text-muted-foreground font-semibold uppercase mb-3">
            Live Preview ({preset.roll ? `${preset.wMm}×${preset.hMm} mm roll` : 'A4 Sheet'})
          </p>
          <div
            ref={sheetRef}
            className="sheet"
            style={{
              display: 'grid',
              gridTemplateColumns: preset.roll
                ? `repeat(auto-fill, ${preset.w})`
                : `repeat(${preset.cols}, 1fr)`,
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
                  color: '#000',
                  width: preset.roll ? preset.w : undefined,
                  height: preset.roll ? preset.h : undefined,
                  minHeight: preset.h,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  pageBreakInside: 'avoid',
                }}
              >
                {showName && (
                  <div
                    className="name"
                    style={{
                      fontSize: preset.fontSize,
                      fontWeight: 700,
                      textAlign: 'center',
                      lineHeight: 1.1,
                    }}
                  >
                    {showEmoji && product.image && (
                      <span style={{ fontSize: preset.fontSize * 1.6 }}>{product.image} </span>
                    )}
                    {product.name}
                  </div>
                )}
                <svg data-barcode-svg={product.id} style={{ marginTop: 2 }} />
                {showPrice && (
                  <div
                    className="price"
                    style={{
                      fontSize: preset.fontSize * 1.5,
                      fontWeight: 900,
                      color: '#000',
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                    }}
                  >
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
