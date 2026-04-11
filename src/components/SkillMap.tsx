'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { Skill, SkillCategory } from '@/types';
import { useNorth } from '@/store/north';
import { ArrowLeft, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  category: SkillCategory | 'center';
  radius: number;
  color: string;
  evidence?: string;
  strength?: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
}

const CATEGORY_COLORS: Record<SkillCategory | 'center', string> = {
  technical: '#1D9E75',
  creative: '#7F77DD',
  people: '#BA7517',
  business: '#D85A30',
  center: '#E8E8FF',
};

export const SkillMap = () => {
  const router = useRouter();
  const { skills, skillMapReady, setSkillMapReady } = useNorth();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || skills.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Group skills by category
    const grouped: Record<string, typeof skills> = {};
    for (const s of skills) {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    }

    const categoryNames: Record<string, string> = {
      technical: 'Technical',
      creative: 'Creative',
      people: 'People',
      business: 'Business',
    };

    // Robust Category Mapping
    const getSafeCategory = (cat: string): SkillCategory => {
      const c = cat.toLowerCase();
      if (c.includes('tech')) return 'technical';
      if (c.includes('creat')) return 'creative';
      if (c.includes('peop') || c.includes('commun')) return 'people';
      if (c.includes('bus') || c.includes('mark') || c.includes('sale')) return 'business';
      return 'technical'; // Default fallback
    };

    // Tier 1: Center node
    const nodes: Node[] = [
      { id: 'center', name: 'You', category: 'center', radius: 30, color: CATEGORY_COLORS.center },
    ];
    const links: Link[] = [];

    // Tier 2: Category hub nodes -> Tier 3: Skill leaf nodes
    Object.entries(grouped).forEach(([cat, catSkills]) => {
      const safeCat = getSafeCategory(cat);
      const hubId = `cat-${cat}`;

      nodes.push({
        id: hubId,
        name: categoryNames[safeCat] || cat,
        category: safeCat,
        radius: 18,
        color: CATEGORY_COLORS[safeCat] || CATEGORY_COLORS.technical,
      });

      // Hub links to center
      links.push({ source: 'center', target: hubId });

      // Leaf skill nodes link to their hub
      catSkills.forEach((s, i) => {
        const leafId = `skill-${cat}-${i}`;
        const strength = typeof s.strength === 'number' ? s.strength : 5;
        nodes.push({
          id: leafId,
          name: s.name || 'Skill',
          category: safeCat,
          radius: 10 + (Math.min(10, Math.max(1, strength)) / 10) * 8,
          color: CATEGORY_COLORS[safeCat] || CATEGORY_COLORS.technical,
          evidence: s.evidence || 'Demonstrated in conversation',
          strength: strength,
        });
        links.push({ source: hubId, target: leafId });
      });
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Zoom and pan behavior removed to lock graph to viewport securely.
    // const zoom = d3.zoom<SVGSVGElement, unknown>()
    //  .scaleExtent([0.5, 3])
    //  .on('zoom', (event: any) => {
    //    g.attr('transform', event.transform);
    //  });
    // svg.call(zoom);

    // Pin center node to true center immediately
    nodes[0].fx = width / 2;
    nodes[0].fy = height / 2;

    // Pinch-to-zoom via native touch events
    let lastDist = 0;
    let currentScale = 1;
    const svgEl = svgRef.current!;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = dist / lastDist;
        currentScale = Math.max(0.4, Math.min(3, currentScale * delta));
        g.attr('transform', `translate(${width / 2},${height / 2}) scale(${currentScale}) translate(${-width / 2},${-height / 2})`);
        lastDist = dist;
      }
    };

    svgEl.addEventListener('touchstart', onTouchStart, { passive: true });
    svgEl.addEventListener('touchmove', onTouchMove, { passive: false });

    // Simulation
    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links)
        .id((d: any) => d.id)
        .distance((d: any) => {
          const src = d.source?.id ?? d.source;
          if (src === 'center') return 115;       // center → hub
          return 85;                               // hub → leaf
        })
        .strength(0.9)
      )
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => (d as Node).radius + 18));
    // Add SVG glow filter
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#333')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1);

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any)
      .on('click', (event: any, d: any) => {
        if (d.category !== 'center' && !d.id?.startsWith('cat-')) {
          setSelectedNode(d);
        }
        event.stopPropagation();
      });

    node.append('circle')
      .attr('r', (d: any) => d.radius)
      .attr('fill', (d: any) => d.category === 'center' ? d.color : 'transparent')
      .attr('stroke', (d: any) => d.color)
      .attr('stroke-width', (d: any) => {
        if (d.category === 'center') return 3;
        if (d.id?.startsWith('cat-')) return 2.5;   // hub ring
        return 1.5;                                   // leaf ring
      })
      .attr('fill-opacity', (d: any) => d.id?.startsWith('cat-') ? 0.08 : 0.55)
      .style('filter', 'url(#glow)');

    node.append('text')
      .text((d: any) => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', (d: any) => {
        if (d.category === 'center') return '0.35em';
        // Hub labels go below the ring for readability
        if (d.id?.startsWith('cat-')) return d.radius + 14;
        return d.radius + 14;
      })
      .attr('fill', (d: any) => {
        if (d.category === 'center') return '#ffffff';
        if (d.id?.startsWith('cat-')) return d.color;
        return '#cccccc';
      })
      .attr('font-size', (d: any) => {
        if (d.category === 'center') return '13px';
        if (d.id?.startsWith('cat-')) return '10px';
        return '9px';
      })
      .attr('font-weight', (d: any) => d.category === 'center' || d.id?.startsWith('cat-') ? '700' : '400')
      .attr('letter-spacing', (d: any) => d.id?.startsWith('cat-') ? '0.1em' : '0')
      .attr('font-family', 'var(--font-geist-mono)')
      .attr('pointer-events', 'none')
      .style('text-shadow', '0px 2px 6px rgba(0,0,0,1)')
      .style('opacity', 1);

    simulation.on('tick', () => {
      // Clamp nodes to the visible screen bounds
      node.attr('transform', (d: any) => {
        const padding = d.radius + 20; // Prevent text from cutting off too
        d.x = Math.max(padding, Math.min(width - padding, d.x));
        d.y = Math.max(padding, Math.min(height - padding, d.y));
        return `translate(${d.x},${d.y})`;
      });

      link
        .attr('x1', (d: any) => (d.source as any).x)
        .attr('y1', (d: any) => (d.source as any).y)
        .attr('x2', (d: any) => (d.target as any).x)
        .attr('y2', (d: any) => (d.target as any).y);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      const padding = event.subject.radius + 20;
      event.subject.fx = Math.max(padding, Math.min(width - padding, event.x));
      event.subject.fy = Math.max(padding, Math.min(height - padding, event.y));
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Double-tap center node to reset layout
    let lastTapTime = 0;
    node.filter((d: any) => d.id === 'center')
      .on('dblclick', () => {
        simulation.alpha(0.8).restart();
      })
      .on('touchend', () => {
        const now = Date.now();
        if (now - lastTapTime < 300) {
          simulation.alpha(0.8).restart();
        }
        lastTapTime = now;
      });

    // Initial settle
    setTimeout(() => {
      setSkillMapReady(true);
    }, 1000);

    return () => {
      simulation.stop();
      svgEl.removeEventListener('touchstart', onTouchStart);
      svgEl.removeEventListener('touchmove', onTouchMove);
    };
  }, [skills]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-background overflow-hidden" onClick={() => setSelectedNode(null)}>
      {/* Subtle ambient lighting behind the graph */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vh] h-[50vh] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      <svg ref={svgRef} className="w-full h-full relative z-10" />
      
      {/* Overlay UI */}
      <div className="absolute top-0 left-0 w-full p-6 pointer-events-none z-20">
        <div className="flex justify-between items-start pointer-events-auto">
          <button onClick={() => router.back()} className="p-2 bg-surface border border-border rounded-lg text-text-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-right">
            <h2 className="text-xl font-bold tracking-tight">Skill Map</h2>
            <p className="text-xs font-mono text-text-secondary uppercase">Exploration Mode</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-24 left-6 flex flex-col gap-3 pointer-events-none z-20">
        {[
          { label: 'Technical', color: '#1D9E75' },
          { label: 'Creative', color: '#7F77DD' },
          { label: 'People', color: '#BA7517' },
          { label: 'Business', color: '#D85A30' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}80` }} />
            <span className="text-[10px] uppercase font-mono tracking-widest text-text-secondary drop-shadow-md">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Node Detail Popup */}
      <AnimatePresence>
        {selectedNode && selectedNode.category !== 'center' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] bg-surface/90 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: selectedNode.color }} 
              />
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-secondary">
                {selectedNode.category}
              </span>
            </div>
            <h3 className="text-lg font-bold mb-1">{selectedNode.name}</h3>
            <p className="text-sm text-text-secondary italic mb-3">
              "{selectedNode.evidence}"
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-text-secondary">Strength</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-3 h-1 rounded-full",
                      i < (selectedNode.strength || 0) ? "" : "bg-border"
                    )}
                    style={{ backgroundColor: i < (selectedNode.strength || 0) ? selectedNode.color : undefined }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Actions */}
      <div className="absolute top-20 right-6 flex flex-col gap-2 pointer-events-auto z-20">
        <button 
          onClick={() => {
            // Reset the Zustand state so everything starts clean with the real API key
            useNorth.getState().reset();
            router.push('/');
          }}
          className="p-2 bg-surface border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          title="Start Over"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom CTA */}
      <AnimatePresence>
        {skillMapReady && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full px-6 max-w-[420px] z-20"
          >
            <button 
              onClick={() => router.push('/paths')}
              className="w-full bg-surface/80 backdrop-blur-xl border border-accent/30 text-text-primary font-mono text-sm uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:border-accent hover:text-accent transition-all duration-300"
            >
              <span>This is you.</span>
              <span className="text-accent">Find your paths →</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
