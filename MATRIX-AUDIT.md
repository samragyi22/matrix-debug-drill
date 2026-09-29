# Matrix Failure Audit Report

This audit documents every failing combination in the initial CI matrix run across `ubuntu-latest` and `windows-latest` for Node versions 18, 20, and 22.

---

## Summary of Matrix Results

| OS | Node Version | Status | Failure Classification |
|---|---|---|---|
| `ubuntu-latest` | 18 | PASS | N/A |
| `ubuntu-latest` | 20 | PASS | N/A |
| `ubuntu-latest` | 22 | FAIL | Runtime Version (Removed API) |
| `windows-latest` | 18 | FAIL | OS-Specific (Path Separators & Line Endings) |
| `windows-latest` | 20 | FAIL | OS-Specific (Path Separators & Line Endings) |
| `windows-latest` | 22 | FAIL | Runtime Version & OS-Specific |

---

## Detailed Failure Analysis by Combination

### 1. `ubuntu-latest` + Node 22
- **OS & Node Version:** `ubuntu-latest` / Node 22
- **Failing Step Name:** `npm test` (Running Jest suite)
- **Exact Error Line from Log:**
  ```text
  TypeError: crypto.createCipher is not a function
      at createCipher (src/cryptoUtils.js:8:25)
      at Object.encryptValue (src/cryptoUtils.test.js:10:21)
  ```
- **Classification:** `Runtime Version`
- **Root Cause:** `crypto.createCipher` and `crypto.createDecipher` were deprecated in Node.js 10.0.0 and completely removed in Node.js 22.0.0.
- **Planned Fix:** Replace `crypto.createCipher` and `crypto.createDecipher` in `src/cryptoUtils.js` with `crypto.createCipheriv` and `crypto.createDecipheriv` using a derived key (e.g. SHA-256 digest of key string) and a 16-byte initialization vector (`Buffer.alloc(16, 0)`).

---

### 2. `windows-latest` + Node 18
- **OS & Node Version:** `windows-latest` / Node 18
- **Failing Step Name:** `npm test` (Running Jest suite)
- **Exact Error Lines from Log:**
  ```text
  FAIL src/fileUtils.test.js
  ● getOutputPath returns correct path
    expect(received).toBe(expected)
    Expected: "D:\\a\\matrix-debug-drill\\matrix-debug-drill\\src\\output\\report.txt"
    Received: "D:\\a\\matrix-debug-drill\\matrix-debug-drill\\src/output/report.txt"

  ● readTextFile returns file content with expected line endings
    expect(received).toBe(expected)
    Expected: "line one\nline two\nline three\n"
    Received: "line one\r\nline two\r\nline three\r\n"
  ```
- **Classification:** `OS-Specific`
- **Root Cause:**
  1. `src/fileUtils.js` concatenates paths with hardcoded forward slashes (`__dirname + '/output/' + filename`), producing mixed path separators (`\` and `/`) on Windows runners.
  2. Git checkouts on Windows use CRLF (`\r\n`) line endings for `src/test-data/sample.txt`, while the test expects strict LF (`\n`) line endings.
- **Planned Fix:**
  1. Refactor `readConfig` and `getOutputPath` in `src/fileUtils.js` to use `path.join(__dirname, ...)` for OS-native path separators.
  2. Normalize line endings (`.replace(/\r\n/g, '\n')`) in `src/fileUtils.test.js` or `src/fileUtils.js` before performing assertions.

---

### 3. `windows-latest` + Node 20
- **OS & Node Version:** `windows-latest` / Node 20
- **Failing Step Name:** `npm test` (Running Jest suite)
- **Exact Error Lines from Log:**
  ```text
  FAIL src/fileUtils.test.js
  ● getOutputPath returns correct path
    expect(received).toBe(expected)
    Expected: "D:\\a\\matrix-debug-drill\\matrix-debug-drill\\src\\output\\report.txt"
    Received: "D:\\a\\matrix-debug-drill\\matrix-debug-drill\\src/output/report.txt"

  ● readTextFile returns file content with expected line endings
    expect(received).toBe(expected)
    Expected: "line one\nline two\nline three\n"
    Received: "line one\r\nline two\r\nline three\r\n"
  ```
- **Classification:** `OS-Specific`
- **Root Cause:**
  1. Path string concatenation using `/` in `src/fileUtils.js` causes backslash/slash mismatch in Windows path comparisons.
  2. CRLF (`\r\n`) line endings checked out by Git on Windows runners.
- **Planned Fix:** Use `path.join` in `src/fileUtils.js` and line ending normalization (`\r\n` -> `\n`) in file reading / test assertions.

---

### 4. `windows-latest` + Node 22
- **OS & Node Version:** `windows-latest` / Node 22
- **Failing Step Name:** `npm test` (Running Jest suite)
- **Exact Error Lines from Log:**
  ```text
  TypeError: crypto.createCipher is not a function
      at createCipher (src/cryptoUtils.js:8:25)
      at Object.encryptValue (src/cryptoUtils.test.js:10:21)

  FAIL src/fileUtils.test.js
  ● getOutputPath returns correct path
    Expected: "D:\\a\\matrix-debug-drill\\matrix-debug-drill\\src\\output\\report.txt"
    Received: "D:\\a\\matrix-debug-drill\\matrix-debug-drill\\src/output/report.txt"

  ● readTextFile returns file content with expected line endings
    Expected: "line one\nline two\nline three\n"
    Received: "line one\r\nline two\r\nline three\r\n"
  ```
- **Classification:** `Runtime Version & OS-Specific`
- **Root Cause:** Compound failure of the Node 22 `crypto.createCipher` API removal and Windows path separator + CRLF line ending mismatches.
- **Planned Fix:** Apply both the `crypto.createCipheriv` update in `src/cryptoUtils.js` and cross-platform path (`path.join`) + CRLF normalization fixes in `src/fileUtils.js` and `src/fileUtils.test.js`.
