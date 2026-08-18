import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import 'dayjs/locale/vi'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry 401, 403, 404
        if ([401, 403, 404].includes(error?.response?.status)) return false
        return failureCount < 2
      },
    },
    mutations: {
      onError: (error: any) => {
        console.error('Mutation error:', error)
      },
    },
  },
})

const validateMessages = {
  required: 'Vui lòng nhập ${label}',
  whitespace: '${label} không được chỉ chứa khoảng trắng',
  types: {
    email: '${label} không đúng định dạng email',
    number: '${label} phải là số hợp lệ',
    url: '${label} không đúng định dạng đường dẫn',
  },
  string: {
    min: '${label} phải có ít nhất ${min} ký tự',
    max: '${label} không được vượt quá ${max} ký tự',
    range: '${label} phải có từ ${min} đến ${max} ký tự',
  },
  number: {
    min: '${label} phải lớn hơn hoặc bằng ${min}',
    max: '${label} phải nhỏ hơn hoặc bằng ${max}',
    range: '${label} phải nằm trong khoảng ${min} đến ${max}',
  },
  array: {
    min: 'Vui lòng chọn ít nhất ${min} ${label}',
    max: 'Chỉ được chọn tối đa ${max} ${label}',
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN} form={{ validateMessages }}>
        <App />
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
)
