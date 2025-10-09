export type EditorJsListStyle = 'ordered' | 'unordered';

export interface EditorJsBlockBase<TType extends string, TData extends Record<string, unknown>> {
    type: TType;
    data: TData;
}

export type EditorJsParagraphBlock = EditorJsBlockBase<'paragraph', { text: string }>;
export type EditorJsHeaderBlock = EditorJsBlockBase<'header', { text: string; level: number }>;
export type EditorJsListBlock = EditorJsBlockBase<'list', { style: EditorJsListStyle; items: string[] }>;
export type EditorJsQuoteBlock = EditorJsBlockBase<'quote', { text: string; caption?: string }>;
export type EditorJsCodeBlock = EditorJsBlockBase<'code', { code: string }>;
export type EditorJsDelimiterBlock = EditorJsBlockBase<'delimiter', Record<string, never>>;
export type EditorJsImageBlock = EditorJsBlockBase<'image', {
    file: { url: string };
    caption?: string;
    withBorder?: boolean;
    withBackground?: boolean;
    stretched?: boolean;
}>;
export type EditorJsRawBlock = EditorJsBlockBase<'raw', { html: string }>;
export type EditorJsTableBlock = EditorJsBlockBase<'table', { content: string[][] }>;
export type EditorJsEmbedBlock = EditorJsBlockBase<'embed', {
    service?: string;
    source?: string;
    embed?: string;
    width?: number;
    height?: number;
    caption?: string;
}>;
export type EditorJsChecklistBlock = EditorJsBlockBase<'checklist', { items: { text: string; checked?: boolean }[] }>;
export type EditorJsWarningBlock = EditorJsBlockBase<'warning', { title?: string; message?: string }>;
export type EditorJsLinkToolBlock = EditorJsBlockBase<'linkTool', { link: string; meta?: Record<string, unknown> }>;

export type EditorJsBlock =
    | EditorJsParagraphBlock
    | EditorJsHeaderBlock
    | EditorJsListBlock
    | EditorJsQuoteBlock
    | EditorJsCodeBlock
    | EditorJsDelimiterBlock
    | EditorJsImageBlock
    | EditorJsRawBlock
    | EditorJsTableBlock
    | EditorJsEmbedBlock
    | EditorJsChecklistBlock
    | EditorJsWarningBlock
    | EditorJsLinkToolBlock
    | EditorJsBlockBase<string, Record<string, unknown>>;

export interface EditorJsData {
    time?: number;
    version?: string;
    blocks: EditorJsBlock[];
}

const EDITOR_JS_VERSION = '2.29.1';

const htmlEntities: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: '\'',
    nbsp: ' ',
};

const decodeHtmlEntities = (value: string): string =>
    value.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (_match, entity: string) => {
        if (!entity) {
            return '';
        }

        if (entity[0] === '#') {
            const isHex = entity[1]?.toLowerCase() === 'x';
            const codePoint = isHex
                ? parseInt(entity.slice(2), 16)
                : parseInt(entity.slice(1), 10);
            if (Number.isNaN(codePoint)) {
                return '';
            }
            return String.fromCodePoint(codePoint);
        }

        const lower = entity.toLowerCase();
        return htmlEntities[lower] ?? '';
    });

const allowedInlineTags = ['strong', 'b', 'em', 'i', 'u', 'span', 'a', 'mark', 'code', 'sup', 'sub', 'br'];

const sanitizeInlineHtml = (value: string): string => {
    const withoutDisallowed = value.replace(
        /<(?!\/?(?:strong|b|em|i|u|span|a|mark|code|sup|sub|br)([\s>]))[^>]*>/gi,
        ''
    );
    return decodeHtmlEntities(withoutDisallowed).trim();
};

const sanitizeText = (value: string): string => {
    const withLineBreaks = value.replace(/<br\s*\/?>(\s*)/gi, '\n');
    const stripped = withLineBreaks.replace(/<[^>]+>/g, '');
    return decodeHtmlEntities(stripped).replace(/\s+/g, ' ').trim();
};

const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const escapeAttribute = (value: string): string =>
    escapeHtml(value).replace(/\n/g, ' ');

const wrapTag = (tag: string, content: string): string => `<${tag}>${content}</${tag}>`;

export const isEditorJsData = (value: unknown): value is EditorJsData =>
    Boolean(
        value &&
        typeof value === 'object' &&
        Array.isArray((value as EditorJsData).blocks)
    );

const createEmptyEditorData = (): EditorJsData => ({
    time: Date.now(),
    version: EDITOR_JS_VERSION,
    blocks: [],
});

const renderList = (block: EditorJsListBlock): string => {
    const tag = block.data.style === 'ordered' ? 'ol' : 'ul';
    const items = block.data.items
        .map((item) => `<li>${item}</li>`)
        .join('');
    return `<${tag}>${items}</${tag}>`;
};

const renderImage = (block: EditorJsImageBlock): string | null => {
    const url = block.data.file?.url ?? '';
    if (!url) {
        return null;
    }

    const caption = block.data.caption ? `<figcaption>${block.data.caption}</figcaption>` : '';
    const attributes = [
        `src="${escapeAttribute(url)}"`,
        block.data.caption ? `alt="${escapeAttribute(block.data.caption)}"` : 'alt=""',
    ];

    const figureClasses: string[] = [];
    if (block.data.withBorder) {
        figureClasses.push('with-border');
    }
    if (block.data.withBackground) {
        figureClasses.push('with-background');
    }
    if (block.data.stretched) {
        figureClasses.push('stretched');
    }

    const figureClassAttr = figureClasses.length ? ` class="${figureClasses.join(' ')}"` : '';

    return `<figure${figureClassAttr}><img ${attributes.join(' ')} />${caption}</figure>`;
};

const renderEmbed = (block: EditorJsEmbedBlock): string | null => {
    if (!block.data.embed && !block.data.source) {
        return null;
    }

    const url = block.data.embed ?? block.data.source ?? '';
    const caption = block.data.caption ? `<figcaption>${block.data.caption}</figcaption>` : '';
    const iframeAttributes = [
        `src="${escapeAttribute(url)}"`,
        'frameborder="0"',
    ];

    if (block.data.width) {
        iframeAttributes.push(`width="${block.data.width}"`);
    }
    if (block.data.height) {
        iframeAttributes.push(`height="${block.data.height}"`);
    }

    const serviceClass = block.data.service ? ` class="embed-${block.data.service}"` : '';

    return `<figure${serviceClass}><iframe ${iframeAttributes.join(' ')} allowfullscreen></iframe>${caption}</figure>`;
};

const renderChecklist = (block: EditorJsChecklistBlock): string => {
    const items = block.data.items
        .map((item) => {
            const checkbox = item.checked ? '☑' : '☐';
            return `<li>${checkbox} ${item.text}</li>`;
        })
        .join('');
    return `<ul class="checklist">${items}</ul>`;
};

const renderTable = (block: EditorJsTableBlock): string => {
    const rows = block.data.content
        .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
        .join('');
    return `<table><tbody>${rows}</tbody></table>`;
};

const renderBlock = (block: EditorJsBlock): string | null => {
    switch (block.type) {
        case 'paragraph': {
            const data = block.data as EditorJsParagraphBlock['data'];
            const text = typeof data.text === 'string' ? data.text : '';
            return wrapTag('p', text);
        }
        case 'header': {
            const data = block.data as EditorJsHeaderBlock['data'];
            const level = Math.min(Math.max(Number(data.level) || 1, 1), 6);
            const text = typeof data.text === 'string' ? data.text : '';
            return wrapTag(`h${level}`, text);
        }
        case 'list': {
            const data = block.data as EditorJsListBlock['data'];
            const style: EditorJsListStyle = data.style === 'ordered' ? 'ordered' : 'unordered';
            const items = Array.isArray(data.items)
                ? data.items.map((item) => (typeof item === 'string' ? item : String(item)))
                : [];
            const normalizedBlock: EditorJsListBlock = {
                type: 'list',
                data: { style, items },
            };
            return renderList(normalizedBlock);
        }
        case 'quote': {
            const data = block.data as EditorJsQuoteBlock['data'];
            const caption = data.caption ? `<cite>${data.caption}</cite>` : '';
            const text = typeof data.text === 'string' ? data.text : '';
            return `<blockquote><p>${text}</p>${caption}</blockquote>`;
        }
        case 'code': {
            const data = block.data as EditorJsCodeBlock['data'];
            return `<pre><code>${escapeHtml(typeof data.code === 'string' ? data.code : '')}</code></pre>`;
        }
        case 'delimiter':
            return '<hr />';
        case 'image': {
            const data = block.data as EditorJsImageBlock['data'];
            const normalizedBlock: EditorJsImageBlock = {
                type: 'image',
                data: {
                    file: { url: typeof data?.file?.url === 'string' ? data.file.url : '' },
                    caption: typeof data.caption === 'string' ? data.caption : undefined,
                    withBorder: Boolean(data.withBorder),
                    withBackground: Boolean(data.withBackground),
                    stretched: Boolean(data.stretched),
                },
            };
            return renderImage(normalizedBlock);
        }
        case 'raw': {
            const data = block.data as EditorJsRawBlock['data'];
            return typeof data.html === 'string' ? data.html : '';
        }
        case 'table': {
            const data = block.data as EditorJsTableBlock['data'];
            const content = Array.isArray(data.content)
                ? data.content.map((row) => (Array.isArray(row) ? row.map((cell) => String(cell)) : []))
                : [];
            const normalizedBlock: EditorJsTableBlock = {
                type: 'table',
                data: { content },
            };
            return renderTable(normalizedBlock);
        }
        case 'embed': {
            const data = block.data as EditorJsEmbedBlock['data'];
            const normalizedBlock: EditorJsEmbedBlock = {
                type: 'embed',
                data: {
                    service: typeof data.service === 'string' ? data.service : undefined,
                    source: typeof data.source === 'string' ? data.source : undefined,
                    embed: typeof data.embed === 'string' ? data.embed : undefined,
                    width: typeof data.width === 'number' ? data.width : undefined,
                    height: typeof data.height === 'number' ? data.height : undefined,
                    caption: typeof data.caption === 'string' ? data.caption : undefined,
                },
            };
            return renderEmbed(normalizedBlock);
        }
        case 'checklist': {
            const data = block.data as EditorJsChecklistBlock['data'];
            const items = Array.isArray(data.items)
                ? data.items.map((item) => ({
                      text: typeof item?.text === 'string' ? item.text : String(item?.text ?? ''),
                      checked: Boolean(item?.checked),
                  }))
                : [];
            const normalizedBlock: EditorJsChecklistBlock = {
                type: 'checklist',
                data: { items },
            };
            return renderChecklist(normalizedBlock);
        }
        case 'warning': {
            const data = block.data as EditorJsWarningBlock['data'];
            const title = data.title ? `<strong>${data.title}</strong>` : '';
            const message = data.message ? `<span>${data.message}</span>` : '';
            return `<div class="warning">${title}${message}</div>`;
        }
        case 'linkTool': {
            const data = block.data as EditorJsLinkToolBlock['data'];
            const link = typeof data.link === 'string' ? data.link : '';
            if (!link) {
                return null;
            }
            const meta = data.meta as { title?: unknown } | undefined;
            const title = meta && typeof meta.title === 'string'
                ? meta.title
                : link;
            return `<p><a href="${escapeAttribute(link)}" rel="noopener noreferrer">${title}</a></p>`;
        }
        default:
            if (block.data && typeof block.data === 'object' && 'text' in block.data) {
                return wrapTag('p', String((block.data as { text: unknown }).text ?? ''));
            }
            return null;
    }
};

export const convertEditorJsToHtml = (input: unknown): string | undefined => {
    if (input == null) {
        return undefined;
    }

    if (typeof input === 'string') {
        return input;
    }

    if (!isEditorJsData(input)) {
        return undefined;
    }

    const html = input.blocks
        .map((block) => renderBlock(block))
        .filter((segment): segment is string => Boolean(segment && segment.length > 0))
        .join('\n');

    return html;
};

const extractListItems = (html: string): string[] => {
    const itemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    const items: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(html)) !== null) {
        const text = sanitizeInlineHtml(match[1]);
        if (text) {
            items.push(text);
        }
    }

    return items;
};

const extractChecklistItems = (html: string): { text: string; checked: boolean }[] => {
    const itemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    const items: { text: string; checked: boolean }[] = [];
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(html)) !== null) {
        const raw = match[1];
        const checked = /\bchecked\b/i.test(raw) || /☑/.test(raw);
        const text = sanitizeInlineHtml(raw.replace(/\bchecked\b/i, '').replace(/[☐☑]/g, ''));
        if (text) {
            items.push({ text, checked });
        }
    }

    return items;
};

const extractTableRows = (html: string): string[][] => {
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const rows: string[][] = [];
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowRegex.exec(html)) !== null) {
        const rowContent = rowMatch[1];
        const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
        const row: string[] = [];
        let cellMatch: RegExpExecArray | null;

        while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
            const text = sanitizeInlineHtml(cellMatch[1]);
            row.push(text);
        }

        rows.push(row);
    }

    return rows;
};

const extractImgAttribute = (html: string, attribute: string): string | undefined => {
    const regex = new RegExp(`${attribute}\\s*=\\s*"([^"]*)"`, 'i');
    const match = regex.exec(html);
    return match?.[1];
};

const removeProcessedSegment = (input: string, start: number, length: number): string => {
    return input.slice(start + length);
};

const trimLeadingWhitespace = (value: string): string => value.replace(/^\s+/, '');

export const convertHtmlToEditorJs = (html: unknown): EditorJsData => {
    if (isEditorJsData(html)) {
        return html;
    }

    if (typeof html !== 'string') {
        return createEmptyEditorData();
    }

    let remaining = html.trim();
    if (!remaining) {
        return createEmptyEditorData();
    }

    const blocks: EditorJsBlock[] = [];

    const pushParagraphFromText = (text: string) => {
        const sanitized = sanitizeText(text);
        if (sanitized) {
            blocks.push({ type: 'paragraph', data: { text: sanitized } });
        }
    };

    while (remaining.length) {
        const regex = /<(h[1-6]|p|ul|ol|blockquote|pre|hr|img|table)[^>]*>([\s\S]*?)(?:<\/\1>)?/i;
        const match = regex.exec(remaining);

        if (!match) {
            pushParagraphFromText(remaining);
            break;
        }

        const [fullMatch, tagName, innerHtml = ''] = match;
        const startIndex = match.index ?? 0;

        if (startIndex > 0) {
            const preceding = remaining.slice(0, startIndex);
            pushParagraphFromText(preceding);
        }

        const lowerTag = tagName.toLowerCase();

        switch (lowerTag) {
            case 'p': {
                const text = sanitizeInlineHtml(innerHtml);
                if (text) {
                    blocks.push({ type: 'paragraph', data: { text } });
                }
                break;
            }
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6': {
                const text = sanitizeInlineHtml(innerHtml);
                const level = Number(lowerTag[1]) || 1;
                if (text) {
                    blocks.push({ type: 'header', data: { text, level } });
                }
                break;
            }
            case 'ul':
            case 'ol': {
                const checklistHint = /type\s*=\s*"checkbox"/i.test(innerHtml) || /[☑☐]/.test(innerHtml);
                if (checklistHint) {
                    const checklistItems = extractChecklistItems(innerHtml);
                    if (checklistItems.length) {
                        blocks.push({
                            type: 'checklist',
                            data: { items: checklistItems },
                        });
                        break;
                    }
                }

                const items = extractListItems(innerHtml);
                if (items.length) {
                    blocks.push({
                        type: 'list',
                        data: { style: lowerTag === 'ol' ? 'ordered' : 'unordered', items },
                    });
                }
                break;
            }
            case 'blockquote': {
                const citeMatch = /<cite[^>]*>([\s\S]*?)<\/cite>/i.exec(innerHtml);
                const caption = citeMatch ? sanitizeInlineHtml(citeMatch[1]) : undefined;
                const withoutCite = citeMatch ? innerHtml.replace(citeMatch[0], '') : innerHtml;
                const text = sanitizeInlineHtml(withoutCite);
                if (text) {
                    blocks.push({ type: 'quote', data: { text, caption } });
                }
                break;
            }
            case 'pre': {
                const codeContent = innerHtml.replace(/<\/?code[^>]*>/gi, '');
                const text = decodeHtmlEntities(codeContent);
                if (text.trim()) {
                    blocks.push({ type: 'code', data: { code: text.trim() } });
                }
                break;
            }
            case 'hr': {
                blocks.push({ type: 'delimiter', data: {} });
                break;
            }
            case 'img': {
                const src = extractImgAttribute(fullMatch, 'src');
                if (src) {
                    const caption = extractImgAttribute(fullMatch, 'alt');
                    blocks.push({
                        type: 'image',
                        data: {
                            file: { url: src },
                            caption: caption ? decodeHtmlEntities(caption) : undefined,
                            withBorder: /border/i.test(fullMatch),
                            withBackground: /background/i.test(fullMatch),
                            stretched: /stretched/i.test(fullMatch),
                        },
                    });
                }
                break;
            }
            case 'table': {
                const rows = extractTableRows(innerHtml);
                if (rows.length) {
                    blocks.push({ type: 'table', data: { content: rows } });
                }
                break;
            }
            default: {
                pushParagraphFromText(innerHtml);
            }
        }

        remaining = trimLeadingWhitespace(removeProcessedSegment(remaining, startIndex, fullMatch.length));
    }

    return {
        time: Date.now(),
        version: EDITOR_JS_VERSION,
        blocks,
    };
};
