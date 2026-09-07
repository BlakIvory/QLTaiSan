import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { API_ENDPOINTS } from '../lib/constants'

export interface OrgItem {
  id: number
  code: string
  name: string
  type: string
  level: number
  is_active: boolean
  parent?: OrgItem
}

/**
 * Hook fetch danh sach don vi/khoa phong dung cho combobox.
 * Mac dinh loai tru cap Benh vien (HOSPITAL) de combobox chi hien thi
 * cac khoa/phong/kho co the chon duoc.
 *
 * @param excludeType - loai org muon loai tru (mac dinh: 'HOSPITAL')
 * @param extraParams - cac params bo sung (vd: { type: 'WAREHOUSE' })
 */
export function useOrganizations(
  excludeType: string | null = 'HOSPITAL',
  extraParams?: Record<string, unknown>
) {
  const params: Record<string, unknown> = { ...extraParams }
  if (excludeType) params.exclude_type = excludeType

  const { data = [], isLoading } = useQuery<OrgItem[]>({
    queryKey: ['organizations-list', params],
    queryFn: () =>
      api.get(API_ENDPOINTS.ORGANIZATIONS.BASE, { params }).then((r) => r.data.data),
  })

  /** Helper chuyen sang format options cho Ant Design Select */
  const orgOptions = data.map((o) => ({
    value: o.id,
    label: `[${typeLabel(o.type)}] ${o.name}`,
  }))

  return { orgs: data, orgOptions, isLoading }
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    HOSPITAL:   'Benh vien',
    CAMPUS:     'Co so',
    BLOCK:      'Khoi',
    DEPARTMENT: 'Khoa',
    ROOM:       'Phong',
    WAREHOUSE:  'Kho',
  }
  return map[type] ?? type
}
