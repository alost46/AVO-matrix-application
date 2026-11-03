/* AVO Core v2 · MatrixFactory. No DOM or renderer dependency. */
export const clone = value => JSON.parse(JSON.stringify(value));
export function validateMatrix(matrix, rows = 3, cols = 3) {
  return Array.isArray(matrix) && matrix.length === rows && matrix.every(
    row => Array.isArray(row) && row.length === cols && row.every(n => typeof n === 'number' && Number.isFinite(n))
  );
}
export function identity(n = 3) { return Array.from({length:n}, (_,r)=>Array.from({length:n},(_,c)=>+(r===c))); }
export class MatrixFactory {
  constructor(initial) {
    this.initial = clone(initial);
    this.current = clone(initial);
    for (const [name,m] of Object.entries(initial)) if (!validateMatrix(m, m.length, m[0].length)) throw new Error(`Invalid matrix ${name}`);
  }
  getNumericMatrix(name, coordinatesAndTime = {}) {
    if (!this.current[name]) throw new Error(`Unknown matrix: ${name}`);
    // Stable API: numeric cells now; expression evaluation can later use x/y/z/t.
    return clone(this.current[name]);
  }
  setCell(name, row, col, value) {
    const m = this.current[name];
    if (!m || !m[row] || col < 0 || col >= m[row].length || !Number.isFinite(value)) return false;
    m[row][col] = value;
    return true;
  }
  setColumn(name, col, coords) {
    const m = this.current[name];
    if (!m || !Array.isArray(coords) || coords.length !== 3 || !coords.every(Number.isFinite) || col<0 || col>=m[0].length) return false;
    coords.forEach((v,r)=> m[r][col] = v);
    return true;
  }
  resetMatrix(name) { const m = this.current[name]; if(!m || m.length!==m[0].length) return false; this.current[name] = identity(m.length); return true; }
  setCurrent(next) {
    for (const [name, original] of Object.entries(this.initial)) {
      if (!validateMatrix(next?.[name], original.length, original[0].length)) throw new Error(`Invalid matrix ${name}`);
    }
    this.current = clone(next);
  }
  startOver() { this.current = clone(this.initial); }
}
