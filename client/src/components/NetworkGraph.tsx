import React, { useEffect, useRef, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface Node {
  id: string;
  label: string;
  type: 'subject' | 'associate' | 'location' | 'account' | 'employer';
  value?: number;
  color?: string;
}

interface Link {
  source: string;
  target: string;
  strength: number; // 0-1
  type: string;
}

interface NetworkGraphProps {
  nodes: Node[];
  links: Link[];
  title?: string;
}

export function NetworkGraph({ nodes, links, title = 'Network Analysis' }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNodes = useMemo(() => {
    if (!searchTerm) return nodes;
    return nodes.filter(n => n.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [nodes, searchTerm]);

  const filteredLinks = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));
  }, [links, filteredNodes]);

  useEffect(() => {
    if (!svgRef.current || filteredNodes.length === 0) return;

    const width = svgRef.current.clientWidth || 800;
    const height = 500;

    // Clear previous content
    const svg = svgRef.current;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Create SVG group for zoom/pan
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(g);

    // Draw links (edges)
    filteredLinks.forEach(link => {
      const sourceNode = filteredNodes.find(n => n.id === link.source);
      const targetNode = filteredNodes.find(n => n.id === link.target);
      if (!sourceNode || !targetNode) return;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      const x1 = Math.random() * width;
      const y1 = Math.random() * height;
      const x2 = Math.random() * width;
      const y2 = Math.random() * height;

      line.setAttribute('x1', x1.toString());
      line.setAttribute('y1', y1.toString());
      line.setAttribute('x2', x2.toString());
      line.setAttribute('y2', y2.toString());
      line.setAttribute('stroke', `rgba(100, 150, 255, ${link.strength})`);
      line.setAttribute('stroke-width', (link.strength * 3).toString());
      g.appendChild(line);
    });

    // Draw nodes (circles)
    filteredNodes.forEach((node, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const x = (idx % 5) * (width / 5) + 50;
      const y = Math.floor(idx / 5) * 100 + 50;

      circle.setAttribute('cx', x.toString());
      circle.setAttribute('cy', y.toString());
      circle.setAttribute('r', node.type === 'subject' ? '20' : '12');
      circle.setAttribute('fill', node.color || (node.type === 'subject' ? '#3b82f6' : '#10b981'));
      circle.setAttribute('stroke', selectedNode === node.id ? '#fbbf24' : '#1f2937');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('cursor', 'pointer');
      circle.setAttribute('class', 'network-node');

      circle.addEventListener('click', () => setSelectedNode(node.id));
      circle.addEventListener('mouseenter', () => {
        circle.setAttribute('r', node.type === 'subject' ? '25' : '16');
      });
      circle.addEventListener('mouseleave', () => {
        circle.setAttribute('r', node.type === 'subject' ? '20' : '12');
      });

      g.appendChild(circle);

      // Add label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x.toString());
      text.setAttribute('y', (y + 30).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '11');
      text.setAttribute('fill', '#e5e7eb');
      text.textContent = node.label.substring(0, 15);
      g.appendChild(text);
    });
  }, [filteredNodes, filteredLinks, selectedNode]);

  const selectedNodeData = filteredNodes.find(n => n.id === selectedNode);
  const connectedNodes = filteredLinks
    .filter(l => l.source === selectedNode || l.target === selectedNode)
    .map(l => l.source === selectedNode ? l.target : l.source);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <Input
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            />
          </div>

          <svg
            ref={svgRef}
            className="w-full border border-slate-700 rounded-lg bg-slate-900"
            style={{ minHeight: '500px' }}
          />

          {selectedNodeData && (
            <div className="bg-slate-800 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedNodeData.color || '#3b82f6' }}
                />
                <span className="font-semibold text-white">{selectedNodeData.label}</span>
                <Badge variant="outline" className="text-xs">
                  {selectedNodeData.type}
                </Badge>
              </div>
              {connectedNodes.length > 0 && (
                <div className="text-sm text-slate-300">
                  Connected to {connectedNodes.length} node{connectedNodes.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
