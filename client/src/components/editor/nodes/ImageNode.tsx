/**
 * Image Node for Lexical Editor
 */
import type {
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    EditorConfig,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
} from 'lexical';

import { $applyNodeReplacement, DecoratorNode } from 'lexical';
import * as React from 'react';
import { Suspense } from 'react';

const ImageComponent = React.lazy(() => import('@/components/editor/nodes/ImageComponent'));

export interface ImagePayload {
    altText: string;
    height?: number;
    key?: NodeKey;
    maxWidth?: number;
    src: string;
    width?: number;
}

export type SerializedImageNode = Spread<
    {
        altText: string;
        height?: number;
        maxWidth: number;
        src: string;
        width?: number;
    },
    SerializedLexicalNode
>;

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
    const img = domNode as HTMLImageElement;
    if (img.src.startsWith('file:///')) {
        return null;
    }
    const { alt: altText, src, width, height } = img;
    const node = $createImageNode({ altText, height, src, width });
    return { node };
}

export class ImageNode extends DecoratorNode<React.JSX.Element> {
    __src: string;
    __altText: string;
    __width: 'inherit' | number;
    __height: 'inherit' | number;
    __maxWidth: number;

    static getType(): string {
        return 'image';
    }

    static clone(node: ImageNode): ImageNode {
        return new ImageNode(
            node.__src,
            node.__altText,
            node.__maxWidth,
            node.__width,
            node.__height,
            node.__key
        );
    }

    static importJSON(serializedNode: SerializedImageNode): ImageNode {
        const { altText, height, width, maxWidth, src } = serializedNode;
        return $createImageNode({
            altText,
            height,
            maxWidth,
            src,
            width,
        });
    }

    static importDOM(): DOMConversionMap | null {
        return {
            img: () => ({
                conversion: $convertImageElement,
                priority: 0,
            }),
        };
    }

    constructor(
        src: string,
        altText: string,
        maxWidth: number,
        width?: 'inherit' | number,
        height?: 'inherit' | number,
        key?: NodeKey
    ) {
        super(key);
        this.__src = src;
        this.__altText = altText;
        this.__maxWidth = maxWidth;
        this.__width = width || 'inherit';
        this.__height = height || 'inherit';
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('img');
        element.setAttribute('src', this.__src);
        element.setAttribute('alt', this.__altText);
        element.setAttribute('width', this.__width.toString());
        element.setAttribute('height', this.__height.toString());
        return { element };
    }

    exportJSON(): SerializedImageNode {
        return {
            altText: this.getAltText(),
            height: this.__height === 'inherit' ? 0 : this.__height,
            maxWidth: this.__maxWidth,
            src: this.getSrc(),
            type: 'image',
            version: 1,
            width: this.__width === 'inherit' ? 0 : this.__width,
        };
    }

    setWidthAndHeight(
        width: 'inherit' | number,
        height: 'inherit' | number
    ): void {
        const writable = this.getWritable();
        writable.__width = width;
        writable.__height = height;
    }

    createDOM(config: EditorConfig): HTMLElement {
        const span = document.createElement('span');
        const theme = config.theme;
        const className = theme.image;
        if (className !== undefined) {
            span.className = className;
        }
        return span;
    }

    updateDOM(): false {
        return false;
    }

    getSrc(): string {
        return this.__src;
    }

    getAltText(): string {
        return this.__altText;
    }

    decorate(_editor: LexicalEditor, config: EditorConfig): React.JSX.Element {
        return (
            <Suspense fallback={null}>
                <ImageComponent
                    src={this.__src}
                    altText={this.__altText}
                    width={this.__width}
                    height={this.__height}
                    maxWidth={this.__maxWidth}
                    nodeKey={this.getKey()}
                />
            </Suspense>
        );
    }
}

export function $createImageNode({
    altText,
    height,
    maxWidth = 500,
    src,
    width,
    key,
}: ImagePayload): ImageNode {
    return $applyNodeReplacement(
        new ImageNode(src, altText, maxWidth, width, height, key)
    );
}

export function $isImageNode(
    node: LexicalNode | null | undefined
): node is ImageNode {
    return node instanceof ImageNode;
}
