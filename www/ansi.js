/*
 * Summary of ANSI standards for ASCII terminals       Joe Smith, 18-May-84
 * 
 * Contents:
 *   1.  Overview and Definitions
 *   2.  General rules for interpreting an ESCape Sequence
 *   3.  General rules for interpreting a Control Sequence
 *   4.  C0 and C1 control codes in numeric order
 *   5.  Two and three-character ESCape Sequences in numeric order
 *   6.  Control Sequences in numeric order
 *   7.  VT100 emulation requirements
 * 
 * The VT100 USER GUIDE and ANSI standard X3.64-1979 both list the ANSI ESCape
 * sequences in alphabetic order by mnemonic, but do not have a have a cross
 * reference in order by ASCII code.  This paper lists the combination of all
 * definitions from the three ANSI standards in numeric order.  For a description
 * of the advantages of using these standards, see the article "Toward
 * Standardized Video Terminals" in the April-1984 issue of BYTE magazine.
 * 
 * ANSI X3.4-1977 defines the 7-bit ASCII character set (C0 and G0).  It was
 * written in 1968, revised in 1977, and explains the decisions made in laying out
 * the ASCII code.  In particular, it explains why ANSI chose to make ASCII
 * incompatible with EBCDIC in order to make it self-consistant.
 * 
 * ANSI X3.41-1974 introduces the idea of an 8-bit ASCII character set (C1 and G1
 * in addition to the existing C0 and G0).  It describes how to use the 8-bit
 * features in a 7-bit environment.  X3.41 defines the format of all ESCape
 * sequences, but defines only the 3-character ones with a parameter character
 * in the middle.  These instruct the terminal how to interpret the C0, G0, C1,
 * and G1 characters (such as by selecting different character-set ROMs).
 * 
 *   Note: NAPLPS does videotex graphics by redefining the C1 set and
 *         selecting alternate G0, G1, G2, and G3 sets.
 *   See the February 1983 issue of BYTE magazine for details.
 * 
 * ANSI X3.64-1979 defines the remaining ESCape sequences.  It defines all the C1
 * control characters, and specifies that certain two-character ESCape sequences
 * in the 7-bit environment are to act exactly like the 8-bit C1 control set.
 * X3.64 introduces the idea of a Control-Sequence, which starts with CSI
 * character, has an indefinite length, and is terminated by an alphabetic
 * character.  The VT100 was one of the first terminals to implement this
 * standard.
 * 
 * Definitions:
 * 
 *   Control Character - A single character with an ASCII code with the range
 *   of 000 to 037 and 200 to 237 octal, 00 to 1F and 80 to 9F hex.
 * 
 *   Escape Sequence - A two or three character string staring with ESCape.
 *   (Four or more character strings are allowed but not defined.)
 * 
 *   Control Sequence - A string starting with CSI (233 octal, 9B hex) or
 *   with ESCape Left-Bracket, and terminated by an alphabetic character.
 *   Any number of parameter characters (digits 0 to 9, semicolon, and
 *   question mark) may appear within the Control Sequence.  The terminating
 *   character may be preceded by an intermediate character (such as space).
 * Character classifications:
 * 
 * C0 Control  000-037 octal, 00-1F hex  (G0 is 041-176 octal, 21-7E hex)
 * SPACE       040+240 octal, 20+A0 hex  Always and everywhere a blank space
 * Intermediate    040-057 octal, 20-2F hex   !"#$%&'()*+,-./
 * Parameters  060-077 octal, 30-3F hex  0123456789:;<=>?
 * Uppercase   100-137 octal, 40-5F hex  @ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_
 * Lowercase   140-176 octal, 60-7E hex  `abcdefghijlkmnopqrstuvwxyz{|}~
 * Alphabetic  100-176 octal, 40-7E hex  (all of upper and lower case)
 * Delete          177 octal,    7F hex  Always and everywhere ignored
 * C1 Control  200-237 octal, 80-9F hex  32 additional control characters
 * G1 Displayable  241-376 octal, A1-FE hex  94 additional displayable characters
 * Special     240+377 octal, A0+FF hex  Same as SPACE and DELETE
 * 
 * Note that in this paper, the terms uppercase, lowercase, and alphabetics
 * include more characters than just A to Z.
 * 
 * ------------------------------------------------------------------------------
 * 
 * General rules for interpreting an ESCape Sequence:
 * 
 *   An ESCape Sequence starts with the ESC character (033 octal, 1B hex).
 * The length of the ESCape Sequence depends on the character that immediately
 * follows the ESCape.
 * 
 * If the next character is
 *    C0 control:   Interpret it first, then resume processing ESCape sequence.
 *      Example:  CR, LF, XON, and XOFF work as normal within an ESCape sequence.
 *    Intermediate: Expect zero or more intermediates, a parameter terminates
 *      a private function, an alphabetic terminates a standard sequence.
 *      Example:  ESC ( A defines standard character set, ESC ( 0 a DEC set.
 *    Parameter:    End of a private 2-character escape sequence.
 *      Example:  ESC = sets special keypad mode, ESC > clears it.
 *    Uppercase:    Translate it into a C1 control character and act on it.
 *      Example:  ESC D does indexes down, ESC M indexes up.  (CSI is special)
 *    Lowercase:    End of a standard 2-character escape sequence.
 *      Example:  ESC c resets the terminal.
 *    Delete:   Ignore it, and continue interpreting the ESCape sequence
 *    C1 and G1:    Treat the same as their 7-bit counterparts
 * 
 *   Note that CSI is the two-character sequence ESCape left-bracket or the 8-bit
 * C1 code of 233 octal, 9B hex.  CSI introduces a Control Sequence, which
 * continues until an alphabetic character is received.
 * 
 * General rules for interpreting a Control Sequence:
 * 
 * 1) It starts with CSI, the Control Sequence Introducer.
 * 2) It contains any number of parameter characters (0123456789:;<=>?).
 * 3) It terminates with an alphabetic character.
 * 4) Intermediate characters (if any) immediately precede the terminator.
 * 
 * If the first character after CSI is one of "<=>?" (074-077 octal, 3C-3F hex),
 * then Control Sequence is to be interpreted according to private standards (such
 * as setting and resetting modes not defined by ANSI).  The terminal should
 * expect any number of numeric parameters, separated by semicolons (073 octal,
 * 3B hex).  Only after the terminating alphabetic character is received should
 * the terminal act on the Control Sequence.
 * 
 * =============================================================================
 *     C0 set of 7-bit control characters (from ANSI X3.4-1977).
 * 
 * Oct Hex Name *  (* marks function used in DEC VT series or LA series terminals)
 * --- -- - --- -  --------------------------------------------------------------
 * 000 00 @ NUL *  Null filler, terminal should ignore this character
 * 001 01 A SOH    Start of Header
 * 002 02 B STX    Start of Text, implied end of header
 * 003 03 C ETX    End of Text, causes some terminal to respond with ACK or NAK
 * 004 04 D EOT    End of Transmission
 * 005 05 E ENQ *  Enquiry, causes terminal to send ANSWER-BACK ID
 * 006 06 F ACK    Acknowledge, usually sent by terminal in response to ETX
 * 007 07 G BEL *  Bell, triggers the bell, buzzer, or beeper on the terminal
 * 010 08 H BS  *  Backspace, can be used to define overstruck characters
 * 011 09 I HT  *  Horizontal Tabulation, move to next predetermined position
 * 012 0A J LF  *  Linefeed, move to same position on next line (see also NL)
 * 013 0B K VT  *  Vertical Tabulation, move to next predetermined line
 * 014 0C L FF  *  Form Feed, move to next form or page
 * 015 0D M CR  *  Carriage Return, move to first character of current line
 * 016 0E N SO  *  Shift Out, switch to G1 (other half of character set)
 * 017 0F O SI  *  Shift In, switch to G0 (normal half of character set)
 * 020 10 P DLE    Data Link Escape, interpret next control character specially
 * 021 11 Q XON *  (DC1) Terminal is allowed to resume transmitting
 * 022 12 R DC2    Device Control 2, causes ASR-33 to activate paper-tape reader
 * 023 13 S XOFF*  (DC2) Terminal must pause and refrain from transmitting
 * 024 14 T DC4    Device Control 4, causes ASR-33 to deactivate paper-tape reader
 * 025 15 U NAK    Negative Acknowledge, used sometimes with ETX and ACK
 * 026 16 V SYN    Synchronous Idle, used to maintain timing in Sync communication
 * 027 17 W ETB    End of Transmission block
 * 030 18 X CAN *  Cancel (makes VT100 abort current escape sequence if any)
 * 031 19 Y EM End of Medium
 * 032 1A Z SUB *  Substitute (VT100 uses this to display parity errors)
 * 033 1B [ ESC *  Prefix to an ESCape sequence
 * 034 1C \ FS File Separator
 * 035 1D ] GS Group Separator
 * 036 1E ^ RS  *  Record Separator (sent by VT132 in block-transfer mode)
 * 037 1F _ US Unit Separator
 * 
 * 040 20   SP  *  Space (should never be defined to be otherwise)
 * 177 7F   DEL *  Delete, should be ignored by terminal
 * 
 * ==============================================================================
 *     C1 set of 8-bit control characters (from ANSI X3.64-1979)
 * 
 * Oct Hex Name *  (* marks function used in DEC VT series or LA series terminals)
 * --- -- - --- -  --------------------------------------------------------------
 * 200 80 @    Reserved for future standardization
 * 201 81 A    Reserved
 * 202 82 B    Reserved
 * 203 83 C    Reserved
 * 204 84 D IND *  Index, moves down one line same column regardless of NL
 * 205 85 E NEL *  NEw Line, moves done one line and to first column (CR+LF)
 * 206 86 F SSA    Start of Selected Area to be sent to auxiliary output device
 * 207 87 G ESA    End of Selected Area to be sent to auxiliary output device
 * 210 88 H HTS *  Horizontal Tabulation Set at current position
 * 211 89 I HTJ    Hor Tab Justify, moves string to next tab position
 * 212 8A J VTS    Vertical Tabulation Set at current line
 * 213 8B K PLD    Partial Line Down (subscript)
 * 214 8C L PLU    Partial Line Up (superscript)
 * 215 8D M RI  *  Reverse Index, go up one line, reverse scroll if necessary
 * 216 8E N SS2 *  Single Shift to G2
 * 217 8F O SS3 *  Single Shift to G3 (VT100 uses this for sending PF keys)
 * 220 90 P DCS *  Device Control String, terminated by ST (VT125 enters graphics)
 * 221 91 Q PU1    Private Use 1
 * 222 92 R PU2    Private Use 2
 * 223 93 S STS    Set Transmit State
 * 224 94 T CCH    Cancel CHaracter, ignore previous character
 * 225 95 U MW Message Waiting, turns on an indicator on the terminal
 * 226 96 V SPA    Start of Protected Area
 * 227 97 W EPA    End of Protected Area
 * 230 98 X    Reserved for for future standard
 * 231 99 Y    Reserved
 * 232 9A Z     *  Reserved, but causes DEC terminals to respond with DA codes
 * 233 9B [ CSI *  Control Sequence Introducer (described in a seperate table)
 * 234 9C \ ST  *  String Terminator (VT125 exits graphics)
 * 235 9D ] OSC    Operating System Command (reprograms intelligent terminal)
 * 236 9E ^ PM Privacy Message (password verification), terminated by ST
 * 237 9F _ APC    Application Program Command (to word processor), term by ST
 * 
 * ==============================================================================
 *     Character set selection sequences (from ANSI X3.41-1974)
 *     All are 3 characters long (including the ESCape).  Alphabetic characters
 *     as 3rd character are defined by ANSI, parameter characters as 3rd character
 *     may be interpreted differently by each terminal manufacturer.
 * 
 * Oct Hex   * (* marks function used in DEC VT series or LA series terminals)
 * --- -- -- - ------------------------------------------------------------------
 * 040 20      ANNOUNCER - Determines whether to use 7-bit or 8-bit ASCII
 *     A   G0 only will be used.  Ignore SI, SO, and G1.
 *     B   G0 and G1 used internally.  SI and SO affect G0, G1 is ignored.
 *     C   G0 and G1 in an 8-bit only environment.  SI and SO are ignored.
 *     D   G0 and G1 are used, SI and SO affect G0.
 *     E
 *     F * 7-bit transmission, VT240/PRO350 sends CSI as two characters ESC [
 *     G * 8-bit transmission, VT240/PRO350 sends CSI as single 8-bit character
 * 041 21 !    Select C0 control set (choice of 63 standard, 16 private)
 * 042 22 "    Select C1 control set (choice of 63 standard, 16 private)
 * 043 23 #    Translate next character to a special single character
 *        #3 * DECDHL1 - Double height line, top half
 *        #4 * DECDHL2 - Double height line, bottom half
 *        #5 * DECSWL - Single width line
 *        #6 * DECDWL - Double width line
 *        #7 * DECHCP - Make a hardcopy of the graphics screen (GIGI,VT125,VT241)
 *        #8 * DECALN - Alignment display, fill screen with "E" to adjust focus
 * 044 24 $    MULTIBYTE CHARACTERS - Displayable characters require 2-bytes each
 * 045 25 %    SPECIAL INTERPRETATION - Such as 9-bit data
 * 046 26 &    Reserved for future standardization
 * 047 27 '    Reserved for future standardization
 * 050 28 (  * SCS - Select G0 character set (choice of 63 standard, 16 private)
 *        (0 * DEC VT100 line drawing set (affects lowercase characters)
 *        (1 * DEC Alternate character ROM set (RAM set on GIGI and VT220)
 *        (2 * DEC Alternate character ROM set with line drawing
 *        (5 * DEC Finnish on LA100
 *        (6 * DEC Norwegian/Danish on LA100
 *        (7 * DEC Swedish on LA100
 *        (9 * DEC French Canadian
 *        (< * DEC supplemental graphics (everything not in USASCII)
 *        (A * UKASCII (British pound sign)
 *        (B * USASCII (American pound sign)
 *        (C * ISO Finnish on LA120
 *        (E * ISO Norwegian/Danish on LA120
 *        (H * ISO Swedish on LA120
 *        (K * ISO German on LA100,LA120
 *        (R * ISO French on LA100,LA120
 *        (Y * ISO Italian on LA100
 *        (Z * ISO Spanish on LA100
 * 051 29 )  * SCS - Select G1 character set (choice of 63 standard, 16 private)
 *           * (same character sets as listed under G0)
 * 052 2A *  * SCS - Select G2 character set
 *           * (same character sets as listed under G0)
 * 053 2B +  * SCS - Select G3 character set
 *           * (same character sets as listed under G0)
 * 054 2C ,    SCS - Select G0 character set (additional 63+16 sets)
 * 055 2D -    SCS - Select G1 character set (additional 63+16 sets)
 * 056 2E .    SCS - Select G2 character set
 * 057 2F /    SCS - Select G3 character set
 * 
 * ==============================================================================
 *     Private two-character escape sequences (allowed by ANSI X3.41-1974)
 *     These can be defined differently by each terminal manufacturer.
 * 
 * Oct Hex  *  (* marks function used in DEC VT series or LA series terminals)
 * --- -- - - ------------------------------------------------------------------
 * 060 30 0
 * 061 31 1   DECGON graphics on for VT105, DECHTS horiz tab set for LA34/LA120
 * 062 32 2   DECGOFF graphics off VT105, DECCAHT clear all horz tabs LA34/LA120
 * 063 33 3   DECVTS  - set vertical tab for LA34/LA120
 * 064 34 4   DECCAVT - clear all vertical tabs for LA34/LA120
 * 065 35 5 * DECXMT  - Host requests that VT132 transmit as if ENTER were pressed
 * 066 36 6
 * 067 37 7 * DECSC   - Save cursor position and character attributes
 * 070 38 8 * DECRC   - Restore cursor and attributes to previously saved position
 * 071 39 9
 * 072 3A :
 * 073 3B ;
 * 074 3C < * DECANSI - Switch from VT52 mode to VT100 mode
 * 075 3D = * DECKPAM - Set keypad to applications mode (ESCape instead of digits)
 * 076 3E > * DECKPNM - Set keypad to numeric mode (digits intead of ESCape seq)
 * 077 3F ?
 * 
 *     DCS Device Control Strings used by DEC terminals (ends with ST)
 * 
 * Pp = Start ReGIS graphics (VT125, GIGI, VT240, PRO350)
 * Pq = Start SIXEL graphics (screen dump to LA34, LA100, screen load to VT125)
 * Pr = SET-UP data for GIGI, $PrVC0$\ disables both visible cursors.
 * Ps = Reprogram keys on the GIGI, $P0sDIR<CR>$\ makes keypad 0 send "DIR<CR>"
 *     0-9=digits on keypad, 10=ENTER, 11=minus, 12=comma, 13=period,
 *     14-17=PF1-PF4, 18-21=cursor keys.  Enabled by $[?23h (PK1).
 * Pt = Start VT105 graphics on a VT125
 * 
 * ==============================================================================
 * 
 *     Standard two-character escape sequences (defined by ANSI X3.64-1979)
 * 
 * 100 40 @ See description of C1 control characters
 *      An ESCape followed by one of these uppercase characters is translated
 *      to an 8-bit C1 control character before being interpreted.
 * 220 90 P DCS - Device Control String, terminated by ST - see table above.
 * 133 5B [ CSI - Control Sequence Introducer - see table below.
 * 137 5F _ See description of C1 control characters
 * 
 * ==============================================================================
 * 
 *     Indepenent control functions (from Appendix E of X3.64-1977).
 *     These four controls have the same meaning regardless of the current
 *     definition of the C0 and C1 control sets.  Each control is a two-character
 *     ESCape sequence, the 2nd character is lowercase.
 * 
 * Oct Hex  *      (* marks function used in DEC VT series or LA series terminals)
 * --- -- - - --------------------------------------------------------------------
 * 140 60 `   DMI - Disable Manual Input
 * 141 61 a   INT - INTerrupt the terminal and do special action
 * 142 62 b   EMI - Enable Manual Input
 * 143 63 c * RIS - Reset to Initial State (VT100 does a power-on reset)
 *   ...            The remaining lowercase characters are reserved by ANSI.
 * 153 6B k   NAPLPS lock-shift G1 to GR
 * 154 6C l   NAPLPS lock-shift G2 to GR
 * 155 6D m   NAPLPS lock-shift G3 to GR
 * 156 6E n * LS2 - Shift G2 to GL (extension of SI) VT240,NAPLPS
 * 157 6F o * LS3 - Shift G3 to GL (extension of SO) VT240,NAPLPS
 *   ...            The remaining lowercase characters are reserved by ANSI.
 * 174 7C | * LS3R - VT240 lock-shift G3 to GR
 * 175 7D } * LS2R - VT240 lock-shift G2 to GR
 * 176 7E ~ * LS1R - VT240 lock-shift G1 to GR
 * 
 * ==============================================================================
 *     Control Sequences (defined by ANSI X3.64-1979)
 * 
 * Control Sequences are started by either ESC [ or CSI and are terminated by an
 * "alphabetic" character (100 to 176 octal, 40 to 7E hex).  Intermediate
 * characters are space through slash (40 to 57 octal, 20 to 2F hex) and parameter
 * characters are zero through question mark (60 to 77 octal, 30 to 3F hex,
 * including digits and semicolon).  Parameters consist of zero or more decimal
 * numbers separated by semicolons.  Leading zeros are optional, leading blanks
 * are not allowed.  If no digits precede the final character, the default
 * parameter is used.  Many functions treat a parameter of 0 as if it were 1.
 * 
 * Oct Hex  *      (* marks function used in DEC VT series or LA series terminals)
 * --- -- - - --------------------------------------------------------------------
 * 100 40 @   ICH - Insert CHaracter
 *         [10@ = Make room for 10 characters at current position
 * 101 41 A * CUU - CUrsor Up
 *      *  [A = Move up one line, stop at top of screen, [9A = move up 9
 * 102 42 B * CUD - CUrsor Down
 *      *  [B = Move down one line, stop at bottom of screen
 * 103 43 C * CUF - CUrsor Forward
 *      *  [C = Move forward one position, stop at right edge of screen
 * 104 44 D * CUB - CUrsor Backward
 *      *  [D = Same as BackSpace, stop at left edge of screen
 * 105 45 E   CNL - Cursor to Next Line
 *         [5E = Move to first position of 5th line down
 * 106 46 F   CPL - Cursor to Previous Line
 *         [5F = Move to first position of 5th line previous
 * 107 47 G   CHA - Cursor Horizontal position Absolute
 *         [40G = Move to column 40 of current line
 * 110 48 H * CUP - CUrsor Position
 *      *  [H = Home, [24;80H = Row 24, Column 80
 * 111 49 I   CHT - Cursor Horizontal Tabulation
 *         [I = Same as HT (Control-I), [3I = Go forward 3 tabs
 * 112 4A J * ED  - Erase in Display (cursor does not move)
 *      *  [J = [0J = Erase from current position to end (inclusive)
 *      *  [1J = Erase from beginning to current position (inclusive)
 *      *  [2J = Erase entire display
 *      *  [?0J = Selective erase in display ([?1J, [?2J similar)
 * 113 4B K * EL  - Erase in Line (cursor does not move)
 *      *  [K = [0K = Erase from current position to end (inclusive)
 *      *  [1K = Erase from beginning to current position
 *      *  [2K = Erase entire current line
 *      *  [?0K = Selective erase to end of line ([?1K, [?2K similar)
 * 114 4C L * IL  - Insert Line, current line moves down (VT102 series)
 *         [3L = Insert 3 lines if currently in scrolling region
 * 115 4D M * DL  - Delete Line, lines below current move up (VT102 series)
 *         [2M = Delete 2 lines if currently in scrolling region
 * 116 4E N   EF  - Erase in Field (as bounded by protected fields)
 *         [0N, [1N, [2N act like [L but within currend field
 * 117 4F O   EA  - Erase in qualified Area (defined by DAQ)
 *         [0O, [1O, [2O act like [J but within current area
 * 120 50 P * DCH - Delete Character, from current position to end of field
 *         [4P = Delete 4 characters, VT102 series
 * 121 51 Q   SEM - Set Editing extent Mode (limits ICH and DCH)
 *         [0Q = [Q = Insert/delete character affects rest of display
 *         [1Q = ICH/DCH affect the current line only
 *         [2Q = ICH/DCH affect current field (between tab stops) only
 *         [3Q = ICH/DCH affect qualified area (between protected fields)
 * 122 52 R * CPR - Cursor Position Report (from terminal to host)
 *      *  [24;80R = Cursor is positioned at line 24 column 80
 * 123 53 S   SU  - Scroll up, entire display is moved up, new lines at bottom
 *         [3S = Move everything up 3 lines, bring in 3 new lines
 * 124 54 T   SD  - Scroll down, new lines inserted at top of screen
 *         [4T = Scroll down 4, bring previous lines back into view
 * 125 55 U   NP  - Next Page (if terminal has more than 1 page of memory)
 *         [2U = Scroll forward 2 pages
 * 126 56 V   PP  - Previous Page (if terminal remembers lines scrolled off top)
 *         [1V = Scroll backward 1 page
 * 127 57 W   CTC - Cursor Tabulation Control
 *         [0W = Set horizontal tab for current line at current position
 *         [1W = Set vertical tab stop for current line of current page
 *         [2W = Clear horiz tab stop at current position of current line
 *         [3W = Clear vert tab stop at current line of current page
 *         [4W = Clear all horiz tab stops on current line only
 *         [5W = Clear all horiz tab stops for the entire terminal
 *         [6W = Clear all vert tabs stops for the entire terminal
 * 130 58 X   ECH - Erase CHaracter
 *         [4X = Change next 4 characters to "erased" state
 * 131 59 Y   CVT - Cursor Vertical Tab
 *         [2Y = Move forward to 2nd following vertical tab stop
 * 132 5A Z   CBT - Cursor Back Tab
 *         [3Z = Move backwards to 3rd previous horizontal tab stop
 * 133 5B [    Reserved for future standardization     left bracket
 * 134 5C \    Reserved                                reverse slant
 * 135 5D ]    Reserved                                right bracket
 * 136 5E ^    Reserved                                circumflex
 * 137 5F _    Reserved                                underscore
 * 140 60 ` * HPA - Horizontal Position Absolute (depends on PUM)
 *         [720` = Move to 720 decipoints (1 inch) from left margin
 *      *  [80` = Move to column 80 on LA120
 * 141 61 a * HPR - Horizontal Position Relative (depends on PUM)
 *         [360a = Move 360 decipoints (1/2 inch) from current position
 *      *  [40a = Move 40 columns to right of current position on LA120
 * 142 62 b   REP - REPeat previous displayable character
 *         [80b = Repeat character 80 times
 * 143 63 c * DA  - Device Attributes
 *      *  [c = Terminal will identify itself
 *      *  [?1;2c = Terminal is saying it is a VT100 with AVO
 *      *  [>0c = Secondary DA request (distinguishes VT240 from VT220)
 * 144 64 d * VPA - Vertical Position Absolute (depends on PUM)
 *         [90d = Move to 90 decipoints (1/8 inch) from top margin
 *      *  [10d = Move to line 10 if before that else line 10 next page
 * 145 65 e * VPR - Vertical Position Relative (depends on PUM)
 *         [720e = Move 720 decipoints (1 inch) down from current position
 *      *  [6e = Advance 6 lines forward on LA120
 * 146 66 f * HVP - Horizontal and Vertical Position (depends on PUM)
 *         [720,1440f = Move to 1 inch down and 2 inches over (decipoints)
 *      *  [24;80f = Move to row 24 column 80 if PUM is set to character
 * 147 67 g * TBC - Tabulation Clear
 *      *  [0g = Clear horizontal tab stop at current position
 *      *  [1g = Clear vertical tab stop at current line (LA120)
 *      *  [2g = Clear all horizontal tab stops on current line only LA120
 *      *  [3g = Clear all horizontal tab stops in the terminal
 * 150 68 h * SM  - Set Mode (. means permanently set on VT100)
 *         [0h = Error, this command is ignored
 *      *  [1h = GATM - Guarded Area Transmit Mode, send all (VT132)
 *         [2h = KAM - Keyboard Action Mode, disable keyboard input
 *         [3h = CRM - Control Representation Mode, show all control chars
 *      *  [4h = IRM - Insertion/Replacement Mode, set insert mode (VT102)
 *         [5h = SRTM - Status Report Transfer Mode, report after DCS
 *      *  [6h = ERM - ERasure Mode, erase protected and unprotected
 *         [7h = VEM - Vertical Editing Mode, IL/DL affect previous lines
 *         [8h, [9h are reserved
 *         [10h = HEM - Horizontal Editing mode, ICH/DCH/IRM go backwards
 *         [11h = PUM - Positioning Unit Mode, use decipoints for HVP/etc
 *      .  [12h = SRM - Send Receive Mode, transmit without local echo
 *         [13h = FEAM - Format Effector Action Mode, FE's are stored
 *         [14h = FETM - Format Effector Transfer Mode, send only if stored
 *         [15h = MATM - Multiple Area Transfer Mode, send all areas
 *      *  [16h = TTM - Transmit Termination Mode, send scrolling region
 *         [17h = SATM - Send Area Transmit Mode, send entire buffer
 *         [18h = TSM - Tabulation Stop Mode, lines are independent
 *         [19h = EBM - Editing Boundry Mode, all of memory affected
 *      *  [20h = LNM - Linefeed Newline Mode, LF interpreted as CR LF
 *      *  [?1h = DECCKM - Cursor Keys Mode, send ESC O A for cursor up
 *      *  [?2h = DECANM - ANSI Mode, use ESC < to switch VT52 to ANSI
 *      *  [?3h = DECCOLM - COLumn mode, 132 characters per line
 *      *  [?4h = DECSCLM - SCrolL Mode, smooth scrolling
 *      *  [?5h = DECSCNM - SCreeN Mode, black on white background
 *      *  [?6h = DECOM - Origin Mode, line 1 is relative to scroll region
 *      *  [?7h = DECAWM - AutoWrap Mode, start newline after column 80
 *      *  [?8h = DECARM - Auto Repeat Mode, key will autorepeat
 *      *  [?9h = DECINLM - INterLace Mode, interlaced for taking photos
 *      *  [?10h = DECEDM - EDit Mode, VT132 is in EDIT mode
 *      *  [?11h = DECLTM - Line Transmit Mode, ignore TTM, send line
 *         [?12h = ?
 *      *  [?13h = DECSCFDM - Space Compression/Field Delimiting on,
 *      *  [?14h = DECTEM - Transmit Execution Mode, transmit on ENTER
 *         [?15h = ?
 *      *  [?16h = DECEKEM - Edit Key Execution Mode, EDIT key is local
 *         [?17h = ?
 *      *  [?18h = DECPFF - Print FormFeed mode, send FF after printscreen
 *      *  [?19h = DECPEXT - Print Extent mode, print entire screen
 *      *  [?20h = OV1 - Overstrike, overlay characters on GIGI
 *      *  [?21h = BA1 - Local BASIC, GIGI to keyboard and screen
 *      *  [?22h = BA2 - Host BASIC, GIGI to host computer
 *      *  [?23h = PK1 - GIGI numeric keypad sends reprogrammable sequences
 *      *  [?24h = AH1 - Autohardcopy before erasing or rolling GIGI screen
 *      *  [?29h =     - Use only the proper pitch for the LA100 font
 *      *  [?38h = DECTEK - TEKtronix mode graphics
 * 151 69 i * MC  - Media Copy (printer port on VT102)
 *      *  [0i = Send contents of text screen to printer
 *         [1i = Fill screen from auxiliary input (printer's keyboard)
 *         [2i = Send screen to secondary output device
 *         [3i = Fill screen from secondary input device
 *      *  [4i = Turn on copying received data to primary output (VT125)
 *      *  [4i = Received data goes to VT102 screen, not to its printer
 *      *  [5i = Turn off copying received data to primary output (VT125)
 *      *  [5i = Received data goes to VT102's printer, not its screen
 *      *  [6i = Turn off copying received data to secondary output (VT125)
 *      *  [7i = Turn on copying received data to secondary output (VT125)
 *      *  [?0i = Graphics screen dump goes to graphics printer VT125,VT240
 *      *  [?1i = Print cursor line, terminated by CR LF
 *      *  [?2i = Graphics screen dump goes to host computer VT125,VT240
 *      *  [?4i = Disable auto print
 *      *  [?5i = Auto print, send a line at a time when linefeed received
 * 152 6A j    Reserved for future standardization
 * 153 6B k    Reserved for future standardization
 * 154 6C l * RM  - Reset Mode (. means permanently reset on VT100)
 *      *  [1l = GATM - Transmit only unprotected characters (VT132)
 *      .  [2l = KAM - Enable input from keyboard
 *      .  [3l = CRM - Control characters are not displayable characters
 *      *  [4l = IRM - Reset to replacement mode (VT102)
 *      .  [5l = SRTM - Report only on command (DSR)
 *      *  [6l = ERM - Erase only unprotected fields
 *      .  [7l = VEM - IL/DL affect lines after current line
 *         [8l, [9l are reserved
 *      .  [10l = HEM - ICH and IRM shove characters forward, DCH pulls
 *      .  [11l = PUM - Use character positions for HPA/HPR/VPA/VPR/HVP
 *         [12l = SRM - Local echo - input from keyboard sent to screen
 *      .  [13l = FEAM - HPA/VPA/SGR/etc are acted upon when received
 *      .  [14l = FETM - Format Effectors are sent to the printer
 *         [15l = MATM - Send only current area if SATM is reset
 *      *  [16l = TTM - Transmit partial page, up to cursor position
 *         [17l = SATM - Transmit areas bounded by SSA/ESA/DAQ
 *      .  [18l = TSM - Setting a tab stop on one line affects all lines
 *      .  [19l = EBM - Insert does not overflow to next page
 *      *  [20l = LNM - Linefeed does not change horizontal position
 *      *  [?1l = DECCKM - Cursor keys send ANSI cursor position commands
 *      *  [?2l = DECANM - Use VT52 emulation instead of ANSI mode
 *      *  [?3l = DECCOLM - 80 characters per line (erases screen)
 *      *  [?4l = DECSCLM - Jump scrolling
 *      *  [?5l = DECSCNM - Normal screen (white on black background)
 *      *  [?6l = DECOM - Line numbers are independent of scrolling region
 *      *  [?7l = DECAWM - Cursor remains at end of line after column 80
 *      *  [?8l = DECARM - Keys do not repeat when held down
 *      *  [?9l = DECINLM - Display is not interlaced to avoid flicker
 *      *  [?10l = DECEDM - VT132 transmits all key presses
 *      *  [?11l = DECLTM - Send page or partial page depending on TTM
 *         [?12l = ?
 *      *  [?13l = DECSCFDM - Don't suppress trailing spaces on transmit
 *      *  [?14l = DECTEM - ENTER sends ESC S (STS) a request to send
 *         [?15l = ?
 *      *  [?16l = DECEKEM - EDIT key transmits either $[10h or $[10l
 *         [?17l = ?
 *      *  [?18l = DECPFF - Don't send a formfeed after printing screen
 *      *  [?19l = DECPEXT - Print only the lines within the scroll region
 *      *  [?20l = OV0 - Space is destructive, replace not overstrike, GIGI
 *      *  [?21l = BA0 - No BASIC, GIGI is On-Line or Local
 *      *  [?22l = BA0 - No BASIC, GIGI is On-Line or Local
 *      *  [?23l = PK0 - Ignore reprogramming on GIGI keypad and cursors
 *      *  [?24l = AH0 - No auto-hardcopy when GIGI screen erased
 *      *  [?29l = Allow all character pitches on the LA100
 *      *  [?38l = DECTEK - Ignore TEKtronix graphics commands
 * 155 6D m * SGR - Set Graphics Rendition (affects character attributes)
 *      *  [0m = Clear all special attributes
 *      *  [1m = Bold or increased intensity
 *      *  [2m = Dim or secondary color on GIGI  (superscript on XXXXXX)
 *         [3m = Italic                          (subscript on XXXXXX)
 *      *  [4m = Underscore, [0;4m = Clear, then set underline only
 *      *  [5m = Slow blink
 *         [6m = Fast blink                      (overscore on XXXXXX)
 *      *  [7m = Negative image, [0;1;7m = Bold + Inverse
 *         [8m = Concealed (do not display character echoed locally)
 *         [9m = Reserved for future standardization
 *      *  [10m = Select primary font (LA100)
 *      *  [11m - [19m = Selete alternate font (LA100 has 11 thru 14)
 *         [20m = FRAKTUR (whatever that means)
 *      *  [22m = Cancel bold or dim attribute only (VT220)
 *      *  [24m = Cancel underline attribute only (VT220)
 *      *  [25m = Cancel fast or slow blink attribute only (VT220)
 *      *  [27m = Cancel negative image attribute only (VT220)
 *      *  [30m = Write with black,   [40m = Set background to black (GIGI)
 *      *  [31m = Write with red,     [41m = Set background to red
 *      *  [32m = Write with green,   [42m = Set background to green
 *      *  [33m = Write with yellow,  [43m = Set background to yellow
 *      *  [34m = Write with blue,    [44m = Set background to blue
 *      *  [35m = Write with magenta, [45m = Set background to magenta
 *      *  [36m = Write with cyan,    [46m = Set background to cyan
 *      *  [37m = Write with white,   [47m = Set background to white
 *         [38m, [39m, [48m, [49m are reserved
 * 156 6E n * DSR - Device Status Report
 *      *  [0n = Terminal is ready, no malfunctions detected
 *         [1n = Terminal is busy, retry later
 *         [2n = Terminal is busy, it will send DSR when ready
 *      *  [3n = Malfunction, please try again
 *         [4n = Malfunction, terminal will send DSR when ready
 *      *  [5n = Command to terminal to report its status
 *      *  [6n = Command to terminal requesting cursor position (CPR)
 *      *  [?15n = Command to terminal requesting printer status, returns
 *                 [?10n = OK, [?11n = not OK, [?13n = no printer.
 *      *  [?25n = "Are User Defined Keys Locked?" (VT220)
 * 157 6F o   DAQ - Define Area Qualification starting at current position
 *         [0o = Accept all input, transmit on request
 *         [1o = Protected and guarded, accept no input, do not transmit
 *         [2o = Accept any printing character in this field
 *         [3o = Numeric only field
 *         [4o = Alphabetic (A-Z and a-z) only
 *         [5o = Right justify in area
 *         [3;6o = Zero fill in area
 *         [7o = Set horizontal tab stop, this is the start of the field
 *         [8o = Protected and unguarded, accept no input, do transmit
 *         [9o = Space fill in area
 * 
 * ==============================================================================
 * 
 *     Private Control Sequences (allowed by ANSI X3.41-1974).
 *     These take parameter strings and terminate with the last half of lowercase.
 * 
 * Oct Hex  *      (* marks function used in DEC VT series or LA series terminals)
 * --- -- - - --------------------------------------------------------------------
 * 160 70 p * DECSTR - Soft Terminal Reset
 *         [!p = Soft Terminal Reset
 * 161 71 q * DECLL - Load LEDs
 *         [0q = Turn off all, [?1;4q turns on L1 and L4, etc
 *         [154;155;157q = VT100 goes bonkers
 *         [2;23!q = Partial screen dump from GIGI to graphics printer
 *         [0"q = DECSCA Select Character Attributes off
 *         [1"q = DECSCA - designate set as non-erasable
 *         [2"q = DECSCA - designate set as erasable
 * 162 72 r * DECSTBM - Set top and bottom margins (scroll region on VT100)
 *         [4;20r = Set top margin at line 4 and bottom at line 20
 * 163 73 s * DECSTRM - Set left and right margins on LA100,LA120
 *         [5;130s = Set left margin at column 5 and right at column 130
 * 164 74 t * DECSLPP - Set physical lines per page
 *         [66t = Paper has 66 lines (11 inches at 6 per inch)
 * 165 75 u * DECSHTS - Set many horizontal tab stops at once on LA100
 *         [9;17;25;33;41;49;57;65;73;81u = Set standard tab stops
 * 166 76 v * DECSVTS - Set many vertical tab stops at once on LA100
 *         [1;16;31;45v = Set vert tabs every 15 lines
 * 167 77 w * DECSHORP - Set horizontal pitch on LAxxx printers
 *         [1w = 10 characters per inch, [2w = 12 characters per inch
 *         [0w=10, [3w=13.2, [4w=16.5, [5w=5, [6w=6, [7w=6.6, [8w=8.25
 * 170 78 x * DECREQTPARM - Request terminal parameters
 *         [3;5;2;64;64;1;0x = Report, 7 bit Even, 1200 baud, 1200 baud
 * 171 79 y * DECTST - Invoke confidence test
 *         [2;1y = Power-up test on VT100 series (and VT100 part of VT125)
 *         [3;1y = Power-up test on GIGI (VK100)
 *         [4;1y = Power-up test on graphics portion of VT125
 * 172 7A z * DECVERP - Set vertical pitch on LA100
 *         [1z = 6 lines per inch, [2z = 8 lines per inch
 *         [0z=6, [3z=12, [4z=3, [5z=3, [6z=4
 * 173 7B {   Private
 * 174 7C | * DECTTC - Transmit Termination Character
 *         [0| = No extra characters, [1| = terminate with FF
 * 175 7D } * DECPRO - Define protected field on VT132
 *         [0} = No protection, [1;4;5;7} = Any attribute is protected
 *         [254} = Characters with no attributes are protected
 * 176 7E ~ * DECKEYS - Sent by special function keys
 *         [1~=FIND, [2~=INSERT, [3~=REMOVE, [4~=SELECT, [5~=PREV, [6~=NEXT
 *         [17~=F6...[34~=F20 ([23~=ESC,[24~=BS,[25~=LF,[28~=HELP,[29~=DO)
 * 177 7F DELETE is always ignored
 * 
 * ==============================================================================
 *     Control Sequences with intermediate characters (from ANSI X3.64-1979).
 *     Note that there is a SPACE character before the terminating alphabetic.
 * 
 * Oct Hex  *      (* marks function used in DEC VT series or LA series terminals)
 * --- -- - - --------------------------------------------------------------------
 * 100 40 @   SL  - Scroll Left
 *         [4 @ = Move everything over 4 columns, 4 new columns at right
 * 101 41 A   SR  - Scroll Right
 *         [2 A = Move everything over 2 columns, 2 new columns at left
 * 102 42 B   GSM - Graphic Size Modification
 *         [110;50 B = Make 110% high, 50% wide
 * 103 43 C   GSS - Graphic Size Selection
 *         [120 C = Make characters 120 decipoints (1/6 inch) high
 * 104 44 D   FNT - FoNT selection (used by SGR, [10m thru [19m)
 *         [0;23 D = Make primary font be registered font #23
 * 105 45 E   TSS - Thin Space Specification
 *         [36 E = Define a thin space to be 36 decipoints (1/20 inch)
 * 106 46 F   JFY - JustiFY, done by the terminal/printer
 *         [0 E = No justification
 *         [1 E = Fill, bringing words up from next line if necessary
 *         [2 E = Interword spacing, adjust spaces between words
 *         [3 E = Letter spacing, adjust width of each letter
 *         [4 E = Use hyphenation
 *         [5 E = Flush left margin
 *         [6 E = Center following text between margins (until [0 E)
 *         [7 E = Flush right margin
 *         [8 E = Italian form (underscore instead of hyphen)
 * 107 47 G   SPI - SPacing Increment (in decipoints)
 *         [120;72 G = 6 per inch vertical, 10 per inch horizontal
 * 110 48 H   QUAD- Do quadding on current line of text (typography)
 *         [0 H = Flush left,  [1 H = Flush left and fill with leader
 *         [2 H = Center,      [3 H = Center and fill with leader
 *         [4 H = Flush right, [5 H = Flush right and fill with leader
 * 111 49 I   Reserved for future standardization
 * 157 67 o   Reserved for future standardization
 * 160 70 p   Private use
 *   ...       May be defined by the printer manufacturer
 * 176 7E ~   Private use
 * 177 7F DELETE is always ignored
 * 
 * ==============================================================================
 * Minimum requirements for VT100 emulation:
 * 
 * 1) To act as a passive display, implement the 4 cursor commands, the 2 erase
 *    commands, direct cursor addressing, and at least inverse characters.
 *    The software should be capable of handling strings with 16 numeric parameters
 *    with values in the range of 0 to 255.
 * 
 *   [A      Move cursor up one row, stop if a top of screen
 *   [B      Move cursor down one row, stop if at bottom of screen
 *   [C      Move cursor forward one column, stop if at right edge of screen
 *   [D      Move cursor backward one column, stop if at left edge of screen
 *   [H      Home to row 1 column 1 (also [1;1H)
 *   [J      Clear from current position to bottom of screen
 *   [K      Clear from current position to end of line
 *   [24;80H Position to line 24 column 80 (any line 1 to 24, any column 1 to 132)
 *   [0m     Clear attributes to normal characters
 *   [7m     Add the inverse video attribute to succeeding characters
 *   [0;7m   Set character attributes to inverse video only
 * 
 * 2) To enter data in VT100 mode, implement the 4 cursor keys and the 4 PF keys.
 *    It must be possible to enter ESC, TAB, BS, DEL, and LF from the keyboard.
 * 
 *   [A       Sent by the up-cursor key (alternately ESC O A)
 *   [B       Sent by the down-cursor key (alternately ESC O B)
 *   [C       Sent by the right-cursor key (alternately ESC O C)
 *   [D       Sent by the left-cursor key (alternately ESC O D)
 *   OP       PF1 key sends ESC O P
 *   OQ       PF2 key sends ESC O Q
 *   OR       PF3 key sends ESC O R
 *   OS       PF3 key sends ESC O S
 *   [c       Request for the terminal to identify itself
 *   [?1;0c   VT100 with memory for 24 by 80, inverse video character attribute
 *   [?1;2c   VT100 capable of 132 column mode, with bold+blink+underline+inverse
 * 
 * 3) When doing full-screen editing on a VT100, implement directed erase, the
 *    numeric keypad in applications mode, and the limited scrolling region.
 *    The latter is needed to do insert/delete line functions without rewriting
 *    the screen.
 * 
 *   [0J     Erase from current position to bottom of screen inclusive
 *   [1J     Erase from top of screen to current position inclusive
 *   [2J     Erase entire screen (without moving the cursor)
 *   [0K     Erase from current position to end of line inclusive
 *   [1K     Erase from beginning of line to current position inclusive
 *   [2K     Erase entire line (without moving cursor)
 *   [12;24r   Set scrolling region to lines 12 thru 24.  If a linefeed or an
 *             INDex is received while on line 24, the former line 12 is deleted
 *             and rows 13-24 move up.  If a RI (reverse Index) is received while
 *             on line 12, a blank line is inserted there as rows 12-13 move down.
 *             All VT100 compatible terminals (except GIGI) have this feature.
 *   ESC =   Set numeric keypad to applications mode
 *   ESC >   Set numeric keypad to numbers mode
 *   OA      Up-cursor key    sends ESC O A after ESC = ESC [ ? 1 h
 *   OB      Down-cursor key  sends ESC O B    "      "         "
 *   OC      Right-cursor key sends ESC O B    "      "         "
 *   OB      Left-cursor key  sends ESC O B    "      "         "
 *   OM      ENTER key        sends ESC O M after ESC =
 *   Ol      COMMA on keypad  sends ESC O l    "      "   (that's lowercase L)
 *   Om      MINUS on keypad  sends ESC O m    "      "
 *   Op      ZERO on keypad   sends ESC O p    "      "
 *   Oq      ONE on keypad    sends ESC O q    "      "
 *   Or      TWO on keypad    sends ESC O r    "      "
 *   Os      THREE on keypad  sends ESC O s    "      "
 *   Ot      FOUR on keypad   sends ESC O t    "      "
 *   Ou      FIVE on keypad   sends ESC O u    "      "
 *   Ov      SIX on keypad    sends ESC O v    "      "
 *   Ow      SEVEN on keypad  sends ESC O w    "      "
 *   Ox      EIGHT on keypad  sends ESC O x    "      "
 *   Oy      NINE on keypad   sends ESC O y    "      "
 * 
 * 4) If the hardware is capable of double width/double height:
 * 
 *   #3     Top half of a double-width double-height line
 *   #4     Bottom half of a double-width double-height line
 *   #5     Make line single-width (lines are set this way when cleared by ESC [ J)
 *   #6     Make line double-width normal height (40 or 66 characters)
 * 
 * 5) If the terminal emulator is capable of insert/delete characters,
 * insert/delete lines, insert/replace mode, and can do a full-screen dump to
 * the printer (in text mode), then it should identify itself as a VT102
 * 
 *   [c     Request for the terminal to identify itself
 *   [?6c   VT102 (printer port, 132 column mode, and ins/del standard)
 *   [1@    Insert a blank character position (shift line to the right)
 *   [1P    Delete a character position (shift line to the left)
 *   [1L    Insert blank line at current row (shift screen down)
 *   [1M    Delete the current line (shift screen up)
 *   [4h    Set insert mode, new characters shove existing ones to the right
 *   [4l    Reset insert mode, new characters replace existing ones
 *   [0i    Print screen (all 24 lines) to the printer
 *   [4i    All received data goes to the printer (nothing to the screen)
 *   [5i    All received data goes to the screen (nothing to the printer)
 */
define(function(require, exports, module) {

    var Stack = require('./stack');
    var StringReader = require('./stringreader');

    /**
     * Convert ASCII code to char
     * 
     * @param c {@link Number}
     *          ASCII code
     */
    function charof(c) {
        return String.fromCharCode(c);
    }

    /**
     * Test whether the specified ASCII code represents a digit
     * 
     * @param c {@link Number}
     *          ASCII code of a character
     */
    function isDigit(c) {
        return 0x30 <= c && c <= 0x39;
    }

    /**
     * Test whether the specified ASCII code represents a C0 control character
     * 
     * @param c {@link Number}
     *           ASCII code of a character
     */
    function isC0(c) {
        return 0x00 <= c && c <= 0x1F;
    }

    /**
     * Test whether the specified ASCII code represents a C1 control character
     * 
     * @param c {@link Number}
     *           ASCII code of a character
     */
    function isC1(c) {
        return 0x80 <= c && c <= 0x9F;
    }

    /**
     * Test whether the specified ASCII code represents a control character
     * 
     * @param c {@link Number}
     *           ASCII code of a character
     */
    function isCtrlChar(c) {
        return isC0(c) || isC1(c);
    }

    /**
     * Test whether the specified ASCII code represents an intermediate character
     * 
     * @param c {@link Number}
     *           ASCII code of a character
     */
    function isIntermediate(c) {
        return 0x20 <= c && c <= 0x2F;
    }

    /**
     * Test whether the specified ASCII code represents a parameter character
     * 
     * @param c {@link Number}
     *           ASCII code of a character
     */
    function isParameter(c) {
        return 0x30 <= c && c <= 0x3F;
    }

    /**
     * Test whether the specified ASCII code represents an upper case
     * 
     * @param c {@link Number}
     *           ASCII code of a character
     */
    function isUpperCase(c) {
        return 0x40 <= c && c <= 0x5F;
    }

    /**
     * Test whether the specified ASCII code represents a lower case
     * 
     * @param c {@link Number}
     *           ASCII code of a character
     */
    function isLowerCase(c) {
        return 0x60 <= c && c <= 0x7E;
    }

    /**
     * Test whether the specified ASCII code represents an alphabet
     * 
     * @param c {@link Number}
     *           ASCII code of a character
     */
    function isAlphabet(c) {
        return isUpperCase(c) || isLowerCase(c);
    }

    /**
     * Test whether the specified ASCII code represents the DELETE control code
     * 
     * @param c {@link Number}
     *           ASCII code of a character
     */
    function isDelete(c) {
        return 0x7F == c;
    }

    /**
     * Test whether the specified ASCII code represents a G1 control code
     * 
     * @param c {@link Number}
     *           ASCII code of a character
     */
    function isG1(c) {
        return 0xA1 <= c && c <= 0xFE;
    }

    /**
     * ANSI token prerenderer
     * 
     * @param renderer {@link Function}
     *           Customized renderer
     */
    var Prerenderer = function(renderer) {
        var $renderer = renderer || function(token) {
            console.log(JSON.stringify(token));
        };

        /**
         * Prerender the specified token, parse the parameters
         * 
         * @param token {@link Object}
         *          A token of ANSI sequence
         */
        this.prerender = function(token) {
            var matches = null;

            switch (token.type) {
            case 'ICH':
                prerenderSingularParam(token, /\[(\d+)@/, 1);
                break;
            case 'CUU':
                prerenderSingularParam(token, /\[(\d+)A/, 1);
                break;
            case 'CUD':
                prerenderSingularParam(token, /\[(\d+)B/, 1);
                break;
            case 'CUF':
                prerenderSingularParam(token, /\[(\d+)C/, 1);
                break;
            case 'CUB':
                prerenderSingularParam(token, /\[(\d+)D/, 1);
                break;
            case 'CNL':
                prerenderSingularParam(token, /\[(\d+)E/, 1);
                break;
            case 'CPL':
                prerenderSingularParam(token, /\[(\d+)F/, 1);
                break;
            case 'CHA':
                prerenderSingularParam(token, /\[(\d+)G/, 1);
                break;
            case 'CUP':
                prerenderMultipleParams(token, /\[([^H]+)H$/, [1, 1]);
                break;
            case 'CHT':
                prerenderSingularParam(token, /\[(\d+)I/, 1);
                break;
            case 'ED':
                prerenderSingularParam(token, /\[(\d+)J$/, 0);
                break;
            case 'EL':
                prerenderSingularParam(token, /\[(\d+)K$/, 0);
                break;
            case 'IL':
                prerenderSingularParam(token, /\[(\d+)L$/, 1);
                break;
            case 'DL':
                prerenderSingularParam(token, /\[(\d+)M$/, 1);
                break;
            case 'DCH':
                prerenderSingularParam(token, /\[(\d+)P$/, 1);
                break;
            case 'SU':
                prerenderSingularParam(token, /\[(\d+)S$/, 1);
                break;
            case 'SD':
                prerenderSingularParam(token, /\[(\d+)T$/, 1);
                break;
            case 'ECH':
                prerenderSingularParam(token, /\[(\d+)X$/, 1);
                break;
            case 'CBT':
                prerenderSingularParam(token, /\[(\d+)Z$/, 1);
                break;
            case 'HPA':
                prerenderSingularParam(token, /\[(\d+)`$/, 1);
                break;
            case 'HPR':
                prerenderSingularParam(token, /\[(\d+)a$/, 1);
                break;
            case 'DA':
                prerenderSingularParam(token, /\[(\d+)c$/, 0);
                break;
            case 'VPA':
                prerenderSingularParam(token, /\[(\d+)d$/, 1);
                break;
            case 'VPR':
                prerenderSingularParam(token, /\[(\d+)e$/, 1);
                break;
            case 'HVP':
                prerenderMultipleParams(token, /\[((\d+)?(;\d+)*)f$/, [1, 1]);
                break;
            case 'TBC':
                prerenderSingularParam(token, /\[(\d+)g$/, 0);
                break;
            case 'SM':
                prerenderMultipleParams(token, /\[((\d+)?(;\d+)*)h$/, [0]);
                break;
            case 'MC':
                prerenderMultipleParams(token, /\[((\d+)?(;\d+)*)i$/, [0]);
                break;
            case 'HPB':
                prerenderSingularParam(token, /\[(\d+)j$/, 1);
                break;
            case 'VPB':
                prerenderSingularParam(token, /\[(\d+)k$/, 1);
                break;
            case 'RM':
                prerenderMultipleParams(token, /\[((\d+)?(;\d+)*)l$/, [0]);
                break;
            case 'SGR':
                prerenderMultipleParams(token, /\[((\d+)?(;\d+)*)m$/, [0]);
                break;
            case 'DSR':
                prerenderSingularParam(token, /\[(\d+)n$/, 0);
                break;
            case 'DECSTBM':
                prerenderMultipleParams(token, /\[((\d+)?(;\d+)*)r$/, [0, 0]);
                break;
            case 'DECSLRM':
                prerenderMultipleParams(token, /\[((\d+)?(;\d+)*)s$/, [0, 0]);
                break;
            case 'DECSLPP':
                prerenderMultipleParams(token, /\[((\d+)?(;\d+)*)t$/, [0, 0, 0]);
                break;
            case 'TTIMEST':
                prerenderSingularParam(token, /\[<(\d+)t$/, 0);
                break;
            case 'DA3':
                prerenderSingularParam(token, /\[=(\d+)c$/, 0);
                break;
            case 'DA2':
                prerenderSingularParam(token, /\[>(\d+)c$/, 0);
                break;
            case 'DECSED':
                prerenderSingularParam(token, /\[\?(\d+)J$/, 0);
                break;
            case 'DECSEL':
                prerenderSingularParam(token, /\[\?(\d+)K$/, 0);
                break;
            case 'DECSET':
                prerenderMultipleParams(token, /\[\?((\d+)?(;\d+)*)h$/, [0]);
                break;
            case 'DECMC':
                prerenderMultipleParams(token, /\[\?((\d+)?(;\d+)*)i$/, [0]);
                break;
            case 'DECRST':
                prerenderMultipleParams(token, /\[\?((\d+)?(;\d+)*)l$/, [0]);
                break;
            case 'DECDSR':
                prerenderSingularParam(token, /\[\?(\d+)n$/, 0);
                break;
            case 'DECSCUSR':
                prerenderSingularParam(token, /\[(\d+) q$/, 0);
                break;
            case 'DECSCL':
                prerenderMultipleParams(token, /\[((\d+)?(;\d+)*)"p$/, [0, 0]);
                break;
            case 'DECSCA':
                prerenderSingularParam(token, /\[(\d+)"q$/, 0);
                break;
            case 'DECRQM':
                prerenderSingularParam(token, /\[\??(\d+)\$p$/, 0);
                break;
            case 'DECERA':
                prerenderMultipleParams(token, /\[((\d+)?(;\d+)*)\$z$/, [0, 0, 0, 0]);
                break;
            case 'DECSERA':
                prerenderMultipleParams(token, /\[((\d+)?(;\d+)*)\${$/, [0, 0, 0, 0]);
                break;
            case 'DECSASD':
                prerenderSingularParam(token, /\[(\d+)\$}$/, 0);
                break;
            case 'DECSSDT':
                prerenderSingularParam(token, /\[(\d+)\$~$/, 0);
                break;
            case 'DECEFR':
                prerenderMultipleParams(token, /\[((\d+)?(;\d+)*)'w$/, [0, 0, 0, 0]);
                break;
            case 'DECELR':
                prerenderMultipleParams(token, /\[((\d+)?(;\d+)*)'z$/, [0, 0]);
                break;
            case 'DECSLE':
                prerenderMultipleParams(token, /\[((\d+)?(;\d+)*)'{$/, [0]);
                break;
            case 'G1D4':
                token.value = token.image.charCodeAt(token.image.length - 1);
                break;
            case 'GZD4':
                token.value = token.image.charCodeAt(token.image.length - 1);
                break;
            case 'OSC':
                token.title = token.image.replace(/^\u001b\]\d+;/, '');
                break;
            }

            $renderer(token);
        };

        /**
         * Prerender token with singular parameter
         * 
         * @param token {@link Object}
         *           ANSI token
         * @param pattern {@link RegExp}
         *           The pattern of token image to match          
         * @param defval {@link Number}
         *           The default value of parameter
         */
        function prerenderSingularParam(token, pattern, defval) {
            var matches = token.image.match(pattern);

            token.value = matches ? parseInt(matches[1]) : defval;
        }

        /**
         * Prerender token with multiple parameters
         * 
         * @param token {@link Object}
         *           ANSI token
         * @param pattern {@link RegExp}
         *           The pattern of token image to match          
         * @param defvals {@link Array}
         *           The default value of parameters
         */
        function prerenderMultipleParams(token, pattern, defvals) {
            var matches = token.image.match(pattern);

            if (matches && matches[1].length) {
                token.values = [];

                matches = matches[1].split(';');

                for (var i = 0; i < matches.length; i++) {
                    token.values[i] = parseInt(matches[i]) || defvals[i] || defvals[0];
                }
            } else {
                token.values = defvals;
            }
        }
    };

    /**
     * ANSI sequence parser for terminal
     */
    var ANSIParser = function() {
        var $stack = new Stack();

        /**
         * Parse the input string as tokens and then call renderer
         * to rendereach token sequentially.
         * 
         * @param input {@link String}
         *           Input string
         * @param renderer {@link Function}
         *           The token renderer
         */
        this.parse = function(input, renderer) {
            var c = 0;
            var tokens = new Array();
            var reader = new StringReader($stack.dump() + input);
            var prerenderer = new Prerenderer(renderer);

            try {
                while (true) {
                    c = reader.read();

                    if (!isCtrlChar(c)) {
                        $stack.push(charof(c));
                        continue;
                    }

                    reader.unread();

                    if (!$stack.empty) {
                        dumpToken('TEXT', prerenderer);
                    }

                    parseCtrlChar.call(this, reader, prerenderer);
                }
            } catch (e) {
                if ('EOF' != e.message)
                    throw e;

                if (!$stack.empty && !$stack.contains('\x1b')) {
                    dumpToken('TEXT', prerenderer);
                }
            }

            console.log('Parsing finished');
        };

        /**
         * Parse control character
         * 
         * @param reader {@link StringReader}
         *           A string reader which provides the inputs
         * @param prerenderer {@link Prerenderer}
         *           A token prerenderer
         */
        function parseCtrlChar(reader, prerenderer) {
            var c = reader.read();

            $stack.push(charof(c));

            switch (c) {
            case 0x00:
                dumpToken('NUL', prerenderer);
                break;
            case 0x01:
                dumpToken('SOH', prerenderer);
                break;
            case 0x02:
                dumpToken('STX', prerenderer);
                break;
            case 0x03:
                dumpToken('ETX', prerenderer);
                break;
            case 0x04:
                dumpToken('EOT', prerenderer);
                break;
            case 0x05: 
                dumpToken('ENQ', prerenderer);
                break;
            case 0x06: 
                dumpToken('ACK', prerenderer);
                break;
            case 0x07: 
                dumpToken('BEL', prerenderer);
                break;
            case 0x08: 
                dumpToken('BS', prerenderer);
                break;
            case 0x09: 
                dumpToken('HT', prerenderer);
                break;
            case 0x0A: 
                dumpToken('LF', prerenderer);
                break;
            case 0x0B: 
                dumpToken('VT', prerenderer);
                break;
            case 0x0C: 
                dumpToken('FF', prerenderer);
                break;
            case 0x0D:
                dumpToken('CR', prerenderer);
                break;
            case 0x0E: 
                dumpToken('SO', prerenderer);
                break;
            case 0x0F: 
                dumpToken('SI', prerenderer);
                break;
            case 0x10: 
                dumpToken('DLE', prerenderer);
                break;
            case 0x11: 
                dumpToken('DC1', prerenderer);
                break;
            case 0x12: 
                dumpToken('DC2', prerenderer);
                break;
            case 0x13:
                dumpToken('DC3', prerenderer);
                break;
            case 0x14: 
                dumpToken('DC4', prerenderer);
                break;
            case 0x15: 
                dumpToken('NAK', prerenderer);
                break;
            case 0x16: 
                dumpToken('SYN', prerenderer);
                break;
            case 0x17: 
                dumpToken('ETB', prerenderer);
                break;
            case 0x18: 
                dumpToken('CAN', prerenderer);
                break;
            case 0x19: 
                dumpToken('EM', prerenderer);
                break;
            case 0x1A: 
                dumpToken('SUB', prerenderer);
                break;
            case 0x1B: 
                parseEscapeSequence.call(this, reader, prerenderer);
                break;
            case 0x1C: 
                dumpToken('FS', prerenderer);
                break;
            case 0x1D: 
                dumpToken('GS', prerenderer);
                break;
            case 0x1E: 
                dumpToken('RS', prerenderer);
                break;
            case 0x1F: 
                dumpToken('US', prerenderer);
                break;
            case 0x80: 
                dumpToken('PAD', prerenderer);
                break;
            case 0x81: 
                dumpToken('HOP', prerenderer);
                break;
            case 0x82: 
                dumpToken('BPH', prerenderer);
                break;
            case 0x83: 
                dumpToken('NBH', prerenderer);
                break;
            case 0x84: 
                dumpToken('IND', prerenderer);
                break;
            case 0x85: 
                dumpToken('NEL', prerenderer);
                break;
            case 0x86: 
                dumpToken('SSA', prerenderer);
                break;
            case 0x87: 
                dumpToken('ESA', prerenderer);
                break;
            case 0x88: 
                dumpToken('HTS', prerenderer);
                break;
            case 0x89: 
                dumpToken('HTJ', prerenderer);
                break;
            case 0x8A: 
                dumpToken('VTS', prerenderer);
                break;
            case 0x8B: 
                dumpToken('PLD', prerenderer);
                break;
            case 0x8C: 
                dumpToken('PLU', prerenderer);
                break;
            case 0x8D: 
                dumpToken('RI', prerenderer);
                break;
            case 0x8E: 
                dumpToken('SS2', prerenderer);
                break;
            case 0x8F: 
                dumpToken('SS3', prerenderer);
                break;
            case 0x90: 
                dumpToken('DCS', prerenderer);
                break;
            case 0x91: 
                dumpToken('PU1', prerenderer);
                break;
            case 0x92: 
                dumpToken('PU2', prerenderer);
                break;
            case 0x93: 
                dumpToken('STS', prerenderer);
                break;
            case 0x94: 
                dumpToken('CCH', prerenderer);
                break;
            case 0x95: 
                dumpToken('MW', prerenderer);
                break;
            case 0x96: 
                dumpToken('SPA', prerenderer);
                break;
            case 0x97: 
                dumpToken('EPA', prerenderer);
                break;
            case 0x98: 
                dumpToken('SOS', prerenderer);
                break;
            case 0x99: 
                dumpToken('SGCI', prerenderer);
                break;
            case 0x9A: 
                dumpToken('SCI', prerenderer);
                break;
            case 0x9B: 
                dumpToken('CSI', prerenderer);
                break;
            case 0x9C: 
                dumpToken('ST', prerenderer);
                break;
            case 0x9D: 
                dumpToken('OSC', prerenderer);
                break;
            case 0x9E: 
                dumpToken('PM', prerenderer);
                break;
            case 0x9F: 
                dumpToken('APC', prerenderer);
                break;
            }
        }

        /**
         * Parse Escape Sequence, A two or three character string staring
         * with ESCape.
         * 
         * @param reader {@link StringReader}
         *           A string reader which provides the inputs
         * @param prerenderer {@link Prerenderer}
         *           A token prerenderer
         */
        function parseEscapeSequence(reader, prerenderer) {
            var c = reader.peak();

            if (isCtrlChar(c)) {
                parseCtrlChar.call(this, reader, prerenderer);
                return;
            }

            $stack.push(charof(c));

            esc:
            switch (reader.read()) {
            case 0x20: /* SPACE */
                switch (c = reader.read()) {
                case 0x46:
                    $stack.push(charof(c));
                    dumpToken('S7C1T', prerenderer);
                    break esc;
                case 0x47:
                    $stack.push(charof(c));
                    dumpToken('S8C1T', prerenderer);
                    break esc;
                }

                reader.unread();
                break;
            case 0x21: /* ! */
                dumpToken('CZD', prerenderer);
                break;
            case 0x22: /* " */
                dumpToken('C1D', prerenderer);
                break;
            case 0x23: /* # */
                c = reader.read();
                $stack.push(charof(c));

                switch (c) {
                case 0x33: /* 3 */
                    dumpToken('DECDHL', prerenderer);
                    break esc;
                case 0x34: /* 4 */
                    dumpToken('DECDHL', prerenderer);
                    break esc;
                case 0x35: /* 5 */
                    dumpToken('DECSWL', prerenderer);
                    break esc;
                case 0x36: /* 6 */
                    dumpToken('DECDWL', prerenderer);
                    break esc;
                case 0x38: /* 8 */
                    dumpToken('DECALN', prerenderer);
                    break esc;
                }

                reader.unread();
                $stack.pop();
                break;
            case 0x24: /* $ */
                c = reader.read();
                $stack.push(charof(c));

                switch (c) {
                case 0x28: /* ( */
                    dumpToken('GZDM4', prerenderer);
                    break esc;
                case 0x29: /* ) */
                    dumpToken('G1DM4', prerenderer);
                    break esc;
                case 0x2A: /* * */
                    dumpToken('G2DM4', prerenderer);
                    break esc;
                case 0x2B: /* + */
                    dumpToken('G3DM4', prerenderer);
                    break esc;
                case 0x2D: /* - */
                    dumpToken('G1DM6', prerenderer);
                    break esc;
                case 0x2E: /* . */
                    dumpToken('G2DM6', prerenderer);
                    break esc;
                case 0x2F: /* / */
                    dumpToken('G3DM6', prerenderer);
                    break esc;
                }

                $stack.pop();
                reader.unread();
                break;
            case 0x25: /* % */
                c = reader.read();
                $stack.push(charof(c));

                switch (c) {
                case 0x38: /* 8 */
                    break;
                case 0x40: /* @ */
                    break;
                case 0x47: /* G */
                    break;
                case 0x2F: /* / */
                    break;
                default:
                    $stack.pop();
                    reader.unread();
                    break;
                }

                dumpToken('DOCS', prerenderer);
                break;
            case 0x26: /* & */
                break;
            case 0x27: /* ' */
                break;
            case 0x28: /* ( */
                switch (c = reader.read()) {
                case 0x30: /* 0 */
                case 0x41: /* A */
                case 0x42: /* B */
                case 0x55: /* U */
                    $stack.push(charof(c));
                    break;
                default:
                    reader.unread();
                    break;
                }

                dumpToken('GZD4', prerenderer);
                break;
            case 0x29: /* ) */
                switch (c = reader.read()) {
                case 0x30: /* 0 */
                case 0x41: /* A */
                case 0x42: /* B */
                case 0x55: /* U */
                    $stack.push(charof(c));
                    break;
                default:
                    reader.unread();
                    break;
                }

                dumpToken('G1D4', prerenderer);
                break;
            case 0x2A: /* * */
                dumpToken('G2D4', prerenderer);
                break;
            case 0x2B: /* + */
                dumpToken('G3D4', prerenderer);
                break;
            case 0x2C: /* , */
                break;
            case 0x2D: /* - */
                dumpToken('G1D6', prerenderer);
                break;
            case 0x2E: /* . */
                dumpToken('G2D6', prerenderer);
                break;
            case 0x2F: /* / */
                dumpToken('G3D6', prerenderer);
                break;
            case 0x30: /* 0 */
                break;
            case 0x31: /* 1 */
                break;
            case 0x32: /* 2 */
                break;
            case 0x33: /* 3 */
                break;
            case 0x34: /* 4 */
                break;
            case 0x35: /* 5 */
                break;
            case 0x36: /* 6 */
                dumpToken('DECBI', prerenderer);
                break;
            case 0x37: /* 7 */
                dumpToken('DECSC', prerenderer);
                break;
            case 0x38: /* 8 */
                dumpToken('DECRC', prerenderer);
                break;
            case 0x39: /* 9 */
                break;
            case 0x3A: /* : */
                break;
            case 0x3B: /* ; */
                break;
            case 0x3C: /* < */
                break;
            case 0x3D: /* = */
                dumpToken('DECKPAM', prerenderer);
                break;
            case 0x3E: /* > */
                dumpToken('DECKPNM', prerenderer);
                break;
            case 0x3F: /* ? */
                break;
            case 0x40: /* @ */
                break;
            case 0x41: /* A */
                break;
            case 0x42: /* B */
                break;
            case 0x43: /* C */
                break;
            case 0x44: /* D */
                dumpToken('IND', prerenderer);
                break;
            case 0x45: /* E */
                dumpToken('NEL', prerenderer);
                break;
            case 0x46: /* F */
                break;
            case 0x47: /* G */
                break;
            case 0x48: /* H */
                dumpToken('HTS', prerenderer);
                break;
            case 0x49: /* I */
                break;
            case 0x4A: /* J */
                break;
            case 0x4B: /* K */
                break;
            case 0x4C: /* L */
                break;
            case 0x4D: /* M */
                dumpToken('RI', prerenderer);
                break;
            case 0x4E: /* N */
                dumpToken('SS2', prerenderer);
                break;
            case 0x4F: /* O */
                dumpToken('SS3', prerenderer);
                break;
            case 0x50: /* P */
                parseDCSSequence.call(this, reader, prerenderer);
                break;
            case 0x51: /* Q */
                break;
            case 0x52: /* R */
                break;
            case 0x53: /* S */
                break;
            case 0x54: /* T */
                break;
            case 0x55: /* U */
                break;
            case 0x56: /* V */
                break;
            case 0x57: /* W */
                break;
            case 0x58: /* X */
                parseSOSSequence.call(this, reader, prerenderer);
                break;
            case 0x59: /* Y */
                break;
            case 0x5A: /* Z */
                dumpToken('DECID', prerenderer);
                break;
            case 0x5B: /* [ */
                parseCSISequence.call(this, reader, prerenderer);
                break;
            case 0x5C: /* \ */
                // String terminator, ends a DCS, SOS, OSC, PM and APC sequence
                throw new SyntaxError('Unexpected token: ' + $stack.toString());
            case 0x5D: /* ] */
                parseOSCSequence.call(this, reader, prerenderer);
                break;
            case 0x5E: /* ^ */
                parsePMSequence.call(this, reader, prerenderer);
                break;
            case 0x5F: /* _ */
                parseAPCSequence.call(this, reader, prerenderer);
                break;
            case 0x60: /* ` */
                break;
            case 0x61: /* a */
                break;
            case 0x62: /* b */
                break;
            case 0x63: /* c */
                dumpToken('RIS', prerenderer);
                break;
            case 0x64: /* d */
                break;
            case 0x65: /* e */
                break;
            case 0x66: /* f */
                break;
            case 0x67: /* g */
                // TODO Visible Bell
                break;
            case 0x68: /* h */
                break;
            case 0x69: /* i */
                break;
            case 0x6A: /* j */
                break;
            case 0x6C: /* l */
                break;
            case 0x6B: /* k */
                break;
            case 0x6D: /* m */
                break;
            case 0x6E: /* n */
                dumpToken('LS2', prerenderer);
                break;
            case 0x6F: /* o */
                dumpToken('LS3', prerenderer);
                break;
            case 0x70: /* p */
                break;
            case 0x71: /* q */
                break;
            case 0x72: /* r */
                break;
            case 0x73: /* s */
                break;
            case 0x74: /* t */
                break;
            case 0x75: /* u */
                break;
            case 0x76: /* v */
                break;
            case 0x77: /* w */
                break;
            case 0x78: /* x */
                break;
            case 0x79: /* y */
                break;
            case 0x7A: /* z */
                break;
            case 0x7B: /* { */
                break;
            case 0x7C: /* | */
                dumpToken('LS3R', prerenderer);
                break;
            case 0x7D: /* } */
                dumpToken('LS2R', prerenderer);
                break;
            case 0x7E: /* ~ */
                dumpToken('LS1R', prerenderer);
                break;
            }
        }

        /**
         * Parse device control string sequence
         * 
         * @param reader {@link StringReader}
         *           A string reader which provides the inputs
         * @param prerenderer {@link Prerenderer}
         *           A token prerenderer
         */
        function parseDCSSequence(reader, prerenderer) {
            // TODO
        }

        /**
         * Parse start of string sequence
         * 
         * @param reader {@link StringReader}
         *           A string reader which provides the inputs
         * @param prerenderer {@link Prerenderer}
         *           A token prerenderer
         */
        function parseSOSSequence(reader, prerenderer) {
            // TODO
        }

        /**
         * Parse CSI sequence
         * 
         * @param reader {@link StringReader}
         *           A string reader which provides the inputs
         * @param prerenderer {@link Prerenderer}
         *           A token prerenderer
         */
        function parseCSISequence(reader, prerenderer) {
            var c = reader.read();

            $stack.push(charof(c));

            csi:
            switch (c) {
            case 0x27: /* ' */
                switch (c = reader.read()) {
                case 0x7B: /* { */
                    $stack.push(charof(c));
                    dumpToken('DECSLE', prerenderer);
                    break csi;
                case 0x7C: /* | */
                    $stack.push(charof(c));
                    dumpToken('DECRQLP', prerenderer);
                    break csi;
                }

                reader.unread();
                break;
            case 0x30: /* 0 */
            case 0x31: /* 1 */
            case 0x32: /* 2 */
            case 0x33: /* 3 */
            case 0x34: /* 4 */
            case 0x35: /* 5 */
            case 0x36: /* 6 */
            case 0x37: /* 7 */
            case 0x38: /* 8 */
            case 0x39: /* 9 */
                do {
                    c = reader.read();
                    $stack.push(charof(c));
                } while (isDigit(c));

                switch (c) {
                case 0x24: /* $ */
                    c = reader.read();
                    $stack.push(charof(c));

                    switch (c) {
                    case 0x7D: /* } */
                        dumpToken('DECSASD', prerenderer);
                        break csi;
                    case 0x7E: /* ~ */
                        dumpToken('DECSSDT', prerenderer);
                        break csi;
                    }

                    $stack.pop();
                    reader.unread();
                    break;
                case 0x27: /* ' */
                    if (0x7B == reader.peak()) {
                        c = creader.read();
                        $stack.push(charof(c));
                        dumpToken('DECSLE', prerenderer);
                        break csi;
                    }
                    break;
                case 0x3B: /* ; */
                    while (true) {
                        c = reader.read();

                        if (0x3B != c && !isDigit(c)) {
                            break; 
                        }

                        $stack.push(charof(c));
                    }

                    reader.unread();

                    if (0x3B == c) {
                        break; // the 2nd param is missing
                    }

                    var groups = 0;
                    var matches = $stack.toString().match(/(\d+(;\d+))$/);

                    if (!matches) {
                        break;
                    }

                    c = reader.read();
                    $stack.push(charof(c));
                    groups = matches[1].split(';');

                    switch (c) {
                    case 0x22: /* " */
                        if (2 == groups.length && 0x70 == reader.peak()) {
                            dumpToken('DECSCL', prerenderer);
                            break csi;
                        }
                        break;
                    case 0x24: /* $ */
                        if (4 == groups.length) {
                            switch (reader.peak()) {
                            case 0x7A: /* z */
                                dumpToken('DECERA', prerenderer);
                                break csi;
                            case 0x7B: /* { */
                                dumpToken('DECSERA', prerenderer);
                                break csi;
                            }
                        }
                        break;
                    case 0x27: /* ' */
                        c = reader.read();
                        $stack.push(charof(c));

                        switch (c) {
                        case 0x24: /* $ */
                            dumpToken('DECSLE', prerenderer);
                            break csi;
                        case 0x77: /* w */
                            if (4 == groups.length) {
                                dumpToken('DECEFR', prerenderer);
                                break csi;
                            }
                            break;
                        case 0x7A: /* z */
                            if (2 == groups.length) {
                                dumpToken('DECELR', prerenderer);
                                break csi;
                            }
                            break;
                        }

                        $stack.pop();
                        reader.unread();
                        break;
                    case 0x48: /* H */
                        if (2 == groups.length) {
                            dumpToken('CUP', prerenderer);
                            break csi;
                        }
                        break;
                    case 0x66: /* f */
                        if (2 == groups.length) {
                            dumpToken('HVP', prerenderer);
                            break csi;
                        }
                        break;
                    case 0x68: /* h */
                        dumpToken('SM', prerenderer);
                        break csi;
                    case 0x69: /* i */
                        dumpToken('MC', prerenderer);
                        break csi;
                    case 0x6C: /* l */
                        dumpToken('RM', prerenderer);
                        break csi;
                    case 0x6D: /* m */
                        dumpToken('SGR', prerenderer);
                        break csi;
                    case 0x72: /* r */
                        if (2 == groups.length) {
                            dumpToken('DECSTBM', prerenderer);
                            break csi;
                        }
                        break;
                    case 0x73: /* s */
                        if (2 == groups.length) {
                            dumpToken('DECSLRM', prerenderer);
                            break csi;
                        }
                        break;
                    case 0x74: /* t */
                        if (3 == groups.length) {
                            dumpToken('DECSLPP', prerenderer);
                            break csi;
                        }
                        break;
                    }

                    reader.unread();
                    $stack.pop();
                    break;
                case 0x40: /* @ */
                    dumpToken('ICH', prerenderer);
                    break csi;
                case 0x41: /* A */
                    dumpToken('CUU', prerenderer);
                    break csi;
                case 0x42: /* B */
                    dumpToken('CUD', prerenderer);
                    break csi;
                case 0x43: /* C */
                    dumpToken('CUF', prerenderer);
                    break csi;
                case 0x44: /* D */
                    dumpToken('CUB', prerenderer);
                    break csi;
                case 0x45: /* E */
                    dumpToken('CNL', prerenderer);
                    break csi;
                case 0x46: /* F */
                    dumpToken('CPL', prerenderer);
                    break csi;
                case 0x47: /* G */
                    dumpToken('CHA', prerenderer);
                    break csi;
                case 0x49: /* I */
                    dumpToken('CHT', prerenderer);
                    break csi;
                case 0x4A: /* J */
                    dumpToken('ED', prerenderer);
                    break csi;
                case 0x4B: /* K */
                    dumpToken('EL', prerenderer);
                    break csi;
                case 0x4C: /* L */
                    dumpToken('IL', prerenderer);
                    break csi;
                case 0x4D: /* M */
                    dumpToken('DL', prerenderer);
                    break csi;
                case 0x50: /* P */
                    dumpToken('DCH', prerenderer);
                    break csi;
                case 0x53: /* S */
                    dumpToken('SU', prerenderer);
                    break csi;
                case 0x54: /* T */
                    dumpToken('SD', prerenderer);
                    break csi;
                case 0x58: /* X */
                    dumpToken('ECH', prerenderer);
                    break csi;
                case 0x59: /* Z */
                    dumpToken('CBT', prerenderer);
                    break csi;
                case 0x60: /* ` */
                    dumpToken('HPA', prerenderer);
                    break csi;
                case 0x61: /* a */
                    dumpToken('HPR', prerenderer);
                    break csi;
                case 0x63: /* c */
                    dumpToken('DA', prerenderer);
                    break csi;
                case 0x64: /* d */
                    dumpToken('VPA', prerenderer);
                    break csi;
                case 0x65: /* e */
                    dumpToken('VPR', prerenderer);
                    break csi;
                case 0x67: /* g */
                    dumpToken('TBC', prerenderer);
                    break csi;
                case 0x68: /* h */
                    dumpToken('SM', prerenderer);
                    break csi;
                case 0x69: /* i */
                    dumpToken('MC', prerenderer);
                    break csi;
                case 0x6A: /* j */
                    dumpToken('HPB', prerenderer);
                    break; csi
                case 0x6B: /* k */
                    dumpToken('VPB', prerenderer);
                    break; csi
                case 0x6C: /* l */
                    dumpToken('RM', prerenderer);
                    break csi;
                case 0x6D: /* m */
                    dumpToken('SGR', prerenderer);
                    break csi;
                case 0x6E: /* n */
                    dumpToken('DSR', prerenderer);
                    break; csi
                }

                $stack.pop();
                reader.unread();

                break;
            case 0x3C: /* < */
                c = reader.read();
                $stack.push(charof(c));

                switch (c) {
                case 0x30: /* 0 */
                case 0x31: /* 1 */
                    switch (reader.peak()) {
                    case 0x74: /* t */
                        c = reader.read();
                        $stack.push(charof(c));
                        dumpToken('TTIMEST', prerenderer);
                        break csi;
                    }
                    break;
                case 0x72: /* r */
                    dumpToken('TTIMERS', prerenderer);
                    break csi;
                case 0x73: /* s */
                    dumpToken('TTIMESV', prerenderer);
                    break csi;
                }

                reader.unread();
                break csi;
            case 0x3D: /* = */
                c = reader.read();
                $stack.push(charof(c));

                switch (c) {
                case 0x30:
                    switch (reader.peak()) {
                    case 0x63: /* c */
                        c = reader.read();
                        $stack.push(charof(c));
                        dumpToken('DA3', prerenderer);
                        break csi;
                    }
                    break;
                }

                reader.unread();
                break csi;
            case 0x3E: /* > */
                c = reader.read();
                $stack.push(charof(c));

                switch (c) {
                case 0x63: /* c */
                    dumpToken('DA2', prerenderer);
                    break csi;
                }

                if (isDigit(c)) {
                    var attr = c - 30;

                    // look ahead
                    switch (reader.peak()) {
                    case 0x3B: /* ; */
                        switch (c) {
                        case 0x33: /* 3 */
                            var ahead = null;
                            var matches = null;

                            ahead = reader.peaks(9);

                            if (matches = ahead.match(/^((;\d){4})J$/)) {
                                reader.reads(9, $stack);
                                dumpToken('UNDEFINED', prerenderer);
                                break csi;
                            }

                            ahead = reader.peaks(5);

                            if (matches = ahead.match(/^((;\d){2})K$/)) {
                                reader.reads(9, $stack);
                                dumpToken('UNDEFINED', prerenderer);
                                break csi;
                            }

                            c = reader.read(); // the semicolons behind number
                            $stack.push(charof(c));

                            $stack.pop();
                            reader.unread();
                            $stack.pop();
                            reader.unread();
                            break;
                        case 0x35: /* 5 */
                            c = reader.read(); // the semicolons behind number
                            $stack.push(charof(c));
                            c = reader.read();
                            $stack.push(charof(c));

                            // CSI > 5 ; Ps K
                            if (isDigit(c) && 0x4B == reader.peak()) {
                                c = reader.read();
                                $stack.push(charof(c));
                                dumpToken('UNDEFINED', prerenderer);
                                break csi;
                            }

                            $stack.pop();
                            reader.unread();
                            $stack.pop();
                            reader.unread();
                            break;
                        }
                        break;
                    case 0x63: /* c */
                        c = reader.read();
                        $stack.push(charof(c));
                        dumpToken('DA2', prerenderer);
                        break csi;
                    }
                } else {
                    reader.unread();
                    $stack.pop();
                }

                break;
            case 0x3F: /* ? */
                do {
                    c = reader.read();
                    $stack.push(charof(c));
                } while (isDigit(c) || 0x3B == c);

                switch (c) {
                case 0x4A: /* J */
                    dumpToken('DECSED', prerenderer);
                    break csi;
                case 0x4B: /* K */
                    dumpToken('DECSEL', prerenderer);
                    break csi;
                case 0x68: /* h */
                    dumpToken('DECSET', prerenderer);
                    break csi;
                case 0x69: /* i */
                    dumpToken('DECMC', prerenderer);
                    break csi;
                case 0x6C: /* l */
                    dumpToken('DECRST', prerenderer);
                    break csi;
                case 0x6E: /* n */
                    dumpToken('DECDSR', prerenderer);
                    break csi;
                }

                break;
            case 0x43: /* C */
                dumpToken('CUF', prerenderer);
                break csi;
            case 0x48: /* H */
                dumpToken('CUP', prerenderer);
                break csi;
            case 0x4A: /* J */
                dumpToken('ED', prerenderer);
                break csi;
            case 0x4B: /* K */
                dumpToken('EL', prerenderer);
                break csi;
            case 0x4C: /* L */
                dumpToken('IL', prerenderer);
                break csi;
            case 0x68: /* h */
                dumpToken('SM', prerenderer);
                break csi;
            case 0x69: /* i */
                dumpToken('MC', prerenderer);
                break csi;
            case 0x6C: /* l */
                dumpToken('RM', prerenderer);
                break csi;
            case 0x6D: /* m */
                dumpToken('SGR', prerenderer);
                break csi;
            case 0x73: /* s */
                dumpToken('SCP', prerenderer);
                break csi;
            case 0x75: /* u */
                dumpToken('RCP', prerenderer);
                break csi;
            default:
                break;
            }
        }

        /**
         * Parse operating system command sequence
         * 
         * @param reader {@link StringReader}
         *           A string reader which provides the inputs
         * @param prerenderer {@link Prerenderer}
         *           A token prerenderer
         */
        function parseOSCSequence(reader, prerenderer) {
            var c = 0;

            loop : while (true) {
                switch (c = reader.read()) {
                case 0x07: /* BEL */
                    reader.unread();
                    break loop;
                case 0x5C: /* \ String Terminator */
                    break loop;
                }

                $stack.push(charof(c));
            }

            dumpToken('OSC', prerenderer);
        }

        /**
         * Parse privacy message sequence
         * 
         * @param reader {@link StringReader}
         *           A string reader which provides the inputs
         * @param prerenderer {@link Prerenderer}
         *           A token prerenderer
         */
        function parsePMSequence(reader, prerenderer) {
            // TODO
        }

        /**
         * Parse application program command sequence
         * 
         * @param reader {@link StringReader}
         *           A string reader which provides the inputs
         * @param prerenderer {@link Prerenderer}
         *           A token prerenderer
         */
        function parseAPCSequence(reader, prerenderer) {
            // TODO
        }

        /**
         * Dump the sequence in stack as a token
         * 
         * @param type {@link String} or {@link Object}
         *           Token type or an token instance
         * @param prerenderer {@link Function}
         *           A token prerenderer
         */
        function dumpToken(type, prerenderer) {
            var token = null;

            if ('object' === typeof type) {
                token = type;
            } else {
                token = {
                    type : type,
                    image : $stack.dump(),
                };
            }

            prerenderer.prerender(token);
        }

    };

    module.exports = ANSIParser;

});

