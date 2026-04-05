import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Shirt, Type, Trash2, Move, ChevronLeft, ChevronRight,
    ShoppingCart, Plus, Minus, Bold, Italic, AlignCenter, AlignLeft, AlignRight,
    Download, RotateCcw, Check,
} from 'lucide-react';
import { useState, useRef, useCallback } from 'react';

interface Product {
    id: number; name: string; slug: string; price: number;
    colors: string[]; sizes: string[];
    category: { name: string };
}
interface SharedData { auth: { user: { id: number } | null }; [key: string]: unknown; }
interface Props { products: Product[]; selectedProduct: Product | null; }

interface TextLayer {
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textAlign: 'left' | 'center' | 'right';
    fontFamily: string;
}

const FONTS = ['Inter', 'Georgia', 'Courier New', 'Impact', 'Comic Sans MS', 'Arial Black'];
const PRESET_COLORS = ['#FFFFFF', '#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#F97316', '#6B7280'];

function generateId() { return Math.random().toString(36).slice(2); }

const GARMENT_COLORS = ['#FFFFFF', '#000000', '#1F2937', '#374151', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#F97316', '#84CC16'];

export default function DesignerIndex({ products, selectedProduct: initialProduct }: Props) {
    const { auth } = usePage<SharedData>().props;

    const [activeProduct, setActiveProduct] = useState<Product | null>(initialProduct ?? products[0] ?? null);
    const [garmentColor, setGarmentColor] = useState('#FFFFFF');
    const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'garment' | 'text' | 'product'>('garment');
    const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; layerX: number; layerY: number } | null>(null);
    const [selectedSize, setSelectedSize] = useState('M');
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    const selectedLayer = textLayers.find(l => l.id === selectedLayerId) ?? null;

    const addTextLayer = () => {
        const newLayer: TextLayer = {
            id: generateId(),
            text: 'Your Text Here',
            x: 120,
            y: 160,
            fontSize: 24,
            color: '#000000',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'center',
            fontFamily: 'Inter',
        };
        setTextLayers(prev => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
        setActiveTab('text');
    };

    const updateLayer = useCallback((id: string, updates: Partial<TextLayer>) => {
        setTextLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    }, []);

    const deleteLayer = (id: string) => {
        setTextLayers(prev => prev.filter(l => l.id !== id));
        if (selectedLayerId === id) setSelectedLayerId(null);
    };

    const handleMouseDown = (e: React.MouseEvent, layerId: string) => {
        e.stopPropagation();
        setSelectedLayerId(layerId);
        const layer = textLayers.find(l => l.id === layerId);
        if (!layer) return;
        setDragging({ id: layerId, startX: e.clientX, startY: e.clientY, layerX: layer.x, layerY: layer.y });
    };

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragging) return;
        const dx = e.clientX - dragging.startX;
        const dy = e.clientY - dragging.startY;
        updateLayer(dragging.id, { x: dragging.layerX + dx, y: dragging.layerY + dy });
    }, [dragging, updateLayer]);

    const handleMouseUp = () => setDragging(null);

    const addToCart = () => {
        if (!auth.user) { router.visit('/login'); return; }
        if (!activeProduct) return;

        router.post('/cart', {
            product_id: activeProduct.id,
            color: garmentColor,
            size: selectedSize,
            quantity,
            custom_design: {
                garment_color: garmentColor,
                text_layers: textLayers,
            },
        }, {
            onSuccess: () => {
                setAddedToCart(true);
                setTimeout(() => setAddedToCart(false), 2500);
            },
        });
    };

    return (
        <>
            <Head title="Designer — ThreadCraft" />
            <div className="flex h-screen flex-col overflow-hidden bg-gray-950 font-[Inter] text-white">
                {/* Top Bar */}
                <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/10 bg-gray-900/80 px-5 backdrop-blur">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
                            <Shirt className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold">ThreadCraft</span>
                        <span className="ml-1 text-sm text-gray-500">/ Designer</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={addToCart}
                            disabled={!activeProduct}
                            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition disabled:opacity-40 ${addedToCart ? 'bg-green-600 hover:bg-green-700' : 'bg-violet-600 hover:bg-violet-700'}`}
                        >
                            {addedToCart ? <><Check className="h-4 w-4" /> Added!</> : <><ShoppingCart className="h-4 w-4" /> Add to Cart</>}
                        </button>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Panel */}
                    <aside className="flex w-72 flex-shrink-0 flex-col border-r border-white/10 bg-gray-900">
                        {/* Tabs */}
                        <div className="flex border-b border-white/10">
                            {(['garment', 'text', 'product'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition ${activeTab === tab ? 'border-b-2 border-violet-500 text-violet-400' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {/* Garment Tab */}
                            {activeTab === 'garment' && (
                                <div className="space-y-5">
                                    <div>
                                        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Garment Color</div>
                                        <div className="grid grid-cols-6 gap-2">
                                            {GARMENT_COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setGarmentColor(c)}
                                                    className={`relative h-9 w-9 rounded-full border-2 transition hover:scale-110 ${garmentColor === c ? 'border-violet-500 scale-110' : 'border-white/20'}`}
                                                    style={{ backgroundColor: c }}
                                                    title={c}
                                                >
                                                    {garmentColor === c && (
                                                        <Check className="absolute inset-0 m-auto h-4 w-4" style={{ color: c === '#FFFFFF' ? '#000' : '#fff' }} />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={garmentColor}
                                                onChange={e => setGarmentColor(e.target.value)}
                                                className="h-9 w-9 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                                            />
                                            <input
                                                type="text"
                                                value={garmentColor}
                                                onChange={e => setGarmentColor(e.target.value)}
                                                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono outline-none focus:border-violet-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Size</div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {(activeProduct?.sizes ?? ['XS','S','M','L','XL','2XL']).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setSelectedSize(s)}
                                                    className={`rounded-lg border py-2 text-xs font-medium transition ${selectedSize === s ? 'border-violet-500 bg-violet-600' : 'border-white/20 text-gray-400 hover:border-white/40 hover:text-white'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Quantity</div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 hover:bg-white/10">
                                                <Minus className="h-4 w-4" />
                                            </button>
                                            <span className="w-8 text-center font-bold">{quantity}</span>
                                            <button onClick={() => setQuantity(q => q + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 hover:bg-white/10">
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Text Tab */}
                            {activeTab === 'text' && (
                                <div className="space-y-4">
                                    <button
                                        onClick={addTextLayer}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-3 text-sm text-gray-400 transition hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-400"
                                    >
                                        <Plus className="h-4 w-4" /> Add Text
                                    </button>

                                    {/* Layer list */}
                                    {textLayers.length > 0 && (
                                        <div>
                                            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Layers</div>
                                            <div className="space-y-1">
                                                {textLayers.map(layer => (
                                                    <div
                                                        key={layer.id}
                                                        onClick={() => setSelectedLayerId(layer.id)}
                                                        className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition ${selectedLayerId === layer.id ? 'bg-violet-600/20 text-violet-300' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <Type className="h-3.5 w-3.5 flex-shrink-0" />
                                                            <span className="truncate max-w-[120px]">{layer.text}</span>
                                                        </span>
                                                        <button
                                                            onClick={e => { e.stopPropagation(); deleteLayer(layer.id); }}
                                                            className="text-gray-600 hover:text-red-400"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Selected layer editor */}
                                    {selectedLayer && (
                                        <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
                                            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Edit Text</div>

                                            <textarea
                                                value={selectedLayer.text}
                                                onChange={e => updateLayer(selectedLayer.id, { text: e.target.value })}
                                                rows={2}
                                                className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-violet-500"
                                            />

                                            <div>
                                                <div className="mb-2 text-xs text-gray-500">Font</div>
                                                <select
                                                    value={selectedLayer.fontFamily}
                                                    onChange={e => updateLayer(selectedLayer.id, { fontFamily: e.target.value })}
                                                    className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm outline-none focus:border-violet-500"
                                                >
                                                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <div className="mb-2 text-xs text-gray-500">Size: {selectedLayer.fontSize}px</div>
                                                <input
                                                    type="range"
                                                    min={8} max={72}
                                                    value={selectedLayer.fontSize}
                                                    onChange={e => updateLayer(selectedLayer.id, { fontSize: +e.target.value })}
                                                    className="w-full accent-violet-500"
                                                />
                                            </div>

                                            <div>
                                                <div className="mb-2 text-xs text-gray-500">Style</div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => updateLayer(selectedLayer.id, { fontWeight: selectedLayer.fontWeight === 'bold' ? 'normal' : 'bold' })}
                                                        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition ${selectedLayer.fontWeight === 'bold' ? 'border-violet-500 bg-violet-600' : 'border-white/20 hover:bg-white/10'}`}
                                                    >
                                                        <Bold className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateLayer(selectedLayer.id, { fontStyle: selectedLayer.fontStyle === 'italic' ? 'normal' : 'italic' })}
                                                        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition ${selectedLayer.fontStyle === 'italic' ? 'border-violet-500 bg-violet-600' : 'border-white/20 hover:bg-white/10'}`}
                                                    >
                                                        <Italic className="h-4 w-4" />
                                                    </button>
                                                    {(['left', 'center', 'right'] as const).map(align => (
                                                        <button
                                                            key={align}
                                                            onClick={() => updateLayer(selectedLayer.id, { textAlign: align })}
                                                            className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition ${selectedLayer.textAlign === align ? 'border-violet-500 bg-violet-600' : 'border-white/20 hover:bg-white/10'}`}
                                                        >
                                                            {align === 'left' ? <AlignLeft className="h-4 w-4" /> : align === 'center' ? <AlignCenter className="h-4 w-4" /> : <AlignRight className="h-4 w-4" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="mb-2 text-xs text-gray-500">Text Color</div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {PRESET_COLORS.map(c => (
                                                        <button
                                                            key={c}
                                                            onClick={() => updateLayer(selectedLayer.id, { color: c })}
                                                            className={`h-7 w-7 rounded-full border-2 transition hover:scale-110 ${selectedLayer.color === c ? 'border-violet-500' : 'border-white/20'}`}
                                                            style={{ backgroundColor: c }}
                                                        />
                                                    ))}
                                                    <input
                                                        type="color"
                                                        value={selectedLayer.color}
                                                        onChange={e => updateLayer(selectedLayer.id, { color: e.target.value })}
                                                        className="h-7 w-7 cursor-pointer rounded-full border-2 border-white/20 bg-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Product Tab */}
                            {activeTab === 'product' && (
                                <div className="space-y-2">
                                    <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Choose Garment</div>
                                    {products.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setActiveProduct(p)}
                                            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${activeProduct?.id === p.id ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                                        >
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-800">
                                                <Shirt className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium">{p.name}</div>
                                                <div className="text-xs text-violet-400">${p.price.toFixed(2)}</div>
                                            </div>
                                            {activeProduct?.id === p.id && <Check className="ml-auto h-4 w-4 flex-shrink-0 text-violet-400" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Price footer */}
                        {activeProduct && (
                            <div className="border-t border-white/10 p-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">{activeProduct.name}</span>
                                    <span className="font-bold text-violet-400">${(activeProduct.price * quantity).toFixed(2)}</span>
                                </div>
                                <div className="text-xs text-gray-600 mt-0.5">Size: {selectedSize} · Qty: {quantity}</div>
                            </div>
                        )}
                    </aside>

                    {/* Canvas Area */}
                    <main className="flex flex-1 flex-col items-center justify-center overflow-hidden bg-gray-950 p-8">
                        <div className="mb-4 text-center">
                            <div className="text-sm text-gray-500">
                                {activeProduct ? activeProduct.name : 'Select a garment'}
                                {textLayers.length > 0 && <span className="ml-2 text-violet-400">· {textLayers.length} layer{textLayers.length > 1 ? 's' : ''}</span>}
                            </div>
                        </div>

                        {/* Design Canvas */}
                        <div
                            ref={canvasRef}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onClick={() => setSelectedLayerId(null)}
                            className="relative overflow-hidden rounded-2xl shadow-2xl"
                            style={{ width: 400, height: 480, backgroundColor: garmentColor, cursor: dragging ? 'grabbing' : 'default' }}
                        >
                            {/* Garment SVG silhouette */}
                            <svg viewBox="0 0 400 480" className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M140 40 L100 80 L40 100 L60 160 L100 150 L100 420 L300 420 L300 150 L340 160 L360 100 L300 80 L260 40 C250 60 210 75 200 75 C190 75 150 60 140 40Z"
                                    fill="none"
                                    stroke={garmentColor === '#FFFFFF' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'}
                                    strokeWidth="2"
                                />
                                {/* collar */}
                                <path
                                    d="M160 45 C165 65 175 75 200 80 C225 75 235 65 240 45"
                                    fill="none"
                                    stroke={garmentColor === '#FFFFFF' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}
                                    strokeWidth="2"
                                />
                                {/* print area guide */}
                                <rect
                                    x="130" y="130" width="140" height="160"
                                    rx="4"
                                    fill="none"
                                    stroke={garmentColor === '#FFFFFF' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}
                                    strokeWidth="1"
                                    strokeDasharray="6 4"
                                />
                                <text
                                    x="200" y="320"
                                    textAnchor="middle"
                                    fontSize="9"
                                    fill={garmentColor === '#FFFFFF' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)'}
                                >
                                    Print area
                                </text>
                            </svg>

                            {/* Text Layers */}
                            {textLayers.map(layer => (
                                <div
                                    key={layer.id}
                                    onMouseDown={e => handleMouseDown(e, layer.id)}
                                    className="absolute select-none"
                                    style={{
                                        left: layer.x,
                                        top: layer.y,
                                        fontSize: layer.fontSize,
                                        color: layer.color,
                                        fontWeight: layer.fontWeight,
                                        fontStyle: layer.fontStyle,
                                        textAlign: layer.textAlign,
                                        fontFamily: layer.fontFamily,
                                        cursor: 'grab',
                                        outline: selectedLayerId === layer.id ? '2px dashed rgba(139,92,246,0.8)' : 'none',
                                        outlineOffset: 4,
                                        padding: 4,
                                        whiteSpace: 'pre',
                                        userSelect: 'none',
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {layer.text}
                                </div>
                            ))}

                            {/* Empty state */}
                            {textLayers.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <div
                                        className="rounded-xl px-6 py-4 text-center text-sm"
                                        style={{ color: garmentColor === '#FFFFFF' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }}
                                    >
                                        <Type className="mx-auto mb-2 h-8 w-8" />
                                        Click "Text" tab and add layers
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="mt-4 text-xs text-gray-600">Drag text layers to reposition them on the garment</p>
                    </main>
                </div>
            </div>
        </>
    );
}
