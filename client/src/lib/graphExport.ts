import html2canvas from 'html2canvas';

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
  strength: number;
  type: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
  title: string;
  exportedAt: string;
}

/**
 * Export the network graph as a PNG image
 */
export async function exportGraphAsPNG(
  svgElement: SVGSVGElement | HTMLElement | null,
  filename: string = 'network-graph.png'
): Promise<void> {
  if (!svgElement) {
    throw new Error('SVG element not found');
  }

  try {
    const canvas = await html2canvas(svgElement as unknown as HTMLElement, {
      backgroundColor: '#0f172a',
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to export graph as PNG:', error);
    throw new Error('Failed to export graph as PNG');
  }
}

/**
 * Export the network graph as an SVG file
 */
export function exportGraphAsSVG(
  svgElement: SVGSVGElement | null,
  filename: string = 'network-graph.svg'
): void {
  if (!svgElement) {
    throw new Error('SVG element not found');
  }

  try {
    // Clone the SVG element to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

    // Ensure the SVG has proper attributes for standalone viewing
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSvg.setAttribute('version', '1.1');

    // Serialize the SVG to a string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);

    // Create a blob and download
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Failed to export graph as SVG:', error);
    throw new Error('Failed to export graph as SVG');
  }
}

/**
 * Export the network graph data as JSON
 */
export function exportGraphAsJSON(
  nodes: Node[],
  links: Link[],
  title: string = 'Network Graph',
  filename: string = 'network-graph.json'
): void {
  try {
    const graphData: GraphData = {
      nodes,
      links,
      title,
      exportedAt: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(graphData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Failed to export graph as JSON:', error);
    throw new Error('Failed to export graph as JSON');
  }
}

/**
 * Export the network graph as CSV (edge list format)
 */
export function exportGraphAsCSV(
  nodes: Node[],
  links: Link[],
  filename: string = 'network-graph.csv'
): void {
  try {
    // Create CSV header
    const headers = ['Source', 'Target', 'Strength', 'Type', 'SourceType', 'TargetType'];
    const rows: string[] = [headers.join(',')];

    // Add each link as a row
    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);

      const row = [
        `"${link.source}"`,
        `"${link.target}"`,
        link.strength.toFixed(2),
        `"${link.type}"`,
        `"${sourceNode?.type || 'unknown'}"`,
        `"${targetNode?.type || 'unknown'}"`,
      ];
      rows.push(row.join(','));
    });

    const csvString = rows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Failed to export graph as CSV:', error);
    throw new Error('Failed to export graph as CSV');
  }
}

/**
 * Generate a summary of the graph data
 */
export function generateGraphSummary(nodes: Node[], links: Link[]): string {
  const subjectNodes = nodes.filter(n => n.type === 'subject');
  const associateNodes = nodes.filter(n => n.type === 'associate');
  const locationNodes = nodes.filter(n => n.type === 'location');
  const accountNodes = nodes.filter(n => n.type === 'account');
  const employerNodes = nodes.filter(n => n.type === 'employer');

  const avgStrength = links.length > 0
    ? (links.reduce((sum, l) => sum + l.strength, 0) / links.length).toFixed(2)
    : '0.00';

  return `
Network Graph Summary
====================
Generated: ${new Date().toISOString()}

Nodes:
- Total: ${nodes.length}
- Subjects: ${subjectNodes.length}
- Associates: ${associateNodes.length}
- Locations: ${locationNodes.length}
- Accounts: ${accountNodes.length}
- Employers: ${employerNodes.length}

Connections:
- Total Links: ${links.length}
- Average Strength: ${avgStrength}
- Strongest Link: ${links.length > 0 ? Math.max(...links.map(l => l.strength)).toFixed(2) : 'N/A'}
- Weakest Link: ${links.length > 0 ? Math.min(...links.map(l => l.strength)).toFixed(2) : 'N/A'}
  `.trim();
}
