export function PositiveDecimalInput({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const validate = (input: HTMLInputElement) => {
    input.setCustomValidity(input.value && (!Number.isFinite(input.valueAsNumber) || input.valueAsNumber <= 0) ? `${label}必须为大于 0 的数值` : '')
  }
  return <input aria-label={label} type="number" inputMode="decimal" min="0.1" step="any" required value={value}
    onChange={(event) => { onChange(event.target.value); validate(event.target) }}
    onBlur={(event) => {
      const input = event.target
      if (input.value && Number.isFinite(input.valueAsNumber) && input.valueAsNumber > 0) {
        input.value = input.valueAsNumber.toFixed(1)
        onChange(input.value)
      }
      validate(input)
    }} placeholder="请输入大于 0 的数值" />
}

export function YearRangeSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const currentYear = new Date().getFullYear()
  const [start = '', end = ''] = value.replaceAll('年', '').replace('至今', String(currentYear)).split('-')
  const firstYear = Math.min(1900, Number(start) || 1900, Number(end) || 1900)
  const years = Array.from({ length: currentYear - firstYear + 1 }, (_, index) => currentYear - index)
  return <div className="corpus-year-range">
    <select aria-label="起始年份" required value={start} onChange={(event) => onChange(`${event.target.value}年-${end && Number(end) >= Number(event.target.value) ? `${end}年` : ''}`)}>
      <option value="">起始年份</option>
      {years.map((year) => <option key={year} value={year}>{year}年</option>)}
    </select>
    <span>至</span>
    <select aria-label="结束年份" required value={end} onChange={(event) => onChange(`${start ? `${start}年` : ''}-${event.target.value}年`)}>
      <option value="">结束年份</option>
      {years.filter((year) => !start || year >= Number(start)).map((year) => <option key={year} value={year}>{year}年</option>)}
    </select>
  </div>
}

export function isValidYearRange(value: string) {
  const match = /^(\d{4})年-(\d{4})年$/.exec(value)
  return Boolean(match && Number(match[1]) <= Number(match[2]) && Number(match[2]) <= new Date().getFullYear())
}
