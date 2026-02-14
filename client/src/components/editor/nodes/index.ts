// Lexical Nodes that need to be registered with the editor
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { HashtagNode } from '@lexical/hashtag';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { MarkNode } from '@lexical/mark';
import { OverflowNode } from '@lexical/overflow';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import type { Klass, LexicalNode } from 'lexical';

// Import custom Collapsible nodes
import { CollapsibleContainerNode } from '../plugins/CollapsiblePlugin/CollapsibleContainerNode';
import { CollapsibleContentNode } from '../plugins/CollapsiblePlugin/CollapsibleContentNode';
import { CollapsibleTitleNode } from '../plugins/CollapsiblePlugin/CollapsibleTitleNode';

// Import new nodes
import { ImageNode } from './ImageNode';
import { YouTubeNode } from './YouTubeNode';
import { PageBreakNode } from './PageBreakNode';
import { ExcalidrawNode } from './ExcalidrawNode';

// Export array of all nodes to register
export const PlaygroundNodes: Array<Klass<LexicalNode>> = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HashtagNode,
  AutoLinkNode,
  LinkNode,
  OverflowNode,
  HorizontalRuleNode,
  MarkNode,
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
  // New nodes
  ImageNode,
  YouTubeNode,
  PageBreakNode,
  ExcalidrawNode,
];

// Export individual nodes for use in plugins
export { ImageNode, YouTubeNode, PageBreakNode, ExcalidrawNode };

