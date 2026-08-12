import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { API_ENDPOINTS } from '../lib/constants'

export interface OptionItem {
  value: string
  label: string
  color?: string | null
}

export type OptionsData = Record<string, OptionItem[]>

/**
 * Hook to fetch and manage combobox options dynamically from Backend API.
 *
 * Example:
 * const { getOptionList, getOptionLabel, isLoading } = useOptions(['equipment_status', 'importance_level'])
 * const statusOptions = getOptionList('equipment_status')
 */
export function useOptions(types?: string[]) {
  const typesParam = types?.length ? types.join(',') : undefined

  const { data, isLoading, isError, refetch } = useQuery<OptionsData>({
    queryKey: ['options', typesParam],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.OPTIONS.BASE, {
        params: typesParam ? { types: typesParam } : undefined,
      })
      return response.data.data
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  })

  /**
   * Get options array for a specific combobox type.
   */
  const getOptionList = (type: string): OptionItem[] => {
    return data?.[type] ?? []
  }

  /**
   * Helper to resolve readable label from option value.
   */
  const getOptionLabel = (type: string, value: string): string => {
    const list = getOptionList(type)
    const item = list.find((opt) => opt.value === value)
    return item?.label ?? value
  }

  return {
    options: data ?? {},
    getOptionList,
    getOptionLabel,
    isLoading,
    isError,
    refetch,
  }
}
