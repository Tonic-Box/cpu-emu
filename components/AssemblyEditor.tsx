'use client';

import React, { useRef, useLayoutEffect, useCallback, KeyboardEvent, useMemo } from 'react';

interface AssemblyEditorProps {
    value: string;
    onChange: (value: string) => void;
    currentSourceLine: number;
    onScroll?: (e: React.UIEvent<HTMLTextAreaElement>) => void;
    lineHeight?: number;
}

const INDENT = '\t'; // switch to spaces if you like

/* ---------- regex patterns (non-capturing groups) ---------- */
const SYNTAX_PATTERNS = {
    instruction:
        /\b(?:LOAD|MOV|LDR|STR|LDRI|STRI|LEA|SWAP|ADD|SUB|MUL|DIV|ADDI|SUBI|MULI|DIVI|MOD|MODI|POW|SQRT|ABS|NEG|INC|DEC|AND|OR|XOR|NOT|NAND|NOR|SHL|SHR|ROL|ROR|SETBIT|CLRBIT|TOGBIT|TESTBIT|POPCNT|CLZ|CMP|CMPI|TEST|TESTI|JMP|JEQ|JNE|JLT|JGT|JLE|JGE|JZ|JNZ|JC|JNC|JO|JNO|PUSH|POP|CALL|RET|PUSHA|POPA|PUSHF|POPF|STRLEN|STRCPY|STRCMP|STRCAT|INT|SYSCALL|IRET|CLI|STI|HLT|WAIT|NOP|HALT|RESET|DEBUG)\b/gi,
    register: /\b(?:R[0-7]|SP|LR|PC|IR)\b/g,
    immediate: /#-?\d+/g,
    comment: /;.*$/gm,
    label: /^\s*[A-Za-z_][A-Za-z0-9_]*:/gm,
    number: /\b\d+\b/g,
};

/* helper: are we already inside a <span> ? */
const insideSpan = (whole: string, offset: number) => {
    const before = whole.substring(0, offset);
    const opens = (before.match(/<span/g) || []).length;
    const closes = (before.match(/<\/span>/g) || []).length;
    return opens > closes;
};

const AssemblyEditor: React.FC<AssemblyEditorProps> = ({
    value,
    onChange,
    currentSourceLine,
    onScroll,
    lineHeight = 20,
}) => {
    /* refs -------------------------------------------------- */
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);

    /* syntax highlight (memoised) --------------------------- */
    const highlightedCode = useMemo(() => {
        let out = value;

        // comments first – nothing should override them
        out = out.replace(
            SYNTAX_PATTERNS.comment,
            (m) => `<span class="syntax-comment">${m}</span>`,
        );
        // labels
        out = out.replace(SYNTAX_PATTERNS.label, (m) => `<span class="syntax-label">${m}</span>`);

        // helper replace that skips spans
        const safeReplace = (src: string, pattern: RegExp, wrapClass: string) =>
            src.replace(pattern, (match, offset: number, whole: string) =>
                insideSpan(whole, offset) ? match : `<span class="${wrapClass}">${match}</span>`,
            );

        out = safeReplace(out, SYNTAX_PATTERNS.instruction, 'syntax-instruction');
        out = safeReplace(out, SYNTAX_PATTERNS.register, 'syntax-register');
        out = safeReplace(out, SYNTAX_PATTERNS.immediate, 'syntax-immediate');
        out = safeReplace(out, SYNTAX_PATTERNS.number, 'syntax-number');

        return out;
    }, [value]);

    /* scroll sync ------------------------------------------- */
    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLTextAreaElement>) => {
            const { scrollTop, scrollLeft } = e.currentTarget;
            if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = scrollTop;
            if (highlightRef.current) {
                highlightRef.current.scrollTop = scrollTop;
                highlightRef.current.scrollLeft = scrollLeft;
            }
            onScroll?.(e);
        },
        [onScroll],
    );

    useLayoutEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        const targetY = currentSourceLine * lineHeight;
        if (targetY < ta.scrollTop) ta.scrollTop = targetY;
        else if (targetY + lineHeight > ta.scrollTop + ta.clientHeight)
            ta.scrollTop = targetY + lineHeight - ta.clientHeight;
        if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = ta.scrollTop;
    }, [currentSourceLine, lineHeight]);

    /* caret util -------------------------------------------- */
    const setCaret = (pos: number) =>
        requestAnimationFrame(() => {
            const ta = textareaRef.current;
            if (ta) ta.selectionStart = ta.selectionEnd = pos;
        });

    /* tab / enter handling ---------------------------------- */
    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLTextAreaElement>) => {
            const ta = textareaRef.current;
            if (!ta) return;

            /* TAB & SHIFT-TAB */
            if (e.key === 'Tab') {
                e.preventDefault();
                const { selectionStart: s, selectionEnd: ePos } = ta;
                const before = value.slice(0, s);
                const selected = value.slice(s, ePos);
                const after = value.slice(ePos);

                if (e.shiftKey) {
                    const removed = selected.replace(/^(\t| {4})/gm, '');
                    onChange(before + removed + after);
                    setCaret(ePos - (selected.length - removed.length));
                } else {
                    if (s === ePos) {
                        onChange(before + INDENT + after);
                        setCaret(s + INDENT.length);
                    } else {
                        const indented = selected
                            .split('\n')
                            .map((l) => INDENT + l)
                            .join('\n');
                        onChange(before + indented + after);
                        setCaret(ePos + INDENT.length * indented.split('\n').length);
                    }
                }
                return;
            }

            /* ENTER auto-indent */
            if (e.key === 'Enter') {
                e.preventDefault();
                const { selectionStart: s, selectionEnd: ePos } = ta;
                const before = value.slice(0, s);
                const after = value.slice(ePos);
                const startOfLine = value.lastIndexOf('\n', s - 1) + 1;
                const leadWS = value.slice(startOfLine, s).match(/^\s*/)?.[0] ?? '';
                const insert = '\n' + leadWS;
                onChange(before + insert + after);
                setCaret(s + insert.length);
            }
        },
        [value, onChange],
    );

    /* line numbers ------------------------------------------ */
    const lines = value.split('\n');
    const totalLines = lines.length;

    const jumpToLine = (idx: number) => {
        const pos = lines.slice(0, idx).reduce((a, l) => a + l.length + 1, 0);
        textareaRef.current?.focus();
        setCaret(pos);
    };

    /* render ------------------------------------------------- */
    return (
        <div
            className="relative w-full h-full flex bg-gray-900 border border-gray-600 rounded overflow-hidden"
            data-oid="ckop3wx"
        >
            {/* gutter */}
            <div
                ref={lineNumbersRef}
                className="select-none bg-gray-800 text-gray-400 font-mono text-sm overflow-hidden"
                style={{ width: '3rem', lineHeight: `${lineHeight}px` }}
                data-oid="b.j0s62"
            >
                <div style={{ height: totalLines * lineHeight }} data-oid="a:23blv">
                    {lines.map((_, i) => (
                        <div
                            key={i}
                            onClick={() => jumpToLine(i)}
                            className={`text-right cursor-pointer px-1 ${
                                i === currentSourceLine
                                    ? 'bg-yellow-600 text-black font-bold'
                                    : 'hover:bg-gray-700'
                            }`}
                            style={{ height: `${lineHeight}px`, lineHeight: `${lineHeight}px` }}
                            data-oid="uhpu9es"
                        >
                            {i + 1}
                        </div>
                    ))}
                </div>
            </div>

            {/* highlight + textarea layers */}
            <div className="relative flex-1 bg-black overflow-hidden" data-oid="7z:g9mq">
                <div
                    ref={highlightRef}
                    className="absolute inset-0 font-mono text-sm whitespace-pre pointer-events-none overflow-auto pl-2 pr-4"
                    style={{ lineHeight: `${lineHeight}px` }}
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                    data-oid="z:t1lko"
                />

                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onScroll={handleScroll}
                    className="absolute inset-0 font-mono text-sm resize-none border-none outline-none overflow-auto pl-2 pr-4 bg-transparent caret-white"
                    style={{
                        lineHeight: `${lineHeight}px`,
                        whiteSpace: 'pre',
                        color: 'transparent',
                    }}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    data-oid="cwc3vp5"
                />
            </div>
        </div>
    );
};

export default AssemblyEditor;
