"use client";

import { useState, useRef, useCallback } from "react";

interface Rectangle {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export default function Home() {
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<Rectangle | null>(null);
  const [movingRectId, setMovingRectId] = useState<string | null>(null);
  const [selectedRectId, setSelectedRectId] = useState<string | null>(null);
  const [moveOffset, setMoveOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const findRectangleAtPoint = useCallback((x: number, y: number): Rectangle | null => {
    for (let i = rectangles.length - 1; i >= 0; i--) {
      const rect = rectangles[i];
      const left = rect.width >= 0 ? rect.x : rect.x + rect.width;
      const top = rect.height >= 0 ? rect.y : rect.y + rect.height;
      const right = left + Math.abs(rect.width);
      const bottom = top + Math.abs(rect.height);

      if (x >= left && x <= right && y >= top && y <= bottom) {
        return rect;
      }
    }
    return null;
  }, [rectangles]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedRect = findRectangleAtPoint(x, y);

    if (clickedRect) {
      setSelectedRectId(clickedRect.id);
      setMovingRectId(clickedRect.id);
      const rectLeft = clickedRect.width >= 0 ? clickedRect.x : clickedRect.x + clickedRect.width;
      const rectTop = clickedRect.height >= 0 ? clickedRect.y : clickedRect.y + clickedRect.height;
      setMoveOffset({
        x: x - rectLeft,
        y: y - rectTop,
      });
    } else {
      setIsDrawing(true);
      setStartPoint({ x, y });

      const newRect: Rectangle = {
        id: Date.now().toString(),
        name: `div ${rectangles.length + 1}`,
        x,
        y,
        width: 0,
        height: 0,
        color: "#3b82f6",
      };

      setCurrentRect(newRect);
    }
  }, [findRectangleAtPoint, rectangles.length]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - canvasRect.left;
    const currentY = e.clientY - canvasRect.top;

    if (movingRectId) {
      const newX = currentX - moveOffset.x;
      const newY = currentY - moveOffset.y;

      setRectangles(prev => prev.map(rect => {
        if (rect.id === movingRectId) {
          const normalizedX = rect.width >= 0 ? newX : newX - Math.abs(rect.width);
          const normalizedY = rect.height >= 0 ? newY : newY - Math.abs(rect.height);

          return {
            ...rect,
            x: normalizedX,
            y: normalizedY,
          };
        }
        return rect;
      }));
    } else if (isDrawing && currentRect) {
      const width = currentX - startPoint.x;
      const height = currentY - startPoint.y;

      setCurrentRect({
        ...currentRect,
        width,
        height,
      });
    }
  }, [isDrawing, startPoint, currentRect, movingRectId, moveOffset]);

  const handleMouseUp = useCallback(() => {
    if (movingRectId) {
      setMovingRectId(null);
      setMoveOffset({ x: 0, y: 0 });
    } else if (isDrawing && currentRect) {
      if (Math.abs(currentRect.width) > 5 && Math.abs(currentRect.height) > 5) {
        setRectangles(prev => [...prev, currentRect]);
      }

      setIsDrawing(false);
      setCurrentRect(null);
    }
  }, [isDrawing, currentRect, movingRectId]);

  const clearCanvas = () => {
    setRectangles([]);
    setCurrentRect(null);
    setMovingRectId(null);
    setSelectedRectId(null);
    setMoveOffset({ x: 0, y: 0 });
  };

  const updateRectangle = (id: string, updates: Partial<Rectangle>) => {
    setRectangles(prev => prev.map(rect =>
      rect.id === id ? { ...rect, ...updates } : rect
    ));
  };

  const LayerList = () => (
    <div className="p-4 h-full">
      <h3 className="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-wide">Layers</h3>
      {rectangles.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No layers yet</p>
      ) : (
        <div className="space-y-1">
          {rectangles.map((rectangle) => (
            <div
              key={rectangle.id}
              className={`p-2 rounded cursor-pointer text-sm transition-colors ${
                selectedRectId === rectangle.id
                  ? "bg-blue-100 text-blue-900 border border-blue-200"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              onClick={() => setSelectedRectId(rectangle.id)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded border"
                  style={{ backgroundColor: rectangle.color }}
                />
                {rectangle.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const PropertiesPanel = () => {
    const selectedRect = rectangles.find(rect => rect.id === selectedRectId);

    if (!selectedRect) {
      return (
        <div className="p-4 h-full">
          <h3 className="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-wide">Properties</h3>
          <p className="text-sm text-gray-400 italic">Select a layer to edit properties</p>
        </div>
      );
    }

    return (
      <div className="p-4 h-full">
        <h3 className="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-wide">Properties</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">
              Name
            </label>
            <input
              type="text"
              value={selectedRect.name}
              onChange={(e) => updateRectangle(selectedRect.id, { name: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">
              Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedRect.color}
                onChange={(e) => updateRectangle(selectedRect.id, { color: e.target.value })}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={selectedRect.color}
                onChange={(e) => updateRectangle(selectedRect.id, { color: e.target.value })}
                className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="block text-xs font-medium text-gray-600 mb-3 uppercase tracking-wide">
              Position
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">X</label>
                <input
                  type="number"
                  value={Math.round(selectedRect.x)}
                  onChange={(e) => updateRectangle(selectedRect.id, { x: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Y</label>
                <input
                  type="number"
                  value={Math.round(selectedRect.y)}
                  onChange={(e) => updateRectangle(selectedRect.id, { y: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-3 uppercase tracking-wide">
              Size
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Width</label>
                <input
                  type="number"
                  value={Math.round(Math.abs(selectedRect.width))}
                  onChange={(e) => updateRectangle(selectedRect.id, { width: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Height</label>
                <input
                  type="number"
                  value={Math.round(Math.abs(selectedRect.height))}
                  onChange={(e) => updateRectangle(selectedRect.id, { height: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Top toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Drawing App</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Click and drag to draw • Click to select and move
          </span>
          <button
            onClick={clearCanvas}
            className="px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
          >
            Clear Canvas
          </button>
        </div>
      </div>

      {/* Main layout with three sections */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Layers */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <LayerList />
          </div>
        </div>

        {/* Center Canvas Area */}
        <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
          <div
            ref={canvasRef}
            className="relative bg-white border border-gray-300 shadow-lg cursor-crosshair"
            style={{ width: '800px', height: '600px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {rectangles.map((rectangle) => (
              <div
                key={rectangle.id}
                className={`absolute border-2 transition-all cursor-move ${
                  movingRectId === rectangle.id
                    ? "border-orange-500 opacity-90"
                    : selectedRectId === rectangle.id
                    ? "border-blue-600 opacity-80"
                    : "border-gray-400 opacity-70 hover:border-gray-600 hover:opacity-80"
                }`}
                style={{
                  left: rectangle.width >= 0 ? rectangle.x : rectangle.x + rectangle.width,
                  top: rectangle.height >= 0 ? rectangle.y : rectangle.y + rectangle.height,
                  width: Math.abs(rectangle.width),
                  height: Math.abs(rectangle.height),
                  backgroundColor: rectangle.color,
                }}
              />
            ))}

            {currentRect && (
              <div
                className="absolute border-2 border-green-500 bg-green-200 opacity-70"
                style={{
                  left: currentRect.width >= 0 ? currentRect.x : currentRect.x + currentRect.width,
                  top: currentRect.height >= 0 ? currentRect.y : currentRect.y + currentRect.height,
                  width: Math.abs(currentRect.width),
                  height: Math.abs(currentRect.height),
                }}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <PropertiesPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
