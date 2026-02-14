import type { JSX } from 'react';

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { SelectionAlwaysOnDisplay } from '@lexical/react/LexicalSelectionAlwaysOnDisplay';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { CAN_USE_DOM } from '@lexical/utils';
import { useEffect, useState } from 'react';

import { useSettings } from '@/components/editor/context/SettingsContext';
import { useSharedHistoryContext } from '@/components/editor/context/SharedHistoryContext';

import AutoLinkPlugin from '@/components/editor/plugins/AutoLinkPlugin';
import CodeActionMenuPlugin from '@/components/editor/plugins/CodeActionMenuPlugin';
import CodeHighlightPrismPlugin from '@/components/editor/plugins/CodeHighlightPrismPlugin';
import CodeHighlightShikiPlugin from '@/components/editor/plugins/CodeHighlightShikiPlugin';
import CollapsiblePlugin from '@/components/editor/plugins/CollapsiblePlugin';
import ComponentPickerPlugin from '@/components/editor/plugins/ComponentPickerPlugin';
import ContextMenuPlugin from '@/components/editor/plugins/ContextMenuPlugin';
import DraggableBlockPlugin from '@/components/editor/plugins/DraggableBlockPlugin';
import FloatingLinkEditorPlugin from '@/components/editor/plugins/FloatingLinkEditorPlugin';
import FloatingTextFormatToolbarPlugin from '@/components/editor/plugins/FloatingTextFormatToolbarPlugin';
import LinkPlugin from '@/components/editor/plugins/LinkPlugin';
import ShortcutsPlugin from '@/components/editor/plugins/ShortcutsPlugin';
import TabFocusPlugin from '@/components/editor/plugins/TabFocusPlugin';
import TableCellActionMenuPlugin from '@/components/editor/plugins/TableActionMenuPlugin';
import TableCellResizer from '@/components/editor/plugins/TableCellResizer';
import TableHoverActionsPlugin from '@/components/editor/plugins/TableHoverActionsPlugin';
import TableOfContentsPlugin from '@/components/editor/plugins/TableOfContentsPlugin';
import ToolbarPlugin from '@/components/editor/plugins/ToolbarPlugin';
import ImagesPlugin from '@/components/editor/plugins/ImagesPlugin';
import YouTubePlugin from '@/components/editor/plugins/YouTubePlugin';
import PageBreakPlugin from '@/components/editor/plugins/PageBreakPlugin';
import ExcalidrawPlugin from '@/components/editor/plugins/ExcalidrawPlugin';
import ContentEditable from '@/components/editor/ui/ContentEditable';

export default function Editor(): JSX.Element {
  const { historyState } = useSharedHistoryContext();
  const {
    settings: {
      isCodeHighlighted,
      isCodeShiki,
      hasLinkAttributes,
      isRichText,
      showTableOfContents,
      shouldUseLexicalContextMenu,
      tableCellMerge,
      tableCellBackgroundColor,
      tableHorizontalScroll,
      selectionAlwaysOnDisplay,
      listStrictIndent,
    },
  } = useSettings();
  const isEditable = useLexicalEditable();
  const placeholder = isRichText
    ? 'Enter some rich text...'
    : 'Enter some plain text...';
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        CAN_USE_DOM && window.matchMedia('(max-width: 1025px)').matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener('resize', updateViewPortWidth);

    return () => {
      window.removeEventListener('resize', updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);

  return (
    <>
      <div className="sticky top-14 z-40 bg-white border-b border-gray-200">
        {isRichText && (
          <ToolbarPlugin
            editor={editor}
            activeEditor={activeEditor}
            setActiveEditor={setActiveEditor}
            setIsLinkEditMode={setIsLinkEditMode}
          />
        )}
      </div>
      {isRichText && (
        <ShortcutsPlugin
          editor={activeEditor}
          setIsLinkEditMode={setIsLinkEditMode}
        />
      )}
      <div
        className={`editor-container ${!isRichText ? 'plain-text' : ''
          }`}>
        <AutoFocusPlugin />
        {selectionAlwaysOnDisplay && <SelectionAlwaysOnDisplay />}
        <ClearEditorPlugin />
        <ComponentPickerPlugin />
        <HashtagPlugin />
        <AutoLinkPlugin />
        {isRichText ? (
          <>
            <RichTextPlugin
              contentEditable={
                <div className="editor-scroller">
                  <div className="editor" ref={onRef}>
                    <ContentEditable placeholder={placeholder} />
                  </div>
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            {isCodeHighlighted &&
              (isCodeShiki ? (
                <CodeHighlightShikiPlugin />
              ) : (
                <CodeHighlightPrismPlugin />
              ))}
            <ListPlugin hasStrictIndent={listStrictIndent} />
            <CheckListPlugin />
            <TablePlugin
              hasCellMerge={tableCellMerge}
              hasCellBackgroundColor={tableCellBackgroundColor}
              hasHorizontalScroll={tableHorizontalScroll}
            />
            <TableCellResizer />
            <LinkPlugin hasLinkAttributes={hasLinkAttributes} />
            <ClickableLinkPlugin disabled={isEditable} />
            <HorizontalRulePlugin />
            <TabFocusPlugin />
            <TabIndentationPlugin maxIndent={7} />
            <CollapsiblePlugin />
            <ImagesPlugin />
            <YouTubePlugin />
            <PageBreakPlugin />
            <ExcalidrawPlugin />
            {floatingAnchorElem && (
              <>
                <FloatingLinkEditorPlugin
                  anchorElem={floatingAnchorElem}
                  isLinkEditMode={isLinkEditMode}
                  setIsLinkEditMode={setIsLinkEditMode}
                />
                <TableCellActionMenuPlugin
                  anchorElem={floatingAnchorElem}
                  cellMerge={true}
                />
              </>
            )}
            {floatingAnchorElem && !isSmallWidthViewport && (
              <>
                <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
                <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
                <TableHoverActionsPlugin anchorElem={floatingAnchorElem} />
                <FloatingTextFormatToolbarPlugin
                  anchorElem={floatingAnchorElem}
                  setIsLinkEditMode={setIsLinkEditMode}
                />
              </>
            )}
          </>
        ) : (
          <>
            <PlainTextPlugin
              contentEditable={<ContentEditable placeholder={placeholder} />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin externalHistoryState={historyState} />
          </>
        )}
        <div>{showTableOfContents && <TableOfContentsPlugin />}</div>
        {shouldUseLexicalContextMenu && <ContextMenuPlugin />}
      </div>
    </>
  );
}
