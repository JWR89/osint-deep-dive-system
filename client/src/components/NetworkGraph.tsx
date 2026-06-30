import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

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

interface D3Node extends Node {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface D3Link {
  source: string | D3Node;
  target: string | D3Node;
  strength: number;
  type: string;
}

export function NetworkGraph({ nodes, links, title = 'Network Analysis' }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);

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
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create groups for layering
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create D3 nodes with positions
    const d3Nodes: D3Node[] = filteredNodes.map(node => ({
      ...node,
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height / 2 + (Math.random() - 0.5) * 100,
    }));

    // Create D3 links
    const d3Links: D3Link[] = filteredLinks.map(link => ({
      source: link.source,
      target: link.target,
      strength: link.strength,
      type: link.type,
    }));

    // Create force simulation
    const simulation = d3.forceSimulation<D3Node>(d3Nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(d3Links)
        .id((d: D3Node) => d.id)
        .distance((d: D3Link) => {
          // Stronger links = closer distance
          return 100 / (d.strength || 0.5);
        })
        .strength((d: D3Link) => d.strength || 0.5)
      )
      .force('charge', d3.forceManyBody<D3Node>()
        .strength(-300)
        .distanceMax(500)
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<D3Node>()
        .radius((d: D3Node) => (d.type === 'subject' ? 30 : 20))
      );

    simulationRef.current = simulation;

    // Draw links
    const linkElements = g.selectAll('line')
      .data(d3Links)
      .enter()
      .append('line')
      .attr('stroke', (d: D3Link) => {
        const strength = d.strength || 0.5;
        return `rgba(100, 150, 255, ${strength * 0.8})`;
      })
      .attr('stroke-width', (d: D3Link) => {
        const strength = d.strength || 0.5;
        return strength * 3;
      })
      .attr('class', 'network-link');

    // Draw nodes
    const nodeElements = g.selectAll('circle')
      .data(d3Nodes)
      .enter()
      .append('circle')
      .attr('r', (d: D3Node) => d.type === 'subject' ? 20 : 12)
      .attr('fill', (d: D3Node) => {
        if (d.type === 'subject') return '#3b82f6';
        if (d.type === 'associate') return '#10b981';
        if (d.type === 'location') return '#f59e0b';
        if (d.type === 'account') return '#8b5cf6';
        return '#ec4899';
      })
      .attr('stroke', (d: D3Node) => selectedNode === d.id ? '#fbbf24' : '#1f2937')
      .attr('stroke-width', (d: D3Node) => selectedNode === d.id ? 3 : 2)
      .attr('cursor', 'pointer')
      .attr('class', 'network-node')
      .on('click', (event: MouseEvent, d: D3Node) => {
        event.stopPropagation();
        setSelectedNode(d.id);
      })
      .on('mouseenter', function(this: SVGCircleElement, d: D3Node) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.type === 'subject' ? 28 : 18);
      })
      .on('mouseleave', function(this: SVGCircleElement, d: D3Node) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.type === 'subject' ? 20 : 12);
      })
      .call(d3.drag<SVGCircleElement, D3Node>()
        .on('start', (event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>, d: D3Node) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>, d: D3Node) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>, d: D3Node) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Add labels
    const labelElements = g.selectAll('text')
      .data(d3Nodes)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('font-size', '11')
      .attr('fill', '#e5e7eb')
      .attr('pointer-events', 'none')
      .text((d: D3Node) => d.label.substring(0, 15));

    // Update positions on simulation tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d: D3Link) => {
          const source = d.source as D3Node;
          return source.x || 0;
        })
        .attr('y1', (d: D3Link) => {
          const source = d.source as D3Node;
          return source.y || 0;
        })
        .attr('x2', (d: D3Link) => {
          const target = d.target as D3Node;
          return target.x || 0;
        })
        .attr('y2', (d: D3Link) => {
          const target = d.target as D3Node;
          return target.y || 0;
        });

      nodeElements
        .attr('cx', (d: D3Node) => d.x || 0)
        .attr('cy', (d: D3Node) => d.y || 0);

      labelElements
        .attr('x', (d: D3Node) => d.x || 0)
        .attr('y', (d: D3Node) => (d.y || 0) + 25);
    });

    // Update node styling when selection changes
    nodeElements
      .attr('stroke', (d: D3Node) => selectedNode === d.id ? '#fbbf24' : '#1f2937')
      .attr('stroke-width', (d: D3Node) => selectedNode === d.id ? 3 : 2);

    // Cleanup on unmount
    return () => {
      simulation.stop();
    };
  }, [filteredNodes, filteredLinks, selectedNode]);

  const selectedNodeData = filteredNodes.find(n => n.id === selectedNode);
  const connectedNodes = filteredLinks
    .filter(l => l.source === selectedNode || l.target === selectedNode)
    .map(l => l.source === selectedNode ? l.target : l.source);

  const connectedNodeDetails = connectedNodes
    .map(id => filteredNodes.find(n => n.id === id))
    .filter((n): n is Node => n !== undefined);

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
            <div className="bg-slate-800 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedNodeData.color || '#3b82f6' }}
                />
                <span className="font-semibold text-white text-lg">{selectedNodeData.label}</span>
                <Badge variant="outline" className="text-xs">
                  {selectedNodeData.type}
                </Badge>
              </div>
              {connectedNodes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-slate-300">
                    Connected to {connectedNodes.length} node{connectedNodes.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {connectedNodeDetails.map(node => (
                      <Badge
                        key={node.id}
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-slate-700"
                        onClick={() => setSelectedNode(node.id)}
                      >
                        {node.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-slate-400 bg-slate-800 p-3 rounded-lg">
            <p className="font-semibold mb-1">Legend:</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Subject (Primary target)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Associate (Connected person)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span>Account/Online Identity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                <span>Employer/Organization</span>
              </div>
            </div>
            <p className="text-slate-500 mt-2">Drag nodes to reposition • Scroll to zoom • Click nodes to select</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
