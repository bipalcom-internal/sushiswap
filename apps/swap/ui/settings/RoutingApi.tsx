'use client'

import Switch from '@sushiswap/ui/future/components/Switch'
import React, { FC } from 'react'
import { useLocalStorage } from '@sushiswap/hooks'

export const RoutingApi: FC = () => {
  const [routingApi, setRoutingApi] = useLocalStorage('routingApi', false)

  return (
    <div className="p-4 rounded-lg bg-white dark:bg-slate-800">
      <div className="flex justify-between items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-sm font-semibold text-gray-900 dark:text-slate-50">Routing API</h1>
          <span className="text-xs text-gray-600 dark:text-slate-500">...</span>
        </div>
        <Switch checked={routingApi} onChange={(checked) => setRoutingApi(checked)} />
      </div>
      <span className="mt-3 text-xs text-gray-500 dark:text-slate-400 items-center flex font-medium gap-0.5">...</span>
    </div>
  )
}
