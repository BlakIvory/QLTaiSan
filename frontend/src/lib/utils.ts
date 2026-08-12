/**
 * Chuyển đổi chuỗi tiếng Việt có dấu thành không dấu
 * Ví dụ: "Khoa Khám bệnh" -> "khoa kham benh"
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

/**
 * Hàm filterOption cho Antd Select / Combobox giúp tìm kiếm không dấu
 */
export function filterOptionUnaccented(input: string, option?: any): boolean {
  if (!input || !input.trim()) return true
  if (!option) return false

  let textToSearch = ''

  if (typeof option.children === 'string') {
    textToSearch = option.children
  } else if (Array.isArray(option.children)) {
    textToSearch = option.children
      .map((child: any) => (typeof child === 'string' ? child : ''))
      .join(' ')
  } else if (option.label) {
    textToSearch = String(option.label)
  } else if (option.value) {
    textToSearch = String(option.value)
  }

  const cleanInput = removeVietnameseTones(input.trim())
  const cleanText = removeVietnameseTones(textToSearch)

  return cleanText.includes(cleanInput)
}
