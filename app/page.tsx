'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import AssemblyEditor from '../components/AssemblyEditor';

export default function Page() {
    const [registers, setRegisters] = useState({
        R0: 0,
        R1: 0,
        R2: 0,
        R3: 0,
        R4: 0,
        R5: 0,
        R6: 0,
        R7: 0,
        SP: 255,
        LR: 0,
    });

    const [memory, setMemory] = useState(new Array(256).fill(0));
    const [pc, setPc] = useState(0);
    const [ir, setIr] = useState(0);
    const [flags, setFlags] = useState({
        zero: false,
        carry: false,
        negative: false,
        overflow: false,
        interrupt: false,
    });

    const [asmCode, setAsmCode] =
        useState(`; =============================================================================
; Eight Dots Rotating Smoothly (Pixel-by-Pixel) on a Single Circle (128×64)
; • Center = (64,32), Radius = 20  
; • Eight dots, evenly spaced, moving in 32 steps per revolution (11.25° per step)  
; • Uses RAM to compute all 8 (X,Y) each frame before clearing/drawing to reduce flicker
; =============================================================================

; ----------------------------------------------------------------
; Memory Layout (byte-indexed)
; ----------------------------------------------------------------
; #01 = frame_index        ; 0–31, advances each frame
; #02–#09 = base_offsets   ; 8 entries: [0,4,8,12,16,20,24,28]
; #10–#41 = X_offsets      ; 32 entries: round(20·cos(2π·i/32))
; #42–#73 = Y_offsets      ; 32 entries: round(20·sin(2π·i/32))
; #74 = compute_index      ; 0–8, used to iterate 8 dots when computing positions
; #75 = draw_index         ; 0–8, used to iterate 8 dots when drawing
; #80–#87 = dotX[0..7]     ; computed X screen positions for each dot
; #88–#95 = dotY[0..7]     ; computed Y screen positions for each dot
; ----------------------------------------------------------------

; ------------------------------
; 1) Initialize Base Offsets (0,4,8,12,16,20,24,28)
; ------------------------------
LOAD R0, #0
STR  R0, #2       ; base_offsets[0] =  0
LOAD R0, #4
STR  R0, #3       ; base_offsets[1] =  4
LOAD R0, #8
STR  R0, #4       ; base_offsets[2] =  8
LOAD R0, #12
STR  R0, #5       ; base_offsets[3] = 12
LOAD R0, #16
STR  R0, #6       ; base_offsets[4] = 16
LOAD R0, #20
STR  R0, #7       ; base_offsets[5] = 20
LOAD R0, #24
STR  R0, #8       ; base_offsets[6] = 24
LOAD R0, #28
STR  R0, #9       ; base_offsets[7] = 28

; ------------------------------
; 2) Initialize 32-Step Circle Tables (radius = 20)
;    X_offsets[i] = round(20·cos(2π·i/32))
;    Y_offsets[i] = round(20·sin(2π·i/32))
;    – Store X_offsets at #10–#41
;    – Store Y_offsets at #42–#73
; ------------------------------

; --- X_offsets (i from  0 to 31) ---
LOAD R0, #20   ; i=0:   cos(0°)= 1.00 →  20
STR  R0, #10
LOAD R0, #20   ; i=1:   cos(11.25°)=0.9808→19.62→20
STR  R0, #11
LOAD R0, #18   ; i=2:   cos(22.5°)=0.9239→18.48→18
STR  R0, #12
LOAD R0, #17   ; i=3:   cos(33.75°)=0.8315→16.63→17
STR  R0, #13
LOAD R0, #14   ; i=4:   cos(45°)=0.7071→14.14→14
STR  R0, #14
LOAD R0, #11   ; i=5:   cos(56.25°)=0.5556→11.11→11
STR  R0, #15
LOAD R0, #8    ; i=6:   cos(67.5°)=0.3827→ 7.65→ 8
STR  R0, #16
LOAD R0, #4    ; i=7:   cos(78.75°)=0.1951→ 3.90→ 4
STR  R0, #17

LOAD R0, #0    ; i= 8:  cos(90°)= 0   → 0
STR  R0, #18
LOAD R0, #-4   ; i= 9:  cos(101.25°)=–0.1951→–3.90→–4
STR  R0, #19
LOAD R0, #-8   ; i=10:  cos(112.5°)=–0.3827→–7.65→–8
STR  R0, #20
LOAD R0, #-11  ; i=11:  cos(123.75°)=–0.5556→–11.11→–11
STR  R0, #21
LOAD R0, #-14  ; i=12:  cos(135°)=–0.7071→–14.14→–14
STR  R0, #22
LOAD R0, #-17  ; i=13:  cos(146.25°)=–0.8315→–16.63→–17
STR  R0, #23
LOAD R0, #-18  ; i=14:  cos(157.5°)=–0.9239→–18.48→–18
STR  R0, #24
LOAD R0, #-20  ; i=15:  cos(168.75°)=–0.9808→–19.62→–20
STR  R0, #25

LOAD R0, #-20  ; i=16:  cos(180°)=–1.00→–20
STR  R0, #26
LOAD R0, #-20  ; i=17:  cos(191.25°)=–0.9808→–19.62→–20
STR  R0, #27
LOAD R0, #-18  ; i=18:  cos(202.5°)=–0.9239→–18.48→–18
STR  R0, #28
LOAD R0, #-17  ; i=19:  cos(213.75°)=–0.8315→–16.63→–17
STR  R0, #29
LOAD R0, #-14  ; i=20:  cos(225°)=–0.7071→–14.14→–14
STR  R0, #30
LOAD R0, #-11  ; i=21:  cos(236.25°)=–0.5556→–11.11→–11
STR  R0, #31
LOAD R0, #-8   ; i=22:  cos(247.5°)=–0.3827→–7.65→–8
STR  R0, #32
LOAD R0, #-4   ; i=23:  cos(258.75°)=–0.1951→–3.90→–4
STR  R0, #33

LOAD R0, #0    ; i=24:  cos(270°)= 0   → 0
STR  R0, #34
LOAD R0, #4    ; i=25:  cos(281.25°)= 0.1951→ 3.90→ 4
STR  R0, #35
LOAD R0, #8    ; i=26:  cos(292.5°)= 0.3827→ 7.65→ 8
STR  R0, #36
LOAD R0, #11   ; i=27:  cos(303.75°)=0.5556→11.11→11
STR  R0, #37
LOAD R0, #14   ; i=28:  cos(315°)=   0.7071→14.14→14
STR  R0, #38
LOAD R0, #17   ; i=29:  cos(326.25°)=0.8315→16.63→17
STR  R0, #39
LOAD R0, #18   ; i=30:  cos(337.5°)= 0.9239→18.48→18
STR  R0, #40
LOAD R0, #20   ; i=31:  cos(348.75°)=0.9808→19.62→20
STR  R0, #41

; --- Y_offsets (i from  0 to 31) ---
LOAD R0, #0    ; i=0:   sin(0°)=   0 →  0
STR  R0, #42
LOAD R0, #4    ; i=1:   sin(11.25°)= 0.1951→ 3.90→ 4
STR  R0, #43
LOAD R0, #8    ; i=2:   sin(22.5°)= 0.3827→ 7.65→ 8
STR  R0, #44
LOAD R0, #12   ; i=3:   sin(33.75°)=0.5556→11.11→12
STR  R0, #45
LOAD R0, #14   ; i=4:   sin(45°)=    0.7071→14.14→14
STR  R0, #46
LOAD R0, #17   ; i=5:   sin(56.25°)=0.8315→16.63→17
STR  R0, #47
LOAD R0, #18   ; i=6:   sin(67.5°)=  0.9239→18.48→18
STR  R0, #48
LOAD R0, #20   ; i=7:   sin(78.75°)=0.9808→19.62→20
STR  R0, #49

LOAD R0, #20   ; i= 8:  sin(90°)=  1.00→20
STR  R0, #50
LOAD R0, #20   ; i= 9:  sin(101.25°)=0.9808→19.62→20
STR  R0, #51
LOAD R0, #18   ; i=10:  sin(112.5°)= 0.9239→18.48→18
STR  R0, #52
LOAD R0, #17   ; i=11:  sin(123.75°)=0.8315→16.63→17
STR  R0, #53
LOAD R0, #14   ; i=12:  sin(135°)=   0.7071→14.14→14
STR  R0, #54
LOAD R0, #12   ; i=13:  sin(146.25°)=0.5556→11.11→12
STR  R0, #55
LOAD R0, #8    ; i=14:  sin(157.5°)= 0.3827→ 7.65→ 8
STR  R0, #56
LOAD R0, #4    ; i=15:  sin(168.75°)=0.1951→ 3.90→ 4
STR  R0, #57

LOAD R0, #0    ; i=16:  sin(180°)=   0 → 0
STR  R0, #58
LOAD R0, #-4   ; i=17:  sin(191.25°)=–0.1951→–3.90→–4
STR  R0, #59
LOAD R0, #-8   ; i=18:  sin(202.5°)= –0.3827→–7.65→–8
STR  R0, #60
LOAD R0, #-12  ; i=19:  sin(213.75°)=–0.5556→–11.11→–12
STR  R0, #61
LOAD R0, #-14  ; i=20:  sin(225°)=   –0.7071→–14.14→–14
STR  R0, #62
LOAD R0, #-17  ; i=21:  sin(236.25°)=–0.8315→–16.63→–17
STR  R0, #63
LOAD R0, #-18  ; i=22:  sin(247.5°)= –0.9239→–18.48→–18
STR  R0, #64
LOAD R0, #-20  ; i=23:  sin(258.75°)=–0.9808→–19.62→–20
STR  R0, #65

LOAD R0, #-20  ; i=24:  sin(270°)= –1.00→–20
STR  R0, #66
LOAD R0, #-20  ; i=25:  sin(281.25°)=–0.9808→–19.62→–20
STR  R0, #67
LOAD R0, #-18  ; i=26:  sin(292.5°)= –0.9239→–18.48→–18
STR  R0, #68
LOAD R0, #-17  ; i=27:  sin(303.75°)=–0.8315→–16.63→–17
STR  R0, #69
LOAD R0, #-14  ; i=28:  sin(315°)=   –0.7071→–14.14→–14
STR  R0, #70
LOAD R0, #-12  ; i=29:  sin(326.25°)=–0.5556→–11.11→–12
STR  R0, #71
LOAD R0, #-8   ; i=30:  sin(337.5°)= –0.3827→–7.65→–8
STR  R0, #72
LOAD R0, #-4   ; i=31:  sin(348.75°)=–0.1951→–3.90→–4
STR  R0, #73

; ------------------------------
; 3) Initialize Frame & Indices
; ------------------------------
LOAD R0, #0
STR  R0, #1       ; frame_index = 0
LOAD R0, #0
STR  R0, #74      ; compute_index = 0
LOAD R0, #0
STR  R0, #75      ; draw_index    = 0

; ------------------------------
; 4) Main Animation Loop
; ------------------------------
main_loop:
    ; 4.1) Compute new positions for all 8 dots (store into RAM before clearing)
    LOAD R0, #0
    STR  R0, #74      ; compute_index ← 0

compute_loop:
    ; 4.1.1) Load compute_index (0..7)
    LDR   R0, #74         ; R0 = compute_index

    ; 4.1.2) If compute_index == 8 → done computing
    CMP   R0, #8
    JEQ   done_compute

    ; 4.1.3) Load base_offset = base_offsets[compute_index]
    ADDI  R1, R0, #2      ; address = 2 + compute_index
    LDRI  R2, R1          ; R2 = base_offset (one of 0,4,8,12,16,20,24,28)

    ; 4.1.4) Load frame_index (0..31)
    LDR   R3, #1          ; R3 = frame_index

    ; 4.1.5) rotated_index = (base_offset + frame_index) mod 32
    ADD   R4, R2, R3      ; R4 = base_offset + frame_index
    CMP   R4, #32
    JLT   no_wrap_compute
    SUBI  R4, R4, #32     ; wrap if ≥ 32
no_wrap_compute:

    ; 4.1.6) Load X_offset = X_offsets[rotated_index]
    MOV   R5, R4
    ADDI  R5, R5, #10     ; address = 10 + rotated_index
    LDRI  R6, R5          ; R6 = X_offset

    ; 4.1.7) Load Y_offset = Y_offsets[rotated_index]
    MOV   R5, R4
    ADDI  R5, R5, #42     ; address = 42 + rotated_index
    LDRI  R7, R5          ; R7 = Y_offset

    ; 4.1.8) Compute actual screen coords = (64 + X_offset, 32 + Y_offset)
    LOAD  R8, #64         ; R8 = centerX = 64
    ADD   R8, R8, R6      ; R8 = dotX

    LOAD  R9, #32         ; R9 = centerY = 32
    ADD   R9, R9, R7      ; R9 = dotY

    ; 4.1.9) Store computed X into dotX[compute_index], Y into dotY[compute_index]
    ;        dotX addresses: #80 + compute_index
    ;        dotY addresses: #88 + compute_index
    ADDI  R10, R0, #80    ; R10 = address for dotX[compute_index]
    STRI  R8, R10         ; RAM[R10] = dotX

    ADDI  R10, R0, #88    ; R10 = address for dotY[compute_index]
    STRI  R9, R10         ; RAM[R10] = dotY

    ; 4.1.10) Increment compute_index and loop
    LDR   R0, #74         ; R0 = compute_index
    INC   R0              ; R0 = compute_index + 1
    STR   R0, #74         ; update compute_index
    JMP   compute_loop

done_compute:
    ; 4.2) Clear entire screen now that all positions are precomputed
    INT #101

    ; 4.3) Draw all 8 dots from stored positions
    LOAD R0, #0
    STR  R0, #75      ; draw_index ← 0

draw_loop:
    ; 4.3.1) Load draw_index (0..7)
    LDR   R0, #75         ; R0 = draw_index

    ; 4.3.2) If draw_index == 8 → done drawing
    CMP   R0, #8
    JEQ   done_draw

    ; 4.3.3) Load Xpos = dotX[draw_index], Ypos = dotY[draw_index]
    ADDI  R1, R0, #80     ; addrX = 80 + draw_index
    LDRI  R2, R1          ; R2 = Xpos

    ADDI  R1, R0, #88     ; addrY = 88 + draw_index
    LDRI  R3, R1          ; R3 = Ypos

    ; 4.3.4) Draw a dot at (R2, R3)
    MOV   R0, R2          ; R0 = Xpos
    MOV   R1, R3          ; R1 = Ypos
    LOAD  R4, #1          ; R4 = color “on”
    INT   #102            ; set pixel

    ; 4.3.5) Increment draw_index, loop
    LDR   R0, #75         ; R0 = draw_index
    INC   R0              ; R0 = draw_index + 1
    STR   R0, #75         ; update draw_index
    JMP   draw_loop

done_draw:
    ; 4.4) Increment frame_index (wrap at 32)
    LDR   R0, #1          ; R0 = frame_index
    INC   R0              ; R0 = frame_index + 1
    CMP   R0, #32
    JLT   store_frame
    LOAD  R0, #0
store_frame:
    STR   R0, #1          ; update frame_index

    ; 4.5) Next frame → repeat compute & draw
    JMP   main_loop

; ------------------------------
; End of Program (unreachable)
; ------------------------------
HALT
`);

    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [currentLine, setCurrentLine] = useState(-1);
    const [currentSourceLine, setCurrentSourceLine] = useState(-1);
    const [lineMapping, setLineMapping] = useState([]);
    const [busActivity, setBusActivity] = useState({ address: null, data: null, type: null });
    const [stack, setStack] = useState([]);
    const [parsedInstructions, setParsedInstructions] = useState([]);
    const [stepMode, setStepMode] = useState(false);
    const [executionSpeed, setExecutionSpeed] = useState(0);
    const executionRef = useRef({ isExecuting: false, stopExecution: null });
    const audioContextRef = useRef(null);
    const [performanceStats, setPerformanceStats] = useState({
        instructionsPerSecond: 0,
        totalInstructions: 0,
        executionTime: 0,
    });

    // Pixeled screen state - 128x64 pixel display (higher resolution)
    const SCREEN_WIDTH = 128;
    const SCREEN_HEIGHT = 64;
    const [screenBuffer, setScreenBuffer] = useState(() =>
        new Array(SCREEN_HEIGHT).fill(null).map(() => new Array(SCREEN_WIDTH).fill(0)),
    );
    const [cursorX, setCursorX] = useState(0);
    const [cursorY, setCursorY] = useState(0);
    const [screenColor, setScreenColor] = useState('#00ff00'); // Default green
    const [mouseCursorX, setMouseCursorX] = useState(-1);
    const [mouseCursorY, setMouseCursorY] = useState(-1);

    // Keyboard input state
    const [keyboardBuffer, setKeyboardBuffer] = useState([]);
    const [keyboardInterruptEnabled, setKeyboardInterruptEnabled] = useState(false);
    const [lastKeyPressed, setLastKeyPressed] = useState(0);
    const [lastScanCode, setLastScanCode] = useState(0);
    const [keyboardStatus, setKeyboardStatus] = useState({
        shift: false,
        ctrl: false,
        alt: false,
        capsLock: false,
    });
    const [keyboardInterruptHandler, setKeyboardInterruptHandler] = useState(0);

    const instructions = {
        // Data Movement
        LOAD: { opcode: 0x01, format: 'reg,imm', desc: 'Load immediate value into register' },
        MOV: { opcode: 0x02, format: 'reg,reg', desc: 'Move value from one register to another' },
        LDR: { opcode: 0x03, format: 'reg,mem', desc: 'Load from memory address' },
        STR: { opcode: 0x04, format: 'reg,mem', desc: 'Store to memory address' },
        LDRI: { opcode: 0x05, format: 'reg,reg', desc: 'Load from memory address in register' },
        STRI: { opcode: 0x06, format: 'reg,reg', desc: 'Store to memory address in register' },
        LEA: { opcode: 0x07, format: 'reg,mem', desc: 'Load effective address' },
        SWAP: { opcode: 0x08, format: 'reg,reg', desc: 'Swap two registers' },

        // Basic Arithmetic Operations
        ADD: { opcode: 0x10, format: 'reg,reg,reg', desc: 'Add two registers' },
        SUB: { opcode: 0x11, format: 'reg,reg,reg', desc: 'Subtract registers' },
        MUL: { opcode: 0x12, format: 'reg,reg,reg', desc: 'Multiply registers' },
        DIV: { opcode: 0x13, format: 'reg,reg,reg', desc: 'Divide registers' },
        ADDI: { opcode: 0x14, format: 'reg,reg,imm', desc: 'Add immediate to register' },
        SUBI: { opcode: 0x15, format: 'reg,reg,imm', desc: 'Subtract immediate from register' },
        MULI: { opcode: 0x16, format: 'reg,reg,imm', desc: 'Multiply register by immediate' },
        DIVI: { opcode: 0x17, format: 'reg,reg,imm', desc: 'Divide register by immediate' },

        // Advanced Math Operations
        MOD: { opcode: 0x18, format: 'reg,reg,reg', desc: 'Modulo operation' },
        MODI: { opcode: 0x19, format: 'reg,reg,imm', desc: 'Modulo with immediate' },
        POW: { opcode: 0x1a, format: 'reg,reg,reg', desc: 'Power operation (base^exp)' },
        SQRT: { opcode: 0x1b, format: 'reg,reg', desc: 'Square root' },
        ABS: { opcode: 0x1c, format: 'reg,reg', desc: 'Absolute value' },
        NEG: { opcode: 0x1d, format: 'reg,reg', desc: 'Negate value' },
        INC: { opcode: 0x1e, format: 'reg', desc: 'Increment register by 1' },
        DEC: { opcode: 0x1f, format: 'reg', desc: 'Decrement register by 1' },

        // Logical Operations
        AND: { opcode: 0x20, format: 'reg,reg,reg', desc: 'Bitwise AND' },
        OR: { opcode: 0x21, format: 'reg,reg,reg', desc: 'Bitwise OR' },
        XOR: { opcode: 0x22, format: 'reg,reg,reg', desc: 'Bitwise XOR' },
        NOT: { opcode: 0x23, format: 'reg,reg', desc: 'Bitwise NOT' },
        SHL: { opcode: 0x24, format: 'reg,reg,imm', desc: 'Shift left' },
        SHR: { opcode: 0x25, format: 'reg,reg,imm', desc: 'Shift right' },
        ROL: { opcode: 0x26, format: 'reg,reg,imm', desc: 'Rotate left' },
        ROR: { opcode: 0x27, format: 'reg,reg,imm', desc: 'Rotate right' },
        NAND: { opcode: 0x28, format: 'reg,reg,reg', desc: 'Bitwise NAND' },
        NOR: { opcode: 0x29, format: 'reg,reg,reg', desc: 'Bitwise NOR' },

        // Bit Manipulation
        SETBIT: { opcode: 0x2a, format: 'reg,reg,imm', desc: 'Set bit at position' },
        CLRBIT: { opcode: 0x2b, format: 'reg,reg,imm', desc: 'Clear bit at position' },
        TOGBIT: { opcode: 0x2c, format: 'reg,reg,imm', desc: 'Toggle bit at position' },
        TESTBIT: { opcode: 0x2d, format: 'reg,imm', desc: 'Test bit at position' },
        POPCNT: { opcode: 0x2e, format: 'reg,reg', desc: 'Population count (count set bits)' },
        CLZ: { opcode: 0x2f, format: 'reg,reg', desc: 'Count leading zeros' },

        // Comparison Operations
        CMP: { opcode: 0x30, format: 'reg,reg', desc: 'Compare two registers' },
        CMPI: { opcode: 0x31, format: 'reg,imm', desc: 'Compare register with immediate' },
        TEST: { opcode: 0x32, format: 'reg,reg', desc: 'Test (AND without storing result)' },
        TESTI: { opcode: 0x33, format: 'reg,imm', desc: 'Test with immediate' },

        // Branch Operations
        JMP: { opcode: 0x40, format: 'imm', desc: 'Unconditional jump' },
        JEQ: { opcode: 0x41, format: 'imm', desc: 'Jump if equal' },
        JNE: { opcode: 0x42, format: 'imm', desc: 'Jump if not equal' },
        JLT: { opcode: 0x43, format: 'imm', desc: 'Jump if less than' },
        JGT: { opcode: 0x44, format: 'imm', desc: 'Jump if greater than' },
        JLE: { opcode: 0x45, format: 'imm', desc: 'Jump if less than or equal' },
        JGE: { opcode: 0x46, format: 'imm', desc: 'Jump if greater than or equal' },
        JZ: { opcode: 0x47, format: 'imm', desc: 'Jump if zero' },
        JNZ: { opcode: 0x48, format: 'imm', desc: 'Jump if not zero' },
        JC: { opcode: 0x49, format: 'imm', desc: 'Jump if carry' },
        JNC: { opcode: 0x4a, format: 'imm', desc: 'Jump if no carry' },
        JO: { opcode: 0x4b, format: 'imm', desc: 'Jump if overflow' },
        JNO: { opcode: 0x4c, format: 'imm', desc: 'Jump if no overflow' },

        // Stack Operations
        PUSH: { opcode: 0x50, format: 'reg', desc: 'Push register to stack' },
        POP: { opcode: 0x51, format: 'reg', desc: 'Pop from stack to register' },
        CALL: { opcode: 0x52, format: 'imm', desc: 'Call subroutine' },
        RET: { opcode: 0x53, format: 'none', desc: 'Return from subroutine' },
        PUSHA: { opcode: 0x54, format: 'none', desc: 'Push all registers' },
        POPA: { opcode: 0x55, format: 'none', desc: 'Pop all registers' },
        PUSHF: { opcode: 0x56, format: 'none', desc: 'Push flags register' },
        POPF: { opcode: 0x57, format: 'none', desc: 'Pop flags register' },

        // String Operations
        STRLEN: { opcode: 0x5b, format: 'reg,reg', desc: 'String length' },
        STRCPY: { opcode: 0x5c, format: 'reg,reg', desc: 'String copy' },
        STRCMP: { opcode: 0x5d, format: 'reg,reg', desc: 'String compare' },
        STRCAT: { opcode: 0x5e, format: 'reg,reg', desc: 'String concatenate' },

        // System Operations
        INT: { opcode: 0x60, format: 'imm', desc: 'Software interrupt' },
        SYSCALL: { opcode: 0x61, format: 'imm', desc: 'System call' },
        IRET: { opcode: 0x62, format: 'none', desc: 'Interrupt return' },
        CLI: { opcode: 0x63, format: 'none', desc: 'Clear interrupt flag' },
        STI: { opcode: 0x64, format: 'none', desc: 'Set interrupt flag' },
        HLT: { opcode: 0x65, format: 'none', desc: 'Halt until interrupt' },
        WAIT: { opcode: 0x66, format: 'imm', desc: 'Wait for specified cycles' },

        // Control Operations
        NOP: { opcode: 0x00, format: 'none', desc: 'No operation' },
        HALT: { opcode: 0xff, format: 'none', desc: 'Halt execution' },
        RESET: { opcode: 0xfe, format: 'none', desc: 'Reset processor' },
        DEBUG: { opcode: 0xfd, format: 'none', desc: 'Debug breakpoint' },
    };

    const systemInterrupts = {
        // Basic I/O
        1: 'PRINT_CHAR',
        2: 'PRINT_NEWLINE',
        3: 'PRINT_NUMBER',
        4: 'PRINT_STRING',
        5: 'READ_CHAR',
        6: 'READ_NUMBER',
        7: 'READ_STRING',

        // Screen Control
        8: 'CLEAR_SCREEN',
        9: 'SET_CURSOR',
        10: 'GET_CURSOR',
        11: 'SET_COLOR',
        12: 'SCROLL_UP',
        13: 'SCROLL_DOWN',
        14: 'DRAW_PIXEL',
        15: 'DRAW_LINE',
        16: 'DRAW_RECT',
        17: 'DRAW_CIRCLE',

        // New Graphics Interrupts
        101: 'SCREEN_CLEAR',
        102: 'SCREEN_SET_PIXEL',
        103: 'SCREEN_GET_PIXEL',
        104: 'SCREEN_SET_COLOR',
        105: 'SCREEN_DRAW_LINE',
        106: 'SCREEN_DRAW_RECT',
        107: 'SCREEN_FILL_RECT',
        108: 'SCREEN_DRAW_CIRCLE',
        109: 'SCREEN_SET_CURSOR',
        110: 'SCREEN_PRINT_CHAR',

        // File System
        18: 'FILE_OPEN',
        19: 'FILE_CLOSE',
        20: 'FILE_READ',
        21: 'FILE_WRITE',
        22: 'FILE_SEEK',
        23: 'FILE_DELETE',
        24: 'DIR_LIST',
        25: 'DIR_CREATE',

        // System Information
        26: 'GET_TIME',
        27: 'SET_TIME',
        28: 'GET_DATE',
        29: 'SET_DATE',
        30: 'GET_MEMORY_INFO',
        31: 'GET_CPU_INFO',
        32: 'GET_SYSTEM_INFO',

        // Random & Math
        33: 'RANDOM_NUMBER',
        34: 'RANDOM_SEED',
        35: 'MATH_PI',
        36: 'MATH_E',
        37: 'MATH_LOG',
        38: 'MATH_EXP',

        // Number Formatting
        39: 'PRINT_HEX',
        40: 'PRINT_BINARY',
        41: 'PRINT_OCTAL',
        42: 'PRINT_FLOAT',
        43: 'PRINT_SCIENTIFIC',
        44: 'FORMAT_NUMBER',

        // Sound & Audio
        45: 'BEEP',
        46: 'PLAY_TONE',
        47: 'PLAY_NOTE',
        48: 'SET_VOLUME',
        49: 'AUDIO_INIT',
        50: 'AUDIO_STOP',

        // Network
        51: 'NET_CONNECT',
        52: 'NET_DISCONNECT',
        53: 'NET_SEND',
        54: 'NET_RECEIVE',
        55: 'NET_STATUS',

        // Memory Management
        56: 'MALLOC',
        57: 'FREE',
        58: 'REALLOC',
        59: 'MEMINFO',
        60: 'GARBAGE_COLLECT',

        // Process Control
        61: 'PROCESS_CREATE',
        62: 'PROCESS_KILL',
        63: 'PROCESS_LIST',
        64: 'PROCESS_SWITCH',
        65: 'THREAD_CREATE',
        66: 'THREAD_JOIN',
        67: 'MUTEX_LOCK',
        68: 'MUTEX_UNLOCK',

        // Hardware Control
        69: 'PORT_READ',
        70: 'PORT_WRITE',
        71: 'DMA_TRANSFER',
        72: 'INTERRUPT_ENABLE',
        73: 'INTERRUPT_DISABLE',
        74: 'TIMER_SET',
        75: 'TIMER_GET',

        // Cryptography
        76: 'HASH_MD5',
        77: 'HASH_SHA256',
        78: 'ENCRYPT_AES',
        79: 'DECRYPT_AES',
        80: 'GENERATE_KEY',

        // Compression
        81: 'COMPRESS_DATA',
        82: 'DECOMPRESS_DATA',
        83: 'COMPRESS_STRING',
        84: 'DECOMPRESS_STRING',

        // Debug & Profiling
        85: 'DEBUG_PRINT',
        86: 'PROFILE_START',
        87: 'PROFILE_STOP',
        88: 'BENCHMARK',
        89: 'TRACE_ENABLE',
        90: 'TRACE_DISABLE',

        // Power Management
        91: 'POWER_SAVE',
        92: 'POWER_RESTORE',
        93: 'CPU_FREQUENCY',
        94: 'BATTERY_STATUS',
        95: 'THERMAL_STATUS',

        // Advanced I/O
        96: 'KEYBOARD_READ',
        97: 'KEYBOARD_STATUS',
        98: 'KEYBOARD_BUFFER_SIZE',
        99: 'KEYBOARD_CLEAR_BUFFER',
        100: 'KEYBOARD_SET_INTERRUPT',

        // Additional I/O
        111: 'MOUSE_READ',
        112: 'JOYSTICK_READ',
        113: 'SENSOR_READ',
        114: 'GPIO_SET',

        // Keyboard Interrupts (Hardware-style)
        120: 'KEYBOARD_INT_ENABLE',
        121: 'KEYBOARD_INT_DISABLE',
        122: 'KEYBOARD_INT_HANDLER',
        123: 'KEYBOARD_SCAN_CODE',
        124: 'KEYBOARD_ASCII_CODE',
    };

    const parseAssembly = (code) => {
        const allLines = code.split('\n');
        const parsedInstructions = [];
        const mapping = [];
        const labels = {};

        // First pass: collect labels and build instruction list
        allLines.forEach((line, sourceLineIndex) => {
            let trimmedLine = line.trim();

            // Handle blank lines and full-line comments as NOPs for clean debugging
            if (!trimmedLine || trimmedLine.startsWith(';')) {
                // Map this NOP instruction to its source line
                mapping.push(sourceLineIndex);
                parsedInstructions.push({
                    instruction: 'NOP',
                    args: [],
                    original: line,
                    sourceLineIndex,
                    isBlankOrComment: true, // Flag to identify these special NOPs
                });
            } else {
                // Remove inline comments (everything after semicolon)
                const commentIndex = trimmedLine.indexOf(';');
                if (commentIndex !== -1) {
                    trimmedLine = trimmedLine.substring(0, commentIndex).trim();
                }

                // Skip if line becomes empty after removing comment
                if (!trimmedLine) {
                    mapping.push(sourceLineIndex);
                    parsedInstructions.push({
                        instruction: 'NOP',
                        args: [],
                        original: line,
                        sourceLineIndex,
                        isBlankOrComment: true,
                    });
                    return;
                }

                if (trimmedLine.includes(':')) {
                    // Handle labels
                    const colonIndex = trimmedLine.indexOf(':');
                    const labelName = trimmedLine.substring(0, colonIndex).trim();
                    const remainingLine = trimmedLine.substring(colonIndex + 1).trim();

                    // Store label with current instruction index
                    labels[labelName] = parsedInstructions.length;

                    // If there's an instruction after the label on the same line, process it
                    if (remainingLine) {
                        const parts = remainingLine
                            .split(/[\s,]+/)
                            .filter((part) => part.length > 0);
                        const instruction = parts[0].toUpperCase();
                        const args = parts.slice(1);

                        mapping.push(sourceLineIndex);
                        parsedInstructions.push({
                            instruction,
                            args,
                            original: line,
                            sourceLineIndex,
                            isBlankOrComment: false,
                            label: labelName,
                        });
                    } else {
                        // Label on its own line - add a NOP to maintain position
                        mapping.push(sourceLineIndex);
                        parsedInstructions.push({
                            instruction: 'NOP',
                            args: [],
                            original: line,
                            sourceLineIndex,
                            isBlankOrComment: true,
                            label: labelName,
                        });
                    }
                } else {
                    // Process actual instructions
                    const parts = trimmedLine.split(/[\s,]+/).filter((part) => part.length > 0);
                    if (parts.length > 0) {
                        const instruction = parts[0].toUpperCase();
                        const args = parts.slice(1);

                        // Map this parsed instruction to its source line
                        mapping.push(sourceLineIndex);
                        parsedInstructions.push({
                            instruction,
                            args,
                            original: line,
                            sourceLineIndex,
                            isBlankOrComment: false,
                        });
                    } else {
                        // Empty instruction line
                        mapping.push(sourceLineIndex);
                        parsedInstructions.push({
                            instruction: 'NOP',
                            args: [],
                            original: line,
                            sourceLineIndex,
                            isBlankOrComment: true,
                        });
                    }
                }
            }
        });

        // Second pass: resolve label references
        parsedInstructions.forEach((instr) => {
            if (instr.args) {
                instr.args = instr.args.map((arg) => {
                    // Check if argument is a label reference
                    if (labels.hasOwnProperty(arg)) {
                        return `#${labels[arg]}`;
                    }
                    return arg;
                });
            }
        });

        setLineMapping(mapping);
        return parsedInstructions;
    };

    // Hyper-optimized fast execution function with minimal object creation
    const executeInstructionFast = (
        instruction,
        args,
        currentRegisters,
        currentFlags,
        currentMemory,
        currentStack,
        currentOutput,
        currentScreenBuffer,
        currentCursorX,
        currentCursorY,
        currentScreenColor,
    ) => {
        // Pre-allocate result object to avoid repeated object creation
        let result = {
            registers: currentRegisters,
            flags: currentFlags,
            memory: currentMemory,
            stack: currentStack,
            output: currentOutput,
            screenBuffer: currentScreenBuffer,
            cursorX: currentCursorX,
            cursorY: currentCursorY,
            screenColor: currentScreenColor,
            shouldContinue: true,
            newPC: undefined,
        };

        // Only clone objects when they're actually modified
        let registersModified = false;
        let flagsModified = false;
        let memoryModified = false;
        let stackModified = false;
        let outputModified = false;
        let screenModified = false;

        switch (instruction) {
            case 'LOAD':
                if (!registersModified) {
                    result.registers = { ...currentRegisters };
                    registersModified = true;
                }
                const reg = args[0];
                const value = parseInt(args[1].replace('#', ''));
                result.registers[reg] = value;
                break;

            case 'MOV':
                if (!registersModified) {
                    result.registers = { ...currentRegisters };
                    registersModified = true;
                }
                const destReg = args[0];
                const srcReg = args[1];
                result.registers[destReg] = currentRegisters[srcReg];
                break;

            case 'LDR':
                if (!registersModified) {
                    result.registers = { ...currentRegisters };
                    registersModified = true;
                }
                const loadReg = args[0];
                const memAddr = parseInt(args[1].replace('#', ''));
                result.registers[loadReg] = currentMemory[memAddr] || 0;
                break;

            case 'STR':
                if (!memoryModified) {
                    result.memory = [...currentMemory];
                    memoryModified = true;
                }
                const storeReg = args[0];
                const storeAddr = parseInt(args[1].replace('#', ''));
                result.memory[storeAddr] = currentRegisters[storeReg];
                break;

            case 'LDRI':
                if (!registersModified) {
                    result.registers = { ...currentRegisters };
                    registersModified = true;
                }
                const loadIndirectReg = args[0];
                const loadIndirectAddrReg = args[1];
                const loadIndirectAddr = currentRegisters[loadIndirectAddrReg];
                result.registers[loadIndirectReg] = currentMemory[loadIndirectAddr] || 0;
                break;

            case 'STRI':
                if (!memoryModified) {
                    result.memory = [...currentMemory];
                    memoryModified = true;
                }
                const storeIndirectReg = args[0];
                const storeIndirectAddrReg = args[1];
                const storeIndirectAddr = currentRegisters[storeIndirectAddrReg];
                result.memory[storeIndirectAddr] = currentRegisters[storeIndirectReg];
                break;

            case 'ADD':
                if (!registersModified) {
                    result.registers = { ...currentRegisters };
                    registersModified = true;
                }
                if (!flagsModified) {
                    result.flags = { ...currentFlags };
                    flagsModified = true;
                }
                const addDest = args[0];
                const addSrc1 = args[1];
                const addSrc2 = args[2];
                const addResult = currentRegisters[addSrc1] + currentRegisters[addSrc2];
                result.registers[addDest] = addResult;
                result.flags.zero = addResult === 0;
                result.flags.negative = addResult < 0;
                result.flags.carry = addResult > 0xffffffff;
                break;

            case 'SUB':
                if (!registersModified) {
                    result.registers = { ...currentRegisters };
                    registersModified = true;
                }
                if (!flagsModified) {
                    result.flags = { ...currentFlags };
                    flagsModified = true;
                }
                const subDest = args[0];
                const subSrc1 = args[1];
                const subSrc2 = args[2];
                const subResult = currentRegisters[subSrc1] - currentRegisters[subSrc2];
                result.registers[subDest] = subResult;
                result.flags.zero = subResult === 0;
                result.flags.negative = subResult < 0;
                result.flags.carry = subResult < 0;
                break;

            case 'MUL':
                const mulDest = args[0];
                const mulSrc1 = args[1];
                const mulSrc2 = args[2];
                const mulResult = currentRegisters[mulSrc1] * currentRegisters[mulSrc2];
                result.registers[mulDest] = mulResult;
                result.flags.zero = mulResult === 0;
                result.flags.negative = mulResult < 0;
                break;

            case 'DIV':
                const divDest = args[0];
                const divSrc1 = args[1];
                const divSrc2 = args[2];
                const divResult =
                    currentRegisters[divSrc2] !== 0
                        ? Math.floor(currentRegisters[divSrc1] / currentRegisters[divSrc2])
                        : 0;
                result.registers[divDest] = divResult;
                result.flags.zero = divResult === 0;
                result.flags.negative = divResult < 0;
                break;

            case 'MOD':
                const modDest = args[0];
                const modSrc1 = args[1];
                const modSrc2 = args[2];
                const modResult =
                    currentRegisters[modSrc2] !== 0
                        ? currentRegisters[modSrc1] % currentRegisters[modSrc2]
                        : 0;
                result.registers[modDest] = modResult;
                result.flags.zero = modResult === 0;
                break;

            case 'INC':
                if (!registersModified) {
                    result.registers = { ...currentRegisters };
                    registersModified = true;
                }
                if (!flagsModified) {
                    result.flags = { ...currentFlags };
                    flagsModified = true;
                }
                const incReg = args[0];
                const incResult = currentRegisters[incReg] + 1;
                result.registers[incReg] = incResult;
                result.flags.zero = incResult === 0;
                result.flags.negative = incResult < 0;
                break;

            case 'DEC':
                if (!registersModified) {
                    result.registers = { ...currentRegisters };
                    registersModified = true;
                }
                if (!flagsModified) {
                    result.flags = { ...currentFlags };
                    flagsModified = true;
                }
                const decReg = args[0];
                const decResult = currentRegisters[decReg] - 1;
                result.registers[decReg] = decResult;
                result.flags.zero = decResult === 0;
                result.flags.negative = decResult < 0;
                break;

            case 'CMP':
                if (!flagsModified) {
                    result.flags = { ...currentFlags };
                    flagsModified = true;
                }
                const cmpReg1 = args[0];
                const cmpArg2 = args[1];
                const val1 = currentRegisters[cmpReg1];
                const val2 = cmpArg2.startsWith('#')
                    ? parseInt(cmpArg2.replace('#', ''))
                    : currentRegisters[cmpArg2];
                const cmpResult = val1 - val2;
                result.flags.zero = cmpResult === 0;
                result.flags.negative = cmpResult < 0;
                result.flags.carry = val1 < val2;
                break;

            case 'JMP':
                const jmpAddr = parseInt(args[0].replace('#', ''));
                result.newPC = jmpAddr;
                break;

            case 'JEQ':
            case 'JZ':
                if (currentFlags.zero) {
                    result.newPC = parseInt(args[0].replace('#', ''));
                }
                break;

            case 'JNE':
            case 'JNZ':
                if (!currentFlags.zero) {
                    result.newPC = parseInt(args[0].replace('#', ''));
                }
                break;

            case 'JLT':
                if (currentFlags.negative && !currentFlags.zero) {
                    result.newPC = parseInt(args[0].replace('#', ''));
                }
                break;

            case 'JGT':
                if (!currentFlags.negative && !currentFlags.zero) {
                    result.newPC = parseInt(args[0].replace('#', ''));
                }
                break;

            case 'JLE':
                if (currentFlags.negative || currentFlags.zero) {
                    result.newPC = parseInt(args[0].replace('#', ''));
                }
                break;

            case 'JGE':
                if (!currentFlags.negative || currentFlags.zero) {
                    result.newPC = parseInt(args[0].replace('#', ''));
                }
                break;

            case 'JC':
                if (currentFlags.carry) {
                    result.newPC = parseInt(args[0].replace('#', ''));
                }
                break;

            case 'JNC':
                if (!currentFlags.carry) {
                    result.newPC = parseInt(args[0].replace('#', ''));
                }
                break;

            case 'JO':
                if (currentFlags.overflow) {
                    result.newPC = parseInt(args[0].replace('#', ''));
                }
                break;

            case 'JNO':
                if (!currentFlags.overflow) {
                    result.newPC = parseInt(args[0].replace('#', ''));
                }
                break;

            // Additional arithmetic operations
            case 'ADDI':
                const addiDest = args[0];
                const addiSrc = args[1];
                const addiImm = parseInt(args[2].replace('#', ''));
                const addiResult = currentRegisters[addiSrc] + addiImm;
                result.registers[addiDest] = addiResult;
                result.flags.zero = addiResult === 0;
                result.flags.negative = addiResult < 0;
                result.flags.carry = addiResult > 0xffffffff;
                break;

            case 'SUBI':
                const subiDest = args[0];
                const subiSrc = args[1];
                const subiImm = parseInt(args[2].replace('#', ''));
                const subiResult = currentRegisters[subiSrc] - subiImm;
                result.registers[subiDest] = subiResult;
                result.flags.zero = subiResult === 0;
                result.flags.negative = subiResult < 0;
                result.flags.carry = subiResult < 0;
                break;

            case 'MULI':
                const muliDest = args[0];
                const muliSrc = args[1];
                const muliImm = parseInt(args[2].replace('#', ''));
                const muliResult = currentRegisters[muliSrc] * muliImm;
                result.registers[muliDest] = muliResult;
                result.flags.zero = muliResult === 0;
                result.flags.negative = muliResult < 0;
                result.flags.overflow = muliResult > 0xffffffff;
                break;

            case 'DIVI':
                const diviDest = args[0];
                const diviSrc = args[1];
                const diviImm = parseInt(args[2].replace('#', ''));
                const diviResult =
                    diviImm !== 0 ? Math.floor(currentRegisters[diviSrc] / diviImm) : 0;
                result.registers[diviDest] = diviResult;
                result.flags.zero = diviResult === 0;
                result.flags.negative = diviResult < 0;
                result.flags.overflow = diviImm === 0;
                break;

            // Advanced math operations
            case 'POW':
                const powDest = args[0];
                const powBase = args[1];
                const powExp = args[2];
                const powResult = Math.pow(currentRegisters[powBase], currentRegisters[powExp]);
                result.registers[powDest] = Math.floor(powResult);
                result.flags.zero = powResult === 0;
                result.flags.overflow = powResult > 0xffffffff;
                break;

            case 'SQRT':
                const sqrtDest = args[0];
                const sqrtSrc = args[1];
                const sqrtResult = Math.floor(Math.sqrt(currentRegisters[sqrtSrc]));
                result.registers[sqrtDest] = sqrtResult;
                result.flags.zero = sqrtResult === 0;
                result.flags.negative = currentRegisters[sqrtSrc] < 0;
                break;

            case 'ABS':
                const absDest = args[0];
                const absSrc = args[1];
                const absResult = Math.abs(currentRegisters[absSrc]);
                result.registers[absDest] = absResult;
                result.flags.zero = absResult === 0;
                result.flags.negative = false;
                break;

            case 'NEG':
                const negDest = args[0];
                const negSrc = args[1];
                const negResult = -currentRegisters[negSrc];
                result.registers[negDest] = negResult;
                result.flags.zero = negResult === 0;
                result.flags.negative = negResult < 0;
                result.flags.overflow = currentRegisters[negSrc] === -2147483648;
                break;

            // Logical operations
            case 'AND':
                const andDest = args[0];
                const andSrc1 = args[1];
                const andSrc2 = args[2];
                const andResult = currentRegisters[andSrc1] & currentRegisters[andSrc2];
                result.registers[andDest] = andResult;
                result.flags.zero = andResult === 0;
                result.flags.negative = andResult < 0;
                break;

            case 'OR':
                const orDest = args[0];
                const orSrc1 = args[1];
                const orSrc2 = args[2];
                const orResult = currentRegisters[orSrc1] | currentRegisters[orSrc2];
                result.registers[orDest] = orResult;
                result.flags.zero = orResult === 0;
                result.flags.negative = orResult < 0;
                break;

            case 'XOR':
                const xorDest = args[0];
                const xorSrc1 = args[1];
                const xorSrc2 = args[2];
                const xorResult = currentRegisters[xorSrc1] ^ currentRegisters[xorSrc2];
                result.registers[xorDest] = xorResult;
                result.flags.zero = xorResult === 0;
                result.flags.negative = xorResult < 0;
                break;

            case 'NOT':
                const notDest = args[0];
                const notSrc = args[1];
                const notResult = ~currentRegisters[notSrc];
                result.registers[notDest] = notResult;
                result.flags.zero = notResult === 0;
                result.flags.negative = notResult < 0;
                break;

            case 'SHL':
                const shlDest = args[0];
                const shlSrc = args[1];
                const shlShift = parseInt(args[2].replace('#', ''));
                const shlResult = currentRegisters[shlSrc] << shlShift;
                result.registers[shlDest] = shlResult;
                result.flags.zero = shlResult === 0;
                result.flags.negative = shlResult < 0;
                result.flags.carry =
                    shlShift > 0 && (currentRegisters[shlSrc] & (1 << (32 - shlShift))) !== 0;
                break;

            case 'SHR':
                const shrDest = args[0];
                const shrSrc = args[1];
                const shrShift = parseInt(args[2].replace('#', ''));
                const shrResult = currentRegisters[shrSrc] >>> shrShift;
                result.registers[shrDest] = shrResult;
                result.flags.zero = shrResult === 0;
                result.flags.negative = false;
                result.flags.carry =
                    shrShift > 0 && (currentRegisters[shrSrc] & (1 << (shrShift - 1))) !== 0;
                break;

            case 'ROL':
                const rolDest = args[0];
                const rolSrc = args[1];
                const rolShift = parseInt(args[2].replace('#', '')) % 32;
                const rolValue = currentRegisters[rolSrc];
                const rolResult = (rolValue << rolShift) | (rolValue >>> (32 - rolShift));
                result.registers[rolDest] = rolResult;
                result.flags.zero = rolResult === 0;
                result.flags.negative = rolResult < 0;
                result.flags.carry = rolShift > 0 && (rolValue & (1 << (32 - rolShift))) !== 0;
                break;

            case 'ROR':
                const rorDest = args[0];
                const rorSrc = args[1];
                const rorShift = parseInt(args[2].replace('#', '')) % 32;
                const rorValue = currentRegisters[rorSrc];
                const rorResult = (rorValue >>> rorShift) | (rorValue << (32 - rorShift));
                result.registers[rorDest] = rorResult;
                result.flags.zero = rorResult === 0;
                result.flags.negative = rorResult < 0;
                result.flags.carry = rorShift > 0 && (rorValue & (1 << (rorShift - 1))) !== 0;
                break;

            // Bit manipulation
            case 'SETBIT':
                const setbitDest = args[0];
                const setbitSrc = args[1];
                const setbitPos = parseInt(args[2].replace('#', ''));
                const setbitResult = currentRegisters[setbitSrc] | (1 << setbitPos);
                result.registers[setbitDest] = setbitResult;
                break;

            case 'CLRBIT':
                const clrbitDest = args[0];
                const clrbitSrc = args[1];
                const clrbitPos = parseInt(args[2].replace('#', ''));
                const clrbitResult = currentRegisters[clrbitSrc] & ~(1 << clrbitPos);
                result.registers[clrbitDest] = clrbitResult;
                break;

            case 'TOGBIT':
                const togbitDest = args[0];
                const togbitSrc = args[1];
                const togbitPos = parseInt(args[2].replace('#', ''));
                const togbitResult = currentRegisters[togbitSrc] ^ (1 << togbitPos);
                result.registers[togbitDest] = togbitResult;
                break;

            case 'TESTBIT':
                const testbitReg = args[0];
                const testbitPos = parseInt(args[1].replace('#', ''));
                const testbitResult = (currentRegisters[testbitReg] >> testbitPos) & 1;
                result.flags.zero = testbitResult === 0;
                result.flags.carry = testbitResult === 1;
                break;

            case 'POPCNT':
                const popcntDest = args[0];
                const popcntSrc = args[1];
                const popcntValue = currentRegisters[popcntSrc];
                let popcntResult = 0;
                let tempValue = popcntValue;
                while (tempValue) {
                    popcntResult++;
                    tempValue &= tempValue - 1;
                }
                result.registers[popcntDest] = popcntResult;
                result.flags.zero = popcntResult === 0;
                break;

            case 'CLZ':
                const clzDest = args[0];
                const clzSrc = args[1];
                const clzValue = currentRegisters[clzSrc];
                let clzResult = 0;
                if (clzValue === 0) {
                    clzResult = 32;
                } else {
                    let tempValue = clzValue;
                    for (let i = 31; i >= 0; i--) {
                        if (tempValue & (1 << i)) {
                            break;
                        }
                        clzResult++;
                    }
                }
                result.registers[clzDest] = clzResult;
                result.flags.zero = clzResult === 0;
                break;

            // Additional comparison operations
            case 'CMPI':
                const cmpiReg = args[0];
                const cmpiImm = parseInt(args[1].replace('#', ''));
                const cmpiVal = currentRegisters[cmpiReg];
                const cmpiResult = cmpiVal - cmpiImm;
                result.flags.zero = cmpiResult === 0;
                result.flags.negative = cmpiResult < 0;
                result.flags.carry = cmpiVal < cmpiImm;
                break;

            case 'TEST':
                const testReg1 = args[0];
                const testReg2 = args[1];
                const testResult = currentRegisters[testReg1] & currentRegisters[testReg2];
                result.flags.zero = testResult === 0;
                result.flags.negative = testResult < 0;
                break;

            case 'TESTI':
                const testiReg = args[0];
                const testiImm = parseInt(args[1].replace('#', ''));
                const testiResult = currentRegisters[testiReg] & testiImm;
                result.flags.zero = testiResult === 0;
                result.flags.negative = testiResult < 0;
                break;

            // Additional memory operations
            case 'LEA':
                const leaReg = args[0];
                const leaAddr = parseInt(args[1].replace('#', ''));
                result.registers[leaReg] = leaAddr;
                break;

            case 'SWAP':
                const swapReg1 = args[0];
                const swapReg2 = args[1];
                const temp = currentRegisters[swapReg1];
                result.registers[swapReg1] = currentRegisters[swapReg2];
                result.registers[swapReg2] = temp;
                break;

            // Stack operations
            case 'CALL':
                const callAddr = parseInt(args[0].replace('#', ''));
                result.stack.push(result.newPC || 0); // Push return address
                result.registers.SP = currentRegisters.SP - 1;
                result.newPC = callAddr;
                break;

            case 'RET':
                if (currentStack.length > 0) {
                    const returnAddr = currentStack[currentStack.length - 1];
                    result.newPC = returnAddr;
                    result.registers.SP = currentRegisters.SP + 1;
                    result.stack = currentStack.slice(0, -1);
                }
                break;

            case 'PUSHA':
                // Push all general-purpose registers
                const regsToPush = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];
                regsToPush.forEach((reg) => {
                    result.stack.push(currentRegisters[reg]);
                });
                result.registers.SP = currentRegisters.SP - regsToPush.length;
                break;

            case 'POPA':
                // Pop all general-purpose registers (in reverse order)
                const regsToPop = ['R7', 'R6', 'R5', 'R4', 'R3', 'R2', 'R1', 'R0'];
                regsToPop.forEach((reg) => {
                    if (currentStack.length > 0) {
                        const value = currentStack[currentStack.length - 1];
                        result.registers[reg] = value;
                        result.stack = result.stack.slice(0, -1);
                    }
                });
                result.registers.SP = currentRegisters.SP + regsToPop.length;
                break;

            case 'PUSHF':
                // Push flags as a single value
                const flagsValue =
                    (result.flags.zero ? 1 : 0) |
                    (result.flags.carry ? 2 : 0) |
                    (result.flags.negative ? 4 : 0) |
                    (result.flags.overflow ? 8 : 0);
                result.stack.push(flagsValue);
                result.registers.SP = currentRegisters.SP - 1;
                break;

            case 'POPF':
                // Pop flags from stack
                if (currentStack.length > 0) {
                    const flagsValue = currentStack[currentStack.length - 1];
                    result.flags.zero = (flagsValue & 1) !== 0;
                    result.flags.carry = (flagsValue & 2) !== 0;
                    result.flags.negative = (flagsValue & 4) !== 0;
                    result.flags.overflow = (flagsValue & 8) !== 0;
                    result.stack = currentStack.slice(0, -1);
                    result.registers.SP = currentRegisters.SP + 1;
                }
                break;

            case 'IRET':
                // Interrupt return - restore state from stack
                if (currentStack.length >= 2) {
                    const savedFlags = currentStack[currentStack.length - 1];
                    const savedPC = currentStack[currentStack.length - 2];

                    result.flags.zero = (savedFlags & 1) !== 0;
                    result.flags.carry = (savedFlags & 2) !== 0;
                    result.flags.negative = (savedFlags & 4) !== 0;
                    result.flags.overflow = (savedFlags & 8) !== 0;
                    result.flags.interrupt = true;

                    result.newPC = savedPC;
                    result.registers.SP = currentRegisters.SP + 2;
                    result.stack = currentStack.slice(0, -2);
                }
                break;

            // System control
            case 'CLI':
                result.flags.interrupt = false;
                break;

            case 'STI':
                result.flags.interrupt = true;
                break;

            case 'HLT':
                // Halt until interrupt - for now just continue
                break;

            case 'WAIT':
                // Wait for specified cycles - for now just continue
                break;

            case 'RESET':
                // Reset processor state
                result.registers = {
                    R0: 0,
                    R1: 0,
                    R2: 0,
                    R3: 0,
                    R4: 0,
                    R5: 0,
                    R6: 0,
                    R7: 0,
                    SP: 255,
                    LR: 0,
                };
                result.flags = {
                    zero: false,
                    carry: false,
                    negative: false,
                    overflow: false,
                    interrupt: false,
                };
                result.memory = new Array(256).fill(0);
                result.stack = [];
                break;

            case 'DEBUG':
                result.output += `[DEBUG] PC=${result.newPC || 0}, Registers=${JSON.stringify(result.registers)}\n`;
                break;

            case 'PUSH':
                if (!stackModified) {
                    result.stack = [...currentStack];
                    stackModified = true;
                }
                if (!registersModified) {
                    result.registers = { ...currentRegisters };
                    registersModified = true;
                }
                const pushReg = args[0];
                result.stack.push(currentRegisters[pushReg]);
                result.registers.SP = currentRegisters.SP - 1;
                break;

            case 'POP':
                if (currentStack.length > 0) {
                    if (!stackModified) {
                        result.stack = [...currentStack];
                        stackModified = true;
                    }
                    if (!registersModified) {
                        result.registers = { ...currentRegisters };
                        registersModified = true;
                    }
                    const popReg = args[0];
                    const value = currentStack[currentStack.length - 1];
                    result.registers[popReg] = value;
                    result.registers.SP = currentRegisters.SP + 1;
                    result.stack = result.stack.slice(0, -1);
                }
                break;

            case 'INT':
                const interruptNum = parseInt(args[0].replace('#', ''));
                result = handleInterruptFast(
                    interruptNum,
                    result,
                    registersModified,
                    flagsModified,
                    memoryModified,
                    stackModified,
                    outputModified,
                    screenModified,
                );
                break;

            case 'HALT':
                result.shouldContinue = false;
                result.output += '\n--- Program halted ---\n';
                break;

            case 'NOP':
                // Do nothing
                break;

            default:
                result.output += `\nUnknown instruction: ${instruction}\n`;
                break;
        }

        return result;
    };

    // Hyper-optimized fast interrupt handler
    const handleInterruptFast = (
        interruptNum,
        result,
        registersModified,
        flagsModified,
        memoryModified,
        stackModified,
        outputModified,
        screenModified,
    ) => {
        const interruptType = systemInterrupts[interruptNum];

        switch (interruptType) {
            case 'PRINT_CHAR':
                if (!outputModified) {
                    // Only modify output if needed
                    outputModified = true;
                }
                const charCode = result.registers.R7 || result.registers.R1;
                result.output += String.fromCharCode(charCode);
                break;

            case 'PRINT_NEWLINE':
                if (!outputModified) {
                    outputModified = true;
                }
                result.output += '\n';
                break;

            case 'PRINT_NUMBER':
                if (!outputModified) {
                    outputModified = true;
                }
                const number = result.registers.R7 || result.registers.R1;
                result.output += number.toString();
                break;

            case 'SCREEN_CLEAR':
                if (!screenModified) {
                    result.screenBuffer = new Array(SCREEN_HEIGHT)
                        .fill(null)
                        .map(() => new Array(SCREEN_WIDTH).fill(0));
                    screenModified = true;
                }
                result.cursorX = 0;
                result.cursorY = 0;
                break;

            case 'SCREEN_SET_PIXEL':
                const pixelX = result.registers.R0;
                const pixelY = result.registers.R1;
                const pixelColor = result.registers.R2 || 1;
                if (pixelX >= 0 && pixelX < SCREEN_WIDTH && pixelY >= 0 && pixelY < SCREEN_HEIGHT) {
                    if (!screenModified) {
                        result.screenBuffer = result.screenBuffer.map((row) => [...row]);
                        screenModified = true;
                    }
                    result.screenBuffer[pixelY][pixelX] = pixelColor;
                }
                break;

            case 'SCREEN_SET_COLOR':
                const colorValue = result.registers.R0;
                const colors = [
                    '#000000',
                    '#ff0000',
                    '#00ff00',
                    '#0000ff',
                    '#ffff00',
                    '#ff00ff',
                    '#00ffff',
                    '#ffffff',
                ];

                result.screenColor = colors[colorValue % colors.length];
                break;

            case 'SCREEN_DRAW_LINE':
                const x1 = result.registers.R0;
                const y1 = result.registers.R1;
                const x2 = result.registers.R2;
                const y2 = result.registers.R3;
                drawLineFast(result.screenBuffer, x1, y1, x2, y2);
                break;

            case 'SCREEN_DRAW_RECT':
                const rectX = result.registers.R0;
                const rectY = result.registers.R1;
                const rectW = result.registers.R2;
                const rectH = result.registers.R3;
                drawRectFast(result.screenBuffer, rectX, rectY, rectW, rectH, false);
                break;

            case 'SCREEN_FILL_RECT':
                const fillX = result.registers.R0;
                const fillY = result.registers.R1;
                const fillW = result.registers.R2;
                const fillH = result.registers.R3;
                drawRectFast(result.screenBuffer, fillX, fillY, fillW, fillH, true);
                break;

            case 'SCREEN_DRAW_CIRCLE':
                const centerX = result.registers.R0;
                const centerY = result.registers.R1;
                const radius = result.registers.R2;
                drawCircleFast(result.screenBuffer, centerX, centerY, radius);
                break;

            case 'SCREEN_GET_PIXEL':
                const getX = result.registers.R0;
                const getY = result.registers.R1;
                if (getX >= 0 && getX < SCREEN_WIDTH && getY >= 0 && getY < SCREEN_HEIGHT) {
                    result.registers.R0 = result.screenBuffer[getY][getX];
                }
                break;

            case 'SCREEN_SET_CURSOR':
                const newCursorX = Math.max(0, Math.min(SCREEN_WIDTH - 1, result.registers.R0));
                const newCursorY = Math.max(0, Math.min(SCREEN_HEIGHT - 1, result.registers.R1));
                result.cursorX = newCursorX;
                result.cursorY = newCursorY;
                break;

            case 'SCREEN_PRINT_CHAR':
                const charToPrint = result.registers.R0;
                // Simple character printing to screen buffer
                result.cursorX = (result.cursorX + 1) % Math.floor(SCREEN_WIDTH / 6);
                if (result.cursorX === 0) {
                    result.cursorY = (result.cursorY + 1) % Math.floor(SCREEN_HEIGHT / 8);
                }
                break;

            case 'PRINT_HEX':
                const hexNumber = result.registers.R7 || result.registers.R1;
                result.output += '0x' + hexNumber.toString(16).toUpperCase();
                break;

            case 'PRINT_BINARY':
                const binNumber = result.registers.R7 || result.registers.R1;
                result.output += '0b' + binNumber.toString(2);
                break;

            case 'RANDOM_NUMBER':
                result.registers.R0 = Math.floor(Math.random() * 256);
                break;

            case 'GET_TIME':
                result.registers.R0 = Date.now() % 1000000;
                break;

            case 'BEEP':
                // Audio operations would need to be handled differently in fast mode
                // For now, just add a note to output
                result.output += '[BEEP]';
                break;

            case 'PLAY_TONE':
                const freq = result.registers.R0 || 440;
                const dur = result.registers.R1 || 500;
                result.output += `[TONE:${freq}Hz,${dur}ms]`;
                break;

            // Keyboard Interrupts (Fast Mode)
            case 'KEYBOARD_INT_ENABLE':
                // Note: In fast mode, we can't directly set React state
                // These would need to be handled in the main execution loop
                result.output += '[KEYBOARD_INT_ENABLE]';
                break;
            case 'KEYBOARD_INT_DISABLE':
                result.output += '[KEYBOARD_INT_DISABLE]';
                break;
            case 'KEYBOARD_INT_HANDLER':
                result.output += `[KEYBOARD_INT_HANDLER:${result.registers.R0}]`;
                break;
            case 'KEYBOARD_SCAN_CODE':
                // Return last scan code (simplified for fast mode)
                result.registers.R0 = 0; // Would need access to actual scan code
                break;
            case 'KEYBOARD_ASCII_CODE':
                // Return last ASCII code (simplified for fast mode)
                result.registers.R0 = 0; // Would need access to actual ASCII code
                break;
            case 'KEYBOARD_READ':
                // Read from keyboard buffer (simplified for fast mode)
                result.registers.R0 = 0; // Would need access to actual buffer
                break;
            case 'KEYBOARD_STATUS':
                // Return keyboard status (simplified for fast mode)
                result.registers.R0 = 0; // Would need access to actual status
                break;
            case 'KEYBOARD_BUFFER_SIZE':
                // Return buffer size (simplified for fast mode)
                result.registers.R0 = 0; // Would need access to actual buffer
                break;
            case 'KEYBOARD_CLEAR_BUFFER':
                result.output += '[KEYBOARD_CLEAR_BUFFER]';
                break;

            default:
                result.output += `[Unknown INT #${interruptNum}]`;
                break;
        }

        return result;
    };

    // Hyper-optimized graphics functions with minimal overhead
    const drawLineFast = (buffer, x1, y1, x2, y2) => {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        let x = x1,
            y = y1;

        // Unrolled loop for common cases
        if (dx === 0) {
            // Vertical line - optimized
            const startY = Math.max(0, Math.min(y1, y2));
            const endY = Math.min(SCREEN_HEIGHT, Math.max(y1, y2) + 1);
            if (x >= 0 && x < SCREEN_WIDTH) {
                for (let py = startY; py < endY; py++) {
                    buffer[py][x] = 1;
                }
            }
            return;
        }

        if (dy === 0) {
            // Horizontal line - optimized
            const startX = Math.max(0, Math.min(x1, x2));
            const endX = Math.min(SCREEN_WIDTH, Math.max(x1, x2) + 1);
            if (y >= 0 && y < SCREEN_HEIGHT) {
                for (let px = startX; px < endX; px++) {
                    buffer[y][px] = 1;
                }
            }
            return;
        }

        // General case with optimized bounds checking
        while (true) {
            if (x >= 0 && x < SCREEN_WIDTH && y >= 0 && y < SCREEN_HEIGHT) {
                buffer[y][x] = 1;
            }
            if (x === x2 && y === y2) break;
            const e2 = err << 1;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    };

    const drawRectFast = (buffer, x, y, width, height, filled) => {
        // Pre-calculate bounds once
        const x1 = Math.max(0, x);
        const y1 = Math.max(0, y);
        const x2 = Math.min(SCREEN_WIDTH, x + width);
        const y2 = Math.min(SCREEN_HEIGHT, y + height);

        if (filled) {
            // Optimized filled rectangle with direct array access
            for (let py = y1; py < y2; py++) {
                const row = buffer[py];
                for (let px = x1; px < x2; px++) {
                    row[px] = 1;
                }
            }
        } else {
            // Optimized rectangle outline
            if (y1 < y2 && x1 < x2) {
                // Top edge
                if (y >= 0 && y < SCREEN_HEIGHT) {
                    const topRow = buffer[y];
                    for (let px = x1; px < x2; px++) {
                        topRow[px] = 1;
                    }
                }
                // Bottom edge
                const bottomY = y + height - 1;
                if (bottomY >= 0 && bottomY < SCREEN_HEIGHT && height > 1) {
                    const bottomRow = buffer[bottomY];
                    for (let px = x1; px < x2; px++) {
                        bottomRow[px] = 1;
                    }
                }
                // Left and right edges
                for (let py = y1; py < y2; py++) {
                    const row = buffer[py];
                    if (x >= 0 && x < SCREEN_WIDTH) row[x] = 1;
                    if (x + width - 1 >= 0 && x + width - 1 < SCREEN_WIDTH && width > 1) {
                        row[x + width - 1] = 1;
                    }
                }
            }
        }
    };

    const drawCircleFast = (buffer, centerX, centerY, radius) => {
        let x = 0,
            y = radius;
        let d = 3 - (radius << 1);

        // Inline pixel setting for maximum speed
        const setPixelUnsafe = (px, py) => {
            buffer[py][px] = 1;
        };

        const setPixelSafe = (px, py) => {
            if (px >= 0 && px < SCREEN_WIDTH && py >= 0 && py < SCREEN_HEIGHT) {
                buffer[py][px] = 1;
            }
        };

        // Use unsafe version when possible for speed
        const drawCirclePoints = (cx, cy, x, y) => {
            const points = [
                [cx + x, cy + y],
                [cx - x, cy + y],
                [cx + x, cy - y],
                [cx - x, cy - y],
                [cx + y, cy + x],
                [cx - y, cy + x],
                [cx + y, cy - x],
                [cx - y, cy - x],
            ];

            for (let i = 0; i < 8; i++) {
                const [px, py] = points[i];
                if (px >= 0 && px < SCREEN_WIDTH && py >= 0 && py < SCREEN_HEIGHT) {
                    buffer[py][px] = 1;
                }
            }
        };

        drawCirclePoints(centerX, centerY, x, y);
        while (y >= x) {
            x++;
            if (d > 0) {
                y--;
                d += ((x - y) << 2) + 10;
            } else {
                d += (x << 2) + 6;
            }
            drawCirclePoints(centerX, centerY, x, y);
        }
    };

    const executeInstruction = (instruction, args, callback, currentRegisters, currentFlags) => {
        // Prevent duplicate execution
        if (executionRef.current.isExecuting) {
            return;
        }
        executionRef.current.isExecuting = true;

        setBusActivity({ address: pc, data: instruction, type: 'FETCH' });

        let shouldContinue = true;
        let updatedFlags = { ...currentFlags };

        switch (instruction) {
            // Data Movement Instructions
            case 'LOAD':
                const reg = args[0];
                const value = parseInt(args[1].replace('#', ''));
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [reg]: value,
                }));
                setBusActivity({ address: null, data: value, type: 'LOAD' });
                break;

            case 'MOV':
                const destReg = args[0];
                const srcReg = args[1];
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [destReg]: currentRegs[srcReg],
                }));
                setBusActivity({ address: null, data: currentRegisters[srcReg], type: 'MOV' });
                break;

            case 'LDR':
                const loadReg = args[0];
                const memAddr = parseInt(args[1].replace('#', ''));
                setMemory((currentMem) => {
                    const valueFromMem = currentMem[memAddr] || 0;
                    setRegisters((currentRegs) => ({
                        ...currentRegs,
                        [loadReg]: valueFromMem,
                    }));
                    setBusActivity({ address: memAddr, data: valueFromMem, type: 'LOAD_MEM' });
                    return currentMem; // Return unchanged memory
                });
                break;

            case 'STR':
                const storeReg = args[0];
                const storeAddr = parseInt(args[1].replace('#', ''));
                const valueToStore = currentRegisters[storeReg];
                setMemory((currentMem) => {
                    const newMem = [...currentMem];
                    newMem[storeAddr] = valueToStore;
                    return newMem;
                });
                setBusActivity({
                    address: storeAddr,
                    data: valueToStore,
                    type: 'STORE_MEM',
                });
                break;

            case 'LDRI':
                const loadIndirectReg = args[0];
                const loadIndirectAddrReg = args[1];
                const loadIndirectAddr = currentRegisters[loadIndirectAddrReg];
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [loadIndirectReg]: memory[loadIndirectAddr] || 0,
                }));
                setBusActivity({
                    address: loadIndirectAddr,
                    data: memory[loadIndirectAddr],
                    type: 'LOAD_INDIRECT',
                });
                break;

            case 'STRI':
                const storeIndirectReg = args[0];
                const storeIndirectAddrReg = args[1];
                const storeIndirectAddr = currentRegisters[storeIndirectAddrReg];
                setMemory((currentMem) => {
                    const newMem = [...currentMem];
                    newMem[storeIndirectAddr] = currentRegisters[storeIndirectReg];
                    return newMem;
                });
                setBusActivity({
                    address: storeIndirectAddr,
                    data: currentRegisters[storeIndirectReg],
                    type: 'STORE_INDIRECT',
                });
                break;

            case 'LEA':
                const leaReg = args[0];
                const leaAddr = parseInt(args[1].replace('#', ''));
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [leaReg]: leaAddr,
                }));
                setBusActivity({ address: null, data: leaAddr, type: 'LEA' });
                break;

            // Arithmetic Instructions
            case 'ADD':
                const addDest = args[0];
                const addSrc1 = args[1];
                const addSrc2 = args[2];
                const addResult = currentRegisters[addSrc1] + currentRegisters[addSrc2];
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [addDest]: addResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: addResult === 0,
                    negative: addResult < 0,
                    carry: addResult > 0xffffffff,
                    overflow: false,
                }));
                setBusActivity({ address: null, data: addResult, type: 'ALU_ADD' });
                break;

            case 'SUB':
                const subDest = args[0];
                const subSrc1 = args[1];
                const subSrc2 = args[2];
                const subResult = currentRegisters[subSrc1] - currentRegisters[subSrc2];
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [subDest]: subResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: subResult === 0,
                    negative: subResult < 0,
                    carry: subResult < 0,
                    overflow: false,
                }));
                setBusActivity({ address: null, data: subResult, type: 'ALU_SUB' });
                break;

            case 'MUL':
                const mulDest = args[0];
                const mulSrc1 = args[1];
                const mulSrc2 = args[2];
                const mulResult = currentRegisters[mulSrc1] * currentRegisters[mulSrc2];
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [mulDest]: mulResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: mulResult === 0,
                    negative: mulResult < 0,
                    overflow: mulResult > 0xffffffff,
                }));
                setBusActivity({ address: null, data: mulResult, type: 'ALU_MUL' });
                break;

            case 'DIV':
                const divDest = args[0];
                const divSrc1 = args[1];
                const divSrc2 = args[2];
                const divResult =
                    currentRegisters[divSrc2] !== 0
                        ? Math.floor(currentRegisters[divSrc1] / currentRegisters[divSrc2])
                        : 0;
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [divDest]: divResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: divResult === 0,
                    negative: divResult < 0,
                    overflow: currentRegisters[divSrc2] === 0,
                }));
                setBusActivity({ address: null, data: divResult, type: 'ALU_DIV' });
                break;

            // Advanced Math Operations
            case 'MOD':
                const modDest = args[0];
                const modSrc1 = args[1];
                const modSrc2 = args[2];
                const modResult =
                    currentRegisters[modSrc2] !== 0
                        ? currentRegisters[modSrc1] % currentRegisters[modSrc2]
                        : 0;
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [modDest]: modResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: modResult === 0,
                    overflow: currentRegisters[modSrc2] === 0,
                }));
                setBusActivity({ address: null, data: modResult, type: 'ALU_MOD' });
                break;

            case 'POW':
                const powDest = args[0];
                const powBase = args[1];
                const powExp = args[2];
                const powResult = Math.pow(currentRegisters[powBase], currentRegisters[powExp]);
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [powDest]: Math.floor(powResult),
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: powResult === 0,
                    overflow: powResult > 0xffffffff,
                }));
                setBusActivity({ address: null, data: Math.floor(powResult), type: 'ALU_POW' });
                break;

            case 'SQRT':
                const sqrtDest = args[0];
                const sqrtSrc = args[1];
                const sqrtResult = Math.floor(Math.sqrt(currentRegisters[sqrtSrc]));
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [sqrtDest]: sqrtResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: sqrtResult === 0,
                    negative: currentRegisters[sqrtSrc] < 0,
                }));
                setBusActivity({ address: null, data: sqrtResult, type: 'ALU_SQRT' });
                break;

            case 'ABS':
                const absDest = args[0];
                const absSrc = args[1];
                const absResult = Math.abs(currentRegisters[absSrc]);
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [absDest]: absResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: absResult === 0,
                    negative: false,
                }));
                setBusActivity({ address: null, data: absResult, type: 'ALU_ABS' });
                break;

            case 'INC':
                const incReg = args[0];
                const incResult = currentRegisters[incReg] + 1;
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [incReg]: incResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: incResult === 0,
                    negative: incResult < 0,
                    carry: incResult > 0xffffffff,
                    overflow: false,
                }));
                setBusActivity({ address: null, data: incResult, type: 'ALU_INC' });
                break;

            case 'DEC':
                const decReg = args[0];
                const decResult = currentRegisters[decReg] - 1;
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [decReg]: decResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: decResult === 0,
                    negative: decResult < 0,
                    carry: decResult < 0,
                    overflow: false,
                }));
                setBusActivity({ address: null, data: decResult, type: 'ALU_DEC' });
                break;

            case 'ADDI':
                const addiDest = args[0];
                const addiSrc = args[1];
                const addiImm = parseInt(args[2].replace('#', ''));
                const addiResult = currentRegisters[addiSrc] + addiImm;
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [addiDest]: addiResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: addiResult === 0,
                    negative: addiResult < 0,
                    carry: addiResult > 0xffffffff,
                    overflow: false,
                }));
                setBusActivity({ address: null, data: addiResult, type: 'ALU_ADDI' });
                break;

            case 'SUBI':
                const subiDest = args[0];
                const subiSrc = args[1];
                const subiImm = parseInt(args[2].replace('#', ''));
                const subiResult = currentRegisters[subiSrc] - subiImm;
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [subiDest]: subiResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: subiResult === 0,
                    negative: subiResult < 0,
                    carry: subiResult < 0,
                    overflow: false,
                }));
                setBusActivity({ address: null, data: subiResult, type: 'ALU_SUBI' });
                break;

            case 'MULI':
                const muliDest = args[0];
                const muliSrc = args[1];
                const muliImm = parseInt(args[2].replace('#', ''));
                const muliResult = currentRegisters[muliSrc] * muliImm;
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [muliDest]: muliResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: muliResult === 0,
                    negative: muliResult < 0,
                    overflow: muliResult > 0xffffffff,
                }));
                setBusActivity({ address: null, data: muliResult, type: 'ALU_MULI' });
                break;

            case 'DIVI':
                const diviDest = args[0];
                const diviSrc = args[1];
                const diviImm = parseInt(args[2].replace('#', ''));
                const diviResult =
                    diviImm !== 0 ? Math.floor(currentRegisters[diviSrc] / diviImm) : 0;
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [diviDest]: diviResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: diviResult === 0,
                    negative: diviResult < 0,
                    overflow: diviImm === 0,
                }));
                setBusActivity({ address: null, data: diviResult, type: 'ALU_DIVI' });
                break;

            case 'SHL':
                const shlDest = args[0];
                const shlSrc = args[1];
                const shlShift = parseInt(args[2].replace('#', ''));
                const shlResult = currentRegisters[shlSrc] << shlShift;
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [shlDest]: shlResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: shlResult === 0,
                    negative: shlResult < 0,
                    carry:
                        shlShift > 0 && (currentRegisters[shlSrc] & (1 << (32 - shlShift))) !== 0,
                }));
                setBusActivity({ address: null, data: shlResult, type: 'ALU_SHL' });
                break;

            case 'SHR':
                const shrDest = args[0];
                const shrSrc = args[1];
                const shrShift = parseInt(args[2].replace('#', ''));
                const shrResult = currentRegisters[shrSrc] >>> shrShift; // Unsigned right shift
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [shrDest]: shrResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: shrResult === 0,
                    negative: false, // Unsigned shift always produces positive result
                    carry: shrShift > 0 && (currentRegisters[shrSrc] & (1 << (shrShift - 1))) !== 0,
                }));
                setBusActivity({ address: null, data: shrResult, type: 'ALU_SHR' });
                break;

            case 'ROL':
                const rolDest = args[0];
                const rolSrc = args[1];
                const rolShift = parseInt(args[2].replace('#', '')) % 32; // Ensure shift is within 32 bits
                const rolValue = currentRegisters[rolSrc];
                const rolResult = (rolValue << rolShift) | (rolValue >>> (32 - rolShift));
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [rolDest]: rolResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: rolResult === 0,
                    negative: rolResult < 0,
                    carry: rolShift > 0 && (rolValue & (1 << (32 - rolShift))) !== 0,
                }));
                setBusActivity({ address: null, data: rolResult, type: 'ALU_ROL' });
                break;

            case 'ROR':
                const rorDest = args[0];
                const rorSrc = args[1];
                const rorShift = parseInt(args[2].replace('#', '')) % 32; // Ensure shift is within 32 bits
                const rorValue = currentRegisters[rorSrc];
                const rorResult = (rorValue >>> rorShift) | (rorValue << (32 - rorShift));
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [rorDest]: rorResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: rorResult === 0,
                    negative: rorResult < 0,
                    carry: rorShift > 0 && (rorValue & (1 << (rorShift - 1))) !== 0,
                }));
                setBusActivity({ address: null, data: rorResult, type: 'ALU_ROR' });
                break;

            // Logical Operations
            case 'AND':
                const andDest = args[0];
                const andSrc1 = args[1];
                const andSrc2 = args[2];
                const andResult = currentRegisters[andSrc1] & currentRegisters[andSrc2];
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [andDest]: andResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: andResult === 0,
                    negative: andResult < 0,
                }));
                setBusActivity({ address: null, data: andResult, type: 'ALU_AND' });
                break;

            case 'OR':
                const orDest = args[0];
                const orSrc1 = args[1];
                const orSrc2 = args[2];
                const orResult = currentRegisters[orSrc1] | currentRegisters[orSrc2];
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [orDest]: orResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: orResult === 0,
                    negative: orResult < 0,
                }));
                setBusActivity({ address: null, data: orResult, type: 'ALU_OR' });
                break;

            case 'XOR':
                const xorDest = args[0];
                const xorSrc1 = args[1];
                const xorSrc2 = args[2];
                const xorResult = currentRegisters[xorSrc1] ^ currentRegisters[xorSrc2];
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [xorDest]: xorResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: xorResult === 0,
                    negative: xorResult < 0,
                }));
                setBusActivity({ address: null, data: xorResult, type: 'ALU_XOR' });
                break;

            // Bit Manipulation
            case 'SETBIT':
                const setbitDest = args[0];
                const setbitSrc = args[1];
                const setbitPos = parseInt(args[2].replace('#', ''));
                const setbitResult = currentRegisters[setbitSrc] | (1 << setbitPos);
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [setbitDest]: setbitResult,
                }));
                setBusActivity({ address: null, data: setbitResult, type: 'BIT_SET' });
                break;

            case 'CLRBIT':
                const clrbitDest = args[0];
                const clrbitSrc = args[1];
                const clrbitPos = parseInt(args[2].replace('#', ''));
                const clrbitResult = currentRegisters[clrbitSrc] & ~(1 << clrbitPos);
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [clrbitDest]: clrbitResult,
                }));
                setBusActivity({ address: null, data: clrbitResult, type: 'BIT_CLR' });
                break;

            case 'TOGBIT':
                const togbitDest = args[0];
                const togbitSrc = args[1];
                const togbitPos = parseInt(args[2].replace('#', ''));
                const togbitResult = currentRegisters[togbitSrc] ^ (1 << togbitPos);
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [togbitDest]: togbitResult,
                }));
                setBusActivity({ address: null, data: togbitResult, type: 'BIT_TOG' });
                break;

            case 'TESTBIT':
                const testbitReg = args[0];
                const testbitPos = parseInt(args[1].replace('#', ''));
                const testbitResult = (currentRegisters[testbitReg] >> testbitPos) & 1;
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: testbitResult === 0,
                    carry: testbitResult === 1,
                }));
                setBusActivity({ address: null, data: testbitResult, type: 'BIT_TEST' });
                break;

            case 'POPCNT':
                const popcntDest = args[0];
                const popcntSrc = args[1];
                const popcntValue = currentRegisters[popcntSrc];
                let popcntResult = 0;
                let tempValue = popcntValue;
                // Count set bits using Brian Kernighan's algorithm
                while (tempValue) {
                    popcntResult++;
                    tempValue &= tempValue - 1; // Clear the lowest set bit
                }
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [popcntDest]: popcntResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: popcntResult === 0,
                }));
                setBusActivity({ address: null, data: popcntResult, type: 'BIT_POPCNT' });
                break;

            case 'CLZ':
                const clzDest = args[0];
                const clzSrc = args[1];
                const clzValue = currentRegisters[clzSrc];
                let clzResult = 0;
                if (clzValue === 0) {
                    clzResult = 32; // Assuming 32-bit integers
                } else {
                    let tempValue = clzValue;
                    // Count leading zeros
                    for (let i = 31; i >= 0; i--) {
                        if (tempValue & (1 << i)) {
                            break;
                        }
                        clzResult++;
                    }
                }
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [clzDest]: clzResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: clzResult === 0,
                }));
                setBusActivity({ address: null, data: clzResult, type: 'BIT_CLZ' });
                break;

            case 'NEG':
                const negDest = args[0];
                const negSrc = args[1];
                const negResult = -currentRegisters[negSrc];
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    [negDest]: negResult,
                }));
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: negResult === 0,
                    negative: negResult < 0,
                    overflow: currentRegisters[negSrc] === -2147483648, // Check for overflow on most negative number
                }));
                setBusActivity({ address: null, data: negResult, type: 'ALU_NEG' });
                break;

            // Stack Operations
            case 'PUSH':
                const pushReg = args[0];
                setStack((currentStack) => [...currentStack, currentRegisters[pushReg]]);
                setRegisters((currentRegs) => ({
                    ...currentRegs,
                    SP: currentRegs.SP - 1,
                }));
                setBusActivity({
                    address: currentRegisters.SP,
                    data: currentRegisters[pushReg],
                    type: 'PUSH',
                });
                break;

            case 'POP':
                const popReg = args[0];
                setStack((currentStack) => {
                    if (currentStack.length > 0) {
                        const value = currentStack[currentStack.length - 1];
                        setRegisters((currentRegs) => ({
                            ...currentRegs,
                            [popReg]: value,
                            SP: currentRegs.SP + 1,
                        }));
                        setBusActivity({ address: currentRegisters.SP, data: value, type: 'POP' });
                        return currentStack.slice(0, -1);
                    }
                    return currentStack;
                });
                break;

            // Comparison Instructions
            case 'CMP':
                const cmpReg1 = args[0];
                const cmpArg2 = args[1];
                const val1 = currentRegisters[cmpReg1];
                // Check if second argument is immediate (starts with #) or register
                const val2 = cmpArg2.startsWith('#')
                    ? parseInt(cmpArg2.replace('#', ''))
                    : currentRegisters[cmpArg2];
                const cmpResult = val1 - val2;
                updatedFlags = {
                    ...updatedFlags,
                    zero: cmpResult === 0,
                    negative: cmpResult < 0,
                    carry: val1 < val2,
                    overflow: false,
                };
                setFlags(updatedFlags);
                setBusActivity({ address: null, data: cmpResult, type: 'CMP' });
                break;

            case 'CMPI':
                const cmpiReg = args[0];
                const cmpiImm = parseInt(args[1].replace('#', ''));
                const cmpiVal = currentRegisters[cmpiReg];
                const cmpiResult = cmpiVal - cmpiImm;
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: cmpiResult === 0,
                    negative: cmpiResult < 0,
                    carry: cmpiVal < cmpiImm,
                    overflow: false,
                }));
                setBusActivity({ address: null, data: cmpiResult, type: 'CMPI' });
                break;

            case 'TEST':
                const testReg1 = args[0];
                const testReg2 = args[1];
                const testResult = currentRegisters[testReg1] & currentRegisters[testReg2];
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: testResult === 0,
                    negative: testResult < 0,
                }));
                setBusActivity({ address: null, data: testResult, type: 'TEST' });
                break;

            case 'TESTI':
                const testiReg = args[0];
                const testiImm = parseInt(args[1].replace('#', ''));
                const testiResult = currentRegisters[testiReg] & testiImm;
                setFlags((currentFlags) => ({
                    ...currentFlags,
                    zero: testiResult === 0,
                    negative: testiResult < 0,
                }));
                setBusActivity({ address: null, data: testiResult, type: 'TESTI' });
                break;

            // Jump Instructions
            case 'JMP':
                const jmpAddr = parseInt(args[0].replace('#', ''));
                setPc(jmpAddr);
                setBusActivity({ address: jmpAddr, data: null, type: 'JUMP' });
                // Return early to prevent PC increment
                if (callback) {
                    setTimeout(() => {
                        executionRef.current.isExecuting = false;
                        callback(true, jmpAddr); // Pass new PC
                    }, 1);
                } else {
                    executionRef.current.isExecuting = false;
                }
                return true;

            case 'JEQ':
            case 'JZ':
                const jeqAddr = parseInt(args[0].replace('#', ''));
                if (updatedFlags.zero) {
                    setPc(jeqAddr);
                    setBusActivity({ address: jeqAddr, data: null, type: 'JUMP_TAKEN' });
                    if (callback) {
                        setTimeout(() => {
                            executionRef.current.isExecuting = false;
                            callback(true, jeqAddr);
                        }, 1);
                    } else {
                        executionRef.current.isExecuting = false;
                    }
                    return true;
                } else {
                    setBusActivity({ address: null, data: null, type: 'JUMP_NOT_TAKEN' });
                }
                break;

            case 'JNE':
            case 'JNZ':
                const jneAddr = parseInt(args[0].replace('#', ''));
                if (!updatedFlags.zero) {
                    setPc(jneAddr);
                    setBusActivity({ address: jneAddr, data: null, type: 'JUMP_TAKEN' });
                    if (callback) {
                        setTimeout(() => {
                            executionRef.current.isExecuting = false;
                            callback(true, jneAddr);
                        }, 1);
                    } else {
                        executionRef.current.isExecuting = false;
                    }
                    return true;
                } else {
                    setBusActivity({ address: null, data: null, type: 'JUMP_NOT_TAKEN' });
                }
                break;

            case 'JLT':
                const jltAddr = parseInt(args[0].replace('#', ''));
                if (updatedFlags.negative && !updatedFlags.zero) {
                    setPc(jltAddr);
                    setBusActivity({ address: jltAddr, data: null, type: 'JUMP_TAKEN' });
                    if (callback) {
                        setTimeout(() => {
                            executionRef.current.isExecuting = false;
                            callback(true, jltAddr);
                        }, 1);
                    } else {
                        executionRef.current.isExecuting = false;
                    }
                    return true;
                } else {
                    setBusActivity({ address: null, data: null, type: 'JUMP_NOT_TAKEN' });
                }
                break;

            case 'JGT':
                const jgtAddr = parseInt(args[0].replace('#', ''));
                if (!updatedFlags.negative && !updatedFlags.zero) {
                    setPc(jgtAddr);
                    setBusActivity({ address: jgtAddr, data: null, type: 'JUMP_TAKEN' });
                    if (callback) {
                        setTimeout(() => {
                            executionRef.current.isExecuting = false;
                            callback(true, jgtAddr);
                        }, 1);
                    } else {
                        executionRef.current.isExecuting = false;
                    }
                    return true;
                } else {
                    setBusActivity({ address: null, data: null, type: 'JUMP_NOT_TAKEN' });
                }
                break;

            case 'JLE':
                const jleAddr = parseInt(args[0].replace('#', ''));
                if (updatedFlags.negative || updatedFlags.zero) {
                    setPc(jleAddr);
                    setBusActivity({ address: jleAddr, data: null, type: 'JUMP_TAKEN' });
                    if (callback) {
                        setTimeout(() => {
                            executionRef.current.isExecuting = false;
                            callback(true, jleAddr);
                        }, 1);
                    } else {
                        executionRef.current.isExecuting = false;
                    }
                    return true;
                } else {
                    setBusActivity({ address: null, data: null, type: 'JUMP_NOT_TAKEN' });
                }
                break;

            case 'JGE':
                const jgeAddr = parseInt(args[0].replace('#', ''));
                if (!updatedFlags.negative || updatedFlags.zero) {
                    setPc(jgeAddr);
                    setBusActivity({ address: jgeAddr, data: null, type: 'JUMP_TAKEN' });
                    if (callback) {
                        setTimeout(() => {
                            executionRef.current.isExecuting = false;
                            callback(true, jgeAddr);
                        }, 1);
                    } else {
                        executionRef.current.isExecuting = false;
                    }
                    return true;
                } else {
                    setBusActivity({ address: null, data: null, type: 'JUMP_NOT_TAKEN' });
                }
                break;

            case 'JC':
                const jcAddr = parseInt(args[0].replace('#', ''));
                if (flags.carry) {
                    setPc(jcAddr);
                    setBusActivity({ address: jcAddr, data: null, type: 'JUMP_TAKEN' });
                    if (callback) {
                        setTimeout(() => {
                            executionRef.current.isExecuting = false;
                            callback(true, jcAddr);
                        }, 1);
                    } else {
                        executionRef.current.isExecuting = false;
                    }
                    return true;
                } else {
                    setBusActivity({ address: null, data: null, type: 'JUMP_NOT_TAKEN' });
                }
                break;

            case 'JNC':
                const jncAddr = parseInt(args[0].replace('#', ''));
                if (!flags.carry) {
                    setPc(jncAddr);
                    setBusActivity({ address: jncAddr, data: null, type: 'JUMP_TAKEN' });
                    if (callback) {
                        setTimeout(() => {
                            executionRef.current.isExecuting = false;
                            callback(true, jncAddr);
                        }, 1);
                    } else {
                        executionRef.current.isExecuting = false;
                    }
                    return true;
                } else {
                    setBusActivity({ address: null, data: null, type: 'JUMP_NOT_TAKEN' });
                }
                break;

            case 'JO':
                const joAddr = parseInt(args[0].replace('#', ''));
                if (flags.overflow) {
                    setPc(joAddr);
                    setBusActivity({ address: joAddr, data: null, type: 'JUMP_TAKEN' });
                    if (callback) {
                        setTimeout(() => {
                            executionRef.current.isExecuting = false;
                            callback(true, joAddr);
                        }, 1);
                    } else {
                        executionRef.current.isExecuting = false;
                    }
                    return true;
                } else {
                    setBusActivity({ address: null, data: null, type: 'JUMP_NOT_TAKEN' });
                }
                break;

            case 'JNO':
                const jnoAddr = parseInt(args[0].replace('#', ''));
                if (!flags.overflow) {
                    setPc(jnoAddr);
                    setBusActivity({ address: jnoAddr, data: null, type: 'JUMP_TAKEN' });
                    if (callback) {
                        setTimeout(() => {
                            executionRef.current.isExecuting = false;
                            callback(true, jnoAddr);
                        }, 1);
                    } else {
                        executionRef.current.isExecuting = false;
                    }
                    return true;
                } else {
                    setBusActivity({ address: null, data: null, type: 'JUMP_NOT_TAKEN' });
                }
                break;

            // System Interrupts
            case 'IRET':
                // Interrupt return - restore state from stack
                setStack((currentStack) => {
                    if (currentStack.length >= 2) {
                        // Pop flags and PC from stack
                        const savedFlags = currentStack[currentStack.length - 1];
                        const savedPC = currentStack[currentStack.length - 2];

                        // Restore flags (simplified - just restore zero flag for now)
                        setFlags((currentFlags) => ({
                            ...currentFlags,
                            zero: (savedFlags & 1) !== 0,
                            carry: (savedFlags & 2) !== 0,
                            negative: (savedFlags & 4) !== 0,
                            overflow: (savedFlags & 8) !== 0,
                            interrupt: true, // Re-enable interrupts
                        }));

                        // Restore PC
                        setPc(savedPC);

                        // Update stack pointer
                        setRegisters((currentRegs) => ({
                            ...currentRegs,
                            SP: currentRegs.SP + 2,
                        }));

                        setBusActivity({ address: savedPC, data: null, type: 'IRET' });

                        // Return early to prevent PC increment
                        if (callback) {
                            setTimeout(() => {
                                executionRef.current.isExecuting = false;
                                callback(true, savedPC);
                            }, 1);
                        } else {
                            executionRef.current.isExecuting = false;
                        }
                        return currentStack.slice(0, -2);
                    }
                    return currentStack;
                });
                return true;

            case 'INT':
                const interruptNum = parseInt(args[0].replace('#', ''));
                const interruptType = systemInterrupts[interruptNum];

                console.log(`Executing interrupt ${interruptNum} (${interruptType})`);

                // Execute interrupt using passed register values
                switch (interruptType) {
                    case 'PRINT_CHAR':
                        const charCode = currentRegisters.R7 || currentRegisters.R1;
                        const char = String.fromCharCode(charCode);
                        console.log(`Printing character: '${char}' (ASCII ${charCode})`);
                        setOutput((prev) => prev + char);
                        break;
                    case 'PRINT_NEWLINE':
                        console.log('Printing newline');
                        setOutput((prev) => prev + '\n');
                        break;
                    case 'PRINT_NUMBER':
                        const number = currentRegisters.R7 || currentRegisters.R1;
                        console.log(`Printing number: ${number}`);
                        setOutput((prev) => prev + number.toString());
                        break;
                    case 'PRINT_HEX':
                        const hexNumber = currentRegisters.R7 || currentRegisters.R1;
                        setOutput((prev) => prev + '0x' + hexNumber.toString(16).toUpperCase());
                        break;
                    case 'PRINT_BINARY':
                        const binNumber = currentRegisters.R7 || currentRegisters.R1;
                        setOutput((prev) => prev + '0b' + binNumber.toString(2));
                        break;
                    case 'RANDOM_NUMBER':
                        // Generate random number 0-255
                        setRegisters((currentRegs) => ({
                            ...currentRegs,
                            R0: Math.floor(Math.random() * 256),
                        }));
                        break;
                    case 'GET_TIME':
                        // Return current timestamp
                        setRegisters((currentRegs) => ({
                            ...currentRegs,
                            R0: Date.now() % 1000000, // Truncated timestamp
                        }));
                        break;
                    case 'BEEP':
                        playBeep();
                        break;
                    case 'PLAY_TONE':
                        // R0 = frequency, R1 = duration
                        const freq = currentRegisters.R0 || 440;
                        const dur = currentRegisters.R1 || 500;
                        playTone(freq, dur);
                        break;

                    // Keyboard Interrupts
                    case 'KEYBOARD_INT_ENABLE':
                        setKeyboardInterruptEnabled(true);
                        break;
                    case 'KEYBOARD_INT_DISABLE':
                        setKeyboardInterruptEnabled(false);
                        break;
                    case 'KEYBOARD_INT_HANDLER':
                        // R0 contains the address of the interrupt handler
                        setKeyboardInterruptHandler(currentRegisters.R0);
                        break;
                    case 'KEYBOARD_SCAN_CODE':
                        // Return the last scan code in R0
                        setRegisters((currentRegs) => ({
                            ...currentRegs,
                            R0: lastScanCode,
                        }));
                        break;
                    case 'KEYBOARD_ASCII_CODE':
                        // Return the last ASCII code in R0
                        setRegisters((currentRegs) => ({
                            ...currentRegs,
                            R0: lastKeyPressed,
                        }));
                        break;
                    case 'KEYBOARD_READ':
                        // Read next key from buffer
                        setKeyboardBuffer((prev) => {
                            if (prev.length > 0) {
                                const key = prev[0];
                                setRegisters((currentRegs) => ({
                                    ...currentRegs,
                                    R0: key.asciiCode,
                                }));
                                return prev.slice(1);
                            } else {
                                setRegisters((currentRegs) => ({
                                    ...currentRegs,
                                    R0: 0,
                                }));
                                return prev;
                            }
                        });
                        break;
                    case 'KEYBOARD_STATUS':
                        // Return keyboard status flags in R0
                        const statusFlags =
                            (keyboardStatus.shift ? 1 : 0) |
                            (keyboardStatus.ctrl ? 2 : 0) |
                            (keyboardStatus.alt ? 4 : 0) |
                            (keyboardStatus.capsLock ? 8 : 0) |
                            (keyboardBuffer.length > 0 ? 16 : 0);
                        setRegisters((currentRegs) => ({
                            ...currentRegs,
                            R0: statusFlags,
                        }));
                        break;
                    case 'KEYBOARD_BUFFER_SIZE':
                        // Return keyboard buffer size in R0
                        setRegisters((currentRegs) => ({
                            ...currentRegs,
                            R0: keyboardBuffer.length,
                        }));
                        break;
                    case 'KEYBOARD_CLEAR_BUFFER':
                        // Clear keyboard buffer
                        setKeyboardBuffer([]);
                        break;

                    // New Graphics Interrupts
                    case 'SCREEN_CLEAR':
                        setScreenBuffer(
                            new Array(SCREEN_HEIGHT)
                                .fill(null)
                                .map(() => new Array(SCREEN_WIDTH).fill(0)),
                        );
                        setCursorX(0);
                        setCursorY(0);
                        break;

                    case 'SCREEN_SET_PIXEL':
                        // R0 = x, R1 = y, R2 = color (0=off, 1=on)
                        const pixelX = currentRegisters.R0;
                        const pixelY = currentRegisters.R1;
                        const pixelColor = currentRegisters.R2 || 1;
                        if (
                            pixelX >= 0 &&
                            pixelX < SCREEN_WIDTH &&
                            pixelY >= 0 &&
                            pixelY < SCREEN_HEIGHT
                        ) {
                            setScreenBuffer((prev) => {
                                const newBuffer = prev.map((row) => [...row]);
                                newBuffer[pixelY][pixelX] = pixelColor;
                                return newBuffer;
                            });
                        }
                        break;

                    case 'SCREEN_GET_PIXEL':
                        // R0 = x, R1 = y, returns pixel value in R0
                        const getX = currentRegisters.R0;
                        const getY = currentRegisters.R1;
                        if (getX >= 0 && getX < SCREEN_WIDTH && getY >= 0 && getY < SCREEN_HEIGHT) {
                            setRegisters((prev) => ({
                                ...prev,
                                R0: screenBuffer[getY][getX],
                            }));
                        }
                        break;

                    case 'SCREEN_SET_COLOR':
                        // R0 = color value (0-7 for different colors)
                        const colorValue = currentRegisters.R0;
                        const colors = [
                            '#000000',
                            '#ff0000',
                            '#00ff00',
                            '#0000ff',
                            '#ffff00',
                            '#ff00ff',
                            '#00ffff',
                            '#ffffff',
                        ];

                        setScreenColor(colors[colorValue % colors.length]);
                        break;

                    case 'SCREEN_DRAW_LINE':
                        // R0 = x1, R1 = y1, R2 = x2, R3 = y2
                        const x1 = currentRegisters.R0;
                        const y1 = currentRegisters.R1;
                        const x2 = currentRegisters.R2;
                        const y2 = currentRegisters.R3;
                        drawLine(x1, y1, x2, y2);
                        break;

                    case 'SCREEN_DRAW_RECT':
                        // R0 = x, R1 = y, R2 = width, R3 = height
                        const rectX = currentRegisters.R0;
                        const rectY = currentRegisters.R1;
                        const rectW = currentRegisters.R2;
                        const rectH = currentRegisters.R3;
                        drawRect(rectX, rectY, rectW, rectH, false);
                        break;

                    case 'SCREEN_FILL_RECT':
                        // R0 = x, R1 = y, R2 = width, R3 = height
                        const fillX = currentRegisters.R0;
                        const fillY = currentRegisters.R1;
                        const fillW = currentRegisters.R2;
                        const fillH = currentRegisters.R3;
                        drawRect(fillX, fillY, fillW, fillH, true);
                        break;

                    case 'SCREEN_DRAW_CIRCLE':
                        // R0 = centerX, R1 = centerY, R2 = radius
                        const centerX = currentRegisters.R0;
                        const centerY = currentRegisters.R1;
                        const radius = currentRegisters.R2;
                        drawCircle(centerX, centerY, radius);
                        break;

                    case 'SCREEN_SET_CURSOR':
                        // R0 = x, R1 = y
                        const newCursorX = Math.max(
                            0,
                            Math.min(SCREEN_WIDTH - 1, currentRegisters.R0),
                        );
                        const newCursorY = Math.max(
                            0,
                            Math.min(SCREEN_HEIGHT - 1, currentRegisters.R1),
                        );
                        setCursorX(newCursorX);
                        setCursorY(newCursorY);
                        break;

                    case 'SCREEN_PRINT_CHAR':
                        // R0 = ASCII character code
                        const charToPrint = currentRegisters.R0;
                        printCharToScreen(charToPrint);
                        break;

                    default:
                        console.log(`Unknown interrupt type: ${interruptType}`);
                        setOutput((prev) => prev + `[Unknown INT #${interruptNum}]`);
                        break;
                }
                setBusActivity({ address: null, data: interruptNum, type: 'INTERRUPT' });
                break;

            case 'NOP':
                setBusActivity({ address: null, data: null, type: 'NOP' });
                break;

            case 'HALT':
                setIsRunning(false);
                setStepMode(false);
                setOutput((prev) => prev + '\n--- Program halted ---\n');
                setBusActivity({ address: null, data: null, type: 'HALT' });
                shouldContinue = false;
                // Clear the stop function reference when program halts naturally
                if (executionRef.current.stopExecution) {
                    executionRef.current.stopExecution = null;
                }
                break;

            default:
                setOutput((prev) => prev + `\nUnknown instruction: ${instruction}\n`);
                setBusActivity({ address: null, data: null, type: 'ERROR' });
                break;
        }

        // Call callback with proper timing and reset execution flag
        if (callback) {
            const callbackWrapper = (shouldContinue) => {
                executionRef.current.isExecuting = false;
                callback(shouldContinue);
            };

            if (stepMode) {
                // Immediate callback for step mode
                setTimeout(() => callbackWrapper(shouldContinue), 10);
            } else {
                // Very fast callback for run mode - minimal delay for UI updates
                setTimeout(() => callbackWrapper(shouldContinue), 1);
            }
        } else {
            executionRef.current.isExecuting = false;
        }

        return true;
    };

    const runProgram = () => {
        const parsed = parseAssembly(asmCode);
        setParsedInstructions(parsed);
        setIsRunning(true);
        setStepMode(false);
        setOutput('--- Program started ---\n');
        setPc(0);
        setCurrentLine(0);

        let currentIndex = 0;
        let executionStopped = false;

        // Batch state updates for better performance
        let currentRegs = { ...registers };
        let currentFlags = { ...flags };
        let currentMem = [...memory];
        let currentStack = [...stack];
        let currentOutput = '--- Program started ---\n';
        let currentScreenBuffer = screenBuffer.map((row) => [...row]);
        let currentCursorX = cursorX;
        let currentCursorY = cursorY;
        let currentScreenColor = screenColor;

        // Optimized parameters for maximum speed
        const UI_UPDATE_INTERVAL = executionSpeed === 0 ? 100 : 10; // Less frequent UI updates for max speed
        const BATCH_SIZE = executionSpeed === 0 ? 50 : 1; // Larger batch size for max speed
        let instructionCount = 0;
        let frameCount = 0;

        const executeNext = () => {
            // Prevent infinite loops by limiting execution time per frame
            const startTime = performance.now();
            const MAX_FRAME_TIME = executionSpeed === 0 ? 16 : 16; // 16ms budget per frame

            for (
                let batch = 0;
                batch < BATCH_SIZE && currentIndex < parsed.length && !executionStopped;
                batch++
            ) {
                // Check if we've exceeded frame time budget
                if (performance.now() - startTime > MAX_FRAME_TIME) {
                    break;
                }

                if (currentIndex >= parsed.length) break;

                const { instruction, args, isBlankOrComment } = parsed[currentIndex];

                // Handle blank lines and comments
                if (isBlankOrComment) {
                    currentIndex++;
                    continue;
                }

                // Execute instruction with local state
                const result = executeInstructionFast(
                    instruction,
                    args,
                    currentRegs,
                    currentFlags,
                    currentMem,
                    currentStack,
                    currentOutput,
                    currentScreenBuffer,
                    currentCursorX,
                    currentCursorY,
                    currentScreenColor,
                );

                if (result) {
                    currentRegs = result.registers || currentRegs;
                    currentFlags = result.flags || currentFlags;
                    currentMem = result.memory || currentMem;
                    currentStack = result.stack || currentStack;
                    currentOutput = result.output || currentOutput;
                    currentScreenBuffer = result.screenBuffer || currentScreenBuffer;
                    currentCursorX = result.cursorX !== undefined ? result.cursorX : currentCursorX;
                    currentCursorY = result.cursorY !== undefined ? result.cursorY : currentCursorY;
                    currentScreenColor = result.screenColor || currentScreenColor;

                    if (result.newPC !== undefined) {
                        currentIndex = result.newPC;
                    } else {
                        currentIndex++;
                    }

                    if (!result.shouldContinue) {
                        executionStopped = true;
                        break;
                    }
                } else {
                    currentIndex++;
                }

                instructionCount++;
            }

            frameCount++;

            // Update UI less frequently for maximum speed mode
            const shouldUpdateUI =
                instructionCount % UI_UPDATE_INTERVAL === 0 ||
                frameCount % (executionSpeed === 0 ? 1 : 5) === 0 || // Update every frame for max speed
                executionStopped ||
                currentIndex >= parsed.length;

            if (shouldUpdateUI) {
                // Use React's batching for better performance
                React.startTransition(() => {
                    setRegisters(currentRegs);
                    setFlags(currentFlags);
                    setMemory(currentMem);
                    setStack(currentStack);
                    setOutput(currentOutput);
                    setScreenBuffer(currentScreenBuffer);
                    setCursorX(currentCursorX);
                    setCursorY(currentCursorY);
                    setScreenColor(currentScreenColor);
                    setCurrentLine(currentIndex);
                    setCurrentSourceLine(lineMapping[currentIndex] || -1);
                    setPc(currentIndex);
                    setIr(instructions[parsed[currentIndex]?.instruction]?.opcode || 0);
                });
            }

            // Check if execution should continue
            if (executionStopped || currentIndex >= parsed.length) {
                setIsRunning(false);
                setCurrentLine(-1);
                setCurrentSourceLine(-1);
                if (currentIndex >= parsed.length) {
                    setOutput((prev) => prev + '\n--- Program completed ---\n');
                }
                return;
            }

            // Schedule next batch with optimized timing
            if (executionSpeed === 0) {
                // Use requestAnimationFrame for maximum speed and smooth animation
                requestAnimationFrame(executeNext);
            } else {
                setTimeout(executeNext, executionSpeed);
            }
        };

        // Store the stop function for external access
        executionRef.current.stopExecution = () => {
            executionStopped = true;
        };

        executeNext();
    };

    const stopProgram = () => {
        if (executionRef.current.stopExecution) {
            executionRef.current.stopExecution();
        }
        setIsRunning(false);
        setStepMode(false);
        setCurrentLine(-1);
        setCurrentSourceLine(-1);
        setOutput((prev) => prev + '\n--- Program stopped ---\n');
    };

    const stepProgram = () => {
        if (!stepMode) {
            const parsed = parseAssembly(asmCode);
            setParsedInstructions(parsed);
            setStepMode(true);
            setOutput('Step mode started...\n');
            setPc(0);
            setCurrentLine(0);
            setCurrentSourceLine(lineMapping[0] || 0);
            return;
        }

        if (currentLine >= parsedInstructions.length) {
            setStepMode(false);
            setCurrentLine(-1);
            setCurrentSourceLine(-1);
            setOutput((prev) => prev + '\n--- Program completed ---\n');
            return;
        }

        const { instruction, args, isBlankOrComment } = parsedInstructions[currentLine];
        setIr(instructions[instruction]?.opcode || 0);
        setPc(currentLine);
        setCurrentSourceLine(lineMapping[currentLine]);

        // Handle blank lines and comments in step mode
        if (isBlankOrComment) {
            setBusActivity({ address: null, data: null, type: 'NOP' });
            setCurrentLine((prev) => {
                const newLine = prev + 1;
                setCurrentSourceLine(lineMapping[newLine] || -1);
                return newLine;
            });
            return;
        }

        // Get current register and flag values at execution time
        setRegisters((currentRegs) => {
            setFlags((currentFlags) => {
                executeInstruction(
                    instruction,
                    args,
                    (shouldContinue, newPC) => {
                        if (shouldContinue) {
                            setCurrentLine((prev) => {
                                // If newPC is provided (from jump instruction), use it
                                const newLine = newPC !== undefined ? newPC : prev + 1;
                                setCurrentSourceLine(lineMapping[newLine] || -1);
                                return newLine;
                            });
                        } else {
                            setStepMode(false);
                            setCurrentLine(-1);
                            setCurrentSourceLine(-1);
                        }
                    },
                    currentRegs,
                    currentFlags,
                );
                return currentFlags; // Return unchanged
            });
            return currentRegs; // Return unchanged
        });
    };

    // Audio functions
    const initAudioContext = () => {
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            } catch (error) {
                console.warn('Web Audio API not supported:', error);
                return null;
            }
        }
        return audioContextRef.current;
    };

    const playBeep = (frequency = 800, duration = 200) => {
        const audioContext = initAudioContext();
        if (!audioContext) {
            return;
        }

        try {
            // Resume audio context if suspended (required by some browsers)
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                audioContext.currentTime + duration / 1000,
            );

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (error) {
            console.warn('Error playing beep:', error);
        }
    };

    const playTone = (frequency, duration) => {
        const audioContext = initAudioContext();
        if (!audioContext) {
            return;
        }

        try {
            // Resume audio context if suspended
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                audioContext.currentTime + duration / 1000,
            );

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (error) {
            console.warn('Error playing tone:', error);
        }
    };

    // Graphics helper functions
    const drawLine = (x1, y1, x2, y2) => {
        setScreenBuffer((prev) => {
            const newBuffer = prev.map((row) => [...row]);

            // Bresenham's line algorithm
            const dx = Math.abs(x2 - x1);
            const dy = Math.abs(y2 - y1);
            const sx = x1 < x2 ? 1 : -1;
            const sy = y1 < y2 ? 1 : -1;
            let err = dx - dy;

            let x = x1;
            let y = y1;

            while (true) {
                if (x >= 0 && x < SCREEN_WIDTH && y >= 0 && y < SCREEN_HEIGHT) {
                    newBuffer[y][x] = 1;
                }

                if (x === x2 && y === y2) break;

                const e2 = 2 * err;
                if (e2 > -dy) {
                    err -= dy;
                    x += sx;
                }
                if (e2 < dx) {
                    err += dx;
                    y += sy;
                }
            }

            return newBuffer;
        });
    };

    const drawRect = (x, y, width, height, filled) => {
        setScreenBuffer((prev) => {
            const newBuffer = prev.map((row) => [...row]);

            for (let i = 0; i < height; i++) {
                for (let j = 0; j < width; j++) {
                    const px = x + j;
                    const py = y + i;

                    if (px >= 0 && px < SCREEN_WIDTH && py >= 0 && py < SCREEN_HEIGHT) {
                        if (filled || i === 0 || i === height - 1 || j === 0 || j === width - 1) {
                            newBuffer[py][px] = 1;
                        }
                    }
                }
            }

            return newBuffer;
        });
    };

    const drawCircle = (centerX, centerY, radius) => {
        setScreenBuffer((prev) => {
            const newBuffer = prev.map((row) => [...row]);

            // Bresenham's circle algorithm
            let x = 0;
            let y = radius;
            let d = 3 - 2 * radius;

            const drawCirclePoints = (cx, cy, x, y) => {
                const points = [
                    [cx + x, cy + y],
                    [cx - x, cy + y],
                    [cx + x, cy - y],
                    [cx - x, cy - y],
                    [cx + y, cy + x],
                    [cx - y, cy + x],
                    [cx + y, cy - x],
                    [cx - y, cy - x],
                ];

                points.forEach(([px, py]) => {
                    if (px >= 0 && px < SCREEN_WIDTH && py >= 0 && py < SCREEN_HEIGHT) {
                        newBuffer[py][px] = 1;
                    }
                });
            };

            drawCirclePoints(centerX, centerY, x, y);

            while (y >= x) {
                x++;
                if (d > 0) {
                    y--;
                    d = d + 4 * (x - y) + 10;
                } else {
                    d = d + 4 * x + 6;
                }
                drawCirclePoints(centerX, centerY, x, y);
            }

            return newBuffer;
        });
    };

    const printCharToScreen = (charCode) => {
        // Simple 5x7 font for basic characters
        const font = {
            32: [0, 0, 0, 0, 0, 0, 0], // space
            65: [0x1f, 0x24, 0x44, 0x24, 0x1f, 0, 0], // A
            66: [0x7f, 0x49, 0x49, 0x49, 0x36, 0, 0], // B
            67: [0x3e, 0x41, 0x41, 0x41, 0x22, 0, 0], // C
            72: [0x7f, 0x08, 0x08, 0x08, 0x7f, 0, 0], // H
            69: [0x7f, 0x49, 0x49, 0x49, 0x41, 0, 0], // E
            76: [0x7f, 0x01, 0x01, 0x01, 0x01, 0, 0], // L
            79: [0x3e, 0x41, 0x41, 0x41, 0x3e, 0, 0], // O
        };

        const pattern = font[charCode] || font[32]; // Default to space if character not found

        setScreenBuffer((prev) => {
            const newBuffer = prev.map((row) => [...row]);

            for (let row = 0; row < 7; row++) {
                for (let col = 0; col < 5; col++) {
                    const x = cursorX * 6 + col;
                    const y = cursorY * 8 + row;

                    if (x < SCREEN_WIDTH && y < SCREEN_HEIGHT) {
                        newBuffer[y][x] = (pattern[row] >> (4 - col)) & 1;
                    }
                }
            }

            return newBuffer;
        });

        // Advance cursor
        setCursorX((prev) => {
            const newX = prev + 1;
            if (newX >= Math.floor(SCREEN_WIDTH / 6)) {
                setCursorY((prevY) => (prevY + 1) % Math.floor(SCREEN_HEIGHT / 8));
                return 0;
            }
            return newX;
        });
    };

    const resetCPU = () => {
        // Stop any running execution first
        if (isRunning && executionRef.current.stopExecution) {
            executionRef.current.stopExecution();
        }

        setRegisters({ R0: 0, R1: 0, R2: 0, R3: 0, R4: 0, R5: 0, R6: 0, R7: 0, SP: 255, LR: 0 });
        setMemory(new Array(256).fill(0));
        setPc(0);
        setIr(0);
        setFlags({ zero: false, carry: false, negative: false, overflow: false, interrupt: false });
        setOutput('');
        setIsRunning(false);
        setStepMode(false);
        setCurrentLine(-1);
        setCurrentSourceLine(-1);
        setBusActivity({ address: null, data: null, type: null });
        setStack([]);
        setParsedInstructions([]);
        setLineMapping([]);

        // Reset performance stats
        setPerformanceStats({
            instructionsPerSecond: 0,
            totalInstructions: 0,
            executionTime: 0,
        });

        // Reset screen
        setScreenBuffer(
            new Array(SCREEN_HEIGHT).fill(null).map(() => new Array(SCREEN_WIDTH).fill(0)),
        );
        setCursorX(0);
        setCursorY(0);
        setScreenColor('#00ff00');
        setMouseCursorX(-1);
        setMouseCursorY(-1);

        // Clear the stop function reference
        executionRef.current.stopExecution = null;
    };

    // Handle mouse movement over the screen display
    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate pixel coordinates based on the grid
        // Account for padding (8px on each side) and pixel size (6px each)
        const padding = 8; // p-2 = 8px padding
        const pixelSize = 6;

        const pixelX = Math.floor((x - padding) / pixelSize);
        const pixelY = Math.floor((y - padding) / pixelSize);

        // Check if coordinates are within bounds
        if (pixelX >= 0 && pixelX < SCREEN_WIDTH && pixelY >= 0 && pixelY < SCREEN_HEIGHT) {
            setMouseCursorX(pixelX);
            setMouseCursorY(pixelY);
        } else {
            setMouseCursorX(-1);
            setMouseCursorY(-1);
        }
    };

    // Handle mouse leaving the screen area
    const handleMouseLeave = () => {
        setMouseCursorX(-1);
        setMouseCursorY(-1);
    };

    // Keyboard event handlers
    const handleKeyDown = useCallback(
        (e) => {
            // Update keyboard status
            setKeyboardStatus((prev) => ({
                ...prev,
                shift: e.shiftKey,
                ctrl: e.ctrlKey,
                alt: e.altKey,
                capsLock: e.getModifierState('CapsLock'),
            }));

            // Convert key to scan code (simplified mapping)
            const scanCode = getKeyboardScanCode(e.code);
            setLastScanCode(scanCode);

            // Convert to ASCII if possible
            let asciiCode = 0;
            if (e.key.length === 1) {
                asciiCode = e.key.charCodeAt(0);
            } else {
                // Special keys mapping
                switch (e.key) {
                    case 'Enter':
                        asciiCode = 13;
                        break;
                    case 'Escape':
                        asciiCode = 27;
                        break;
                    case 'Backspace':
                        asciiCode = 8;
                        break;
                    case 'Tab':
                        asciiCode = 9;
                        break;
                    case 'Space':
                        asciiCode = 32;
                        break;
                    case 'ArrowUp':
                        asciiCode = 128;
                        break;
                    case 'ArrowDown':
                        asciiCode = 129;
                        break;
                    case 'ArrowLeft':
                        asciiCode = 130;
                        break;
                    case 'ArrowRight':
                        asciiCode = 131;
                        break;
                    case 'F1':
                        asciiCode = 132;
                        break;
                    case 'F2':
                        asciiCode = 133;
                        break;
                    case 'F3':
                        asciiCode = 134;
                        break;
                    case 'F4':
                        asciiCode = 135;
                        break;
                    case 'F5':
                        asciiCode = 136;
                        break;
                    case 'F6':
                        asciiCode = 137;
                        break;
                    case 'F7':
                        asciiCode = 138;
                        break;
                    case 'F8':
                        asciiCode = 139;
                        break;
                    case 'F9':
                        asciiCode = 140;
                        break;
                    case 'F10':
                        asciiCode = 141;
                        break;
                    case 'F11':
                        asciiCode = 142;
                        break;
                    case 'F12':
                        asciiCode = 143;
                        break;
                    default:
                        asciiCode = 0;
                }
            }

            setLastKeyPressed(asciiCode);

            // Add to keyboard buffer if not full
            setKeyboardBuffer((prev) => {
                if (prev.length < 16) {
                    // Buffer size limit
                    return [...prev, { scanCode, asciiCode, timestamp: Date.now() }];
                }
                return prev; // Buffer full, ignore key
            });

            // Trigger keyboard interrupt if enabled
            if (keyboardInterruptEnabled && keyboardInterruptHandler > 0) {
                // Save current state and jump to interrupt handler
                setStack((currentStack) => {
                    const newStack = [...currentStack];
                    // Push current PC and flags
                    newStack.push(pc);
                    const flagsValue =
                        (flags.zero ? 1 : 0) |
                        (flags.carry ? 2 : 0) |
                        (flags.negative ? 4 : 0) |
                        (flags.overflow ? 8 : 0);
                    newStack.push(flagsValue);
                    return newStack;
                });

                // Jump to interrupt handler
                setPc(keyboardInterruptHandler);

                // Set interrupt flag
                setFlags((prev) => ({ ...prev, interrupt: true }));
            }

            // Prevent default for special keys to avoid browser shortcuts
            if (
                [
                    'F1',
                    'F2',
                    'F3',
                    'F4',
                    'F5',
                    'F6',
                    'F7',
                    'F8',
                    'F9',
                    'F10',
                    'F11',
                    'F12',
                ].includes(e.key)
            ) {
                e.preventDefault();
            }
        },
        [keyboardInterruptEnabled, keyboardInterruptHandler, pc, flags],
    );

    const handleKeyUp = useCallback((e) => {
        // Update keyboard status
        setKeyboardStatus((prev) => ({
            ...prev,
            shift: e.shiftKey,
            ctrl: e.ctrlKey,
            alt: e.altKey,
            capsLock: e.getModifierState('CapsLock'),
        }));
    }, []);

    // Convert JavaScript KeyboardEvent.code to scan code
    const getKeyboardScanCode = (code) => {
        const scanCodeMap = {
            KeyA: 0x1e,
            KeyB: 0x30,
            KeyC: 0x2e,
            KeyD: 0x20,
            KeyE: 0x12,
            KeyF: 0x21,
            KeyG: 0x22,
            KeyH: 0x23,
            KeyI: 0x17,
            KeyJ: 0x24,
            KeyK: 0x25,
            KeyL: 0x26,
            KeyM: 0x32,
            KeyN: 0x31,
            KeyO: 0x18,
            KeyP: 0x19,
            KeyQ: 0x10,
            KeyR: 0x13,
            KeyS: 0x1f,
            KeyT: 0x14,
            KeyU: 0x16,
            KeyV: 0x2f,
            KeyW: 0x11,
            KeyX: 0x2d,
            KeyY: 0x15,
            KeyZ: 0x2c,
            Digit0: 0x0b,
            Digit1: 0x02,
            Digit2: 0x03,
            Digit3: 0x04,
            Digit4: 0x05,
            Digit5: 0x06,
            Digit6: 0x07,
            Digit7: 0x08,
            Digit8: 0x09,
            Digit9: 0x0a,
            Space: 0x39,
            Enter: 0x1c,
            Escape: 0x01,
            Backspace: 0x0e,
            Tab: 0x0f,
            ShiftLeft: 0x2a,
            ShiftRight: 0x36,
            ControlLeft: 0x1d,
            ControlRight: 0x1d,
            AltLeft: 0x38,
            AltRight: 0x38,
            ArrowUp: 0x48,
            ArrowDown: 0x50,
            ArrowLeft: 0x4b,
            ArrowRight: 0x4d,
            F1: 0x3b,
            F2: 0x3c,
            F3: 0x3d,
            F4: 0x3e,
            F5: 0x3f,
            F6: 0x40,
            F7: 0x41,
            F8: 0x42,
            F9: 0x43,
            F10: 0x44,
            F11: 0x57,
            F12: 0x58,
        };
        return scanCodeMap[code] || 0x00;
    };

    // Add keyboard event listeners
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    // Calculate line height for proper sizing
    const lineHeight = 20; // 1.25rem in pixels

    // Synchronize scrolling between textarea and line numbers
    const handleScroll = (e) => {
        // This is now handled by the AssemblyEditor component
    };
    return (
        <div className="min-h-screen bg-gray-900 text-green-400 font-mono p-4" data-oid="53amhe:">
            <div className="max-w-full mx-auto" data-oid="7cue7-s">
                <h1
                    className="text-3xl font-bold mb-4 text-center text-green-300 bg-gray-800 py-3 rounded-lg border border-green-500"
                    data-oid="e58-ixk"
                >
                    Tonics CPU Emulator
                </h1>

                {/* Pixeled Screen Display */}
                <div
                    className="bg-gray-800 rounded-lg border border-green-500 overflow-hidden mb-4"
                    data-oid="9svp_th"
                >
                    <div
                        className="bg-gray-700 px-4 py-2 border-b border-green-500 flex items-center justify-between"
                        data-oid="0yfz0sn"
                    >
                        <h2
                            className="text-lg font-bold text-green-300 flex items-center gap-2"
                            data-oid="qgg4c_o"
                        >
                            Pixeled Display (128x64)
                        </h2>
                        <div className="flex gap-2 items-center" data-oid="-a1i7:p">
                            <span className="text-sm text-gray-400" data-oid="qamdxux">
                                Text Cursor: ({cursorX}, {cursorY})
                            </span>
                            <span className="text-sm text-green-400 font-mono" data-oid=":7oh1.z">
                                Mouse: ({mouseCursorX}, {mouseCursorY})
                            </span>
                            {isRunning && (
                                <div className="flex items-center gap-2" data-oid="1s1o9ts">
                                    <span
                                        className="text-sm text-yellow-400 font-mono animate-pulse"
                                        data-oid="44v-5j:"
                                    >
                                        {executionSpeed === 0
                                            ? '🚀 ULTRA'
                                            : executionSpeed === 1
                                              ? '⚡ TURBO'
                                              : '🏃 RUNNING'}
                                    </span>
                                    {executionSpeed === 0 &&
                                        performanceStats.instructionsPerSecond > 0 && (
                                            <span
                                                className="text-xs text-green-400 font-mono"
                                                data-oid="vqq8hhv"
                                            >
                                                {performanceStats.instructionsPerSecond.toLocaleString()}{' '}
                                                IPS
                                            </span>
                                        )}
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    setScreenBuffer(
                                        new Array(SCREEN_HEIGHT)
                                            .fill(null)
                                            .map(() => new Array(SCREEN_WIDTH).fill(0)),
                                    );
                                    setCursorX(0);
                                    setCursorY(0);
                                }}
                                className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm"
                                data-oid="qtxcix:"
                            >
                                🗑️ Clear Screen
                            </button>
                        </div>
                    </div>
                    <div className="p-4 bg-black flex justify-center" data-oid="e1ov2nu">
                        <div
                            className="relative border border-gray-600 bg-black p-2 cursor-crosshair"
                            style={{
                                width: `${SCREEN_WIDTH * 6 + 16}px`,
                                height: `${SCREEN_HEIGHT * 6 + 16}px`,
                            }}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            data-oid="ionkf_n"
                        >
                            <canvas
                                ref={(canvas) => {
                                    if (canvas) {
                                        const ctx = canvas.getContext('2d');
                                        if (ctx) {
                                            canvas.width = SCREEN_WIDTH * 6;
                                            canvas.height = SCREEN_HEIGHT * 6;

                                            // Clear canvas
                                            ctx.fillStyle = '#111111';
                                            ctx.fillRect(0, 0, canvas.width, canvas.height);

                                            // Draw pixels
                                            for (let y = 0; y < SCREEN_HEIGHT; y++) {
                                                for (let x = 0; x < SCREEN_WIDTH; x++) {
                                                    const pixel = screenBuffer[y][x];
                                                    if (pixel) {
                                                        ctx.fillStyle = screenColor;
                                                        ctx.fillRect(x * 6, y * 6, 6, 6);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }}
                                className="absolute top-2 left-2"
                                title={`Screen Buffer - Mouse: (${mouseCursorX}, ${mouseCursorY})`}
                                data-oid="nexrsu6"
                            />
                        </div>
                    </div>
                    <div
                        className="bg-gray-700 px-4 py-2 border-t border-green-500"
                        data-oid="o-qtlh2"
                    >
                        <div
                            className="text-xs text-gray-400 grid grid-cols-2 md:grid-cols-4 gap-2"
                            data-oid="eehrrzd"
                        >
                            <div data-oid="a85k12v">
                                <strong data-oid="7dsy2_u">INT #101:</strong> Clear screen
                            </div>
                            <div data-oid="oty94e2">
                                <strong data-oid="sy9kek6">INT #102:</strong> Set pixel (R0=x, R1=y,
                                R2=color) [0-127, 0-63]
                            </div>
                            <div data-oid="s05.bf2">
                                <strong data-oid="pfto0sc">INT #105:</strong> Draw line (R0=x1,
                                R1=y1, R2=x2, R3=y2)
                            </div>
                            <div data-oid="4he8jz2">
                                <strong data-oid="56ie.zm">INT #106:</strong> Draw rect (R0=x, R1=y,
                                R2=w, R3=h)
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-4 mb-4" data-oid="yypu5j8">
                    <div className="col-span-12 lg:col-span-5 space-y-4" data-oid="2uwde-1">
                        <div
                            className="bg-gray-800 rounded-lg border border-green-500 overflow-hidden h-[650px] flex flex-col"
                            data-oid="827g9-v"
                        >
                            <div
                                className="bg-gray-700 px-4 py-2 border-b border-green-500 flex items-center justify-between flex-shrink-0"
                                data-oid="9k_q.2s"
                            >
                                <h2
                                    className="text-lg font-bold text-green-300 flex items-center gap-2"
                                    data-oid="m4g.gm3"
                                >
                                    Assembly Editor
                                </h2>
                                <div className="flex gap-2 items-center" data-oid="porfxnd">
                                    <select
                                        value={executionSpeed}
                                        onChange={(e) => setExecutionSpeed(Number(e.target.value))}
                                        className="px-2 py-1 bg-gray-600 text-white text-sm rounded-none w-[167px] h-[26px]"
                                        disabled={isRunning}
                                        data-oid="::7:b_y"
                                    >
                                        <option value={0} data-oid="2jrqie8">
                                            ULTRA SPEED (MAX)
                                        </option>
                                        <option value={1} data-oid="qxsfhb.">
                                            Turbo Speed (30fps)
                                        </option>
                                        <option value={10} data-oid="r4iu4:-">
                                            Fast (10fps)
                                        </option>
                                        <option value={50} data-oid="xk6i_3t">
                                            Normal (2fps)
                                        </option>
                                        <option value={100} data-oid="s31efo9">
                                            Slow (1fps)
                                        </option>
                                    </select>
                                    <button
                                        onClick={stepProgram}
                                        disabled={isRunning && !stepMode}
                                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:bg-gray-600 disabled:text-gray-400 text-sm font-semibold transition-colors"
                                        data-oid="0-u3g2:"
                                    >
                                        {stepMode ? 'Step' : 'Debug'}
                                    </button>
                                    <button
                                        onClick={isRunning ? stopProgram : runProgram}
                                        disabled={stepMode}
                                        className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                                            isRunning
                                                ? 'bg-red-600 text-white hover:bg-red-500'
                                                : 'bg-green-600 text-black hover:bg-green-500'
                                        } disabled:bg-gray-600 disabled:text-gray-400`}
                                        data-oid=":wjgjb9"
                                    >
                                        {isRunning ? 'Stop' : 'Run'}
                                    </button>
                                    <button
                                        onClick={resetCPU}
                                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 text-sm font-semibold transition-colors"
                                        data-oid="ds6zsy-"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                            <div className="p-3 flex-1 min-h-0" data-oid="0i6g09w">
                                <AssemblyEditor
                                    value={asmCode}
                                    onChange={setAsmCode}
                                    currentSourceLine={currentSourceLine}
                                    onScroll={handleScroll}
                                    lineHeight={lineHeight}
                                    data-oid="vz1362d"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-4 space-y-4" data-oid="y7l58u2">
                        <div
                            className="bg-gray-800 rounded-lg border border-green-500 overflow-hidden h-[650px]"
                            data-oid=":x6ppri"
                        >
                            <div
                                className="bg-gray-700 px-4 py-2 border-b border-green-500 flex items-center justify-between"
                                data-oid="v1j1aw-"
                            >
                                <h2
                                    className="text-lg font-bold text-green-300 flex items-center gap-2"
                                    data-oid="onrmm._"
                                >
                                    Program Output
                                </h2>
                                <button
                                    onClick={() => setOutput('')}
                                    className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm"
                                    data-oid="hv1t7_a"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="p-3 h-full" data-oid="-d0:nxe">
                                <div
                                    className="bg-black p-3 rounded h-full overflow-y-auto border border-gray-600"
                                    data-oid="rmnxdzz"
                                >
                                    <pre
                                        className="text-green-400 text-sm whitespace-pre-wrap font-mono"
                                        data-oid="zfe-3nl"
                                    >
                                        {output || '> Program output will appear here...'}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-3 space-y-4" data-oid="ym8c1sp">
                        <div
                            className="bg-gray-800 rounded-lg border border-green-500 overflow-hidden"
                            data-oid="77tklbx"
                        >
                            <div
                                className="bg-gray-700 px-3 py-2 border-b border-green-500"
                                data-oid="9jpx-gt"
                            >
                                <h3 className="text-lg font-bold text-blue-300" data-oid="m0yoib9">
                                    Registers
                                </h3>
                            </div>
                            <div className="p-3" data-oid="0ls27i7">
                                <div className="space-y-1" data-oid="ok8_b1b">
                                    {Object.entries(registers).map(([reg, value]) => (
                                        <div
                                            key={reg}
                                            className="flex justify-between bg-gray-900 p-2 rounded text-sm"
                                            data-oid="pn43k.5"
                                        >
                                            <span
                                                className="text-yellow-400 font-semibold"
                                                data-oid="gbb1695"
                                            >
                                                {reg}:
                                            </span>
                                            <span
                                                className="text-white font-mono"
                                                data-oid="q63cydc"
                                            >
                                                {value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div
                            className="bg-gray-800 rounded-lg border border-green-500 overflow-hidden"
                            data-oid="97p.0:e"
                        >
                            <div
                                className="bg-gray-700 px-3 py-2 border-b border-green-500"
                                data-oid="xgw:sc8"
                            >
                                <h3
                                    className="text-lg font-bold text-purple-300"
                                    data-oid="53wn82t"
                                >
                                    Control
                                </h3>
                            </div>
                            <div className="p-3" data-oid="hk23kv.">
                                <div className="space-y-1" data-oid="pr1bseg">
                                    <div
                                        className="flex justify-between bg-gray-900 p-2 rounded text-sm"
                                        data-oid="1ujbif6"
                                    >
                                        <span
                                            className="text-yellow-400 font-semibold"
                                            data-oid="_r5:3do"
                                        >
                                            PC:
                                        </span>
                                        <span className="text-white font-mono" data-oid="2mcbd2s">
                                            {pc}
                                        </span>
                                    </div>
                                    <div
                                        className="flex justify-between bg-gray-900 p-2 rounded text-sm"
                                        data-oid="9_anac1"
                                    >
                                        <span
                                            className="text-yellow-400 font-semibold"
                                            data-oid="xm8gfyw"
                                        >
                                            IR:
                                        </span>
                                        <span className="text-white font-mono" data-oid="49sasrc">
                                            0x{ir.toString(16).padStart(2, '0')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RAM Memory Display and Flags Row */}
                <div className="grid grid-cols-12 gap-4 mb-4" data-oid="nb:3-pf">
                    {/* RAM Memory Display - Compact Grid */}
                    <div className="col-span-12 lg:col-span-8" data-oid="4o.pwge">
                        <div
                            className="bg-gray-800 rounded-lg border border-green-500 overflow-hidden"
                            data-oid="u8:s02b"
                        >
                            <div
                                className="bg-gray-700 px-3 py-2 border-b border-green-500"
                                data-oid="n.33mkc"
                            >
                                <h3 className="text-lg font-bold text-green-300" data-oid="l7dhtzt">
                                    RAM
                                </h3>
                            </div>
                            <div className="p-3 block" data-oid="56cmdos">
                                <div
                                    className="bg-gray-900 rounded border border-gray-600 p-2 max-h-64 overflow-auto"
                                    data-oid="dcdlkl4"
                                >
                                    <div
                                        className="grid text-sm font-mono grid-cols-[repeat(16,_1fr)] h-auto w-auto gap-2 m-0"
                                        data-oid="mtnkxa2"
                                    >
                                        {/* Memory cells - showing first 128 bytes in 16x8 grid */}
                                        {Array.from({ length: 128 }, (_, index) => {
                                            const value = memory[index] || 0;
                                            const isActive = busActivity.address === index;
                                            const isStackPointer = registers.SP === index;
                                            const hasData = value !== 0;

                                            return (
                                                <div
                                                    key={`cell-${index}`}
                                                    className={`
                                                        relative w-10 h-10 border rounded text-center 
                                                        flex items-center justify-center cursor-pointer
                                                        transition-all duration-200 text-sm font-semibold
                                                        ${isActive ? 'bg-yellow-600 text-black border-yellow-400 animate-pulse shadow-lg' : ''}
                                                        ${isStackPointer && !isActive ? 'bg-purple-600 text-white border-purple-400 shadow-md' : ''}
                                                        ${hasData && !isActive && !isStackPointer ? 'bg-blue-700 text-blue-100 border-blue-500 shadow-sm' : ''}
                                                        ${!hasData && !isActive && !isStackPointer ? 'bg-gray-800 text-gray-500 border-gray-600 hover:bg-gray-700' : ''}
                                                    `}
                                                    onClick={() => {
                                                        const newValue = prompt(
                                                            `Edit memory address ${index} (0x${index.toString(16).padStart(2, '0')}):`,
                                                            value.toString(),
                                                        );
                                                        if (newValue !== null) {
                                                            const parsedValue =
                                                                parseInt(newValue) || 0;
                                                            setMemory((prev) => {
                                                                const newMem = [...prev];
                                                                newMem[index] = parsedValue;
                                                                return newMem;
                                                            });
                                                        }
                                                    }}
                                                    title={`Address: ${index} (0x${index.toString(16).padStart(2, '0')})\\nValue: ${value}\\n${isStackPointer ? 'Stack Pointer' : ''}`}
                                                    data-oid="3hkizrl"
                                                >
                                                    {value
                                                        .toString(16)
                                                        .padStart(2, '0')
                                                        .toUpperCase()}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Compact Legend */}
                                <div
                                    className="mt-2 flex flex-wrap gap-2 text-xs"
                                    data-oid="_nu9-nt"
                                >
                                    <div className="flex items-center gap-1" data-oid="0yhi9:x">
                                        <div
                                            className="w-3 h-3 bg-gray-800 border border-gray-600 rounded"
                                            data-oid="6dbufy-"
                                        ></div>
                                        <span className="text-gray-400" data-oid="7v_y_e4">
                                            Empty
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1" data-oid="3:.hop9">
                                        <div
                                            className="w-3 h-3 bg-blue-900 border border-gray-600 rounded"
                                            data-oid="y86mujd"
                                        ></div>
                                        <span className="text-gray-400" data-oid="w14t-ry">
                                            Data
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1" data-oid="whxgf0u">
                                        <div
                                            className="w-3 h-3 bg-yellow-600 border border-yellow-400 rounded animate-pulse"
                                            data-oid="g1f0y29"
                                        ></div>
                                        <span className="text-gray-400" data-oid="nzkqzpb">
                                            Active
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1" data-oid="asyz_h4">
                                        <div
                                            className="w-3 h-3 bg-purple-600 border border-purple-400 rounded"
                                            data-oid="an_hqpc"
                                        ></div>
                                        <span className="text-gray-400" data-oid="7iobhk5">
                                            SP
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Flags */}
                    <div className="col-span-12 lg:col-span-4" data-oid=".7nlaax">
                        <div
                            className="bg-gray-800 rounded-lg border border-green-500 overflow-hidden h-[227px]"
                            data-oid="co80ajk"
                        >
                            <div
                                className="bg-gray-700 px-3 py-2 border-b border-green-500"
                                data-oid="lb.k.me"
                            >
                                <h3
                                    className="text-lg font-bold text-orange-300"
                                    data-oid="tipg8qb"
                                >
                                    Flags
                                </h3>
                            </div>
                            <div className="p-3 h-[306px]" data-oid="q6fdd9_">
                                <div className="space-y-1" data-oid="61xg0a5">
                                    <div
                                        className="flex justify-between bg-gray-900 p-2 rounded text-sm"
                                        data-oid="vgzmn93"
                                    >
                                        <span
                                            className="text-yellow-400 font-semibold"
                                            data-oid="hctskh_"
                                        >
                                            Zero:
                                        </span>
                                        <span
                                            className={`font-mono ${flags.zero ? 'text-green-400' : 'text-red-400'}`}
                                            data-oid="w:aokzg"
                                        >
                                            {flags.zero ? '1' : '0'}
                                        </span>
                                    </div>
                                    <div
                                        className="flex justify-between bg-gray-900 p-2 rounded text-sm"
                                        data-oid="auwgi8i"
                                    >
                                        <span
                                            className="text-yellow-400 font-semibold"
                                            data-oid="hl4kl3a"
                                        >
                                            Carry:
                                        </span>
                                        <span
                                            className={`font-mono ${flags.carry ? 'text-green-400' : 'text-red-400'}`}
                                            data-oid="62i0hp."
                                        >
                                            {flags.carry ? '1' : '0'}
                                        </span>
                                    </div>
                                    <div
                                        className="flex justify-between bg-gray-900 p-2 rounded text-sm"
                                        data-oid="xg0w8ge"
                                    >
                                        <span
                                            className="text-yellow-400 font-semibold"
                                            data-oid="j6eb.te"
                                        >
                                            Negative:
                                        </span>
                                        <span
                                            className={`font-mono ${flags.negative ? 'text-green-400' : 'text-red-400'}`}
                                            data-oid="pdhp30-"
                                        >
                                            {flags.negative ? '1' : '0'}
                                        </span>
                                    </div>
                                    <div
                                        className="flex justify-between bg-gray-900 p-2 rounded text-sm"
                                        data-oid="stqxq7t"
                                    >
                                        <span
                                            className="text-yellow-400 font-semibold"
                                            data-oid="a2qlwh3"
                                        >
                                            Overflow:
                                        </span>
                                        <span
                                            className={`font-mono ${flags.overflow ? 'text-green-400' : 'text-red-400'}`}
                                            data-oid="gkkcqyr"
                                        >
                                            {flags.overflow ? '1' : '0'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Instruction Set Reference */}

                <div
                    className="bg-gray-800 rounded-lg border border-green-500 overflow-hidden mt-6"
                    data-oid="eu0q-hy"
                >
                    <div
                        className="bg-gray-700 px-4 py-3 border-b border-green-500"
                        data-oid="nap.ud4"
                    >
                        <h2
                            className="text-2xl font-bold text-green-300 flex items-center gap-2"
                            data-oid="mggkgh7"
                        >
                            Enhanced Instruction Set Reference
                        </h2>
                    </div>
                    <div className="p-6" data-oid="zmd134y">
                        <div
                            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3"
                            data-oid="xnu31ze"
                        >
                            {/* Data Movement */}
                            <div
                                className="bg-gray-900 rounded-lg p-3 border border-blue-500"
                                data-oid="x7t9_h9"
                            >
                                <h3
                                    className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-1"
                                    data-oid="k3.7iei"
                                >
                                    Data Movement
                                </h3>
                                <div className="space-y-1 text-xs" data-oid="o9v2aet">
                                    <div data-oid="hxqlwq:">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="09.najq"
                                        >
                                            LOAD Rx, #imm
                                        </span>
                                        <p className="text-gray-400" data-oid="i829u8v">
                                            Load immediate
                                        </p>
                                    </div>
                                    <div data-oid="-p1..pz">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="37_h.tv"
                                        >
                                            MOV Rx, Ry
                                        </span>
                                        <p className="text-gray-400" data-oid="3le1g53">
                                            Move register
                                        </p>
                                    </div>
                                    <div data-oid="xsuk72n">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="pq36sm9"
                                        >
                                            LDR Rx, #addr
                                        </span>
                                        <p className="text-gray-400" data-oid="o4mw6kt">
                                            Load from memory
                                        </p>
                                    </div>
                                    <div data-oid="0_qvhau">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="slug4:h"
                                        >
                                            STR Rx, #addr
                                        </span>
                                        <p className="text-gray-400" data-oid="bhmu.n8">
                                            Store to memory
                                        </p>
                                    </div>
                                    <div data-oid="7fcd4c4">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="4oqx7uh"
                                        >
                                            LDRI Rx, Ry
                                        </span>
                                        <p className="text-gray-400" data-oid="b8a8d.k">
                                            Load indirect
                                        </p>
                                    </div>
                                    <div data-oid="o:du3ai">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="ypmi_yy"
                                        >
                                            STRI Rx, Ry
                                        </span>
                                        <p className="text-gray-400" data-oid="gewgoik">
                                            Store indirect
                                        </p>
                                    </div>
                                    <div data-oid="7v80myh">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="tbzpvxy"
                                        >
                                            LEA Rx, #addr
                                        </span>
                                        <p className="text-gray-400" data-oid="ezbudw2">
                                            Load effective address
                                        </p>
                                    </div>
                                    <div data-oid="ypkhhsn">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="99asup7"
                                        >
                                            SWAP Rx, Ry
                                        </span>
                                        <p className="text-gray-400" data-oid="2elsiwn">
                                            Swap registers
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Basic Arithmetic */}
                            <div
                                className="bg-gray-900 rounded-lg p-3 border border-green-500"
                                data-oid="2vc:pay"
                            >
                                <h3
                                    className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-1"
                                    data-oid="34zto-h"
                                >
                                    Basic Arithmetic
                                </h3>
                                <div className="space-y-1 text-xs" data-oid="t2p2:p0">
                                    <div data-oid="-3usqk4">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="qosfdec"
                                        >
                                            ADD Rx, Ry, Rz
                                        </span>
                                        <p className="text-gray-400" data-oid="5tq92hq">
                                            Add registers
                                        </p>
                                    </div>
                                    <div data-oid="z7y2.11">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="fw_z::k"
                                        >
                                            SUB Rx, Ry, Rz
                                        </span>
                                        <p className="text-gray-400" data-oid="uj_rit7">
                                            Subtract registers
                                        </p>
                                    </div>
                                    <div data-oid="sbunnps">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid=".uo:0gt"
                                        >
                                            MUL Rx, Ry, Rz
                                        </span>
                                        <p className="text-gray-400" data-oid="9hky-qw">
                                            Multiply registers
                                        </p>
                                    </div>
                                    <div data-oid="7lph-gz">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="bd7xl14"
                                        >
                                            DIV Rx, Ry, Rz
                                        </span>
                                        <p className="text-gray-400" data-oid="z.zpm7h">
                                            Divide registers
                                        </p>
                                    </div>
                                    <div data-oid="57gry5y">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid=".-t17h1"
                                        >
                                            ADDI Rx, Ry, #imm
                                        </span>
                                        <p className="text-gray-400" data-oid="qwob8.2">
                                            Add immediate to register
                                        </p>
                                    </div>
                                    <div data-oid="7rcegts">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="dybhxci"
                                        >
                                            SUBI Rx, Ry, #imm
                                        </span>
                                        <p className="text-gray-400" data-oid="8.u639t">
                                            Subtract immediate from register
                                        </p>
                                    </div>
                                    <div data-oid="7vdttio">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="pn87nn2"
                                        >
                                            MULI Rx, Ry, #imm
                                        </span>
                                        <p className="text-gray-400" data-oid="bf.u0eq">
                                            Multiply register by immediate
                                        </p>
                                    </div>
                                    <div data-oid="43jgx_0">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="t0b9zjo"
                                        >
                                            DIVI Rx, Ry, #imm
                                        </span>
                                        <p className="text-gray-400" data-oid="s:vmtqc">
                                            Divide register by immediate
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Math */}
                            <div
                                className="bg-gray-900 rounded-lg p-3 border border-emerald-500"
                                data-oid="t1eisr6"
                            >
                                <h3
                                    className="text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-1"
                                    data-oid="ymcxw6g"
                                >
                                    Advanced Math
                                </h3>
                                <div className="space-y-1 text-xs" data-oid="krtqsy7">
                                    <div data-oid="nce7n0c">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="87fgldr"
                                        >
                                            MOD Rx, Ry, Rz
                                        </span>
                                        <p className="text-gray-400" data-oid="jy5pf-:">
                                            Modulo operation
                                        </p>
                                    </div>
                                    <div data-oid="wljvc8o">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="atvqirr"
                                        >
                                            MODI Rx, Ry, #imm
                                        </span>
                                        <p className="text-gray-400" data-oid="oxu.ud4">
                                            Modulo immediate
                                        </p>
                                    </div>
                                    <div data-oid="kmwl1_p">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="nrfyf-g"
                                        >
                                            POW Rx, Ry, Rz
                                        </span>
                                        <p className="text-gray-400" data-oid="y:rmvcr">
                                            Power (base^exp)
                                        </p>
                                    </div>
                                    <div data-oid=":x12qet">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="zou4vf7"
                                        >
                                            SQRT Rx, Ry
                                        </span>
                                        <p className="text-gray-400" data-oid="5xq7p72">
                                            Square root
                                        </p>
                                    </div>
                                    <div data-oid="nnputad">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="2zzbu63"
                                        >
                                            ABS Rx, Ry
                                        </span>
                                        <p className="text-gray-400" data-oid="mymbyqx">
                                            Absolute value
                                        </p>
                                    </div>
                                    <div data-oid=":r4i:jz">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="e403hfq"
                                        >
                                            NEG Rx, Ry
                                        </span>
                                        <p className="text-gray-400" data-oid="nd:wkso">
                                            Negate value (two's complement)
                                        </p>
                                    </div>
                                    <div data-oid="wn.5jep">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="wzz8yiy"
                                        >
                                            INC Rx
                                        </span>
                                        <p className="text-gray-400" data-oid="j7jc2fk">
                                            Increment by 1
                                        </p>
                                    </div>
                                    <div data-oid="7xri563">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="zaodq8_"
                                        >
                                            DEC Rx
                                        </span>
                                        <p className="text-gray-400" data-oid="ey5s5m7">
                                            Decrement by 1
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Logical & Bitwise */}
                            <div
                                className="bg-gray-900 rounded-lg p-3 border border-purple-500"
                                data-oid="jn7ka93"
                            >
                                <h3
                                    className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-1"
                                    data-oid="2qythla"
                                >
                                    Logical & Bitwise
                                </h3>
                                <div className="space-y-1 text-xs" data-oid="pq_rf89">
                                    <div data-oid="qpvbc2c">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="7-ga767"
                                        >
                                            AND Rx, Ry, Rz
                                        </span>
                                        <p className="text-gray-400" data-oid="00rn4iy">
                                            Bitwise AND
                                        </p>
                                    </div>
                                    <div data-oid="bvq8g.y">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="3keoxjx"
                                        >
                                            OR Rx, Ry, Rz
                                        </span>
                                        <p className="text-gray-400" data-oid="v99nntj">
                                            Bitwise OR
                                        </p>
                                    </div>
                                    <div data-oid="eo3bk04">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="chlfhbh"
                                        >
                                            XOR Rx, Ry, Rz
                                        </span>
                                        <p className="text-gray-400" data-oid="4y5im80">
                                            Bitwise XOR
                                        </p>
                                    </div>
                                    <div data-oid="ty8_8un">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="l19y5y1"
                                        >
                                            NOT Rx, Ry
                                        </span>
                                        <p className="text-gray-400" data-oid="p2kfpuw">
                                            Bitwise NOT
                                        </p>
                                    </div>
                                    <div data-oid="hbjo:..">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="5i3s4._"
                                        >
                                            NAND Rx, Ry, Rz
                                        </span>
                                        <p className="text-gray-400" data-oid="5cyfzn9">
                                            Bitwise NAND
                                        </p>
                                    </div>
                                    <div data-oid="z1:587v">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="r:70lzx"
                                        >
                                            NOR Rx, Ry, Rz
                                        </span>
                                        <p className="text-gray-400" data-oid="89wxb5y">
                                            Bitwise NOR
                                        </p>
                                    </div>
                                    <div data-oid="-kgf6bi">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="::b:ban"
                                        >
                                            SHL Rx, Ry, #n
                                        </span>
                                        <p className="text-gray-400" data-oid="uuvvn6t">
                                            Shift left by n positions
                                        </p>
                                    </div>
                                    <div data-oid="gcdfgia">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="y_15-ta"
                                        >
                                            SHR Rx, Ry, #n
                                        </span>
                                        <p className="text-gray-400" data-oid="0kesdyy">
                                            Shift right by n positions
                                        </p>
                                    </div>
                                    <div data-oid="71nz1hv">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="l0ut76b"
                                        >
                                            ROL Rx, Ry, #n
                                        </span>
                                        <p className="text-gray-400" data-oid="lx9zo6r">
                                            Rotate left by n positions
                                        </p>
                                    </div>
                                    <div data-oid="kekcyy8">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="ezilxz."
                                        >
                                            ROR Rx, Ry, #n
                                        </span>
                                        <p className="text-gray-400" data-oid="f8paylp">
                                            Rotate right by n positions
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Bit Manipulation */}
                            <div
                                className="bg-gray-900 rounded-lg p-3 border border-pink-500"
                                data-oid="ggo7bcu"
                            >
                                <h3
                                    className="text-sm font-semibold text-pink-300 mb-2 flex items-center gap-1"
                                    data-oid="sfhnpf:"
                                >
                                    Bit Manipulation
                                </h3>
                                <div className="space-y-1 text-xs" data-oid=".xs3xfk">
                                    <div data-oid="p6h4n87">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="i4.fwfl"
                                        >
                                            SETBIT Rx, Ry, #n
                                        </span>
                                        <p className="text-gray-400" data-oid="iqfqmlv">
                                            Set bit at position
                                        </p>
                                    </div>
                                    <div data-oid="6obo.05">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="r.spjcf"
                                        >
                                            CLRBIT Rx, Ry, #n
                                        </span>
                                        <p className="text-gray-400" data-oid=":6qtg0.">
                                            Clear bit at position
                                        </p>
                                    </div>
                                    <div data-oid="ghq.ea:">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="x1oc_hu"
                                        >
                                            TOGBIT Rx, Ry, #n
                                        </span>
                                        <p className="text-gray-400" data-oid=".1..8l1">
                                            Toggle bit at position n
                                        </p>
                                    </div>
                                    <div data-oid="is9h_bn">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid=".a-5-ll"
                                        >
                                            TESTBIT Rx, #n
                                        </span>
                                        <p className="text-gray-400" data-oid="mb_n-_m">
                                            Test bit at position n
                                        </p>
                                    </div>
                                    <div data-oid="al0r3-3">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="3a.lvvf"
                                        >
                                            POPCNT Rx, Ry
                                        </span>
                                        <p className="text-gray-400" data-oid="inf1nlb">
                                            Population count (count set bits)
                                        </p>
                                    </div>
                                    <div data-oid="nq5yu9m">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="bizlhyi"
                                        >
                                            CLZ Rx, Ry
                                        </span>
                                        <p className="text-gray-400" data-oid="zlsiir:">
                                            Count leading zeros
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Comparison & Control Flow */}
                            <div
                                className="bg-gray-900 rounded-lg p-3 border border-orange-500"
                                data-oid="f0fcg8m"
                            >
                                <h3
                                    className="text-sm font-semibold text-orange-300 mb-2 flex items-center gap-1"
                                    data-oid="85jt39e"
                                >
                                    Comparison & Control Flow
                                </h3>
                                <div className="space-y-1 text-xs" data-oid="4g0kno4">
                                    <div data-oid="0z6s7jt">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="7gsy7b5"
                                        >
                                            CMP Rx, Ry
                                        </span>
                                        <p className="text-gray-400" data-oid="tg6vkte">
                                            Compare registers
                                        </p>
                                    </div>
                                    <div data-oid="7xv0__4">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="8xgcctl"
                                        >
                                            CMPI Rx, #imm
                                        </span>
                                        <p className="text-gray-400" data-oid="-d:3vth">
                                            Compare with immediate
                                        </p>
                                    </div>
                                    <div data-oid="i-fv.:l">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="_naavac"
                                        >
                                            TEST Rx, Ry
                                        </span>
                                        <p className="text-gray-400" data-oid="0wt334.">
                                            Test (AND without store)
                                        </p>
                                    </div>
                                    <div data-oid="ihdf4db">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="fw9tazg"
                                        >
                                            JMP #addr
                                        </span>
                                        <p className="text-gray-400" data-oid="155khbm">
                                            Unconditional jump
                                        </p>
                                    </div>
                                    <div data-oid="foqeuj_">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="rjmk2qd"
                                        >
                                            JEQ/JNE #addr
                                        </span>
                                        <p className="text-gray-400" data-oid="4nd.rxh">
                                            Jump if equal/not equal
                                        </p>
                                    </div>
                                    <div data-oid="syy95m6">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="vhtabb3"
                                        >
                                            JLT/JGT #addr
                                        </span>
                                        <p className="text-gray-400" data-oid="cb_j:cr">
                                            Jump if less/greater
                                        </p>
                                    </div>
                                    <div data-oid=".31ccrs">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="2e_ulch"
                                        >
                                            JLE/JGE #addr
                                        </span>
                                        <p className="text-gray-400" data-oid="nc:31m8">
                                            Jump if less/greater equal
                                        </p>
                                    </div>
                                    <div data-oid="t-l.v.1">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="6t4k50-"
                                        >
                                            JZ/JNZ/JC/JNC #addr
                                        </span>
                                        <p className="text-gray-400" data-oid="y2u-xem">
                                            Jump on flags
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Stack & Memory */}
                            <div
                                className="bg-gray-900 rounded-lg p-3 border border-cyan-500"
                                data-oid="w2m1s9_"
                            >
                                <h3
                                    className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-1"
                                    data-oid="sf1yjfa"
                                >
                                    Stack & Memory
                                </h3>
                                <div className="space-y-1 text-xs" data-oid="wzp5.1s">
                                    <div data-oid="-fz7qro">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="e1t:4xs"
                                        >
                                            PUSH Rx
                                        </span>
                                        <p className="text-gray-400" data-oid="vh415yv">
                                            Push register to stack
                                        </p>
                                    </div>
                                    <div data-oid="d4zo8br">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="ikbmm0b"
                                        >
                                            POP Rx
                                        </span>
                                        <p className="text-gray-400" data-oid="pp2w_2q">
                                            Pop from stack
                                        </p>
                                    </div>
                                    <div data-oid="q5t5svb">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="jnqde5f"
                                        >
                                            PUSHA/POPA
                                        </span>
                                        <p className="text-gray-400" data-oid="4qri_j8">
                                            Push/pop all registers
                                        </p>
                                    </div>
                                    <div data-oid="4rpr693">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="342umqp"
                                        >
                                            PUSHF/POPF
                                        </span>
                                        <p className="text-gray-400" data-oid="vkuqza4">
                                            Push/pop flags
                                        </p>
                                    </div>
                                    <div data-oid="ocgg3sm">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="_pjrf79"
                                        >
                                            CALL #addr
                                        </span>
                                        <p className="text-gray-400" data-oid=".rjs5mg">
                                            Call subroutine
                                        </p>
                                    </div>
                                    <div data-oid="tcqzehf">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="l.44e3w"
                                        >
                                            RET
                                        </span>
                                        <p className="text-gray-400" data-oid="8g.2:e_">
                                            Return from subroutine
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* String Operations */}
                            <div
                                className="bg-gray-900 rounded-lg p-3 border border-yellow-500"
                                data-oid="ig495.s"
                            >
                                <h3
                                    className="text-sm font-semibold text-yellow-300 mb-2 flex items-center gap-1"
                                    data-oid="861n6lj"
                                >
                                    String Operations
                                </h3>
                                <div className="space-y-1 text-xs" data-oid="ofd-v_m">
                                    <div data-oid="7wn:1yg">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="9i_j:hv"
                                        >
                                            STRLEN Rx, Ry
                                        </span>
                                        <p className="text-gray-400" data-oid="unkmods">
                                            String length
                                        </p>
                                    </div>
                                    <div data-oid=":2bwt.w">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="gqnvdnq"
                                        >
                                            STRCPY Rx, Ry
                                        </span>
                                        <p className="text-gray-400" data-oid="v_q964x">
                                            String copy
                                        </p>
                                    </div>
                                    <div data-oid="gevjja7">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="obkbi4a"
                                        >
                                            STRCMP Rx, Ry
                                        </span>
                                        <p className="text-gray-400" data-oid="fv_sipw">
                                            String compare
                                        </p>
                                    </div>
                                    <div data-oid="sel-5xz">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="nzoc09c"
                                        >
                                            STRCAT Rx, Ry
                                        </span>
                                        <p className="text-gray-400" data-oid="v-w:lq1">
                                            String concatenate
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* System Control */}
                            <div
                                className="bg-gray-900 rounded-lg p-3 border border-red-500"
                                data-oid="n9n5:wc"
                            >
                                <h3
                                    className="text-sm font-semibold text-red-300 mb-2 flex items-center gap-1"
                                    data-oid="hf00i0:"
                                >
                                    System Control
                                </h3>
                                <div className="space-y-1 text-xs" data-oid="._l2lui">
                                    <div data-oid="3-0o5sx">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="cfw_gmh"
                                        >
                                            INT #n
                                        </span>
                                        <p className="text-gray-400" data-oid="4r-e69f">
                                            Software interrupt
                                        </p>
                                    </div>
                                    <div data-oid="jd_6y4l">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="6m-xzt7"
                                        >
                                            SYSCALL #n
                                        </span>
                                        <p className="text-gray-400" data-oid="lqp:436">
                                            System call
                                        </p>
                                    </div>
                                    <div data-oid="jsy2dx.">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="1vkbbky"
                                        >
                                            CLI/STI
                                        </span>
                                        <p className="text-gray-400" data-oid="tqh4pgt">
                                            Clear/set interrupt flag
                                        </p>
                                    </div>
                                    <div data-oid="q394cye">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="6ii1z8i"
                                        >
                                            HLT
                                        </span>
                                        <p className="text-gray-400" data-oid="6nti-px">
                                            Halt until interrupt
                                        </p>
                                    </div>
                                    <div data-oid="-cvm.bc">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="m2m0wn5"
                                        >
                                            WAIT #n
                                        </span>
                                        <p className="text-gray-400" data-oid="8i8wepo">
                                            Wait for cycles
                                        </p>
                                    </div>
                                    <div data-oid="xdl7j-.">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid=":1z45l_"
                                        >
                                            NOP
                                        </span>
                                        <p className="text-gray-400" data-oid="0t.t03g">
                                            No operation
                                        </p>
                                    </div>
                                    <div data-oid="nus5_p.">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="d2ni1v5"
                                        >
                                            HALT
                                        </span>
                                        <p className="text-gray-400" data-oid="8ttc.sr">
                                            Halt execution
                                        </p>
                                    </div>
                                    <div data-oid="y4dhj7_">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="qtoa217"
                                        >
                                            IRET
                                        </span>
                                        <p className="text-gray-400" data-oid="t7jz6ff">
                                            Interrupt return
                                        </p>
                                    </div>
                                    <div data-oid="4rb6uvu">
                                        <span
                                            className="text-yellow-400 font-mono"
                                            data-oid="l40yhrf"
                                        >
                                            RESET/DEBUG
                                        </span>
                                        <p className="text-gray-400" data-oid="wbki5as">
                                            Reset/debug ops
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* System Interrupts - Comprehensive */}
                            <div
                                className="bg-gray-900 rounded-lg p-3 border border-red-400 col-span-1 lg:col-span-2 xl:col-span-3 2xl:col-span-4"
                                data-oid="nqdv0zj"
                            >
                                <h3
                                    className="text-sm font-semibold text-red-300 mb-2 flex items-center gap-1"
                                    data-oid="xxhu6f7"
                                >
                                    System Interrupts (124+ Available)
                                </h3>
                                <div
                                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 text-xs"
                                    data-oid="4fiw8k8"
                                >
                                    <div className="space-y-1" data-oid="pym6xmy">
                                        <h4
                                            className="text-blue-300 font-semibold"
                                            data-oid="lqhnqxd"
                                        >
                                            Basic I/O (1-7)
                                        </h4>
                                        <div data-oid="n2oaoyz">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="49uu2dr"
                                            >
                                                INT #1
                                            </span>
                                            <p className="text-gray-400" data-oid="lmps:jv">
                                                Print char from R7/R1
                                            </p>
                                        </div>
                                        <div data-oid="iudra.6">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="xi68fzk"
                                            >
                                                INT #2
                                            </span>
                                            <p className="text-gray-400" data-oid="z_mmn7o">
                                                Print newline
                                            </p>
                                        </div>
                                        <div data-oid="ytqg1w2">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="k2y9eg-"
                                            >
                                                INT #3
                                            </span>
                                            <p className="text-gray-400" data-oid="g:0b-y6">
                                                Print number from R7/R1
                                            </p>
                                        </div>
                                        <div data-oid="feuft9i">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="6v5zgm5"
                                            >
                                                INT #4-7
                                            </span>
                                            <p className="text-gray-400" data-oid="3fqyxv:">
                                                String I/O operations
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid="uz:cfie">
                                        <h4
                                            className="text-green-300 font-semibold"
                                            data-oid="bn8vf7k"
                                        >
                                            Screen Control (8-17)
                                        </h4>
                                        <div data-oid="x5vz17g">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="91gfhx2"
                                            >
                                                INT #8
                                            </span>
                                            <p className="text-gray-400" data-oid="uv-6di1">
                                                Clear screen
                                            </p>
                                        </div>
                                        <div data-oid="ignz9b_">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="0-hh:qb"
                                            >
                                                INT #9-10
                                            </span>
                                            <p className="text-gray-400" data-oid="_6hfaca">
                                                Cursor control
                                            </p>
                                        </div>
                                        <div data-oid="5ydyp1q">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="dg5e353"
                                            >
                                                INT #11-13
                                            </span>
                                            <p className="text-gray-400" data-oid="wk03rer">
                                                Color & scrolling
                                            </p>
                                        </div>
                                        <div data-oid="euvbs2_">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid=".p9sbch"
                                            >
                                                INT #14-17
                                            </span>
                                            <p className="text-gray-400" data-oid="bog:csd">
                                                Graphics primitives
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid="gxh:etz">
                                        <h4
                                            className="text-purple-300 font-semibold"
                                            data-oid="gmxc6uy"
                                        >
                                            File System (18-25)
                                        </h4>
                                        <div data-oid="em0te2f">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="ogs7ou4"
                                            >
                                                INT #18-23
                                            </span>
                                            <p className="text-gray-400" data-oid="5cd59jn">
                                                File operations
                                            </p>
                                        </div>
                                        <div data-oid="9g22c51">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="qny:lg7"
                                            >
                                                INT #24-25
                                            </span>
                                            <p className="text-gray-400" data-oid="ntik5v.">
                                                Directory operations
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid="3o6zrpj">
                                        <h4
                                            className="text-orange-300 font-semibold"
                                            data-oid="d41bcio"
                                        >
                                            System Info (26-32)
                                        </h4>
                                        <div data-oid="142teuv">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="q_ieqv8"
                                            >
                                                INT #26
                                            </span>
                                            <p className="text-gray-400" data-oid="em9:dq5">
                                                Get time to R0
                                            </p>
                                        </div>
                                        <div data-oid="yo1wq.i">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="90nyxr2"
                                            >
                                                INT #27-29
                                            </span>
                                            <p className="text-gray-400" data-oid="._195ch">
                                                Time/date operations
                                            </p>
                                        </div>
                                        <div data-oid="7t76:hr">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="woui82t"
                                            >
                                                INT #30-32
                                            </span>
                                            <p className="text-gray-400" data-oid="cog5fgi">
                                                System information
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid="ghfe19t">
                                        <h4
                                            className="text-cyan-300 font-semibold"
                                            data-oid=":-sxrfk"
                                        >
                                            Math & Random (33-38)
                                        </h4>
                                        <div data-oid="moamo6p">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="dofky4a"
                                            >
                                                INT #33
                                            </span>
                                            <p className="text-gray-400" data-oid="7eddcd:">
                                                Random number to R0
                                            </p>
                                        </div>
                                        <div data-oid="z19brcc">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="ywxd3t0"
                                            >
                                                INT #34
                                            </span>
                                            <p className="text-gray-400" data-oid="8ryms_7">
                                                Set random seed
                                            </p>
                                        </div>
                                        <div data-oid="hqb_7:e">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="js_yohm"
                                            >
                                                INT #35-38
                                            </span>
                                            <p className="text-gray-400" data-oid="54cx_ug">
                                                Math constants/functions
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid="xgjs1uf">
                                        <h4
                                            className="text-pink-300 font-semibold"
                                            data-oid="-f4xs.o"
                                        >
                                            Formatting (39-44)
                                        </h4>
                                        <div data-oid="kpv12tz">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="v7:5.bl"
                                            >
                                                INT #39
                                            </span>
                                            <p className="text-gray-400" data-oid="nbf10ls">
                                                Print hex from R7/R1
                                            </p>
                                        </div>
                                        <div data-oid="5v1o4_7">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="esg8jma"
                                            >
                                                INT #40
                                            </span>
                                            <p className="text-gray-400" data-oid="x9b1g7x">
                                                Print binary from R7/R1
                                            </p>
                                        </div>
                                        <div data-oid=":ad0ifc">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="erc7fca"
                                            >
                                                INT #41-44
                                            </span>
                                            <p className="text-gray-400" data-oid="b5riedr">
                                                Octal/float/scientific
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid="o0nu:i4">
                                        <h4
                                            className="text-yellow-300 font-semibold"
                                            data-oid="skkwcmc"
                                        >
                                            Audio (45-50)
                                        </h4>
                                        <div data-oid="2dbd6gl">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="4k51fap"
                                            >
                                                INT #45
                                            </span>
                                            <p className="text-gray-400" data-oid="b.tw4ce">
                                                Beep sound
                                            </p>
                                        </div>
                                        <div data-oid="egewty8">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="g-uonc2"
                                            >
                                                INT #46
                                            </span>
                                            <p className="text-gray-400" data-oid="jfbegt0">
                                                Play tone (R0=freq, R1=dur)
                                            </p>
                                        </div>
                                        <div data-oid="weweq1b">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="1xrydbg"
                                            >
                                                INT #47-50
                                            </span>
                                            <p className="text-gray-400" data-oid="zdyo4u-">
                                                Notes/volume/audio ctrl
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid="fjviesa">
                                        <h4
                                            className="text-cyan-300 font-semibold"
                                            data-oid="a3f5ftj"
                                        >
                                            Graphics (101-110)
                                        </h4>
                                        <div data-oid="hawhwn2">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="5e-l4e1"
                                            >
                                                INT #101
                                            </span>
                                            <p className="text-gray-400" data-oid=".yuw4gp">
                                                Clear screen
                                            </p>
                                        </div>
                                        <div data-oid="z9cnox6">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid=".cpbsj:"
                                            >
                                                INT #102
                                            </span>
                                            <p className="text-gray-400" data-oid="2dml9mu">
                                                Set pixel (R0=x, R1=y, R2=color)
                                            </p>
                                        </div>
                                        <div data-oid="n5g__y.">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="43slsla"
                                            >
                                                INT #104
                                            </span>
                                            <p className="text-gray-400" data-oid=":yo5q6:">
                                                Set color (R0=0-7)
                                            </p>
                                        </div>
                                        <div data-oid="mr8k7m6">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="eoucah:"
                                            >
                                                INT #105
                                            </span>
                                            <p className="text-gray-400" data-oid="-svd39v">
                                                Draw line (R0=x1, R1=y1, R2=x2, R3=y2)
                                            </p>
                                        </div>
                                        <div data-oid="b.hk9:9">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="12.c-wo"
                                            >
                                                INT #106/107
                                            </span>
                                            <p className="text-gray-400" data-oid="e:don6g">
                                                Draw/fill rect (R0=x, R1=y, R2=w, R3=h)
                                            </p>
                                        </div>
                                        <div data-oid="-ji44v9">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid=".1s7uy0"
                                            >
                                                INT #108
                                            </span>
                                            <p className="text-gray-400" data-oid="ezk._97">
                                                Draw circle (R0=x, R1=y, R2=radius)
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid="q7h3fq.">
                                        <h4
                                            className="text-indigo-300 font-semibold"
                                            data-oid="0zlzlb7"
                                        >
                                            Network (51-55)
                                        </h4>
                                        <div data-oid="o7l0wj1">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="elg354p"
                                            >
                                                INT #51-54
                                            </span>
                                            <p className="text-gray-400" data-oid="cnuasgv">
                                                Network operations
                                            </p>
                                        </div>
                                        <div data-oid="2exvkyb">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="9-ri7x4"
                                            >
                                                INT #55
                                            </span>
                                            <p className="text-gray-400" data-oid="ilm-:-y">
                                                Network status
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid="xg_6p36">
                                        <h4
                                            className="text-emerald-300 font-semibold"
                                            data-oid="3qvzfgt"
                                        >
                                            Memory (56-60)
                                        </h4>
                                        <div data-oid="dj-yn6e">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="s_izw4."
                                            >
                                                INT #56-58
                                            </span>
                                            <p className="text-gray-400" data-oid="e.1smpt">
                                                Malloc/free/realloc
                                            </p>
                                        </div>
                                        <div data-oid="x-mce2s">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="zd51jtv"
                                            >
                                                INT #59-60
                                            </span>
                                            <p className="text-gray-400" data-oid="gtmv._x">
                                                Memory info/GC
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid="de4t-re">
                                        <h4
                                            className="text-red-300 font-semibold"
                                            data-oid="28_xp8s"
                                        >
                                            Process (61-68)
                                        </h4>
                                        <div data-oid="0iba-:3">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="jnhjnnw"
                                            >
                                                INT #61-64
                                            </span>
                                            <p className="text-gray-400" data-oid="gc5fh59">
                                                Process control
                                            </p>
                                        </div>
                                        <div data-oid="-zr_6ov">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="9dl0i6v"
                                            >
                                                INT #65-68
                                            </span>
                                            <p className="text-gray-400" data-oid="d26g8:1">
                                                Thread/mutex ops
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid="td7q8a:">
                                        <h4
                                            className="text-teal-300 font-semibold"
                                            data-oid="d6gksuf"
                                        >
                                            Hardware (69-75)
                                        </h4>
                                        <div data-oid="b3j2p60">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="zt5q93j"
                                            >
                                                INT #69-71
                                            </span>
                                            <p className="text-gray-400" data-oid="w_w_pkj">
                                                Port/DMA operations
                                            </p>
                                        </div>
                                        <div data-oid="p20u.qj">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="o1qhm1:"
                                            >
                                                INT #72-75
                                            </span>
                                            <p className="text-gray-400" data-oid="gzol16f">
                                                Interrupt/timer control
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid="dj1kh12">
                                        <h4
                                            className="text-violet-300 font-semibold"
                                            data-oid="pl-f21c"
                                        >
                                            Crypto (76-80)
                                        </h4>
                                        <div data-oid="-phhty.">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="4:7dh5r"
                                            >
                                                INT #76-77
                                            </span>
                                            <p className="text-gray-400" data-oid="4.g3:s8">
                                                Hash functions
                                            </p>
                                        </div>
                                        <div data-oid="8immat_">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid=":nxuxe8"
                                            >
                                                INT #78-80
                                            </span>
                                            <p className="text-gray-400" data-oid="-p.jkdy">
                                                Encryption/keys
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid="a-84i0r">
                                        <h4
                                            className="text-lime-300 font-semibold"
                                            data-oid="vmijodn"
                                        >
                                            Compression (81-84)
                                        </h4>
                                        <div data-oid="w8sw_j0">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="-:l5ap4"
                                            >
                                                INT #81-82
                                            </span>
                                            <p className="text-gray-400" data-oid="ju:7cjt">
                                                Data compression
                                            </p>
                                        </div>
                                        <div data-oid="az2rl1_">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="542lb_s"
                                            >
                                                INT #83-84
                                            </span>
                                            <p className="text-gray-400" data-oid="gwm-.ps">
                                                String compression
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid="ph63j5r">
                                        <h4
                                            className="text-amber-300 font-semibold"
                                            data-oid="fp4wwxu"
                                        >
                                            Debug (85-90)
                                        </h4>
                                        <div data-oid="-gad08i">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="2i-6_p."
                                            >
                                                INT #85-87
                                            </span>
                                            <p className="text-gray-400" data-oid="78ca8bo">
                                                Debug/profile ops
                                            </p>
                                        </div>
                                        <div data-oid="2m4mk1u">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="m2p4z5."
                                            >
                                                INT #88-90
                                            </span>
                                            <p className="text-gray-400" data-oid="2.0.s_q">
                                                Benchmark/trace
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid=".l4_t8q">
                                        <h4
                                            className="text-rose-300 font-semibold"
                                            data-oid="hu0030h"
                                        >
                                            Power & I/O (91-100)
                                        </h4>
                                        <div data-oid="8xu2x.3">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="-rns5eo"
                                            >
                                                INT #91-95
                                            </span>
                                            <p className="text-gray-400" data-oid="8tws4ou">
                                                Power management
                                            </p>
                                        </div>
                                        <div data-oid="uott8wm">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="wv..092"
                                            >
                                                INT #96-100
                                            </span>
                                            <p className="text-gray-400" data-oid="_ctn-8j">
                                                Advanced I/O devices
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid="adpgs1r">
                                        <h4
                                            className="text-sky-300 font-semibold"
                                            data-oid="ji2yu55"
                                        >
                                            Additional I/O (111-114)
                                        </h4>
                                        <div data-oid="jhm042y">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="bxpo20s"
                                            >
                                                INT #111
                                            </span>
                                            <p className="text-gray-400" data-oid="ff_u67l">
                                                Mouse read operations
                                            </p>
                                        </div>
                                        <div data-oid="9-qr9dq">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="t2k39ls"
                                            >
                                                INT #112
                                            </span>
                                            <p className="text-gray-400" data-oid="3jzwex:">
                                                Joystick read operations
                                            </p>
                                        </div>
                                        <div data-oid="m:0l_bf">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="3gblhlz"
                                            >
                                                INT #113
                                            </span>
                                            <p className="text-gray-400" data-oid="rquf.tx">
                                                Sensor read operations
                                            </p>
                                        </div>
                                        <div data-oid="g_16nuq">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="ray7p6g"
                                            >
                                                INT #114
                                            </span>
                                            <p className="text-gray-400" data-oid="cwdqo7x">
                                                GPIO set operations
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1" data-oid="w_2_0t2">
                                        <h4
                                            className="text-emerald-300 font-semibold"
                                            data-oid="es7w6c2"
                                        >
                                            Keyboard Hardware (120-124)
                                        </h4>
                                        <div data-oid="2pw4.vw">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="ah9:-_s"
                                            >
                                                INT #120
                                            </span>
                                            <p className="text-gray-400" data-oid="s4mn8dk">
                                                Enable keyboard interrupts
                                            </p>
                                        </div>
                                        <div data-oid="to0kw72">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="zrsji--"
                                            >
                                                INT #121
                                            </span>
                                            <p className="text-gray-400" data-oid="5t2_:i4">
                                                Disable keyboard interrupts
                                            </p>
                                        </div>
                                        <div data-oid="jr2ohc_">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="guywf_0"
                                            >
                                                INT #122
                                            </span>
                                            <p className="text-gray-400" data-oid="nsycn1e">
                                                Set keyboard interrupt handler
                                            </p>
                                        </div>
                                        <div data-oid="x:x:kp4">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="5y866ve"
                                            >
                                                INT #123
                                            </span>
                                            <p className="text-gray-400" data-oid="6m.m7-i">
                                                Get keyboard scan code
                                            </p>
                                        </div>
                                        <div data-oid="yy07:7p">
                                            <span
                                                className="text-yellow-400 font-mono"
                                                data-oid="9dxqcqo"
                                            >
                                                INT #124
                                            </span>
                                            <p className="text-gray-400" data-oid="yaxcp95">
                                                Get keyboard ASCII code
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    className="mt-3 p-2 bg-gray-800 rounded border border-gray-600"
                                    data-oid="mnnwzss"
                                >
                                    <h4
                                        className="text-green-300 font-semibold mb-1"
                                        data-oid="r.hpe7b"
                                    >
                                        Quick Reference:
                                    </h4>
                                    <div
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs"
                                        data-oid="9bnegr9"
                                    >
                                        <div data-oid="pd28jwt">
                                            <span className="text-yellow-400" data-oid="dnsoody">
                                                R7/R1
                                            </span>{' '}
                                            = Primary data register for most interrupts
                                        </div>
                                        <div data-oid="4_892sf">
                                            <span className="text-yellow-400" data-oid="r5ac412">
                                                R0
                                            </span>{' '}
                                            = Return value register for system calls
                                        </div>
                                        <div data-oid="f1_rvls">
                                            <span className="text-yellow-400" data-oid="r60s-.7">
                                                R1,R2,R3...
                                            </span>{' '}
                                            = Additional parameters for complex operations
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
