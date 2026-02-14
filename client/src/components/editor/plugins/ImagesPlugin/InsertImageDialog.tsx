/**
 * Insert Image Dialog Component
 */
import type { LexicalEditor } from 'lexical';

import * as React from 'react';
import { useState, useRef } from 'react';

import Button from '@/components/editor/ui/Button';
import { DialogActions, DialogButtonsList } from '@/components/editor/ui/Dialog';
import TextInput from '@/components/editor/ui/TextInput';
import { INSERT_IMAGE_COMMAND } from './index';

export function InsertImageURLDialog({
    activeEditor,
    onClose,
}: {
    activeEditor: LexicalEditor;
    onClose: () => void;
}): React.JSX.Element {
    const [src, setSrc] = useState('');
    const [altText, setAltText] = useState('');

    const isDisabled = src === '';

    const handleSubmit = () => {
        if (!isDisabled) {
            activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                altText,
                src,
            });
            onClose();
        }
    };

    return (
        <>
            <TextInput
                label="Image URL"
                placeholder="https://example.com/image.jpg"
                onChange={setSrc}
                value={src}
                data-test-id="image-modal-url-input"
            />
            <TextInput
                label="Alt Text"
                placeholder="Describe the image"
                onChange={setAltText}
                value={altText}
                data-test-id="image-modal-alt-text-input"
            />
            <DialogActions>
                <Button
                    data-test-id="image-modal-confirm-btn"
                    disabled={isDisabled}
                    onClick={handleSubmit}>
                    Confirm
                </Button>
            </DialogActions>
        </>
    );
}

export function InsertImageUploadDialog({
    activeEditor,
    onClose,
}: {
    activeEditor: LexicalEditor;
    onClose: () => void;
}): React.JSX.Element {
    const [src, setSrc] = useState('');
    const [altText, setAltText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isDisabled = src === '';

    const loadImage = (files: FileList | null) => {
        if (files === null || files.length === 0) return;
        const reader = new FileReader();
        reader.onload = function () {
            if (typeof reader.result === 'string') {
                setSrc(reader.result);
            }
        };
        reader.readAsDataURL(files[0]);
    };

    const handleSubmit = () => {
        if (!isDisabled) {
            activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                altText,
                src,
            });
            onClose();
        }
    };

    const handleChooseFile = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => loadImage(e.target.files)}
                style={{ display: 'none' }}
                data-test-id="image-modal-file-input"
            />
            <div style={{ marginBottom: '15px' }}>
                <Button onClick={handleChooseFile} data-test-id="image-modal-choose-file-btn">
                    Choose Image File
                </Button>
            </div>
            <TextInput
                label="Alt Text"
                placeholder="Describe the image"
                onChange={setAltText}
                value={altText}
                data-test-id="image-modal-alt-text-input"
            />
            {src && (
                <div style={{ marginTop: '10px' }}>
                    <img
                        src={src}
                        alt={altText || 'Preview'}
                        style={{ maxWidth: '100%', maxHeight: '200px' }}
                    />
                </div>
            )}
            <DialogActions>
                <Button
                    data-test-id="image-modal-confirm-btn"
                    disabled={isDisabled}
                    onClick={handleSubmit}>
                    Confirm
                </Button>
            </DialogActions>
        </>
    );
}

export function InsertImageDialog({
    activeEditor,
    onClose,
}: {
    activeEditor: LexicalEditor;
    onClose: () => void;
}): React.JSX.Element {
    const [mode, setMode] = useState<null | 'file' | 'url'>(null);

    if (mode === 'url') {
        return <InsertImageURLDialog activeEditor={activeEditor} onClose={onClose} />;
    }

    if (mode === 'file') {
        return <InsertImageUploadDialog activeEditor={activeEditor} onClose={onClose} />;
    }

    return (
        <>
            <DialogButtonsList>
                <Button
                    data-test-id="image-modal-option-url"
                    onClick={() => setMode('url')}>
                    URL
                </Button>
                <Button
                    data-test-id="image-modal-option-file"
                    onClick={() => setMode('file')}>
                    File
                </Button>
            </DialogButtonsList>
        </>
    );
}
